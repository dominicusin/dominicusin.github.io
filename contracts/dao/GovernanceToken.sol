// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title GovernanceToken (KNOW)
/// @notice ERC20 + Votes + Delegation for DAO governance.
contract GovernanceToken is AccessControl, IERC20, IERC20Metadata {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant SNAPSHOT_ROLE = keccak256("SNAPSHOT_ROLE");

    string public name;
    string public symbol;
    uint8 public constant decimals = 18;

    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    // Delegation
    mapping(address => address) public delegates;
    mapping(address => uint256) public numCheckpoints;
    mapping(address => mapping(uint256 => Checkpoint)) public checkpoints;

    struct Checkpoint {
        uint256 fromBlock;
        uint256 votes;
    }

    // Snapshot for off-chain voting
    uint256 public currentSnapshotId;
    mapping(uint256 => mapping(address => uint256)) public snapshots;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event DelegateChanged(address indexed delegator, address indexed fromDelegate, address indexed toDelegate);
    event Snapshot(uint256 id);

    constructor(string memory _name, string memory _symbol) {
        name = _name;
        symbol = _symbol;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }

    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    function snapshot() external onlyRole(SNAPSHOT_ROLE) returns (uint256) {
        currentSnapshotId++;
        emit Snapshot(currentSnapshotId);
        return currentSnapshotId;
    }

    function getVotes(address account) public view returns (uint256) {
        return checkpoints[account][numCheckpoints[account] - 1].votes;
    }

    function getCurrentVotes(address account) public view returns (uint256) {
        uint256 nCheckpoints = numCheckpoints[account];
        return nCheckpoints > 0 ? checkpoints[account][nCheckpoints - 1].votes : 0;
    }

    function _mint(address to, uint256 amount) internal {
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
        _moveDelegates(address(0), delegates[to], amount);
    }

    function _moveDelegates(address srcRep, address dstRep, uint256 amount) internal {
        if (srcRep != dstRep && amount > 0) {
            if (srcRep != address(0)) {
                uint256 srcRepNum = numCheckpoints[srcRep];
                uint256 srcRepOld = srcRepNum > 0 ? checkpoints[srcRep][srcRepNum - 1].votes : 0;
                uint256 srcRepNew = srcRepOld - amount;
                _writeCheckpoint(srcRep, srcRepNum, srcRepOld, srcRepNew);
            }
            if (dstRep != address(0)) {
                uint256 dstRepNum = numCheckpoints[dstRep];
                uint256 dstRepOld = dstRepNum > 0 ? checkpoints[dstRep][dstRepNum - 1].votes : 0;
                uint256 dstRepNew = dstRepOld + amount;
                _writeCheckpoint(dstRep, dstRepNum, dstRepOld, dstRepNew);
            }
        }
    }

    function _writeCheckpoint(address delegatee, uint256 nCheckpoints, uint256 oldVotes, uint256 newVotes) internal {
        if (nCheckpoints > 0 && checkpoints[delegatee][nCheckpoints - 1].fromBlock == block.number) {
            checkpoints[delegatee][nCheckpoints - 1].votes = newVotes;
        } else {
            checkpoints[delegatee][nCheckpoints] = Checkpoint(block.number, newVotes);
            numCheckpoints[delegatee] = nCheckpoints + 1;
        }
        emit DelegateChanged(delegatee, address(0), delegatee);
    }

    function delegate(address delegatee) external {
        return _delegate(msg.sender, delegatee);
    }

    function _delegate(address delegator, address delegatee) internal {
        address currentDelegate = delegates[delegator];
        uint256 delegatorBalance = balanceOf[delegator];
        delegates[delegator] = delegatee;
        emit DelegateChanged(delegator, currentDelegate, delegatee);
        _moveDelegates(currentDelegate, delegatee, delegatorBalance);
    }

    // ERC20 functions
    function transfer(address to, uint256 amount) external returns (bool) {
        return _transfer(msg.sender, to, amount);
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 currentAllowance = allowance[from][msg.sender];
        require(currentAllowance >= amount, "ERC20: transfer amount exceeds allowance");
        allowance[from][msg.sender] = currentAllowance - amount;
        return _transfer(from, to, amount);
    }

    function _transfer(address from, address to, uint256 amount) internal returns (bool) {
        require(from != address(0), "ERC20: transfer from the zero address");
        require(to != address(0), "ERC20: transfer to the zero address");
        require(balanceOf[from] >= amount, "ERC20: transfer amount exceeds balance");

        balanceOf[from] -= amount;
        balanceOf[to] += amount;

        _moveDelegates(delegates[from], delegates[to], amount);

        emit Transfer(from, to, amount);
        return true;
    }

    function _burn(address account, uint256 amount) internal {
        require(account != address(0), "ERC20: burn from the zero address");
        require(balanceOf[account] >= amount, "ERC20: burn amount exceeds balance");

        balanceOf[account] -= amount;
        totalSupply -= amount;

        _moveDelegates(delegates[account], address(0), amount);

        emit Transfer(account, address(0), amount);
    }

    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }

    // IERC20Metadata
    function transferAndCall(address to, uint256 value, bytes calldata data) external returns (bool) {
        require(_transfer(msg.sender, to, value));
        // Note: In production, implement IERC677Receiver check
        return true;
    }
}
