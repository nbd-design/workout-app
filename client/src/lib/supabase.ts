import { createClient } from '@supabase/supabase-js';

// Get environment variables with fallbacks for development mode
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://vztkefrbzgudnazrbyel.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6dGtlZnJiemd1ZG5henJieWVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3MjAwNTksImV4cCI6MjA2MjI5NjA1OX0.Ix1G6n7DO5wu4CkFFUvn08FKRPcqXqziT6C6_2DMWoc';

// Log whether we're using environment variables or fallbacks
if (import.meta.env.DEV) {
  if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    console.warn('Using fallback Supabase credentials in development mode. This is OK for testing.');
  } else {
    console.log('Using Supabase credentials from environment variables.');
  }
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
