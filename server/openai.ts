import OpenAI from "openai";
import { SYSTEM_PROMPT } from "../client/src/lib/constants";

// Initialize the OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const MODEL = "gpt-4o";

export async function generateWorkoutWithOpenAI(userPrompt: string): Promise<string> {
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

    return response.choices[0].message.content || '';
  } catch (error) {
    console.error("Error generating content with OpenAI:", error);
    throw new Error("Failed to generate workout with OpenAI. Check your API key and try again.");
  }
}