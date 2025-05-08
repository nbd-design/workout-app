import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { workoutFormSchema } from "../shared/schema";
import { ZodError } from "zod";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { generateWorkoutWithOpenAI } from "./openai";
import { generateWorkoutWithGemini } from "./gemini";

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

      // Generate workout using Gemini (primary) or fallback to mock
      const geminiResult = await generateWorkoutWithGemini(userPrompt);
      
      let content: string;
      
      if (geminiResult.isDemo) {
        // If the API call failed, use mock data
        console.log("Using mock workout data due to API error");
        content = mockWorkoutResponse(validatedData);
      } else {
        // Format the response if needed
        content = formatWorkoutResponse(geminiResult.content);
      }
      
      // Save the generated workout content
      await storage.updateWorkoutContent(savedWorkout.id, content);

      // Return the workout data 
      res.json({
        parameters: validatedData,
        content,
        isDemo: geminiResult.isDemo
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

  // Get exercise suggestions based on muscle groups
  const exercises = getExercisesForMuscleGroups(params.muscleGroups, params.workoutType, params.intensity);
  
  // Calculate workout duration components
  const mainWorkoutMinutes = parseInt(params.duration) - 10; // Subtract warm-up and cool down
  
  // Generate a basic workout HTML structure based on parameters
  return `
    <h3>Custom ${workoutTypeText} Workout</h3>
    <p>This ${intensityText.toLowerCase()} intensity workout targets your ${muscleGroupsText} and is designed for ${goalText.toLowerCase()}.</p>
    
    <h4>Warm-up (5 minutes)</h4>
    <ul>
      <li>Light cardio: ${exercises.warmup[0]} - 2 minutes</li>
      <li>Dynamic stretching: ${exercises.warmup[1]} - 3 minutes</li>
    </ul>
    
    <h4>Main Workout (${mainWorkoutMinutes} minutes)</h4>
    ${exercises.main.map((exercise, index) => `
    <div class="bg-neutral-50 p-4 rounded-lg mb-4">
      <p class="font-medium">Exercise ${index + 1}: ${exercise.name}</p>
      <p>${exercise.sets} sets of ${exercise.reps} ${exercise.repType || 'reps'} | Rest ${exercise.rest} seconds between sets</p>
      <p class="text-sm text-neutral-600 mt-1">${exercise.tip}</p>
    </div>
    `).join('')}
    
    <h4>Cool Down (5 minutes)</h4>
    <ul>
      ${exercises.cooldown.map(exercise => `<li>${exercise}</li>`).join('')}
    </ul>
    
    <h4>Training Tips</h4>
    <div class="bg-blue-50 p-4 rounded-lg mt-4">
      <p class="font-medium text-blue-800">Pro Tip for ${goalText}</p>
      <p>${getTrainingTip(params.goal, params.intensity)}</p>
    </div>
  `;
}

// Helper function to get training tips based on goal
function getTrainingTip(goal: string, intensity: number): string {
  const tips: Record<string, string[]> = {
    weightLoss: [
      "For weight loss, consistency is key. Aim to perform this workout 3-4 times per week, incorporating cardio on rest days.",
      "Focus on maintaining a caloric deficit through diet and regular exercise for optimal weight loss results.",
      "Consider adding 15-20 minutes of high-intensity interval training (HIIT) at the end of your workout to boost calorie burn."
    ],
    muscleBuild: [
      "For muscle building, ensure you're eating in a slight caloric surplus with adequate protein (1.6-2.2g per kg of bodyweight).",
      "Progressive overload is essential - aim to increase weight or reps every 1-2 weeks.",
      "Allow muscle groups 48-72 hours to recover between training sessions for optimal growth."
    ],
    endurance: [
      "For endurance training, focus on maintaining proper form even as fatigue sets in.",
      "Gradually increase workout duration by 5-10% each week to build sustainable endurance.",
      "Stay well-hydrated and consider adding electrolytes to your water during longer training sessions."
    ],
    strength: [
      "For strength gains, focus on compound movements and lift in the 80-90% of your one-rep max range.",
      "Ensure proper recovery with 2-3 minutes of rest between heavy sets.",
      "Track your lifts to ensure progressive overload over time - aim for small, consistent strength increases."
    ],
    toning: [
      "For muscle toning, use moderate weights with higher repetitions (12-15 reps per set).",
      "Maintain tension throughout each movement with controlled tempos (especially during the lowering phase).",
      "Consider incorporating supersets to increase workout intensity while keeping rest periods short."
    ],
    flexibility: [
      "Hold each stretch for 20-30 seconds, breathing deeply to help muscles relax.",
      "Never bounce in a stretched position - instead, ease gently into each stretch.",
      "For best results, practice flexibility work daily, not just during scheduled workouts."
    ],
    maintenance: [
      "For general fitness maintenance, aim for consistency with 3-4 workouts per week.",
      "Balance your routine with a mix of strength, cardio, and flexibility exercises.",
      "Listen to your body - adjust workout intensity based on energy levels and recovery."
    ]
  };

  // Get tips for the specific goal, or use general tips if goal not found
  const goalTips = tips[goal] || tips.maintenance;
  
  // Use intensity to select a tip (lower intensity gets more basic tips)
  const tipIndex = Math.min(Math.floor(intensity / 2), goalTips.length - 1);
  
  return goalTips[tipIndex];
}

// Helper function to get exercises based on muscle groups and workout type
function getExercisesForMuscleGroups(muscleGroups: string[], workoutType: string, intensity: number): {
  warmup: string[],
  main: Array<{
    name: string,
    sets: number,
    reps: number,
    repType?: string,
    rest: number,
    tip: string
  }>,
  cooldown: string[]
} {
  // Default warmup exercises
  const warmup = [
    muscleGroups.includes("legs") ? "Bodyweight squats and jumping jacks" : "Jogging in place and arm circles",
    muscleGroups.includes("shoulders") || muscleGroups.includes("arms") ? "Arm circles, wrist rotations, and shoulder rolls" : "Hip rotations, torso twists, and bodyweight squats"
  ];
  
  // Default cooldown
  const cooldown = [
    "Static stretching for worked muscle groups - 3 minutes",
    "Deep breathing and relaxation - 2 minutes" 
  ];

  // Main workout exercises based on muscle groups
  const mainExercises: Array<{
    name: string,
    sets: number,
    reps: number,
    repType?: string,
    rest: number,
    tip: string
  }> = [];
  
  // Set intensity-based parameters
  const sets = Math.min(3 + Math.floor(intensity / 2), 5);  // 3 to 5 sets based on intensity
  const rest = Math.max(90 - (intensity * 10), 45);  // 45 to 90 seconds rest based on intensity
  
  // Exercise library by muscle group and workout type
  const exerciseOptions: Record<string, Array<{name: string, reps: number, repType?: string, tip: string}>> = {
    chest: [
      {name: "Push-ups", reps: 12, tip: "Keep your core engaged and body in a straight line."},
      {name: "Dumbbell Chest Press", reps: 10, tip: "Focus on a full range of motion, bringing dumbbells to chest level."},
      {name: "Incline Push-ups", reps: 15, tip: "Elevate your hands on a stable surface for a modified version."},
      {name: "Chest Flies", reps: 12, tip: "Maintain a slight bend in the elbows throughout the movement."}
    ],
    back: [
      {name: "Dumbbell Rows", reps: 12, tip: "Keep your back flat and pull the weight toward your hip."},
      {name: "Superman Holds", reps: 30, repType: "seconds", tip: "Lift arms and legs simultaneously, engaging your entire back."},
      {name: "Pull-ups", reps: 8, tip: "If too challenging, use an assisted pull-up machine or resistance bands."},
      {name: "Lat Pulldowns", reps: 12, tip: "Focus on pulling with your back muscles, not your arms."}
    ],
    legs: [
      {name: "Bodyweight Squats", reps: 15, tip: "Keep weight in your heels and chest up throughout the movement."},
      {name: "Walking Lunges", reps: 10, repType: "per leg", tip: "Take a big step forward and keep your front knee above your ankle."},
      {name: "Glute Bridges", reps: 15, tip: "Squeeze your glutes at the top of the movement."},
      {name: "Bulgarian Split Squats", reps: 10, repType: "per leg", tip: "Keep your front foot flat on the ground and torso upright."}
    ],
    core: [
      {name: "Plank", reps: 45, repType: "seconds", tip: "Keep your body in a straight line from head to heels."},
      {name: "Bicycle Crunches", reps: 20, repType: "per side", tip: "Focus on the rotation and bringing opposite elbow to knee."},
      {name: "Russian Twists", reps: 16, repType: "total", tip: "Keep feet elevated and twist from your core, not your arms."},
      {name: "Mountain Climbers", reps: 20, repType: "per leg", tip: "Maintain a strong plank position while alternating knees to chest."}
    ],
    shoulders: [
      {name: "Shoulder Press", reps: 12, tip: "Avoid arching your back by engaging your core."},
      {name: "Lateral Raises", reps: 12, tip: "Keep a slight bend in your elbows and raise to shoulder height."},
      {name: "Front Raises", reps: 12, tip: "Use a controlled tempo and avoid swinging the weights."},
      {name: "Pike Push-ups", reps: 10, tip: "Form an inverted V with your body and lower your head toward the ground."}
    ],
    arms: [
      {name: "Bicep Curls", reps: 12, tip: "Keep elbows close to your sides throughout the movement."},
      {name: "Tricep Dips", reps: 12, tip: "Lower yourself with control and keep shoulders away from your ears."},
      {name: "Hammer Curls", reps: 12, tip: "Maintain a neutral grip with palms facing each other."},
      {name: "Diamond Push-ups", reps: 10, tip: "Form a diamond shape with your hands directly under your chest."}
    ],
    fullbody: [
      {name: "Burpees", reps: 10, tip: "Focus on proper form rather than speed, especially when fatigued."},
      {name: "Squat to Overhead Press", reps: 12, tip: "Use the power from your legs to help drive the press upward."},
      {name: "Renegade Rows", reps: 8, repType: "per arm", tip: "Keep hips stable and avoid rotating your torso."},
      {name: "Thruster", reps: 12, tip: "Combine a front squat with an overhead press in one fluid motion."}
    ]
  };

  // Adjust exercises based on workout type
  if (workoutType === "hiit") {
    // For HIIT, use time-based instead of rep-based
    for (const group in exerciseOptions) {
      exerciseOptions[group] = exerciseOptions[group].map(ex => ({
        ...ex,
        reps: 30,
        repType: "seconds", 
        tip: ex.tip + " Focus on intensity and minimal rest."
      }));
    }
  } else if (workoutType === "stretching") {
    // For stretching, use longer holds
    for (const group in exerciseOptions) {
      exerciseOptions[group] = [
        {name: `${group.charAt(0).toUpperCase() + group.slice(1)} Stretch 1`, reps: 30, repType: "seconds hold", tip: "Focus on breathing deeply and relaxing into the stretch."},
        {name: `${group.charAt(0).toUpperCase() + group.slice(1)} Stretch 2`, reps: 30, repType: "seconds hold", tip: "Never bounce in a stretched position - hold steady."},
      ];
    }
  }

  // Select exercises for each targeted muscle group
  const selectedMuscleGroups = muscleGroups.includes("fullbody") ? ["fullbody"] : muscleGroups;
  
  selectedMuscleGroups.forEach(group => {
    if (exerciseOptions[group]) {
      // Select 2 exercises per muscle group (fewer for higher intensity)
      const numExercises = Math.max(4 - intensity, 2);
      const exercises = exerciseOptions[group].slice(0, numExercises);
      
      exercises.forEach(exercise => {
        mainExercises.push({
          ...exercise,
          sets,
          rest
        });
      });
    }
  });

  // Limit total exercises to avoid too long workouts (4-6 exercises total)
  const maxExercises = Math.min(Math.max(intensity + 3, 4), 6);
  
  return {
    warmup,
    main: mainExercises.slice(0, maxExercises),
    cooldown
  };
}
