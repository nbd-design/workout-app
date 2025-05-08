import { 
  workoutRequests, type WorkoutRequest, type InsertWorkoutRequest,
  workoutHistory, type WorkoutHistory, type InsertWorkoutHistory 
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  createWorkoutRequest(request: InsertWorkoutRequest): Promise<WorkoutRequest>;
  updateWorkoutContent(id: number, content: string): Promise<WorkoutHistory>;
  getWorkoutHistory(): Promise<WorkoutHistory[]>;
}

export class DatabaseStorage implements IStorage {
  async createWorkoutRequest(request: InsertWorkoutRequest): Promise<WorkoutRequest> {
    const [workoutRequest] = await db
      .insert(workoutRequests)
      .values(request)
      .returning();
    
    return workoutRequest;
  }

  async updateWorkoutContent(requestId: number, content: string): Promise<WorkoutHistory> {
    // First, get the request to retrieve all necessary data
    const [request] = await db
      .select()
      .from(workoutRequests)
      .where(eq(workoutRequests.id, requestId));
    
    if (!request) {
      throw new Error(`Workout request with ID ${requestId} not found`);
    }
    
    // Create the workout history record
    const [workout] = await db
      .insert(workoutHistory)
      .values({
        requestId,
        content,
        muscleGroups: request.muscleGroups,
        intensity: request.intensity,
        workoutType: request.workoutType,
        goal: request.goal,
        duration: request.duration
      })
      .returning();
    
    return workout;
  }

  async getWorkoutHistory(): Promise<WorkoutHistory[]> {
    return await db
      .select()
      .from(workoutHistory)
      .orderBy({ timestamp: 'desc' });
  }
}

export const storage = new DatabaseStorage();
