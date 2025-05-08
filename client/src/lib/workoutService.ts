import { z } from 'zod';
import { workoutFormSchema } from '@shared/schema';
import { supabase } from './supabase';
import type { WorkoutResponse } from './supabase';

type WorkoutFormData = z.infer<typeof workoutFormSchema>;

export async function generateWorkout(data: WorkoutFormData): Promise<WorkoutResponse> {
  // Call Supabase Edge Function
  const { data: response, error } = await supabase.functions.invoke('generate-workout', {
    body: data
  });

  if (error) {
    throw new Error(error.message);
  }

  return response;
}
