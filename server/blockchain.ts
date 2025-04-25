import * as crypto from "crypto";

export interface Block {
  index: number;
  timestamp: Date;
  data: any;
  previousHash: string;
  hash: string;
  nonce: number;
}

// Calculate hash for a block
function calculateHash(index: number, previousHash: string, timestamp: Date, data: any, nonce: number): string {
  return crypto
    .createHash("sha256")
    .update(index + previousHash + timestamp.getTime() + JSON.stringify(data) + nonce)
    .digest("hex");
}

// Mine a new block (Proof of Work)
function mineBlock(block: Omit<Block, "hash">, difficulty: number = 2): Block {
  const target = Array(difficulty + 1).join("0");
  let nonce = 0;
  let hash = "";
  
  while (true) {
    nonce++;
    hash = calculateHash(
      block.index,
      block.previousHash,
      block.timestamp,
      block.data,
      nonce
    );
    
    if (hash.substring(0, difficulty) === target) {
      break;
    }
  }
  
  return {
    ...block,
    hash,
    nonce
  };
}

// Generate the genesis block (first block in the chain)
export function generateGenesisBlock(): Block {
  const block = {
    index: 0,
    timestamp: new Date(),
    data: "Genesis Block",
    previousHash: "0",
    nonce: 0
  };
  
  return mineBlock(block);
}

// Add a new block to the chain
export function addBlock(previousBlock: Block, data: any): Block {
  const newBlock = {
    index: previousBlock.index + 1,
    timestamp: new Date(),
    data,
    previousHash: previousBlock.hash,
    nonce: 0
  };
  
  return mineBlock(newBlock);
}

// Validate the integrity of the blockchain
export function isChainValid(blockchain: Block[]): boolean {
  // Check each block in the chain
  for (let i = 1; i < blockchain.length; i++) {
    const currentBlock = blockchain[i];
    const previousBlock = blockchain[i - 1];
    
    // Validate the current block's hash
    const hash = calculateHash(
      currentBlock.index,
      currentBlock.previousHash,
      currentBlock.timestamp,
      currentBlock.data,
      currentBlock.nonce
    );
    
    if (currentBlock.hash !== hash) {
      console.log(`Block ${currentBlock.index} has invalid hash`);
      return false;
    }
    
    // Validate the previous hash reference
    if (currentBlock.previousHash !== previousBlock.hash) {
      console.log(`Block ${currentBlock.index} has invalid previous hash reference`);
      return false;
    }
    
    // Validate the block index
    if (currentBlock.index !== previousBlock.index + 1) {
      console.log(`Block ${currentBlock.index} has invalid index`);
      return false;
    }
  }
  
  return true;
}
