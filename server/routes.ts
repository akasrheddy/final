import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { Block, generateGenesisBlock, addBlock, isChainValid } from "./blockchain";
import { setupArduinoConnection, getArduinoStatus, disconnectArduino } from "./arduino";
import { eq } from "drizzle-orm";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize Arduino connection
  setupArduinoConnection();

  // API routes
  const apiPrefix = "/api";

  // Blockchain status
  app.get(`${apiPrefix}/blockchain/status`, async (req, res) => {
    try {
      const latestBlock = await storage.getLatestBlock();
      res.json({
        active: true,
        blockCount: latestBlock ? latestBlock.index + 1 : 0,
        latestHash: latestBlock ? latestBlock.hash : null,
      });
    } catch (error) {
      console.error("Error getting blockchain status:", error);
      res.status(500).json({ message: "Error fetching blockchain status" });
    }
  });

  // Get entire blockchain
  app.get(`${apiPrefix}/blockchain`, async (req, res) => {
    try {
      const blocks = await storage.getAllBlocks();
      res.json({ blocks });
    } catch (error) {
      console.error("Error getting blockchain:", error);
      res.status(500).json({ message: "Error fetching blockchain" });
    }
  });

  // System status
  app.get(`${apiPrefix}/status`, async (req, res) => {
    try {
      const arduinoStatus = await getArduinoStatus();
      const latestBlock = await storage.getLatestBlock();
      
      res.json({
        arduino: {
          connected: arduinoStatus.isConnected,
          message: arduinoStatus.message
        },
        fingerprintSensor: {
          connected: arduinoStatus.isSensorConnected,
          message: arduinoStatus.sensorMessage
        },
        blockchainNode: {
          connected: true,
          synced: true,
          message: "Blockchain node is operational"
        },
        systemSecurity: {
          status: "Protected",
          message: "System security is active"
        }
      });
    } catch (error) {
      console.error("Error getting system status:", error);
      res.status(500).json({ message: "Error fetching system status" });
    }
  });

  // Register fingerprint
  app.post(`${apiPrefix}/fingerprints/register`, async (req, res) => {
    try {
      const { voterID } = req.body;
      
      if (!voterID) {
        return res.status(400).json({ success: false, message: "Voter ID is required" });
      }
      
      // Check if voter exists
      const user = await storage.getUserByVoterId(voterID);
      
      if (!user) {
        return res.status(404).json({ success: false, message: "Voter not found" });
      }
      
      if (user.hasFingerprint) {
        return res.status(409).json({ success: false, message: "Fingerprint already registered for this voter" });
      }
      
      // Request fingerprint enrollment from Arduino
      const arduinoStatus = await getArduinoStatus();
      
      if (!arduinoStatus.isConnected) {
        return res.status(503).json({ success: false, message: "Arduino is not connected" });
      }
      
      // In a real implementation, we would:
      // 1. Send a command to Arduino to start fingerprint enrollment
      // 2. Wait for Arduino to capture the fingerprint
      // 3. Store the fingerprint template in the database
      
      // For this implementation, we'll simulate success
      const templateData = "SIMULATED_FINGERPRINT_TEMPLATE_" + Date.now();
      await storage.registerFingerprint(user.id, templateData);
      
      res.json({ 
        success: true, 
        message: "Fingerprint registered successfully" 
      });
    } catch (error) {
      console.error("Error registering fingerprint:", error);
      res.status(500).json({ success: false, message: "Error registering fingerprint" });
    }
  });

  // Verify fingerprint
  app.post(`${apiPrefix}/fingerprints/verify`, async (req, res) => {
    try {
      const { voterID } = req.body;
      
      if (!voterID) {
        return res.status(400).json({ success: false, message: "Voter ID is required", verified: false });
      }
      
      // Check if voter exists
      const user = await storage.getUserByVoterId(voterID);
      
      if (!user) {
        return res.status(404).json({ success: false, message: "Voter not found", verified: false });
      }
      
      if (!user.hasFingerprint) {
        return res.status(409).json({ success: false, message: "Fingerprint not registered for this voter", verified: false });
      }
      
      // Check if user has already voted
      if (user.hasVoted) {
        return res.status(409).json({ success: false, message: "You have already cast your vote", verified: false });
      }
      
      // Request fingerprint verification from Arduino
      const arduinoStatus = await getArduinoStatus();
      
      if (!arduinoStatus.isConnected) {
        return res.status(503).json({ success: false, message: "Arduino is not connected", verified: false });
      }
      
      // In a real implementation, we would:
      // 1. Send a command to Arduino to start fingerprint verification
      // 2. Wait for Arduino to capture and verify the fingerprint
      
      // For this implementation, we'll simulate success
      res.json({ 
        success: true, 
        message: "Fingerprint verified successfully", 
        verified: true 
      });
    } catch (error) {
      console.error("Error verifying fingerprint:", error);
      res.status(500).json({ success: false, message: "Error verifying fingerprint", verified: false });
    }
  });

  // Get candidates
  app.get(`${apiPrefix}/candidates`, async (req, res) => {
    try {
      const candidates = await storage.getAllCandidates();
      res.json(candidates);
    } catch (error) {
      console.error("Error getting candidates:", error);
      res.status(500).json({ message: "Error fetching candidates" });
    }
  });

  // Cast vote
  app.post(`${apiPrefix}/votes`, async (req, res) => {
    try {
      const { voterID, candidateID } = req.body;
      
      if (!voterID || !candidateID) {
        return res.status(400).json({ message: "Voter ID and Candidate ID are required" });
      }
      
      // Check if voter exists
      const user = await storage.getUserByVoterId(voterID);
      
      if (!user) {
        return res.status(404).json({ message: "Voter not found" });
      }
      
      // Check if candidate exists
      const candidate = await storage.getCandidateById(parseInt(candidateID));
      
      if (!candidate) {
        return res.status(404).json({ message: "Candidate not found" });
      }
      
      // Check if user has already voted
      if (user.hasVoted) {
        return res.status(409).json({ message: "You have already cast your vote" });
      }
      
      // Create a vote transaction
      const voteData = {
        voterID: user.voterId,
        candidateID: candidate.id,
        timestamp: new Date().toISOString()
      };
      
      // Add transaction to blockchain
      const latestBlock = await storage.getLatestBlock();
      let newBlock: Block;
      
      if (!latestBlock) {
        // Initialize blockchain with genesis block
        const genesisBlock = generateGenesisBlock();
        await storage.addBlock(genesisBlock);
        newBlock = addBlock(genesisBlock, voteData);
      } else {
        newBlock = addBlock(latestBlock, voteData);
      }
      
      // Verify blockchain integrity
      const allBlocks = await storage.getAllBlocks();
      if (allBlocks.length > 0 && !isChainValid([...allBlocks, newBlock])) {
        return res.status(500).json({ message: "Blockchain validation failed" });
      }
      
      // Save block to database
      // Convert timestamp to proper Date object if it's a string
      const blockForStorage = {
        ...newBlock,
        timestamp: newBlock.timestamp instanceof Date ? newBlock.timestamp : new Date(newBlock.timestamp)
      };
      const savedBlock = await storage.addBlock(blockForStorage);
      
      // Record vote in database
      const transactionId = `0x${newBlock.hash.substring(0, 10)}`;
      const vote = await storage.recordVote(user.id, candidate.id, savedBlock.id, transactionId);
      
      // Update user's voting status
      await storage.updateUserVotingStatus(user.id, true);
      
      res.status(201).json({
        id: transactionId,
        blockNumber: newBlock.index,
        timestamp: new Date().toISOString(),
        voterID: user.voterId,
        candidateID: candidate.id
      });
    } catch (error) {
      console.error("Error casting vote:", error);
      res.status(500).json({ message: "Error casting vote" });
    }
  });

  // Get vote transaction
  app.get(`${apiPrefix}/votes/:id`, async (req, res) => {
    try {
      const transactionId = req.params.id;
      const vote = await storage.getVoteByTransactionId(transactionId);
      
      if (!vote) {
        return res.status(404).json({ message: "Vote transaction not found" });
      }
      
      // Get the related block, user, and candidate
      const block = await storage.getBlockById(vote.blockId);
      const user = await storage.getUserById(vote.userId);
      const candidate = await storage.getCandidateById(vote.candidateId);
      
      if (!block || !user || !candidate) {
        return res.status(404).json({ message: "Related data not found" });
      }
      
      res.json({
        id: vote.transactionId,
        blockNumber: block.index,
        timestamp: vote.timestamp.toISOString(),
        voterID: user.voterId,
        candidateID: candidate.id
      });
    } catch (error) {
      console.error("Error getting vote transaction:", error);
      res.status(500).json({ message: "Error fetching vote transaction" });
    }
  });

  // Verify vote
  app.get(`${apiPrefix}/votes/verify/:id`, async (req, res) => {
    try {
      const transactionId = req.params.id;
      const vote = await storage.getVoteByTransactionId(transactionId);
      
      if (!vote) {
        return res.status(404).json({ message: "Vote transaction not found", verified: false });
      }
      
      // Get the related block
      const block = await storage.getBlockById(vote.blockId);
      
      if (!block) {
        return res.status(404).json({ message: "Block not found", verified: false });
      }
      
      // Verify the block is in the blockchain
      const allBlocks = await storage.getAllBlocks();
      const isValid = isChainValid(allBlocks);
      
      res.json({
        verified: isValid,
        blockNumber: block.index,
        timestamp: vote.timestamp.toISOString()
      });
    } catch (error) {
      console.error("Error verifying vote:", error);
      res.status(500).json({ message: "Error verifying vote", verified: false });
    }
  });

  // Get election results
  app.get(`${apiPrefix}/results`, async (req, res) => {
    try {
      const results = await storage.getElectionResults();
      
      // Calculate the total number of votes
      const totalVotes = results.reduce((sum, candidate) => sum + candidate.votes, 0);
      
      // Calculate the percentage for each candidate
      const resultsWithPercentage = results.map(candidate => ({
        ...candidate,
        percentage: totalVotes > 0 ? Math.round((candidate.votes / totalVotes) * 100) : 0
      }));
      
      res.json(resultsWithPercentage);
    } catch (error) {
      console.error("Error getting election results:", error);
      res.status(500).json({ message: "Error fetching election results" });
    }
  });

  // Get voting statistics
  app.get(`${apiPrefix}/statistics`, async (req, res) => {
    try {
      const totalVotes = await storage.getTotalVotes();
      const totalVoters = await storage.getTotalVoters();
      const totalBlocks = await storage.getTotalBlocks();
      
      // Calculate turnout percentage
      const turnout = totalVoters > 0 ? Math.round((totalVotes / totalVoters) * 100) : 0;
      
      // Simulate time remaining (for demo purposes)
      const timeRemaining = "2h 45m";
      
      res.json({
        totalVotes,
        turnout,
        blocksCreated: totalBlocks,
        timeRemaining
      });
    } catch (error) {
      console.error("Error getting voting statistics:", error);
      res.status(500).json({ message: "Error fetching voting statistics" });
    }
  });

  // Clean up resources when the server is shutting down
  process.on('SIGINT', async () => {
    console.log('Server shutting down, cleaning up resources...');
    await disconnectArduino();
    process.exit(0);
  });

  const httpServer = createServer(app);
  return httpServer;
}
