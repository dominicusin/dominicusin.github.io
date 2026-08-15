// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/// @title SoulboundToken
/// @notice Non-transferable (soulbound) ERC721 representing author reputation.
///         Reputation cannot be bought, sold, or transferred — it is earned.
contract SoulboundToken is ERC721, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    uint256 private _nextId;
    mapping(uint256 => string) private _reputations;

    constructor(address admin) ERC721("Author Reputation", "REP") {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    /// @notice Mint a soulbound reputation token. Only MINTER_ROLE.
    function mintReputation(address to, string calldata reputation)
        external
        onlyRole(MINTER_ROLE)
        returns (uint256)
    {
        uint256 id = _nextId++;
        _safeMint(to, id);
        _reputations[id] = reputation;
        return id;
    }

    function reputationOf(uint256 id) external view returns (string memory) {
        return _reputations[id];
    }

    // --- Soulbound enforcement: all transfers reverted ---
    function transferFrom(address, address, uint256)
        public
        pure
        override
    {
        revert("SBT: non-transferable");
    }

    function safeTransferFrom(address, address, uint256, bytes memory)
        public
        pure
        override
    {
        revert("SBT: non-transferable");
    }

    function approve(address, uint256) public pure override {
        revert("SBT: non-transferable");
    }

    function setApprovalForAll(address, bool) public pure override {
        revert("SBT: non-transferable");
    }

    function getApproved(uint256) public view override returns (address) {
        return address(0);
    }

    function isApprovedForAll(address, address)
        public
        pure
        override
        returns (bool)
    {
        return false;
    }

    // Resolve the ERC721 (ERC165) + AccessControl (ERC165) diamond: a single
    // override that delegates to both base implementations.
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
