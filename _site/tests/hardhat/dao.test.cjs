// DAO contract tests (v4.0) — Hardhat + Chai.
// Run with: npm run test:dao  (hardhat test)
// `ethers` and `expect` are injected into the global scope by Hardhat.
const { expect } = require('chai');

describe('DAO — GovernanceToken', () => {
  let token, owner, alice;
  beforeEach(async () => {
    [owner, alice] = await ethers.getSigners();
    const F = await ethers.getContractFactory('GovernanceToken', owner);
    token = await F.deploy(owner.address);
    await token.waitForDeployment();
  });

  it('mints only by owner (cap enforced)', async () => {
    await token.mint(alice.address, ethers.parseEther('100'));
    expect(await token.balanceOf(alice.address)).to.equal(ethers.parseEther('100'));
    await expect(token.connect(alice).mint(alice.address, 1)).to.be.reverted;
  });

  it('respects max supply cap', async () => {
    const cap = await token.MAX_SUPPLY();
    await expect(token.mint(owner.address, cap + 1n)).to.be.revertedWith('cap exceeded');
  });
});

describe('DAO — SoulboundToken (SBT)', () => {
  let sbt, owner, alice, bob;
  beforeEach(async () => {
    [owner, alice, bob] = await ethers.getSigners();
    const F = await ethers.getContractFactory('SoulboundToken', owner);
    sbt = await F.deploy(owner.address);
    await sbt.waitForDeployment();
    await sbt.grantRole(await sbt.MINTER_ROLE(), owner.address);
  });

  it('mints a reputation token via MINTER_ROLE', async () => {
    const id = await sbt.mintReputation(alice.address, 'expert');
    expect(await sbt.reputationOf(0n)).to.equal('expert');
  });

  it('is non-transferable (reverts on transfer)', async () => {
    await sbt.mintReputation(alice.address, 'expert');
    await expect(sbt.transferFrom(alice.address, bob.address, 0n)).to.be.revertedWith('SBT: non-transferable');
    await expect(sbt.approve(bob.address, 0n)).to.be.revertedWith('SBT: non-transferable');
  });
});

describe('DAO — ProposalEngine (quorum, double-vote, timelock, commit-reveal)', () => {
  let token, engine, owner, alice, bob, treasury;
  const DAY = 86400n;

  beforeEach(async () => {
    // Full chain reset per test -> each test starts at genesis (t=0) on a
    // fresh clock, so earlier tests' evm_increaseTime cannot age later
    // proposals past their voting period.
    await network.provider.send('hardhat_reset', []);
    [owner, alice, bob, treasury] = await ethers.getSigners();
    const TF = await ethers.getContractFactory('GovernanceToken', owner);
    token = await TF.deploy(owner.address);
    await token.waitForDeployment();
    const EF = await ethers.getContractFactory('ProposalEngine', owner);
    engine = await EF.deploy(owner.address, await token.getAddress());
    await engine.waitForDeployment();
    // Total supply 10000. Each voter gets 200 (2%) so NO single voter can
    // reach the 4% (400) quorum alone -> a coalition is required. The rest
    // sits in a non-voting treasury so it never participates.
    await token.mint(owner.address, ethers.parseEther('200'));
    await token.mint(alice.address, ethers.parseEther('200'));
    await token.mint(bob.address, ethers.parseEther('200'));
    await token.mint(treasury.address, ethers.parseEther('9400'));
  });


  async function createProposal(desc) {
    const tx = await engine.createProposal(desc);
    const rcpt = await tx.wait();
    const ev = rcpt.logs.find((l) => l.fragment && l.fragment.name === 'ProposalCreated');
    return ev.args[0];
  }

  async function commitReveal(proposalId, signer, support) {
    const salt = ethers.zeroPadValue(ethers.toUtf8Bytes('salt'), 32);
    const comm = ethers.keccak256(ethers.solidityPacked(['uint8', 'bytes32'], [support, salt]));
    await engine.connect(signer).commit(proposalId, comm);
    await engine.connect(signer).reveal(proposalId, support, salt);
  }

  it('requires quorum (min 4%) to succeed', async () => {
    const pid = await createProposal('raise bar');
    // owner (200) + alice (200) = 400 = exactly 4% quorum, majority for
    await commitReveal(pid, owner, 1);
    await commitReveal(pid, alice, 1);
    // fast-forward past voting period
    await ethers.provider.send('evm_increaseTime', [Number(3n * DAY) + 10]);
    await ethers.provider.send('evm_mine');
    expect(await engine.state(pid)).to.equal(2n); // Succeeded
  });

  it('blocks double voting by the same address', async () => {
    const pid = await createProposal('double vote');
    // first vote via commit-reveal (proven path)
    await commitReveal(pid, alice, 1);
    // second attempt to commit must be rejected (already committed)
    const salt2 = ethers.zeroPadValue(ethers.toUtf8Bytes('salt2'), 32);
    const comm2 = ethers.keccak256(ethers.solidityPacked(['uint8', 'bytes32'], [1, salt2]));
    await expect(engine.connect(alice).commit(pid, comm2)).to.be.revertedWith('already committed');
  });

  it('rejects a bad reveal (front-running mitigation)', async () => {
    const pid = await createProposal('reveal check');
    const salt = ethers.zeroPadValue(ethers.toUtf8Bytes('salt'), 32);
    const comm = ethers.keccak256(ethers.solidityPacked(['uint8', 'bytes32'], [1, salt]));
    await engine.connect(alice).commit(pid, comm);
    const wrong = ethers.zeroPadValue(ethers.toUtf8Bytes('wrong'), 32);
    await expect(engine.connect(alice).reveal(pid, 1, wrong)).to.be.revertedWith('bad reveal');
  });

  it('enforces 2-day timelock before execution', async () => {
    const pid = await createProposal('timelock');
    // owner (200) + alice (200) = 400 = exactly 4% quorum, majority for
    await commitReveal(pid, owner, 1);
    await commitReveal(pid, alice, 1);
    await ethers.provider.send('evm_increaseTime', [Number(3n * DAY) + 10]);
    await ethers.provider.send('evm_mine');
    expect(await engine.state(pid)).to.equal(2n); // Succeeded
    await engine.queue(pid);
    // try execute before timelock
    await expect(engine.execute(pid)).to.be.revertedWith('timelock active');
    await ethers.provider.send('evm_increaseTime', [Number(2n * DAY) + 10]);
    await ethers.provider.send('evm_mine');
    await engine.execute(pid);
    expect(await engine.state(pid)).to.equal(4n); // Executed
  });

  it('defeats a proposal that fails quorum', async () => {
    // Only alice votes: 200 of 10000 = 2% < 4% quorum -> defeated.
    const pid = await createProposal('low turnout');
    await commitReveal(pid, alice, 1); // only 200 of 10000 supply
    await ethers.provider.send('evm_increaseTime', [Number(3n * DAY) + 10]);
    await ethers.provider.send('evm_mine');
    expect(await engine.state(pid)).to.equal(5n); // Defeated
  });
});
