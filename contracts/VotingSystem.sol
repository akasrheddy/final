// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title VotingSystem
 * @dev A secure blockchain-based voting system with biometric verification tracking
 */
contract VotingSystem is Ownable {
    using Counters for Counters.Counter;
    
    struct Candidate {
        uint256 id;
        string name;
        string party;
        uint256 voteCount;
        bool isRegistered;
    }
    
    struct Voter {
        string voterId;
        bool hasVoted;
        uint256 candidateId;
        bool isRegistered;
        bool hasBiometricVerification;
    }
    
    // State variables
    mapping(address => Voter) public voters;
    mapping(uint256 => Candidate) public candidates;
    mapping(string => bool) public registeredVoterIds;
    Counters.Counter private _candidateIds;
    Counters.Counter private _totalVotes;
    
    bool public votingActive;
    uint256 public votingStartTime;
    uint256 public votingEndTime;
    
    // Events
    event VoterRegistered(address indexed voterAddress, string voterId);
    event CandidateRegistered(uint256 indexed candidateId, string name, string party);
    event VoteCast(address indexed voter, uint256 indexed candidateId, string voterId);
    event BiometricVerified(string voterId);
    event VotingStarted(uint256 startTime, uint256 endTime);
    event VotingEnded(uint256 endTime, uint256 totalVotes);
    
    // Modifiers
    modifier onlyDuringVoting() {
        require(votingActive, "Voting is not active");
        require(block.timestamp >= votingStartTime, "Voting has not started yet");
        require(block.timestamp <= votingEndTime, "Voting has ended");
        _;
    }
    
    modifier voterNotRegistered(address _address) {
        require(!voters[_address].isRegistered, "Voter already registered");
        _;
    }
    
    modifier candidateExists(uint256 _candidateId) {
        require(candidates[_candidateId].isRegistered, "Candidate does not exist");
        _;
    }
    
    // Constructor
    constructor() {
        votingActive = false;
    }
    
    // Admin functions
    function startVoting(uint256 _durationInMinutes) external onlyOwner {
        require(!votingActive, "Voting is already active");
        
        votingActive = true;
        votingStartTime = block.timestamp;
        votingEndTime = block.timestamp + (_durationInMinutes * 1 minutes);
        
        emit VotingStarted(votingStartTime, votingEndTime);
    }
    
    function endVoting() external onlyOwner {
        require(votingActive, "Voting is not active");
        
        votingActive = false;
        votingEndTime = block.timestamp;
        
        emit VotingEnded(votingEndTime, _totalVotes.current());
    }
    
    function registerCandidate(string memory _name, string memory _party) external onlyOwner {
        _candidateIds.increment();
        uint256 candidateId = _candidateIds.current();
        
        candidates[candidateId] = Candidate({
            id: candidateId,
            name: _name,
            party: _party,
            voteCount: 0,
            isRegistered: true
        });
        
        emit CandidateRegistered(candidateId, _name, _party);
    }
    
    // Voter registration
    function registerVoter(address _voterAddress, string memory _voterId) external onlyOwner voterNotRegistered(_voterAddress) {
        require(!registeredVoterIds[_voterId], "Voter ID already registered");
        
        voters[_voterAddress] = Voter({
            voterId: _voterId,
            hasVoted: false,
            candidateId: 0,
            isRegistered: true,
            hasBiometricVerification: false
        });
        
        registeredVoterIds[_voterId] = true;
        
        emit VoterRegistered(_voterAddress, _voterId);
    }
    
    // Biometric verification
    function setBiometricVerification(address _voterAddress) external onlyOwner {
        require(voters[_voterAddress].isRegistered, "Voter not registered");
        require(!voters[_voterAddress].hasBiometricVerification, "Biometric already verified");
        
        voters[_voterAddress].hasBiometricVerification = true;
        
        emit BiometricVerified(voters[_voterAddress].voterId);
    }
    
    // Voting function
    function castVote(uint256 _candidateId) external onlyDuringVoting candidateExists(_candidateId) {
        require(voters[msg.sender].isRegistered, "Voter not registered");
        require(!voters[msg.sender].hasVoted, "Voter has already voted");
        require(voters[msg.sender].hasBiometricVerification, "Biometric verification required");
        
        voters[msg.sender].hasVoted = true;
        voters[msg.sender].candidateId = _candidateId;
        
        candidates[_candidateId].voteCount++;
        _totalVotes.increment();
        
        emit VoteCast(msg.sender, _candidateId, voters[msg.sender].voterId);
    }
    
    // View functions
    function getCandidateCount() external view returns (uint256) {
        return _candidateIds.current();
    }
    
    function getTotalVotes() external view returns (uint256) {
        return _totalVotes.current();
    }
    
    function getVoterStatus(address _voterAddress) external view returns (
        bool isRegistered,
        bool hasBiometricVerification,
        bool hasVoted,
        uint256 votedFor
    ) {
        Voter memory voter = voters[_voterAddress];
        return (
            voter.isRegistered,
            voter.hasBiometricVerification,
            voter.hasVoted,
            voter.candidateId
        );
    }
    
    function getVotingStatus() external view returns (
        bool isActive,
        uint256 startTime,
        uint256 endTime,
        uint256 remainingTime
    ) {
        uint256 remaining = 0;
        if (votingActive && block.timestamp < votingEndTime) {
            remaining = votingEndTime - block.timestamp;
        }
        
        return (
            votingActive,
            votingStartTime,
            votingEndTime,
            remaining
        );
    }
    
    function getElectionResults() external view returns (
        uint256[] memory candidateIds,
        string[] memory names,
        string[] memory parties,
        uint256[] memory voteCounts
    ) {
        uint256 candidateCount = _candidateIds.current();
        candidateIds = new uint256[](candidateCount);
        names = new string[](candidateCount);
        parties = new string[](candidateCount);
        voteCounts = new uint256[](candidateCount);
        
        for (uint256 i = 1; i <= candidateCount; i++) {
            Candidate memory candidate = candidates[i];
            candidateIds[i-1] = candidate.id;
            names[i-1] = candidate.name;
            parties[i-1] = candidate.party;
            voteCounts[i-1] = candidate.voteCount;
        }
        
        return (candidateIds, names, parties, voteCounts);
    }
}