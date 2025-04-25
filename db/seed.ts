import { db } from "./index";
import * as schema from "@shared/schema";
import { eq } from "drizzle-orm";
import * as crypto from "crypto";

async function seed() {
  try {
    console.log("Starting database seed...");
    
    // Seed candidates
    const candidatesData = [
      {
        name: "Candidate A",
        party: "Party X",
        description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut elementum.",
        imageUrl: null
      },
      {
        name: "Candidate B",
        party: "Party Y",
        description: "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum.",
        imageUrl: null
      },
      {
        name: "Candidate C",
        party: "Party Z",
        description: "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia.",
        imageUrl: null
      }
    ];
    
    // Check if candidates already exist
    const existingCandidates = await db.select().from(schema.candidates);
    
    if (existingCandidates.length === 0) {
      console.log("Seeding candidates...");
      await db.insert(schema.candidates).values(candidatesData);
    } else {
      console.log(`Found ${existingCandidates.length} existing candidates, skipping seed.`);
    }
    
    // Seed test users (voters)
    const usersData = [
      {
        username: "voter1",
        password: crypto.createHash("sha256").update("password1").digest("hex"),
        voterId: "V00001",
        phone: "1234567890",
        hasFingerprint: false,
        hasVoted: false
      },
      {
        username: "voter2",
        password: crypto.createHash("sha256").update("password2").digest("hex"),
        voterId: "V00002",
        phone: "2345678901",
        hasFingerprint: false,
        hasVoted: false
      },
      {
        username: "voter3",
        password: crypto.createHash("sha256").update("password3").digest("hex"),
        voterId: "V00003",
        phone: "3456789012",
        hasFingerprint: false,
        hasVoted: false
      }
    ];
    
    // Check if users already exist
    const existingUsers = await db.select().from(schema.users);
    
    if (existingUsers.length === 0) {
      console.log("Seeding users...");
      await db.insert(schema.users).values(usersData);
    } else {
      console.log(`Found ${existingUsers.length} existing users, skipping seed.`);
    }
    
    // Initialize Arduino status
    const existingStatus = await db.select().from(schema.arduinoStatus);
    
    if (existingStatus.length === 0) {
      console.log("Initializing Arduino status...");
      await db.insert(schema.arduinoStatus).values({
        isConnected: false,
        message: "Not initialized",
        lastCheckedAt: new Date()
      });
    }
    
    // Initialize blockchain with genesis block
    const existingBlocks = await db.select().from(schema.blocks);
    
    if (existingBlocks.length === 0) {
      console.log("Initializing blockchain with genesis block...");
      
      const genesisBlock = {
        index: 0,
        timestamp: new Date(),
        data: "Genesis Block",
        previousHash: "0",
        hash: crypto.createHash("sha256").update("genesis").digest("hex"),
        nonce: 0
      };
      
      await db.insert(schema.blocks).values(genesisBlock);
    } else {
      console.log(`Found ${existingBlocks.length} existing blocks, skipping genesis block creation.`);
    }
    
    console.log("Database seed completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

seed();
