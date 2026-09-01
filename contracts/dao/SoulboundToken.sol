// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/// @title SoulboundToken (SBT)
/// @notice ERC721 soulbound token for achievements and contributions.
/// @dev Tokens cannot be transferred (soulbound).
contract SoulboundToken is ERC721, AccessControl {
    using Strings for uint256;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    uint256 private _nextTokenId;
    mapping(uint256 => string) public achievements;
    mapping(address => uint256[]) public ownerAchievements;

    event AchievementMinted(address indexed to, uint256 tokenId, string achievement);

    constructor() ERC721("DominicusIn Achievement", "DIA") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }

    function mint(address to, string calldata achievement) external onlyRole(MINTER_ROLE) returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        achievements[tokenId] = achievement;
        ownerAchievements[to].push(tokenId);
        emit AchievementMinted(to, tokenId, achievement);
        return tokenId;
    }

    function burn(uint256 tokenId) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _burn(tokenId);
    }

    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        // Prevent transfers (soulbound)
        require(from == address(0) || to == address(0), "SBT: soulbound");
        return super._update(to, tokenId, auth);
    }

    function getAchievements(address owner) external view returns (string[] memory) {
        uint256[] memory ids = ownerAchievements[owner];
        string[] memory result = new string[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            result[i] = achievements[ids[i]];
        }
        return result;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        return string(abi.encodePacked("ipfs://", achievements[tokenId]));
    }
}
