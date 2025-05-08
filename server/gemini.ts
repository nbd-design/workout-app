import { GoogleGenerativeAI } from "@google/generative-ai";
import { SYSTEM_PROMPT } from "../client/src/lib/constants";

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Using the Gemini Pro model which supports text generation
const MODEL_NAME = "gemini-1.5-pro";

export async function generateWorkoutWithGemini(userPrompt: string): Promise<{ content: string; isDemo: boolean }> {
  try {
    // Initialize the model
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    // Generate text with system prompt and user prompt
    const chatSession = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: "You are FitnessPal AI. " + SYSTEM_PROMPT }],
        },
        {
          role: "model",
          parts: [{ text: "I understand my role as FitnessPal AI. I'll generate custom workout plans based on the parameters you provide, focusing solely on fitness advice with clear HTML formatting." }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1500,
      },
    });

    // Execute the generation
    const result = await chatSession.sendMessage(userPrompt);
    const response = await result.response;
    const text = response.text();

    return { 
      content: text,
      isDemo: false
    };
  } catch (error) {
    console.error("Error generating content with Gemini:", error);
    
    // For errors, return a flag indicating a demo mode
    return {
      content: "API_ERROR",
      isDemo: true
    };
  }
}