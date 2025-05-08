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

  const generateMutation = useMutation({
    mutationFn: async (data: z.infer<typeof workoutFormSchema>) => {
      const response = await apiRequest("POST", "/api/workouts/generate", data);
      return response.json();
    },
    onSuccess: (data) => {
      onWorkoutGenerated(data);
    },
    onError: (error) => {
      toast({
        title: "Error generating workout",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: z.infer<typeof workoutFormSchema>) {
    generateMutation.mutate(data);
  }

  const toggleMuscleGroup = (muscleGroup: string) => {
    const isFullBody = muscleGroup === "fullbody";
    let updatedGroups: string[];

    if (isFullBody) {
      // If fullbody is selected, remove all other selections
      updatedGroups = selectedMuscleGroups.includes(muscleGroup) ? [] : [muscleGroup];
    } else {
      // If other group is selected, remove fullbody if present
      if (selectedMuscleGroups.includes(muscleGroup)) {
        updatedGroups = selectedMuscleGroups.filter(group => group !== muscleGroup);
      } else {
        updatedGroups = selectedMuscleGroups.filter(group => group !== "fullbody");
        updatedGroups.push(muscleGroup);
      }
    }

    setSelectedMuscleGroups(updatedGroups);
    form.setValue("muscleGroups", updatedGroups, { shouldValidate: true });
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h2 className="text-xl font-bold text-neutral-800 mb-6">Customize Your Workout</h2>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="muscleGroups"
            render={() => (
              <FormItem>
                <FormLabel className="text-neutral-700 font-medium">
                  Muscle Groups <span className="text-red-500">*</span>
                </FormLabel>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {MUSCLE_GROUPS.map((muscleGroup) => (
                    <Button
                      key={muscleGroup.value}
                      type="button"
                      variant="outline"
                      className={`px-3 py-2 h-auto text-sm font-medium hover:bg-neutral-100 ${
                        selectedMuscleGroups.includes(muscleGroup.value)
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : ""
                      }`}
                      onClick={() => toggleMuscleGroup(muscleGroup.value)}
                    >
                      {muscleGroup.label}
                    </Button>
                  ))}
                </div>
                <FormDescription className="text-xs text-neutral-500">
                  Select one or more muscle groups to focus on
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="intensity"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <div className="flex justify-between">
                  <FormLabel className="text-neutral-700 font-medium">
                    Intensity Level <span className="text-red-500">*</span>
                  </FormLabel>
                  <span className="text-sm font-normal text-neutral-500">
                    {INTENSITY_LABELS[field.value]}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-neutral-600">Beginner</span>
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
                  <span className="text-xs text-neutral-600">Expert</span>
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
                <FormLabel className="text-neutral-700 font-medium">
                  Workout Type <span className="text-red-500">*</span>
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full p-3 h-auto">
                      <SelectValue placeholder="Select workout type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
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
                <FormLabel className="text-neutral-700 font-medium">
                  Fitness Goal <span className="text-red-500">*</span>
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full p-3 h-auto">
                      <SelectValue placeholder="Select your goal" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
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
                <FormLabel className="text-neutral-700 font-medium">
                  Duration <span className="text-red-500">*</span>
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full p-3 h-auto">
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
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
              className="w-full h-auto py-3 px-6 font-medium"
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
