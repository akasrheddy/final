import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table (voters)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  voterId: text("voter_id").notNull().unique(),
  phone: text("phone"),
  hasFingerprint: boolean("has_fingerprint").default(false),
  hasVoted: boolean("has_voted").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Candidates table
export const candidates = pgTable("candidates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  party: text("party").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Blocks table (blockchain)
export const blocks = pgTable("blocks", {
  id: serial("id").primaryKey(),
  index: integer("index").notNull().unique(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  data: jsonb("data").notNull(),
  previousHash: text("previous_hash").notNull(),
  hash: text("hash").notNull().unique(),
  nonce: integer("nonce").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Votes table
export const votes = pgTable("votes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  candidateId: integer("candidate_id").references(() => candidates.id).notNull(),
  blockId: integer("block_id").references(() => blocks.id).notNull(),
  transactionId: text("transaction_id").notNull().unique(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Fingerprints table
export const fingerprints = pgTable("fingerprints", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull().unique(),
  templateData: text("template_data").notNull(), // Encoded fingerprint template
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Arduino status table
export const arduinoStatus = pgTable("arduino_status", {
  id: serial("id").primaryKey(),
  isConnected: boolean("is_connected").default(false),
  lastCheckedAt: timestamp("last_checked_at").defaultNow().notNull(),
  message: text("message"),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  fingerprint: one(fingerprints, {
    fields: [users.id],
    references: [fingerprints.userId]
  }),
  votes: many(votes)
}));

export const candidatesRelations = relations(candidates, ({ many }) => ({
  votes: many(votes)
}));

export const blocksRelations = relations(blocks, ({ many }) => ({
  votes: many(votes)
}));

export const votesRelations = relations(votes, ({ one }) => ({
  user: one(users, {
    fields: [votes.userId],
    references: [users.id]
  }),
  candidate: one(candidates, {
    fields: [votes.candidateId],
    references: [candidates.id]
  }),
  block: one(blocks, {
    fields: [votes.blockId],
    references: [blocks.id]
  })
}));

export const fingerprintsRelations = relations(fingerprints, ({ one }) => ({
  user: one(users, {
    fields: [fingerprints.userId],
    references: [users.id]
  })
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users, {
  voterId: (schema) => schema.min(5, "Voter ID must be at least 5 characters"),
  phone: (schema) => schema.min(10, "Phone number must be at least 10 digits").optional()
});

export const insertCandidateSchema = createInsertSchema(candidates, {
  name: (schema) => schema.min(2, "Name must be at least 2 characters"),
  party: (schema) => schema.min(2, "Party must be at least 2 characters"),
  description: (schema) => schema.min(10, "Description must be at least 10 characters")
});

export const insertFingerprintSchema = createInsertSchema(fingerprints);
export const insertVoteSchema = createInsertSchema(votes);
export const insertBlockSchema = createInsertSchema(blocks);

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertCandidate = z.infer<typeof insertCandidateSchema>;
export type Candidate = typeof candidates.$inferSelect;

export type InsertFingerprint = z.infer<typeof insertFingerprintSchema>;
export type Fingerprint = typeof fingerprints.$inferSelect;

export type InsertVote = z.infer<typeof insertVoteSchema>;
export type Vote = typeof votes.$inferSelect;

export type InsertBlock = z.infer<typeof insertBlockSchema>;
export type Block = typeof blocks.$inferSelect;
