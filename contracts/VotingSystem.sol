// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * @title VotingSystem
 * @dev A secure blockchain-based voting system with biometric verification support
 */
contract VotingSystem {
    // State variables
    address public owner;
    bool public votingActive;
    uint256 public votingStartTime;
    uint256 public votingEndTime;
    uint256 public candidateCount;
    
    // Structs
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
    
    // Mappings
    mapping(address => Voter) public voters;
    mapping(uint256 => Candidate) public candidates;
    
    // Events
    event VoterRegistered(address indexed voterAddress, string voterId);
    event CandidateRegistered(uint256 indexed candidateId, string name, string party);
    event BiometricVerified(string voterId);
    event VoteCast(address indexed voter, uint256 indexed candidateId, string voterId);
    event VotingStarted(uint256 startTime, uint256 endTime);
    event VotingEnded(uint256 endTime, uint256 totalVotes);
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier votingIsActive() {
        require(votingActive, "Voting is not active");
        require(block.timestamp <= votingEndTime, "Voting period has ended");
        _;
    }
    
    modifier votingNotActive() {
        require(!votingActive, "Voting is already active");
        _;
    }
    
    // Constructor
    constructor() {
        owner = msg.sender;
        candidateCount = 0;
    }
    
    // Admin functions
    /**
     * @dev Start the voting period
     * @param _durationInMinutes Duration of voting period in minutes
     */
    function startVoting(uint256 _durationInMinutes) external onlyOwner votingNotActive {
        require(_durationInMinutes > 0, "Duration must be greater than 0");
        
        votingActive = true;
        votingStartTime = block.timestamp;
        votingEndTime = block.timestamp + (_durationInMinutes * 1 minutes);
        
        emit VotingStarted(votingStartTime, votingEndTime);
    }
    
    /**
     * @dev End the voting period
     */
    function endVoting() external onlyOwner {
        require(votingActive, "Voting is not active");
        
        votingActive = false;
        votingEndTime = block.timestamp;
        
        uint256 totalVotes = 0;
        for (uint256 i = 1; i <= candidateCount; i++) {
            totalVotes += candidates[i].voteCount;
        }
        
        emit VotingEnded(votingEndTime, totalVotes);
    }
    
    /**
     * @dev Register a new candidate
     * @param _name Name of the candidate
     * @param _party Political party of the candidate
     */
    function registerCandidate(string memory _name, string memory _party) external onlyOwner {
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(bytes(_party).length > 0, "Party cannot be empty");
        
        candidateCount++;
        candidates[candidateCount] = Candidate({
            id: candidateCount,
            name: _name,
            party: _party,
            voteCount: 0,
            isRegistered: true
        });
        
        emit CandidateRegistered(candidateCount, _name, _party);
    }
    
    /**
     * @dev Register a new voter
     * @param _voterAddress Ethereum address of the voter
     * @param _voterId Unique identifier for the voter
     */
    function registerVoter(address _voterAddress, string memory _voterId) external onlyOwner {
        require(_voterAddress != address(0), "Invalid voter address");
        require(bytes(_voterId).length > 0, "Voter ID cannot be empty");
        require(!voters[_voterAddress].isRegistered, "Voter already registered");
        
        voters[_voterAddress] = Voter({
            voterId: _voterId,
            hasVoted: false,
            candidateId: 0,
            isRegistered: true,
            hasBiometricVerification: false
        });
        
        emit VoterRegistered(_voterAddress, _voterId);
    }
    
    /**
     * @dev Set biometric verification status for a voter
     * @param _voterAddress Ethereum address of the voter
     */
    function setBiometricVerification(address _voterAddress) external onlyOwner {
        require(voters[_voterAddress].isRegistered, "Voter not registered");
        require(!voters[_voterAddress].hasBiometricVerification, "Biometric already verified");
        
        voters[_voterAddress].hasBiometricVerification = true;
        
        emit BiometricVerified(voters[_voterAddress].voterId);
    }
    
    // Voter functions
    /**
     * @dev Cast a vote for a candidate
     * @param _candidateId ID of the candidate
     */
    function castVote(uint256 _candidateId) external votingIsActive {
        require(voters[msg.sender].isRegistered, "You are not registered to vote");
        require(voters[msg.sender].hasBiometricVerification, "Biometric verification required");
        require(!voters[msg.sender].hasVoted, "You have already voted");
        require(_candidateId > 0 && _candidateId <= candidateCount, "Invalid candidate ID");
        require(candidates[_candidateId].isRegistered, "Candidate not registered");
        
        voters[msg.sender].hasVoted = true;
        voters[msg.sender].candidateId = _candidateId;
        candidates[_candidateId].voteCount++;
        
        emit VoteCast(msg.sender, _candidateId, voters[msg.sender].voterId);
    }
    
    // View functions
    /**
     * @dev Get the current status of a voter
     * @param _voterAddress Ethereum address of the voter
     * @return isRegistered, hasBiometricVerification, hasVoted, votedFor
     */
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
    
    /**
     * @dev Get the current voting status
     * @return isActive, startTime, endTime, remainingTime
     */
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
    
    /**
     * @dev Get the current total number of candidates
     * @return The number of registered candidates
     */
    function getCandidateCount() external view returns (uint256) {
        return candidateCount;
    }
    
    /**
     * @dev Get the total number of votes cast
     * @return The total vote count
     */
    function getTotalVotes() external view returns (uint256) {
        uint256 totalVotes = 0;
        for (uint256 i = 1; i <= candidateCount; i++) {
            totalVotes += candidates[i].voteCount;
        }
        return totalVotes;
    }
    
    /**
     * @dev Get the current election results
     * @return candidateIds, names, parties, voteCounts
     */
    function getElectionResults() external view returns (
        uint256[] memory candidateIds,
        string[] memory names,
        string[] memory parties,
        uint256[] memory voteCounts
    ) {
        candidateIds = new uint256[](candidateCount);
        names = new string[](candidateCount);
        parties = new string[](candidateCount);
        voteCounts = new uint256[](candidateCount);
        
        for (uint256 i = 1; i <= candidateCount; i++) {
            candidateIds[i-1] = candidates[i].id;
            names[i-1] = candidates[i].name;
            parties[i-1] = candidates[i].party;
            voteCounts[i-1] = candidates[i].voteCount;
        }
        
        return (candidateIds, names, parties, voteCounts);
    }
}