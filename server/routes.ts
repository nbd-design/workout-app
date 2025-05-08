import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { workoutFormSchema } from "../shared/schema";
import { ZodError } from "zod";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { generateWorkoutWithOpenAI } from "./openai";

export async function registerRoutes(app: Express): Promise<Server> {
  // API endpoint to generate workouts
  app.post("/api/workouts/generate", async (req, res) => {
    try {
      // Validate request body using the schema
      const validatedData = workoutFormSchema.parse(req.body);
      
      // Save workout request in storage
      const savedWorkout = await storage.createWorkoutRequest(validatedData);

      // Format the prompt with the parameters
      const userPrompt = formatUserPrompt(validatedData);

      // Generate workout using OpenAI
      const workoutContent = await generateWorkoutWithOpenAI(userPrompt);
      
      // Format the response if needed
      const formattedContent = formatWorkoutResponse(workoutContent);
      
      // Save the generated workout content
      await storage.updateWorkoutContent(savedWorkout.id, formattedContent);

      // Return the workout data
      res.json({
        parameters: validatedData,
        content: formattedContent,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        console.error("Error generating workout:", error);
        res.status(500).json({ message: "Failed to generate workout" });
      }
    }
  });

  // Get history of generated workouts
  app.get("/api/workouts/history", async (req, res) => {
    try {
      const workouts = await storage.getWorkoutHistory();
      res.json(workouts);
    } catch (error) {
      console.error("Error fetching workout history:", error);
      res.status(500).json({ message: "Failed to fetch workout history" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

function formatUserPrompt(params: z.infer<typeof workoutFormSchema>): string {
  // Format intensity level to a text description
  const intensityLabels = ["Beginner", "Light", "Moderate", "Challenging", "Expert"];
  const intensityText = intensityLabels[params.intensity - 1];
  
  // Format muscle groups for better readability
  const muscleGroupsText = params.muscleGroups
    .map(group => group.charAt(0).toUpperCase() + group.slice(1))
    .join(', ');
  
  // Format workout type
  const workoutTypeMap: Record<string, string> = {
    lifting: "Weight Lifting",
    circuit: "Circuit Training",
    crossfit: "CrossFit",
    hiit: "HIIT",
    calisthenics: "Calisthenics",
    stretching: "Stretching/Flexibility",
    combination: "Combination"
  };
  const workoutTypeText = workoutTypeMap[params.workoutType] || params.workoutType;
  
  // Format goal
  const goalMap: Record<string, string> = {
    weightLoss: "Weight Loss",
    muscleBuild: "Muscle Building",
    endurance: "Endurance",
    strength: "Strength",
    toning: "Toning/Definition",
    flexibility: "Flexibility",
    maintenance: "General Fitness/Maintenance"
  };
  const goalText = goalMap[params.goal] || params.goal;

  return `
Generate a detailed workout plan based on these parameters:
- Muscle Groups: ${muscleGroupsText}
- Intensity: ${intensityText} (${params.intensity}/5)
- Workout Type: ${workoutTypeText}
- Goal: ${goalText}
- Duration: ${params.duration} minutes

Please create a structured workout with warm-up, main exercises, and cool down sections. Use HTML formatting for structure (with h3, h4, p, ul, li tags). Include form tips and make it appropriately challenging for the specified intensity level.

Be sure to include the following sections with clear HTML formatting:
1. <h3>Overview</h3> - A brief introduction to the workout
2. <h4>Warm-up</h4> - 5-10 minutes of appropriate warm-up exercises
3. <h4>Main Workout</h4> - The core exercises targeting the specified muscle groups
4. <h4>Cool Down</h4> - Appropriate stretching and recovery
5. <h4>Training Tips</h4> - Advice specific to the workout intensity and goals
`;
}

function formatWorkoutResponse(text: string): string {
  // If the response already has HTML, return it as is
  if (text.includes("<h3>") || text.includes("<div>")) {
    return text;
  }
  
  // Otherwise do some basic formatting
  return text
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>");
}

function mockWorkoutResponse(params: z.infer<typeof workoutFormSchema>): string {
  const muscleGroupsText = params.muscleGroups.join(", ");
  const intensityLabels = ["Beginner", "Light", "Moderate", "Challenging", "Expert"];
  const intensityText = intensityLabels[params.intensity - 1];
  
  const workoutTypes: Record<string, string> = {
    lifting: "Weight Lifting",
    circuit: "Circuit Training",
    crossfit: "CrossFit",
    hiit: "HIIT",
    calisthenics: "Calisthenics",
    stretching: "Stretching/Flexibility",
    combination: "Combination"
  };
  
  const workoutTypeText = workoutTypes[params.workoutType] || params.workoutType;
  
  const goals: Record<string, string> = {
    weightLoss: "Weight Loss",
    muscleBuild: "Muscle Building",
    endurance: "Endurance",
    strength: "Strength",
    toning: "Toning/Definition",
    flexibility: "Flexibility",
    maintenance: "General Fitness/Maintenance"
  };
  
  const goalText = goals[params.goal] || params.goal;

  // Generate a basic workout HTML structure based on parameters
  return `
    <h3>Custom ${workoutTypeText} Workout</h3>
    <p>This ${intensityText.toLowerCase()} intensity workout targets your ${muscleGroupsText} and is designed for ${goalText.toLowerCase()}.</p>
    
    <h4>Warm-up (5-10 minutes)</h4>
    <ul>
      <li>Light cardio: Jogging in place or jumping jacks - 2 minutes</li>
      <li>Dynamic stretching: Arm circles, hip rotations, bodyweight squats - 3 minutes</li>
      <li>Joint mobility exercises - 2-3 minutes</li>
    </ul>
    
    <h4>Main Workout (${parseInt(params.duration) - 15} minutes)</h4>
    <div class="bg-neutral-50 p-4 rounded-lg mb-4">
      <p class="font-medium">Exercise 1: ${params.muscleGroups.includes("chest") ? "Push-ups" : params.muscleGroups.includes("legs") ? "Squats" : "Plank"}</p>
      <p>3 sets of 12-15 reps | Rest 60 seconds between sets</p>
      <p class="text-sm text-neutral-600 mt-1">Focus on proper form and controlled movements.</p>
    </div>
    
    <div class="bg-neutral-50 p-4 rounded-lg mb-4">
      <p class="font-medium">Exercise 2: ${params.muscleGroups.includes("back") ? "Rows" : params.muscleGroups.includes("core") ? "Crunches" : "Lunges"}</p>
      <p>3 sets of 10-12 reps | Rest 60 seconds between sets</p>
      <p class="text-sm text-neutral-600 mt-1">Maintain core engagement throughout the exercise.</p>
    </div>
    
    <div class="bg-neutral-50 p-4 rounded-lg mb-4">
      <p class="font-medium">Exercise 3: ${params.muscleGroups.includes("shoulders") ? "Overhead Press" : params.muscleGroups.includes("arms") ? "Bicep Curls" : "Mountain Climbers"}</p>
      <p>3 sets of 12 reps | Rest 45-60 seconds between sets</p>
      <p class="text-sm text-neutral-600 mt-1">Focus on the mind-muscle connection.</p>
    </div>
    
    <h4>Cool Down (5 minutes)</h4>
    <ul>
      <li>Static stretching for worked muscle groups - 3-4 minutes</li>
      <li>Deep breathing and relaxation - 1-2 minutes</li>
    </ul>
    
    <div class="bg-blue-50 p-4 rounded-lg mt-4">
      <p class="font-medium text-blue-800">Pro Tip</p>
      <p>For ${goalText.toLowerCase()}, consistency is key. Aim to perform this workout 2-3 times per week with at least one day of rest between sessions for optimal results.</p>
    </div>
  `;
}
