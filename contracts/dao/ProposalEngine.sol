// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./GovernanceToken.sol";

/// @title ProposalEngine
/// @notice DAO proposal/voting engine.
///         - Quorum: minimum 4% of total token supply must participate.
///         - Double-vote protection: one vote per address per proposal.
///         - Timelock: executed proposals wait TIMELOCK_DELAY before exec.
///         - Commit-Reveal: votes are committed (hash) then revealed, to
///           mitigate front-running of vote choices.
///         - Token burn on vote (optional mechanic): voting consumes gas only.
contract ProposalEngine is AccessControl {
    bytes32 public constant PROPOSER_ROLE = keccak256("PROPOSER_ROLE");

    uint256 public constant QUORUM_BPS = 400; // 4%
    uint256 public constant BPS_DENOM = 10_000;
    uint256 public constant TIMELOCK_DELAY = 2 days;
    uint256 public constant VOTING_PERIOD = 3 days;

    GovernanceToken public immutable token;

    enum State { Pending, Active, Succeeded, Queued, Executed, Defeated }

    struct Proposal {
        uint256 id;
        address proposer;
        string description;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 createdAt;
        uint256 queuedAt;
        uint256 executeAfter;
        bool executed;
    }

    mapping(uint256 => Proposal) public proposals;
    uint256 public proposalCount;

    // double-vote protection
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    // commit-reveal: commitment hash per voter
    mapping(uint256 => mapping(address => bytes32)) public commitments;
    // revealed choice per voter
    mapping(uint256 => mapping(address => uint8)) public revealed;

    event ProposalCreated(uint256 id, address proposer, string description);
    event Committed(uint256 id, address voter, bytes32 commitment);
    event VoteRevealed(uint256 id, address voter, uint8 support);
    event ProposalQueued(uint256 id, uint256 executeAfter);
    event ProposalExecuted(uint256 id);

    constructor(address admin, address governanceToken) {
        token = GovernanceToken(governanceToken);
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(PROPOSER_ROLE, admin);
    }

    function createProposal(string calldata description)
        external
        onlyRole(PROPOSER_ROLE)
        returns (uint256)
    {
        uint256 id = proposalCount++;
        proposals[id] = Proposal({
            id: id,
            proposer: msg.sender,
            description: description,
            forVotes: 0,
            againstVotes: 0,
            createdAt: block.timestamp,
            queuedAt: 0,
            executeAfter: 0,
            executed: false
        });
        emit ProposalCreated(id, msg.sender, description);
        return id;
    }

    /// @notice Commit a vote hash (keccak256(support, salt)).
    function commit(uint256 proposalId, bytes32 commitment) external {
        require(state(proposalId) == State.Active, "not active");
        require(commitments[proposalId][msg.sender] == bytes32(0), "already committed");
        commitments[proposalId][msg.sender] = commitment;
        emit Committed(proposalId, msg.sender, commitment);
    }

    /// @notice Reveal and count a vote. support: 1=for, 0=against.
    function reveal(uint256 proposalId, uint8 support, bytes32 salt) external {
        require(state(proposalId) == State.Active, "not active");
        require(!hasVoted[proposalId][msg.sender], "already voted");
        bytes32 comm = commitments[proposalId][msg.sender];
        require(comm != bytes32(0), "no commitment");
        require(keccak256(abi.encodePacked(support, salt)) == comm, "bad reveal");

        uint256 weight = token.balanceOf(msg.sender);
        require(weight > 0, "no voting power");

        if (support == 1) proposals[proposalId].forVotes += weight;
        else proposals[proposalId].againstVotes += weight;

        hasVoted[proposalId][msg.sender] = true;
        revealed[proposalId][msg.sender] = support;
        emit VoteRevealed(proposalId, msg.sender, support);
    }

    /// @notice Queue a succeeded proposal for timelock execution.
    function queue(uint256 proposalId) external {
        require(state(proposalId) == State.Succeeded, "not succeeded");
        Proposal storage p = proposals[proposalId];
        p.queuedAt = block.timestamp;
        p.executeAfter = block.timestamp + TIMELOCK_DELAY;
        emit ProposalQueued(proposalId, p.executeAfter);
    }

    /// @notice Execute a queued, timelock-elapsed proposal.
    function execute(uint256 proposalId) external {
        Proposal storage p = proposals[proposalId];
        require(state(proposalId) == State.Queued, "not queued");
        require(block.timestamp >= p.executeAfter, "timelock active");
        p.executed = true;
        emit ProposalExecuted(proposalId);
    }

    function state(uint256 proposalId) public view returns (State) {
        Proposal storage p = proposals[proposalId];
        if (p.executed) return State.Executed;
        if (p.queuedAt != 0) return State.Queued;
        if (block.timestamp < p.createdAt + VOTING_PERIOD) {
            uint256 total = token.totalSupply();
            uint256 participated = p.forVotes + p.againstVotes;
            bool quorum = (participated * BPS_DENOM) >= (total * QUORUM_BPS);
            if (quorum && p.forVotes > p.againstVotes) return State.Succeeded;
            if (block.timestamp >= p.createdAt + VOTING_PERIOD) return State.Defeated;
            return State.Active;
        }
        uint256 total = token.totalSupply();
        uint256 participated = p.forVotes + p.againstVotes;
        bool quorum = (participated * BPS_DENOM) >= (total * QUORUM_BPS);
        if (quorum && p.forVotes > p.againstVotes) return State.Succeeded;
        return State.Defeated;
    }
}
