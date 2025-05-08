import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type WorkoutExercise = {
  name: string;
  sets: number;
  reps: string;
  rest: string;
};

export type WorkoutResponse = {
  workout: {
    title: string;
    exercises: WorkoutExercise[];
    intensity: number;
    notes: string;
  };
};
