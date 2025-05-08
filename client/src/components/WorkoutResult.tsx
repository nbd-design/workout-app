import { useState } from "react";
import { Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { INTENSITY_LABELS } from "@/lib/constants";

interface WorkoutResultProps {
  workout: {
    parameters: {
      muscleGroups: string[];
      intensity: number;
      workoutType: string;
      goal: string;
      duration: string;
    };
    content: string;
    isDemo?: boolean;
  } | null;
  onReset: () => void;
  isLoading: boolean;
}

export function WorkoutResult({ workout, onReset, isLoading }: WorkoutResultProps) {
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const downloadWorkout = () => {
    setDownloadingPdf(true);
    
    // Simulate PDF generation
    setTimeout(() => {
      setDownloadingPdf(false);
      alert("In a production environment, this would download a PDF of your workout plan.");
    }, 1500);
  };

  // Format the parameter values for display
  const formatParameterValue = (key: string, value: any) => {
    if (key === "muscleGroups" && Array.isArray(value)) {
      return value.map(group => capitalizeWords(group)).join(", ");
    }
    if (key === "intensity" && typeof value === "number") {
      return INTENSITY_LABELS[value];
    }
    if (typeof value === "string") {
      return capitalizeWords(value.replace(/([A-Z])/g, ' $1'));
    }
    return value;
  };

  const capitalizeWords = (str: string) => {
    return str.split(/[\s-_]+/).map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(" ");
  };

  // Empty state
  if (!workout && !isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center">
        <div className="p-4 rounded-full glass inline-block mb-6 glow">
          <Dumbbell className="h-12 w-12 text-primary" />
        </div>
        <h3 className="text-xl font-medium neon-text mb-3">Ready to get started?</h3>
        <p className="text-neutral-300 max-w-md">
          Select your workout parameters and click "Generate Workout" to create a personalized fitness plan.
        </p>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-accent opacity-30 blur-lg"></div>
          <div className="p-4 rounded-full glass inline-block mb-6 relative">
            <RefreshCw className="h-12 w-12 text-primary animate-spin" />
          </div>
        </div>
        <h3 className="text-xl font-medium neon-text mb-3">Creating your workout...</h3>
        <p className="text-neutral-300 max-w-md">
          Our AI is designing a personalized workout plan based on your parameters.
        </p>
      </div>
    );
  }

  // Result state
  return (
    <div className="overflow-y-auto max-h-[800px] pr-2">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold neon-text mb-2">Your Workout Plan</h2>
          <div className="h-1 w-16 bg-gradient-to-r from-secondary to-accent rounded-full"></div>
        </div>
        <Button 
          variant="outline" 
          className="glass-input text-primary hover:text-secondary border-opacity-30"
          onClick={onReset}
        >
          <RefreshCw className="mr-1 h-4 w-4" />
          New Workout
        </Button>
      </div>
      
      {workout?.isDemo && (
        <div className="mb-6 p-4 glass-card border border-amber-500/30 text-amber-200 text-sm">
          <p className="flex items-center">
            <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span>
              This workout was generated using our built-in library of exercises. While the AI service is unavailable, 
              we've created a personalized workout based on your selected parameters.
            </span>
          </p>
        </div>
      )}
      
      <div className="mb-6 glass-card p-4 border border-blue-500/20">
        <div className="grid grid-cols-2 gap-3 text-sm">
          {workout && Object.entries(workout.parameters).map(([key, value]) => (
            <div key={key} className="mb-2">
              <p className="text-neutral-400">{capitalizeWords(key)}:</p>
              <p className="font-medium text-white">
                {formatParameterValue(key, value)}
              </p>
            </div>
          ))}
        </div>
      </div>
      
      <div className="workout-content-wrapper">
        <div 
          className="prose prose-invert max-w-none text-neutral-200 workout-content"
          dangerouslySetInnerHTML={{ __html: workout?.content || '' }}
        />
      </div>
      
      <div className="mt-6 pt-6 border-t border-slate-700/50">
        <Button 
          className="w-full h-auto py-3 px-6 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity glow"
          onClick={downloadWorkout}
          disabled={downloadingPdf}
        >
          {downloadingPdf ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Preparing download...
            </>
          ) : (
            <>
              <Download className="mr-2 h-5 w-5" />
              Download Workout Plan
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function Loader2(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function Dumbbell(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m6.5 6.5 11 11" />
      <path d="m21 21-1-1" />
      <path d="m3 3 1 1" />
      <path d="m18 22 4-4" />
      <path d="m2 6 4-4" />
      <path d="m3 10 7-7" />
      <path d="m14 21 7-7" />
    </svg>
  );
}
