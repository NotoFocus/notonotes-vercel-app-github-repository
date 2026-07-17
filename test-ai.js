import { GoogleGenAI } from "@google/genai";

const key = process.env.GEMINI_API_KEY;
console.log("Key exists?", !!key);

const ai = new GoogleGenAI({ apiKey: key });

const models = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-flash-latest",
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite",
  "gemini-2.5-pro",
  "gemini-1.5-pro",
  "gemini-3.5-pro",
  "gemini-3.1-pro-preview"
];

async function run() {
  for (const model of models) {
    try {
      console.log(`Trying model: ${model}...`);
      const response = await ai.models.generateContent({
        model,
        contents: "Hello, reply with one word: 'Success'",
      });
      console.log(`>>> SUCCESS with model: ${model}! Response:`, response.text);
    } catch (error) {
      console.error(`>>> FAILED model: ${model}. Error message:`, error.message || error);
    }
  }
}

run();
