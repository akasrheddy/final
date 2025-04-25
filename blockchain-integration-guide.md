# Ethereum Blockchain Integration Guide for Voting System

## Overview
This document provides step-by-step instructions for integrating the VotingSystem smart contract with your existing voting application. The integration enables secure, transparent, and tamper-proof voting through Ethereum's Sepolia testnet.

## Prerequisites
- MetaMask browser extension installed
- Sepolia testnet ETH in your accounts
- Remix IDE for deploying the contract

## Smart Contract Deployment
1. Open [Remix IDE](https://remix.ethereum.org/)
2. Create a new file named `VotingSystem.sol`
3. Copy the content from `contracts/VotingSystem.sol` into Remix
4. Compile the contract using Solidity Compiler tab (0.8.0 or higher)
5. Deploy the contract to Sepolia testnet using the Injected Provider - MetaMask
6. Ensure you're connected to Sepolia testnet in MetaMask before deploying
7. After deployment, copy the contract address - you'll need it for configuration

## Configuration Setup
1. Open `client/src/lib/ethereum.ts`
2. Update the following values:
   ```typescript
   export const SEPOLIA_RPC_URL = "https://sepolia.infura.io/v3/YOUR_INFURA_API_KEY";
   export const CONTRACT_ADDRESS = "YOUR_DEPLOYED_CONTRACT_ADDRESS";
   ```
3. If you don't have an Infura API key, you can create one at [Infura](https://infura.io/)

## Smart Contract ABI
After compilation in Remix, you should find the ABI (Application Binary Interface) in the Solidity Compiler tab under "Compilation Details" → "ABI". This was already implemented in the ethereum.ts file, but you may need to update it if you modify the contract.

## Testing the Integration
1. Access the blockchain admin page at `/blockchain-admin`
2. Connect your MetaMask wallet (ensure it's on Sepolia testnet)
3. Register candidates using the admin interface
4. Register voters with their Ethereum addresses and voter IDs
5. Set biometric verification status for registered voters
6. Start the voting process with a specified duration

## Voter Experience
1. Voters access the voting page
2. They connect their Ethereum wallets
3. The system verifies if their wallet is registered and biometrically verified
4. If verified, they can cast their vote securely on the blockchain
5. Votes are recorded transparently and cannot be altered

## Technical Implementation
The integration is split across several key files:
- `contracts/VotingSystem.sol`: The main smart contract
- `client/src/lib/ethereum.ts`: Interface to interact with the contract
- `client/src/components/ethereum-connector.tsx`: UI for connecting wallets
- `client/src/components/blockchain-voting.tsx`: Voting interface
- `client/src/pages/blockchain-admin.tsx`: Admin dashboard

## Administrator Guide
1. Deploy the contract from your admin address
2. Register candidates before opening voting
3. Register voter addresses and link them to voter IDs
4. Verify biometric data for each registered voter
5. Start voting with a defined time limit
6. Monitor results in real-time
7. End voting when appropriate

## Voter Guide
1. Install MetaMask and connect to Sepolia testnet
2. Get registered by the administrator
3. Complete biometric verification
4. Connect your wallet to the voting application
5. Cast your vote securely within the voting period
6. Verify your transaction was recorded on the blockchain

## Troubleshooting
- If MetaMask is not detecting the application, refresh the page
- Ensure you have sufficient Sepolia ETH for transaction fees
- Check that you're using the correct wallet address that was registered
- Verify that voting is active before attempting to cast a vote
- If a transaction fails, check the console for detailed error messages

## Security Considerations
- The contract owner has full administrative control
- All votes are publicly verifiable on the blockchain
- Biometric verification adds an additional layer of security
- Once a vote is cast, it cannot be changed
- Voting status is enforced by the smart contract