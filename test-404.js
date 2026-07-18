import { GoogleGenAI } from "@google/genai";
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
ai.models.generateContent({
  model: "nonexistent-model",
  contents: "Hello",
}).then(r => console.log("Success")).catch(e => console.log("Error:", e.status, e.message));
