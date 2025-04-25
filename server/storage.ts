import { db } from "@db";
import { 
  users, 
  candidates, 
  fingerprints, 
  blocks, 
  votes,
  arduinoStatus,
  User,
  Candidate,
  Block,
  Vote
} from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";

// Users (Voters)
async function getUserById(id: number): Promise<User | undefined> {
  const result = await db.select().from(users).where(eq(users.id, id));
  return result[0];
}

async function getUserByVoterId(voterId: string): Promise<User | undefined> {
  const result = await db.select().from(users).where(eq(users.voterId, voterId));
  return result[0];
}

async function updateUserVotingStatus(userId: number, hasVoted: boolean): Promise<User | undefined> {
  const result = await db
    .update(users)
    .set({ hasVoted })
    .where(eq(users.id, userId))
    .returning();
  return result[0];
}

async function getTotalVoters(): Promise<number> {
  const result = await db.select({ count: sql<number>`count(*)` }).from(users);
  return result[0]?.count || 0;
}

// Candidates
async function getAllCandidates(): Promise<Candidate[]> {
  return await db.select().from(candidates);
}

async function getCandidateById(id: number): Promise<Candidate | undefined> {
  const result = await db.select().from(candidates).where(eq(candidates.id, id));
  return result[0];
}

// Fingerprints
async function registerFingerprint(userId: number, templateData: string): Promise<void> {
  // Begin a transaction
  await db.transaction(async (tx) => {
    // Insert the fingerprint template
    await tx
      .insert(fingerprints)
      .values({ userId, templateData })
      .onConflictDoUpdate({
        target: fingerprints.userId,
        set: { templateData }
      });
    
    // Update the user's fingerprint status
    await tx
      .update(users)
      .set({ hasFingerprint: true })
      .where(eq(users.id, userId));
  });
}

// Blockchain
async function getLatestBlock(): Promise<Block | undefined> {
  const result = await db
    .select()
    .from(blocks)
    .orderBy(sql`${blocks.index} desc`)
    .limit(1);
  return result[0];
}

async function getAllBlocks(): Promise<Block[]> {
  return await db
    .select()
    .from(blocks)
    .orderBy(sql`${blocks.index} asc`);
}

async function addBlock(block: Omit<Block, 'id' | 'createdAt'>): Promise<Block> {
  const result = await db
    .insert(blocks)
    .values(block)
    .returning();
  return result[0];
}

async function getBlockById(id: number): Promise<Block | undefined> {
  const result = await db.select().from(blocks).where(eq(blocks.id, id));
  return result[0];
}

async function getTotalBlocks(): Promise<number> {
  const result = await db.select({ count: sql<number>`count(*)` }).from(blocks);
  return result[0]?.count || 0;
}

// Votes
async function recordVote(
  userId: number, 
  candidateId: number, 
  blockId: number, 
  transactionId: string
): Promise<Vote> {
  const result = await db
    .insert(votes)
    .values({
      userId,
      candidateId,
      blockId,
      transactionId,
      timestamp: new Date()
    })
    .returning();
  return result[0];
}

async function getVoteByTransactionId(transactionId: string): Promise<Vote | undefined> {
  const result = await db
    .select()
    .from(votes)
    .where(eq(votes.transactionId, transactionId));
  return result[0];
}

async function getTotalVotes(): Promise<number> {
  const result = await db.select({ count: sql<number>`count(*)` }).from(votes);
  return result[0]?.count || 0;
}

// Election Results
async function getElectionResults(): Promise<{ id: number; name: string; party: string; votes: number }[]> {
  const results = await db.execute(sql`
    SELECT 
      c.id, 
      c.name, 
      c.party, 
      COUNT(v.id) as votes
    FROM 
      ${candidates} c
    LEFT JOIN 
      ${votes} v ON c.id = v.candidate_id
    GROUP BY 
      c.id, c.name, c.party
    ORDER BY 
      votes DESC
  `);
  
  return results.rows.map((row: any) => ({
    id: row.id,
    name: row.name,
    party: row.party,
    votes: parseInt(row.votes) || 0
  }));
}

// Arduino Status
async function updateArduinoStatus(isConnected: boolean, message: string): Promise<void> {
  // Check if a status record exists
  const existing = await db.select().from(arduinoStatus).limit(1);
  
  if (existing.length > 0) {
    // Update existing record
    await db
      .update(arduinoStatus)
      .set({
        isConnected,
        message,
        lastCheckedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(arduinoStatus.id, existing[0].id));
  } else {
    // Create new record
    await db
      .insert(arduinoStatus)
      .values({
        isConnected,
        message,
        lastCheckedAt: new Date()
      });
  }
}

async function getArduinoStatus(): Promise<{ isConnected: boolean; message: string }> {
  const result = await db.select().from(arduinoStatus).limit(1);
  
  if (result.length === 0) {
    return { isConnected: false, message: "Not initialized" };
  }
  
  return {
    isConnected: result[0].isConnected,
    message: result[0].message || ""
  };
}

export const storage = {
  // Users
  getUserById,
  getUserByVoterId,
  updateUserVotingStatus,
  getTotalVoters,
  
  // Candidates
  getAllCandidates,
  getCandidateById,
  
  // Fingerprints
  registerFingerprint,
  
  // Blockchain
  getLatestBlock,
  getAllBlocks,
  addBlock,
  getBlockById,
  getTotalBlocks,
  
  // Votes
  recordVote,
  getVoteByTransactionId,
  getTotalVotes,
  
  // Election Results
  getElectionResults,
  
  // Arduino Status
  updateArduinoStatus,
  getArduinoStatus
};
