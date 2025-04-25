// Simple ethereum interface file - using web3.js which is more stable with our setup
import Web3 from 'web3';

// ABI for the VotingSystem contract - replace with your compiled ABI from Remix
const votingSystemABI = [
  // This is a placeholder ABI - replace with your complete ABI after compilation
];

// Configuration - update with your deployed contract details
export const SEPOLIA_RPC_URL = "https://sepolia.infura.io/v3/"; // Add your Infura API key
export const CONTRACT_ADDRESS = ""; // Replace with your deployed contract address

// Initialize Web3
function getWeb3() {
  if (window.ethereum) {
    return new Web3(window.ethereum);
  } else {
    return new Web3(new Web3.providers.HttpProvider(SEPOLIA_RPC_URL));
  }
}

// Get contract instance
function getContract() {
  const web3 = getWeb3();
  return new web3.eth.Contract(votingSystemABI as any, CONTRACT_ADDRESS);
}

// Get connected account
export async function getConnectedAccount() {
  if (!window.ethereum) {
    throw new Error("MetaMask not installed");
  }
  
  try {
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    return accounts[0] || null;
  } catch (error) {
    console.error("Error getting accounts", error);
    return null;
  }
}

// Request account connection
export async function connectWallet() {
  if (!window.ethereum) {
    throw new Error("MetaMask not installed");
  }
  
  try {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    return accounts[0] || null;
  } catch (error) {
    console.error("User denied account access", error);
    throw error;
  }
}

// Check if user has MetaMask installed
export function isMetaMaskInstalled() {
  return typeof window.ethereum !== 'undefined';
}

// Admin functions
export async function startVoting(durationInMinutes: number) {
  const account = await getConnectedAccount();
  if (!account) throw new Error("No account connected");
  
  const contract = getContract();
  return await contract.methods.startVoting(durationInMinutes).send({ from: account });
}

export async function endVoting() {
  const account = await getConnectedAccount();
  if (!account) throw new Error("No account connected");
  
  const contract = getContract();
  return await contract.methods.endVoting().send({ from: account });
}

export async function registerCandidate(name: string, party: string) {
  const account = await getConnectedAccount();
  if (!account) throw new Error("No account connected");
  
  const contract = getContract();
  return await contract.methods.registerCandidate(name, party).send({ from: account });
}

export async function registerVoter(voterAddress: string, voterId: string) {
  const account = await getConnectedAccount();
  if (!account) throw new Error("No account connected");
  
  const contract = getContract();
  return await contract.methods.registerVoter(voterAddress, voterId).send({ from: account });
}

export async function setBiometricVerification(voterAddress: string) {
  const account = await getConnectedAccount();
  if (!account) throw new Error("No account connected");
  
  const contract = getContract();
  return await contract.methods.setBiometricVerification(voterAddress).send({ from: account });
}

// Voter functions
export async function castVote(candidateId: number) {
  const account = await getConnectedAccount();
  if (!account) throw new Error("No account connected");
  
  const contract = getContract();
  return await contract.methods.castVote(candidateId).send({ from: account });
}

// View functions
export async function getVoterStatus(voterAddress: string) {
  const contract = getContract();
  return await contract.methods.getVoterStatus(voterAddress).call();
}

export async function getCandidateCount() {
  const contract = getContract();
  return await contract.methods.getCandidateCount().call();
}

export async function getTotalVotes() {
  const contract = getContract();
  return await contract.methods.getTotalVotes().call();
}

export async function getVotingStatus() {
  const contract = getContract();
  return await contract.methods.getVotingStatus().call();
}

export async function getElectionResults() {
  const contract = getContract();
  return await contract.methods.getElectionResults().call();
}

// Event subscription - simplified approach
export async function subscribeToEvents(callback: (event: any) => void) {
  const web3 = getWeb3();
  const contract = getContract();
  
  // Set up event listeners
  contract.events.VoterRegistered({}, (error: Error, event: any) => {
    if (error) {
      console.error("Error on VoterRegistered event:", error);
      return;
    }
    callback({
      type: "VoterRegistered",
      voterAddress: event.returnValues.voterAddress,
      voterId: event.returnValues.voterId
    });
  });
  
  contract.events.BiometricVerified({}, (error: Error, event: any) => {
    if (error) {
      console.error("Error on BiometricVerified event:", error);
      return;
    }
    callback({
      type: "BiometricVerified",
      voterId: event.returnValues.voterId
    });
  });
  
  contract.events.VoteCast({}, (error: Error, event: any) => {
    if (error) {
      console.error("Error on VoteCast event:", error);
      return;
    }
    callback({
      type: "VoteCast",
      voter: event.returnValues.voter,
      candidateId: Number(event.returnValues.candidateId),
      voterId: event.returnValues.voterId
    });
  });
  
  // Return unsubscribe function
  return () => {
    // Web3.js doesn't have a direct way to remove all listeners
    // Each subscription would need to be captured and unsubscribed individually
    console.log("Event listeners cannot be automatically removed with web3.js");
  };
}

// Global type definitions
declare global {
  interface Window {
    ethereum?: any;
  }
}