#!/usr/bin/env node
/**
 * DAO Security Audit — static heuristic checks (v4.0).
 *
 * A lightweight, dependency-free gate that verifies the safety patterns the
 * manual/Slither/Mythril review recommended are actually present in the
 * deployed contracts: reentrancy guard, Solidity >=0.8 (overflow-safe),
 * commit-reveal for vote privacy, and AccessControl role gating.
 *
 * This is NOT a substitute for Slither/Mythril on a real audit — it is a
 * CI-friendly smoke check that fails the build if a protected pattern
 * regresses. Run: node scripts/audit-dao.cjs
 */
const fs = require('fs');
const path = require('path');

const DAO_DIR = path.join(__dirname, '..', 'contracts', 'dao');

const checks = [
  {
    name: 'Reentrancy guard / Checks-Effects-Interactions in execute',
    file: 'ProposalEngine.sol',
    test: (src) => src.includes('function execute(') && src.includes('p.executed = true')
  },
  {
    name: 'Solidity >=0.8 (built-in overflow protection)',
    file: 'ProposalEngine.sol',
    test: (src) => /^pragma solidity \^?0\.8\.\d+;/m.test(src)
  },
  {
    name: 'Commit-Reveal scheme present (commit + reveal)',
    file: 'ProposalEngine.sol',
    test: (src) => src.includes('function commit(') && src.includes('function reveal(') &&
                   src.includes('keccak256(abi.encodePacked')
  },
  {
    name: 'AccessControl role gating on proposer',
    file: 'ProposalEngine.sol',
    test: (src) => src.includes("onlyRole(PROPOSER_ROLE)") && src.includes("DEFAULT_ADMIN_ROLE")
  },
  {
    name: 'Soulbound token is non-transferable',
    file: 'SoulboundToken.sol',
    test: (src) => src.includes("revert(\"SBT: non-transferable\")") &&
                   src.includes('function transferFrom') && src.includes('function safeTransferFrom')
  },
  {
    name: 'GovernanceToken mint restricted to owner',
    file: 'GovernanceToken.sol',
    test: (src) => src.includes('onlyOwner') && src.includes('MAX_SUPPLY')
  }
];

let failures = 0;
console.log('🔐 DAO Security Audit (static heuristics)\n');
for (const c of checks) {
  const fpath = path.join(DAO_DIR, c.file);
  let ok = false;
  try {
    const src = fs.readFileSync(fpath, 'utf8');
    ok = c.test(src);
  } catch (e) {
    ok = false;
  }
  if (ok) {
    console.log(`  ✓ ${c.name}`);
  } else {
    console.log(`  ✗ ${c.name}  (${c.file})`);
    failures += 1;
  }
}

console.log('');
if (failures > 0) {
  console.error(`Audit FAILED: ${failures} check(s) did not pass.`);
  process.exit(1);
}
console.log('Audit PASSED: all safety patterns present.');
