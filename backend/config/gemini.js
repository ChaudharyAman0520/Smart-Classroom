import { GoogleGenAI } from "@google/genai";

let aiInstance = null;

export const getGeminiClient = () => {
  if (aiInstance) return aiInstance;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("\n========================================================");
    console.warn("⚠️  WARNING: GEMINI_API_KEY environment variable is missing!");
    console.warn("Gemini capabilities will fall back to local simulated response generator.");
    console.warn("========================================================\n");
    return null;
  }

  try {
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "scas-backend-build",
        },
      },
    });
    console.log("✅ Gemini AI Client initialized successfully.");
    return aiInstance;
  } catch (error) {
    console.warn(`⚠️ Failed to initialize Gemini Client: ${error.message}`);
    return null;
  }
};
