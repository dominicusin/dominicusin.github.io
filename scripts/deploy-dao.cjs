/**
 * Deploy the DAO contracts to a network (v4.0).
 * Usage: npx hardhat run scripts/deploy-dao.cjs --network <name>
 * Defaults to the local Hardhat Network when no --network is given.
 */
const hre = require('hardhat');

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log('Deploying DAO contracts from', deployer.address);

  const GovernanceToken = await hre.ethers.getContractFactory('GovernanceToken', deployer);
  const token = await GovernanceToken.deploy(deployer.address);
  await token.waitForDeployment();
  console.log('GovernanceToken:', await token.getAddress());

  const ProposalEngine = await hre.ethers.getContractFactory('ProposalEngine', deployer);
  const engine = await ProposalEngine.deploy(deployer.address, await token.getAddress());
  await engine.waitForDeployment();
  console.log('ProposalEngine:', await engine.getAddress());

  const SoulboundToken = await hre.ethers.getContractFactory('SoulboundToken', deployer);
  const sbt = await SoulboundToken.deploy(deployer.address);
  await sbt.waitForDeployment();
  console.log('SoulboundToken:', await sbt.getAddress());

  // Seed initial governance supply to the deployer (adjust for your DAO).
  const seed = hre.ethers.parseEther('1000');
  await (await token.mint(deployer.address, seed)).wait();
  console.log('Seeded', hre.ethers.formatEther(seed), 'KNOW to deployer');

  console.log('DAO deployment complete.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
