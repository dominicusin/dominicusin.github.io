// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title GovernanceToken
/// @notice ERC20 voting token for the DAO. Minting is restricted to the owner
///         (the ProposalEngine / governance), preventing arbitrary inflation.
contract GovernanceToken is ERC20, Ownable {
    uint256 public constant MAX_SUPPLY = 1_000_000e18;

    constructor(address initialOwner)
        ERC20("Knowledge Governance", "KNOW")
        Ownable(initialOwner)
    {}

    /// @notice Mint governance tokens. Only the owner may mint.
    function mint(address to, uint256 amount) external onlyOwner {
        require(totalSupply() + amount <= MAX_SUPPLY, "cap exceeded");
        _mint(to, amount);
    }
}
