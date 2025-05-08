import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Workout form schema
export const workoutFormSchema = z.object({
  muscleGroups: z.array(z.string()).min(1, { message: "Select at least one muscle group" }),
  intensity: z.number().min(1).max(5),
  workoutType: z.string().min(1, { message: "Workout type is required" }),
  goal: z.string().min(1, { message: "Fitness goal is required" }),
  duration: z.string().min(1, { message: "Duration is required" }),
});

// Database schema for workout requests
export const workoutRequests = pgTable("workout_requests", {
  id: serial("id").primaryKey(),
  muscleGroups: text("muscle_groups").array().notNull(),
  intensity: integer("intensity").notNull(),
  workoutType: text("workout_type").notNull(),
  goal: text("goal").notNull(),
  duration: text("duration").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertWorkoutRequestSchema = createInsertSchema(workoutRequests).omit({ 
  id: true,
  timestamp: true
});

// Database schema for workout history
export const workoutHistory = pgTable("workout_history", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").notNull().references(() => workoutRequests.id),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  // Duplicate some fields for easier querying
  muscleGroups: text("muscle_groups").array().notNull(),
  intensity: integer("intensity").notNull(),
  workoutType: text("workout_type").notNull(),
  goal: text("goal").notNull(),
  duration: text("duration").notNull(),
});

export const insertWorkoutHistorySchema = createInsertSchema(workoutHistory).omit({ 
  id: true,
  timestamp: true
});

// User schema (from the initial template)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Export types
export type InsertWorkoutRequest = z.infer<typeof insertWorkoutRequestSchema>;
export type WorkoutRequest = typeof workoutRequests.$inferSelect;

export type InsertWorkoutHistory = z.infer<typeof insertWorkoutHistorySchema>;
export type WorkoutHistory = typeof workoutHistory.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
