import * as ethers from 'ethers';

// ABI for the VotingSystem contract
// This needs to be updated with the complete ABI once you compile your contract in Remix
const votingSystemABI = [
  // Events
  "event VoterRegistered(address indexed voterAddress, string voterId)",
  "event CandidateRegistered(uint256 indexed candidateId, string name, string party)",
  "event VoteCast(address indexed voter, uint256 indexed candidateId, string voterId)",
  "event BiometricVerified(string voterId)",
  "event VotingStarted(uint256 startTime, uint256 endTime)",
  "event VotingEnded(uint256 endTime, uint256 totalVotes)",
  
  // View functions
  "function voters(address) view returns (string voterId, bool hasVoted, uint256 candidateId, bool isRegistered, bool hasBiometricVerification)",
  "function candidates(uint256) view returns (uint256 id, string name, string party, uint256 voteCount, bool isRegistered)",
  "function votingActive() view returns (bool)",
  "function votingStartTime() view returns (uint256)",
  "function votingEndTime() view returns (uint256)",
  "function getCandidateCount() view returns (uint256)",
  "function getTotalVotes() view returns (uint256)",
  "function getVoterStatus(address _voterAddress) view returns (bool isRegistered, bool hasBiometricVerification, bool hasVoted, uint256 votedFor)",
  "function getVotingStatus() view returns (bool isActive, uint256 startTime, uint256 endTime, uint256 remainingTime)",
  "function getElectionResults() view returns (uint256[] candidateIds, string[] names, string[] parties, uint256[] voteCounts)",
  
  // State-changing functions
  "function startVoting(uint256 _durationInMinutes) external",
  "function endVoting() external",
  "function registerCandidate(string memory _name, string memory _party) external",
  "function registerVoter(address _voterAddress, string memory _voterId) external",
  "function setBiometricVerification(address _voterAddress) external",
  "function castVote(uint256 _candidateId) external"
];

// Configuration - You'll need to update this with your deployed contract address from Remix
export const SEPOLIA_RPC_URL = "https://sepolia.infura.io/v3/"; // You'll need to add your Infura API key
export const CONTRACT_ADDRESS = ""; // Replace with your deployed contract address

// Connect to the Ethereum provider
export async function getProvider() {
  // If MetaMask is installed, use it
  if (window.ethereum) {
    try {
      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      return new ethers.BrowserProvider(window.ethereum);
    } catch (error) {
      console.error("User denied account access");
      throw error;
    }
  } else {
    // If no injected provider, use fallback
    return new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
  }
}

// Get contract instance
export async function getContract(useSigner = false) {
  const provider = await getProvider();
  
  if (useSigner) {
    const signer = await provider.getSigner();
    return new ethers.Contract(CONTRACT_ADDRESS, votingSystemABI, signer);
  } else {
    return new ethers.Contract(CONTRACT_ADDRESS, votingSystemABI, provider);
  }
}

// Admin functions
export async function startVoting(durationInMinutes: number) {
  const contract = await getContract(true);
  const tx = await contract.startVoting(durationInMinutes);
  return await tx.wait();
}

export async function endVoting() {
  const contract = await getContract(true);
  const tx = await contract.endVoting();
  return await tx.wait();
}

export async function registerCandidate(name: string, party: string) {
  const contract = await getContract(true);
  const tx = await contract.registerCandidate(name, party);
  return await tx.wait();
}

export async function registerVoter(voterAddress: string, voterId: string) {
  const contract = await getContract(true);
  const tx = await contract.registerVoter(voterAddress, voterId);
  return await tx.wait();
}

export async function setBiometricVerification(voterAddress: string) {
  const contract = await getContract(true);
  const tx = await contract.setBiometricVerification(voterAddress);
  return await tx.wait();
}

// Voter functions
export async function castVote(candidateId: number) {
  const contract = await getContract(true);
  const tx = await contract.castVote(candidateId);
  return await tx.wait();
}

// View functions
export async function getVoterStatus(voterAddress: string) {
  const contract = await getContract();
  return await contract.getVoterStatus(voterAddress);
}

export async function getCandidateCount() {
  const contract = await getContract();
  return await contract.getCandidateCount();
}

export async function getTotalVotes() {
  const contract = await getContract();
  return await contract.getTotalVotes();
}

export async function getVotingStatus() {
  const contract = await getContract();
  return await contract.getVotingStatus();
}

export async function getElectionResults() {
  const contract = await getContract();
  return await contract.getElectionResults();
}

// Get connected account
export async function getConnectedAccount() {
  if (!window.ethereum) {
    throw new Error("MetaMask not installed");
  }
  
  const accounts = await window.ethereum.request({ method: 'eth_accounts' });
  return accounts[0] || null;
}

// Request account connection
export async function connectWallet() {
  if (!window.ethereum) {
    throw new Error("MetaMask not installed");
  }
  
  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
  return accounts[0] || null;
}

// Check if user has MetaMask installed
export function isMetaMaskInstalled() {
  return window.ethereum !== undefined;
}

// Listen for blockchain events
export async function subscribeToEvents(callback: (event: any) => void) {
  const contract = await getContract();
  
  // Listen to different events
  contract.on("VoterRegistered", (voterAddress, voterId) => {
    callback({
      type: "VoterRegistered",
      voterAddress,
      voterId
    });
  });
  
  contract.on("BiometricVerified", (voterId) => {
    callback({
      type: "BiometricVerified",
      voterId
    });
  });
  
  contract.on("VoteCast", (voter, candidateId, voterId) => {
    callback({
      type: "VoteCast",
      voter,
      candidateId: candidateId.toNumber(),
      voterId
    });
  });
  
  return () => {
    contract.removeAllListeners();
  };
}

// Global type definitions
declare global {
  interface Window {
    ethereum?: any;
  }
}