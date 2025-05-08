import { useState } from "react";
import { WorkoutForm } from "@/components/WorkoutForm";
import { WorkoutResult } from "@/components/WorkoutResult";

type WorkoutData = {
  parameters: {
    muscleGroups: string[];
    intensity: number;
    workoutType: string;
    goal: string;
    duration: string;
  };
  content: string;
};

export default function Home() {
  const [workout, setWorkout] = useState<WorkoutData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleWorkoutGenerated = (data: WorkoutData) => {
    setWorkout(data);
    setIsLoading(false);
  };

  const handleReset = () => {
    setWorkout(null);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <header className="mb-8 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-2">FitnessPal AI</h1>
        <p className="text-lg text-neutral-600">Generate personalized workout plans with AI</p>
      </header>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-1/2">
          <WorkoutForm 
            onWorkoutGenerated={(data) => {
              setIsLoading(true);
              setTimeout(() => handleWorkoutGenerated(data), 500);
            }} 
          />
        </div>
        
        <div className="lg:w-1/2">
          <WorkoutResult 
            workout={workout} 
            onReset={handleReset} 
            isLoading={isLoading} 
          />
        </div>
      </div>

      <footer className="mt-12 text-center text-neutral-500 text-sm">
        <p>FitnessPal AI uses open-source LLM technology to generate workout recommendations.</p>
        <p className="mt-1">This tool is not a replacement for professional fitness advice.</p>
      </footer>
    </div>
  );
}
