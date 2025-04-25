import { apiRequest } from "./queryClient";

export interface Block {
  index: number;
  timestamp: number;
  data: any;
  previousHash: string;
  hash: string;
  nonce: number;
}

export interface Transaction {
  id: string;
  blockNumber: number;
  timestamp: string;
  voterID: string;
  candidateID: string;
}

// Fetch the latest blockchain
export async function fetchBlockchain(): Promise<Block[]> {
  const response = await fetch('/api/blockchain');
  const data = await response.json();
  return data.blocks;
}

// Submit a vote to the blockchain
export async function submitVote(voterID: string, candidateID: string): Promise<Transaction> {
  const response = await apiRequest('POST', '/api/votes', { voterID, candidateID });
  return await response.json();
}

// Get vote transaction details
export async function getVoteTransaction(transactionId: string): Promise<Transaction> {
  const response = await fetch(`/api/votes/${transactionId}`);
  const data = await response.json();
  return data;
}

// Verify a vote using the blockchain
export async function verifyVote(transactionId: string): Promise<boolean> {
  const response = await fetch(`/api/votes/verify/${transactionId}`);
  const data = await response.json();
  return data.verified;
}
