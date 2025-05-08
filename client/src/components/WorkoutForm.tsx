import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Dumbbell } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

import { MUSCLE_GROUPS, WORKOUT_TYPES, GOALS, DURATIONS, INTENSITY_LABELS } from "@/lib/constants";
import { apiRequest } from "@/lib/queryClient";
import { workoutFormSchema } from "@shared/schema";

interface WorkoutFormProps {
  onWorkoutGenerated: (workout: any) => void;
}

export function WorkoutForm({ onWorkoutGenerated }: WorkoutFormProps) {
  const { toast } = useToast();
  const [selectedMuscleGroups, setSelectedMuscleGroups] = useState<string[]>([]);

  const form = useForm<z.infer<typeof workoutFormSchema>>({
    resolver: zodResolver(workoutFormSchema),
    defaultValues: {
      muscleGroups: [],
      intensity: 3,
      workoutType: "",
      goal: "",
      duration: "",
    },
  });

  // Updated generateMutation using object syntax with mutationFn key
  const generateMutation = useMutation<any, Error, z.infer<typeof workoutFormSchema>>({
    mutationFn: async (data: z.infer<typeof workoutFormSchema>) => {
      try {
        console.log("Calling generateWorkout with data:", data);
        const { generateWorkout } = await import('@/lib/workoutService');
        const result = await generateWorkout(data);
        console.log("Raw API response:", result);
        return result;
      } catch (err: unknown) {
        // Log detailed error information
        const error = err as Error;
        console.error("Detailed error in mutation function:", {
          message: error.message,
          stack: error.stack,
          name: error.name,
          cause: error.cause,
          fullError: error
        });
        throw err; // Re-throw to be caught by onError
      }
    },
    onSuccess: (data) => {
      console.log("Workout generated successfully:", data);
      onWorkoutGenerated(data);
    },
    onError: (error: any) => {
      console.error("Error generating workout:", {
        message: error?.message,
        name: error?.name,
        stack: error?.stack,
        fullError: error
      });
      toast({
        variant: "destructive",
        title: "Workout generation error",
        description: error?.message || "Failed to generate workout. Please try again later.",
      });
    }
  });

  function onSubmit(data: z.infer<typeof workoutFormSchema>) {
    console.log("Submitting workout data:", data);
    generateMutation.mutate(data);
  }

  const toggleMuscleGroup = (group: string) => {
    const newSelection = selectedMuscleGroups.includes(group)
      ? selectedMuscleGroups.filter(g => g !== group)
      : [...selectedMuscleGroups, group];
    setSelectedMuscleGroups(newSelection);
    form.setValue("muscleGroups", newSelection);
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold neon-text mb-2">Customize Your Workout</h2>
        <div className="h-1 w-16 bg-gradient-to-r from-primary to-accent rounded-full"></div>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="muscleGroups"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel className="text-neutral-200 font-medium">
                  Muscle Groups <span className="text-red-400">*</span>
                </FormLabel>
                
                <div className="muscle-group-selector">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {MUSCLE_GROUPS.map((muscleGroup) => {
                      const isSelected = selectedMuscleGroups.includes(muscleGroup.value);
                      return (
                        <div
                          key={muscleGroup.value}
                          onClick={() => toggleMuscleGroup(muscleGroup.value)}
                          className={`
                            relative flex items-center justify-center p-3 rounded-md cursor-pointer
                            transition-all duration-200 ease-in-out
                            ${isSelected 
                              ? 'bg-primary/30 text-white border-2 border-primary shadow-lg' 
                              : 'glass-input hover:bg-primary/10 hover:border-primary/50 border-2 border-transparent'}
                          `}
                          aria-selected={isSelected}
                          role="option"
                        >
                          {/* Selection indicator */}
                          {isSelected && (
                            <div className="absolute top-1 right-1 h-3 w-3 bg-primary rounded-full" />
                          )}
                          
                          <span className="font-medium text-sm">{muscleGroup.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-2">
                  <FormDescription className="text-xs text-neutral-400">
                    Select one or more muscle groups to focus on
                  </FormDescription>
                  
                  {selectedMuscleGroups.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMuscleGroups([]);
                        form.setValue("muscleGroups", []);
                      }}
                      className="text-xs text-primary hover:text-primary/80 transition-colors"
                    >
                      Clear selection
                    </button>
                  )}
                </div>
                
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="intensity"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <div className="flex justify-between items-center">
                  <FormLabel className="text-neutral-200 font-medium">
                    Intensity Level <span className="text-red-400">*</span>
                  </FormLabel>
                  <span className="text-sm font-normal text-primary neon-text">
                    {INTENSITY_LABELS[field.value]}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-neutral-400">Beginner</span>
                  <FormControl>
                    <Slider
                      min={1}
                      max={5}
                      step={1}
                      value={[field.value]}
                      onValueChange={(value) => field.onChange(value[0])}
                      className="w-full"
                    />
                  </FormControl>
                  <span className="text-xs text-neutral-400">Expert</span>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="workoutType"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel className="text-neutral-200 font-medium">
                  Workout Type <span className="text-red-400">*</span>
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full p-3 h-auto glass-input backdrop-blur-md border-opacity-30">
                      <SelectValue placeholder="Select workout type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="glass-card border-opacity-30">
                    {WORKOUT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="goal"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel className="text-neutral-200 font-medium">
                  Fitness Goal <span className="text-red-400">*</span>
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full p-3 h-auto glass-input backdrop-blur-md border-opacity-30">
                      <SelectValue placeholder="Select your goal" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="glass-card border-opacity-30">
                    {GOALS.map((goal) => (
                      <SelectItem key={goal.value} value={goal.value}>
                        {goal.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel className="text-neutral-200 font-medium">
                  Duration <span className="text-red-400">*</span>
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full p-3 h-auto glass-input backdrop-blur-md border-opacity-30">
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="glass-card border-opacity-30">
                    {DURATIONS.map((duration) => (
                      <SelectItem key={duration.value} value={duration.value}>
                        {duration.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="pt-2">
            <Button 
              type="submit" 
              className="w-full h-auto py-3 px-6 font-medium bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
              disabled={generateMutation.isPending}
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating your workout...
                </>
              ) : (
                <>
                  <Dumbbell className="mr-2 h-5 w-5" />
                  Generate Workout
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
