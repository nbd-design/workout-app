import { serve } from 'https://deno.fresh.runtime.dev/server';
import { z } from 'https://deno.land/x/zod/mod.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const workoutFormSchema = z.object({
  muscleGroups: z.array(z.string()),
  intensity: z.number().min(1).max(5),
  workoutType: z.string(),
  goal: z.string(),
  duration: z.string(),
});

serve(async (req) => {
  try {
    const { muscleGroups, intensity, workoutType, goal, duration } = workoutFormSchema.parse(
      await req.json()
    );

    // Initialize Supabase client (we'll use this later for database operations)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // For now, we'll generate a workout based on the input parameters
    // Later, you can fetch this from a database table
    const exercises = [
      { name: 'Push-ups', sets: 3, reps: '12-15', rest: '60 seconds' },
      { name: 'Squats', sets: 4, reps: '10-12', rest: '90 seconds' },
      { name: 'Pull-ups', sets: 3, reps: '8-10', rest: '60 seconds' },
    ].filter((_, index) => index < parseInt(duration) / 15); // Adjust exercises based on duration

    const response = {
      workout: {
        title: `${goal} ${workoutType} - ${duration} minutes`,
        exercises,
        intensity,
        notes: `This ${workoutType.toLowerCase()} workout focuses on ${muscleGroups.join(', ')} with ${intensity}/5 intensity.`,
      },
    };

    return new Response(JSON.stringify(response), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
