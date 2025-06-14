import { z } from 'zod';
import { workoutFormSchema } from '@shared/schema';
import { supabase } from './supabase';
import type { WorkoutResponse } from './supabase';

type WorkoutFormData = z.infer<typeof workoutFormSchema>;

/**
 * Creates mock workout data for development and testing
 */
function createMockWorkout(data: WorkoutFormData): WorkoutResponse {
  // Create mock exercises based on the user's selections
  const mockExercises = [
    {
      name: 'Push-ups',
      sets: 3,
      reps: '12-15',
      rest: '60 seconds'
    },
    {
      name: 'Squats',
      sets: 4,
      reps: '10-12',
      rest: '90 seconds'
    },
    {
      name: 'Pull-ups',
      sets: 3,
      reps: '8-10',
      rest: '60 seconds'
    }
  ];
  
  // Generate clean HTML content for the workout
  const exercisesHtml = mockExercises.map(ex => `
    <div class="exercise-card">
      <h3>${ex.name}</h3>
      <ul>
        <li><strong>Sets:</strong> ${ex.sets}</li>
        <li><strong>Reps:</strong> ${ex.reps}</li>
        <li><strong>Rest:</strong> ${ex.rest}</li>
      </ul>
    </div>
  `).join('');
  
  const workoutTitle = `${data.goal} ${data.workoutType} Workout`;
  const workoutDescription = `This ${data.workoutType.toLowerCase()} workout focuses on ${data.muscleGroups.join(', ')} with ${data.intensity}/5 intensity.`;
  
  // Create clean HTML content without any problematic styling
  const htmlContent = `
    <div>
      <h2>${workoutTitle}</h2>
      <p>${workoutDescription}</p>
      <p><em>(Development mode: Using mock data)</em></p>
      <div class="exercises-container">
        ${exercisesHtml}
      </div>
    </div>
  `;
  
  // Return a properly structured WorkoutResponse object
  return {
    workout: {
      title: workoutTitle,
      exercises: mockExercises,
      intensity: data.intensity,
      notes: workoutDescription + ' (Development mode: Using mock data)'
    },
    content: htmlContent
  } as WorkoutResponse;
}

export async function generateWorkout(data: WorkoutFormData): Promise<WorkoutResponse> {
  // In development mode, always use mock data to avoid Edge Function errors
  if (import.meta.env.DEV) {
    console.warn('Development mode detected - using mock workout data');
    return createMockWorkout(data);
  }
  
  try {
    console.log('Invoking Supabase Edge Function with data:', data);
    
    // Call Supabase Edge Function
    const { data: response, error } = await supabase.functions.invoke('generate-workout', {
      body: data
    });

    if (error) {
      console.error('Supabase Edge Function error:', error);
      // Check if this is a FunctionsFetchError, which is common in development
      if (error.name === 'FunctionsFetchError') {
        console.warn('FunctionsFetchError detected - falling back to mock data');
        return createMockWorkout(data);
      }
      throw new Error(`Supabase Edge Function error: ${error.message || JSON.stringify(error)}`);
    }

    if (!response) {
      console.error('No response from Supabase Edge Function');
      throw new Error('No response received from the workout generation service');
    }

    return response;
  } catch (err) {
    console.error('Error in generateWorkout:', err);
    
    // In development mode, return mock data as fallback
    if (import.meta.env.DEV) {
      console.warn('Using mock data in development mode');
      return createMockWorkout(data);
    }
    
    // Re-throw the error for production environment
    throw err;
  }
}
