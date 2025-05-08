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
    <div className="container mx-auto px-4 py-8 max-w-5xl relative z-10">
      <header className="mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-3 neon-text tracking-tight">
          Fitness<span className="neon-text-accent">Pal AI</span>
        </h1>
        <p className="text-lg text-neutral-300">Generate personalized workout plans with advanced AI</p>
      </header>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-1/2">
          <div className="glass-card p-6 border border-opacity-20 border-blue-400 rounded-lg shadow-xl">
            <WorkoutForm 
              onWorkoutGenerated={(data) => {
                setIsLoading(true);
                setTimeout(() => handleWorkoutGenerated(data), 500);
              }} 
            />
          </div>
        </div>
        
        <div className="lg:w-1/2">
          <div className="glass-card p-6 border border-opacity-20 border-purple-400 rounded-lg shadow-xl">
            <WorkoutResult 
              workout={workout} 
              onReset={handleReset} 
              isLoading={isLoading} 
            />
          </div>
        </div>
      </div>

      <footer className="mt-12 text-center text-neutral-400 text-sm">
        <p>FitGen AI uses advanced LLM technology to generate workout recommendations.</p>
        <p className="mt-1">This tool is not a replacement for professional fitness advice.</p>
      </footer>
      
      {/* Ambient light effects */}
      <div className="fixed top-0 left-0 w-full h-screen -z-10 overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-blue-500 rounded-full filter blur-[150px] opacity-10"></div>
        <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-purple-500 rounded-full filter blur-[150px] opacity-10"></div>
        <div className="absolute top-1/4 left-1/4 w-1/4 h-1/4 bg-cyan-500 rounded-full filter blur-[150px] opacity-5"></div>
      </div>
    </div>
  );
}
