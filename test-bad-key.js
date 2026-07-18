import { GoogleGenAI } from "@google/genai";
const ai = new GoogleGenAI({ apiKey: "AQ_some_invalid_key_12345" });
ai.models.generateContent({
  model: "gemini-2.5-flash",
  contents: "Hello",
}).then(r => console.log("Success")).catch(e => console.log("Error:", e.status, e.message, e.statusCode));
