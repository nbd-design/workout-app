import { serve } from 'https://deno.fresh.runtime.dev/server';
import { z } from 'https://deno.land/x/zod/mod.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai@0.2.0';

const workoutFormSchema = z.object({
  muscleGroups: z.array(z.string()),
  intensity: z.number().min(1).max(5),
  workoutType: z.string(),
  goal: z.string(),
  duration: z.string(),
});

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') || '');
const MODEL_NAME = "gemini-2.0-flash";

// System prompt to guide the AI
const SYSTEM_PROMPT = `You are FitGen AI, a specialized workout generator.

Your task is to create a detailed workout plan based on the user's specifications.

Your response should ONLY include:
- A brief introduction
- A list of exercises with sets, reps, and rest periods
- Brief notes on form and technique

Format your response with ONLY these HTML elements:
- <p> for paragraphs
- <ul> and <li> for lists
- <strong> or <b> for bold text
- <em> or <i> for italic text
- <h3> for section headings

DO NOT use any other HTML elements, CSS styles, or formatting. Keep your response clean and minimal.`;

// Function to sanitize HTML, allowing only basic formatting elements
function sanitizeHtml(html: string): string {
  // Define allowed tags
  const allowedTags = ['p', 'ul', 'li', 'strong', 'b', 'em', 'i', 'h3', 'br'];
  
  // Remove all style attributes
  let sanitized = html.replace(/\sstyle="[^"]*"/g, '');
  
  // Remove all class attributes
  sanitized = sanitized.replace(/\sclass="[^"]*"/g, '');
  
  // Remove all other HTML tags except allowed ones
  const tagPattern = new RegExp(`<(?!\/?(?:${allowedTags.join('|')})(\\s|>))[^>]*>`, 'gi');
  sanitized = sanitized.replace(tagPattern, '');
  
  return sanitized;
}

// Function to generate workout with Gemini API
async function generateWorkoutWithGemini(prompt: string): Promise<string> {
  try {
    // Initialize the model
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    // Generate text with system prompt and user prompt
    const chatSession = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: SYSTEM_PROMPT }],
        },
        {
          role: "model",
          parts: [{ text: "I understand my role as FitGen AI. I'll generate custom workout plans with only basic HTML formatting as specified." }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1500,
      },
    });

    // Execute the generation
    const result = await chatSession.sendMessage(prompt);
    const response = await result.response;
    const text = response.text();

    // Sanitize the HTML output
    return sanitizeHtml(text);
  } catch (error) {
    console.error("Error generating content with Gemini:", error);
    return `<p>Sorry, there was an error generating your workout. Please try again later.</p>`;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': 'https://nbd-design.github.io',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }
  try {
    const { muscleGroups, intensity, workoutType, goal, duration } = workoutFormSchema.parse(
      await req.json()
    );

    // Initialize Supabase client (we'll use this later for database operations)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Create a prompt for the Gemini API
    const prompt = `Generate a ${duration} minute ${workoutType.toLowerCase()} workout for ${goal.toLowerCase()} with intensity level ${intensity}/5, focusing on these muscle groups: ${muscleGroups.join(', ')}.

Please include:
- A brief introduction
- Exercises with sets, reps, and rest periods
- Brief notes on form and technique

Remember to use ONLY basic HTML formatting (p, ul, li, strong/b, em/i, h3) and NO CSS styles.`;

    // Generate workout content using Gemini API with sanitized HTML
    const workoutContent = await generateWorkoutWithGemini(prompt);

    const response = {
      workout: {
        title: `${goal} ${workoutType} - ${duration} minutes`,
        content: workoutContent,
        intensity,
        muscleGroups: muscleGroups.join(', '),
      },
    };

    return new Response(JSON.stringify(response), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'https://nbd-design.github.io',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'https://nbd-design.github.io',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
    });
  }
});
