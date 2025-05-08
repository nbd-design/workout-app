import OpenAI from "openai";
import { SYSTEM_PROMPT } from "../client/src/lib/constants";

// Initialize the OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const MODEL = "gpt-4o";

export async function generateWorkoutWithOpenAI(userPrompt: string): Promise<{ content: string; isDemo: boolean }> {
  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    return { 
      content: response.choices[0].message.content || '',
      isDemo: false
    };
  } catch (error: any) {
    console.error("Error generating content with OpenAI:", error);
    
    // Check if it's a quota error
    const isQuotaError = error.code === 'insufficient_quota' || 
                        (error.message && error.message.includes('quota'));
    
    // Instead of throwing an error, return a special status that allows fallback
    if (isQuotaError) {
      return {
        content: "QUOTA_EXCEEDED",
        isDemo: true
      };
    }
    
    // For other errors, still return a flag indicating a demo mode
    return {
      content: "API_ERROR",
      isDemo: true
    };
  }
}