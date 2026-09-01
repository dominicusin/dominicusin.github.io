// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./GovernanceToken.sol";

/// @title ProposalEngine v2
/// @notice Enhanced DAO proposal/voting engine with delegation and timelock.
contract ProposalEngine is AccessControl, ReentrancyGuard {
    bytes32 public constant PROPOSER_ROLE = keccak256("PROPOSER_ROLE");

    uint256 public constant QUORUM_BPS = 400; // 4%
    uint256 public constant BPS_DENOM = 10_000;
    uint256 public constant TIMELOCK_DELAY = 2 days;
    uint256 public constant VOTING_PERIOD = 7 days;
    uint256 public constant PROPOSAL_THRESHOLD = 100 * 10**18; // 100 tokens

    GovernanceToken public token;

    enum State { Pending, Active, Succeeded, Queued, Executed, Defeated, Canceled }

    struct Proposal {
        uint256 id;
        address proposer;
        string description;
        bytes32 ipfsHash;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 startBlock;
        uint256 endBlock;
        uint256 executeAfter;
        bool executed;
        bool canceled;
        mapping(address => bool) hasVoted;
    }

    mapping(uint256 => Proposal) public proposals;
    uint256 public proposalCount;

    mapping(uint256 => mapping(address => uint256)) public receipts;

    event ProposalCreated(uint256 indexed id, address indexed proposer, string description, bytes32 ipfsHash);
    event VoteCast(uint256 indexed id, address indexed voter, bool support, uint256 weight);
    event ProposalQueued(uint256 indexed id, uint256 executeAfter);
    event ProposalExecuted(uint256 indexed id);
    event ProposalCanceled(uint256 indexed id);

    constructor(address _token) {
        token = GovernanceToken(_token);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PROPOSER_ROLE, msg.sender);
    }

    function propose(string calldata description, bytes32 ipfsHash) external returns (uint256) {
        require(token.getCurrentVotes(msg.sender) >= PROPOSAL_THRESHOLD, "below threshold");
        
        uint256 id = proposalCount++;
        Proposal storage p = proposals[id];
        p.id = id;
        p.proposer = msg.sender;
        p.description = description;
        p.ipfsHash = ipfsHash;
        p.startBlock = block.timestamp;
        p.endBlock = block.timestamp + VOTING_PERIOD;
        p.executed = false;
        p.canceled = false;

        emit ProposalCreated(id, msg.sender, description, ipfsHash);
        return id;
    }

    function castVote(uint256 proposalId, bool support) external nonReentrant {
        Proposal storage p = proposals[proposalId];
        require(block.timestamp < p.endBlock, "voting ended");
        require(!p.hasVoted[msg.sender], "already voted");

        uint256 weight = token.balanceOf(msg.sender);
        require(weight > 0, "no voting power");

        if (support) {
            p.forVotes += weight;
        } else {
            p.againstVotes += weight;
        }

        p.hasVoted[msg.sender] = true;
        receipts[proposalId][msg.sender] = weight;

        emit VoteCast(proposalId, msg.sender, support, weight);
    }

    function queue(uint256 proposalId) external {
        Proposal storage p = proposals[proposalId];
        require(state(proposalId) == State.Succeeded, "not succeeded");
        p.executeAfter = block.timestamp + TIMELOCK_DELAY;
        emit ProposalQueued(proposalId, p.executeAfter);
    }

    function execute(uint256 proposalId) external nonReentrant {
        Proposal storage p = proposals[proposalId];
        require(state(proposalId) == State.Queued, "not queued");
        require(block.timestamp >= p.executeAfter, "timelock active");

        p.executed = true;
        emit ProposalExecuted(proposalId);
    }

    function cancel(uint256 proposalId) external {
        Proposal storage p = proposals[proposalId];
        require(msg.sender == p.proposer || hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "not authorized");
        require(state(proposalId) != State.Executed && state(proposalId) != State.Canceled, "finalized");

        p.canceled = true;
        emit ProposalCanceled(proposalId);
    }

    function state(uint256 proposalId) public view returns (State) {
        Proposal storage p = proposals[proposalId];
        if (p.canceled) return State.Canceled;
        if (p.executed) return State.Executed;
        if (p.executeAfter != 0 && block.timestamp >= p.executeAfter) return State.Queued;
        if (block.timestamp < p.endBlock) {
            return State.Active;
        }
        uint256 total = token.totalSupply();
        uint256 participated = p.forVotes + p.againstVotes;
        bool quorum = (participated * BPS_DENOM) >= (total * QUORUM_BPS);
        if (quorum && p.forVotes > p.againstVotes) return State.Succeeded;
        return State.Defeated;
    }
}
