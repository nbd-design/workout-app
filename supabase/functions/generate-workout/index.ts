import { serve } from "https://deno.land/std@0.204.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.2.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://nbd-design.github.io',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

const workoutFormSchema = z.object({
  muscleGroups: z.array(z.string()),
  intensity: z.number().min(1).max(5),
  workoutType: z.string(),
  goal: z.string(),
  duration: z.string()
});

// Get the API key from environment variables
const apiKey = Deno.env.get("GEMINI_API_KEY");
if (!apiKey) {
  console.error("GEMINI_API_KEY is not set in environment variables");
}

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(apiKey || "");
const MODEL_NAME = "gemini-2.0-flash";

// Function to sanitize HTML, allowing only basic formatting elements
function sanitizeHtml(html: string): string {
  // Define allowed tags
  const allowedTags = ['p', 'ul', 'li', 'ol', 'strong', 'b', 'em', 'i', 'h3', 'br'];
  
  // Remove all style attributes
  let sanitized = html.replace(/\sstyle="[^"]*"/g, '');
  
  // Remove all class attributes
  sanitized = sanitized.replace(/\sclass="[^"]*"/g, '');
  
  // Remove all id attributes
  sanitized = sanitized.replace(/\sid="[^"]*"/g, '');
  
  // Remove all other HTML tags except allowed ones
  const tagPattern = new RegExp(`<(?!\/?(?:${allowedTags.join('|')})(\\s|>))[^>]*>`, 'gi');
  sanitized = sanitized.replace(tagPattern, '');
  
  // Clean up any remaining attributes from allowed tags
  allowedTags.forEach(tag => {
    const attrPattern = new RegExp(`<${tag}[^>]*>`, 'gi');
    sanitized = sanitized.replace(attrPattern, (match) => {
      return `<${tag}>`;
    });
  });
  
  return sanitized;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }
  
  try {
    const params = workoutFormSchema.parse(await req.json());
    
    // Create a prompt for Gemini based on user parameters
    const userPrompt = `
      Create a detailed workout plan with the following parameters:
      - Muscle Groups: ${params.muscleGroups.join(', ')}
      - Intensity Level: ${params.intensity}/5
      - Workout Type: ${params.workoutType}
      - Goal: ${params.goal}
      - Duration: ${params.duration} minutes
      
      Format the response with ONLY these HTML elements:
      - <p> for paragraphs
      - <ul> or <ol> and <li> for lists
      - <strong> or <b> for bold text
      - <em> or <i> for italic text
      - <h3> for section headings
      - <br> for line breaks
      
      DO NOT use any CSS classes, styles, or other HTML attributes.
      Keep your response clean and minimal with only basic HTML formatting.
    `;
    
    try {
      // Initialize the model
      const model = genAI.getGenerativeModel({
        model: MODEL_NAME
      });
      
      // Generate content
      const result = await model.generateContent(userPrompt);
      const responseText = await result.response;
      let htmlContent = responseText.text();
      
      // Sanitize the HTML to remove any unwanted elements or attributes
      htmlContent = sanitizeHtml(htmlContent);
      
      // Return the generated workout
      return new Response(JSON.stringify({
        parameters: params,
        content: htmlContent,
        isDemo: false
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    } catch (apiError) {
      console.error("Error calling Gemini API:", apiError);
      
      // Create a simple fallback HTML content with no styling
      const fallbackHtml = `
        <h3>Workout Plan</h3>
        <p>This is a fallback workout plan for ${params.goal} focusing on ${params.muscleGroups.join(', ')} with intensity level ${params.intensity}/5.</p>
        <h3>Exercises</h3>
        <ul>
          <li><strong>Push-ups</strong>: 3 sets of 12-15 reps with 60 seconds rest</li>
          <li><strong>Squats</strong>: 4 sets of 10-12 reps with 90 seconds rest</li>
          <li><strong>Pull-ups</strong>: 3 sets of 8-10 reps with 60 seconds rest</li>
        </ul>
        <p><em>Note: This is a demo workout. The AI service is currently unavailable.</em></p>
      `;
      
      return new Response(JSON.stringify({
        parameters: params,
        content: fallbackHtml,
        isDemo: true
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
});
