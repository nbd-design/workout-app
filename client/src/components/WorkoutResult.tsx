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
      <div className="bg-white rounded-xl shadow-md p-6 h-full flex flex-col items-center justify-center text-center">
        <div className="p-4 rounded-full bg-neutral-100 inline-block mb-4">
          <Dumbbell className="h-10 w-10 text-neutral-400" />
        </div>
        <h3 className="text-xl font-medium text-neutral-700 mb-2">Ready to get started?</h3>
        <p className="text-neutral-500 max-w-md">
          Select your workout parameters and click "Generate Workout" to create a personalized fitness plan.
        </p>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 h-full flex flex-col items-center justify-center text-center">
        <div className="p-4 rounded-full bg-primary-light/20 inline-block mb-4">
          <RefreshCw className="h-10 w-10 text-primary animate-spin" />
        </div>
        <h3 className="text-xl font-medium text-neutral-700 mb-2">Creating your workout...</h3>
        <p className="text-neutral-500 max-w-md">
          Our AI is designing a personalized workout plan based on your parameters.
        </p>
      </div>
    );
  }

  // Result state
  return (
    <div className="bg-white rounded-xl shadow-md p-6 overflow-y-auto max-h-[800px]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-neutral-800">Your Workout Plan</h2>
        <Button 
          variant="ghost" 
          className="text-primary hover:text-primary-dark font-medium"
          onClick={onReset}
        >
          <RefreshCw className="mr-1 h-4 w-4" />
          New Workout
        </Button>
      </div>
      
      <div className="mb-6 p-4 bg-neutral-100 rounded-lg">
        <div className="grid grid-cols-2 gap-3 text-sm">
          {workout && Object.entries(workout.parameters).map(([key, value]) => (
            <div key={key}>
              <p className="text-neutral-500">{capitalizeWords(key)}:</p>
              <p className="font-medium text-neutral-800">
                {formatParameterValue(key, value)}
              </p>
            </div>
          ))}
        </div>
      </div>
      
      <div 
        className="prose max-w-none text-neutral-800"
        dangerouslySetInnerHTML={{ __html: workout?.content || '' }}
      />
      
      <div className="mt-6 pt-6 border-t border-neutral-200">
        <Button 
          className="w-full bg-blue-500 hover:bg-blue-600 h-auto py-3 px-6"
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
