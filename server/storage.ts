import { 
  workoutRequests, type WorkoutRequest, type InsertWorkoutRequest,
  workoutHistory, type WorkoutHistory, type InsertWorkoutHistory 
} from "@shared/schema";

export interface IStorage {
  createWorkoutRequest(request: InsertWorkoutRequest): Promise<WorkoutRequest>;
  updateWorkoutContent(id: number, content: string): Promise<WorkoutHistory>;
  getWorkoutHistory(): Promise<WorkoutHistory[]>;
}

export class MemStorage implements IStorage {
  private requests: Map<number, WorkoutRequest>;
  private workouts: Map<number, WorkoutHistory>;
  private currentRequestId: number;
  private currentWorkoutId: number;

  constructor() {
    this.requests = new Map();
    this.workouts = new Map();
    this.currentRequestId = 1;
    this.currentWorkoutId = 1;
  }

  async createWorkoutRequest(request: InsertWorkoutRequest): Promise<WorkoutRequest> {
    const id = this.currentRequestId++;
    const timestamp = new Date();
    
    const workoutRequest: WorkoutRequest = {
      id,
      ...request,
      timestamp
    };
    
    this.requests.set(id, workoutRequest);
    return workoutRequest;
  }

  async updateWorkoutContent(requestId: number, content: string): Promise<WorkoutHistory> {
    const request = this.requests.get(requestId);
    
    if (!request) {
      throw new Error(`Workout request with ID ${requestId} not found`);
    }
    
    const id = this.currentWorkoutId++;
    const timestamp = new Date();
    
    const workout: WorkoutHistory = {
      id,
      requestId,
      content,
      timestamp,
      muscleGroups: request.muscleGroups,
      intensity: request.intensity,
      workoutType: request.workoutType,
      goal: request.goal,
      duration: request.duration
    };
    
    this.workouts.set(id, workout);
    return workout;
  }

  async getWorkoutHistory(): Promise<WorkoutHistory[]> {
    return Array.from(this.workouts.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
}

export const storage = new MemStorage();
