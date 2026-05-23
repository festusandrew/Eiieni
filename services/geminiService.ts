import { GoogleGenAI, Chat } from "@google/genai";
import { BACKEND_URL, isBackendConfigured } from "./apiConfig";

// Local Direct SDK Client initialization
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
let chatSession: Chat | null = null;

/**
 * 1. Scene Analyzer: Understands environment directly ahead
 */
export const analyzeScene = async (base64Image: string): Promise<string> => {
  if (isBackendConfigured()) {
    console.log("[API Bridge] Routing analyzeScene to dedicated backend:", BACKEND_URL);
    try {
      const response = await fetch(`${BACKEND_URL}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image })
      });
      if (!response.ok) throw new Error(`Backend returned status ${response.status}`);
      const data = await response.json();
      return data.analysis || data.text || "I am not sure what is ahead.";
    } catch (error) {
      console.error("[API Bridge] Scene analysis backend failed. Falling back to local SDK.", error);
    }
  }

  // Local SDK Fallback
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image
            }
          },
          {
            text: "You are a navigation assistant for the visually impaired. Analyze this image. Identify the most important object or obstacle directly ahead and estimate its distance. Return ONLY a short sentence in this format: 'Possible [object] about [distance] ahead'. If unclear, say 'I am not sure what is ahead'. Keep it under 15 words."
          }
        ]
      }
    });
    return response.text || "I am not sure what is ahead.";
  } catch (error) {
    console.error("Gemini API Direct Error:", error);
    throw new Error("I can't connect right now.");
  }
};

/**
 * 2. Document Reader OCR: Extracts editable text from images
 */
export const extractTextFromImage = async (base64Image: string): Promise<string> => {
  if (isBackendConfigured()) {
    console.log("[API Bridge] Routing extractTextFromImage to dedicated backend:", BACKEND_URL);
    try {
      const response = await fetch(`${BACKEND_URL}/api/ocr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image })
      });
      if (!response.ok) throw new Error(`Backend returned status ${response.status}`);
      const data = await response.json();
      return data.text || "No text detected.";
    } catch (error) {
      console.error("[API Bridge] OCR backend failed. Falling back to local SDK.", error);
    }
  }

  // Local SDK Fallback
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image
            }
          },
          {
            text: "Extract all legible text from this image. Return only the text found. Preserve line breaks where appropriate. If no text is found, return 'No text detected'."
          }
        ]
      }
    });
    return response.text || "No text detected.";
  } catch (error) {
    console.error("Gemini OCR Direct Error:", error);
    throw new Error("Could not read text.");
  }
};

/**
 * 3. Walking Directions Generator
 */
export const getWalkingDirections = async (originLat: number, originLng: number, destination: string): Promise<string[]> => {
  if (isBackendConfigured()) {
    console.log("[API Bridge] Routing getWalkingDirections to dedicated backend:", BACKEND_URL);
    try {
      const response = await fetch(`${BACKEND_URL}/api/navigate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude: originLat, longitude: originLng, destination })
      });
      if (!response.ok) throw new Error(`Backend returned status ${response.status}`);
      const data = await response.json();
      if (Array.isArray(data.steps)) return data.steps;
      if (typeof data.text === 'string') return [data.text];
    } catch (error) {
      console.error("[API Bridge] Navigation backend failed. Falling back to local SDK.", error);
    }
  }

  // Local SDK Fallback
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            text: `I am a visually impaired user currently at latitude ${originLat}, longitude ${originLng}. 
            I need walking directions to "${destination}". 
            Provide a numbered list of clear, safe, step-by-step instructions. 
            Focus on street names, turns, and major landmarks. 
            Do not include any introductory text. Just the numbered steps.
            Keep each step concise (under 20 words).`
          }
        ]
      }
    });

    const text = response.text || "";
    const steps = text.split(/\n\d+\.\s+/).filter(step => step.trim().length > 0);
    if (steps.length === 0 && text.length > 0) {
      return [text];
    }
    return steps;
  } catch (error) {
    console.error("Gemini Navigation Direct Error:", error);
    throw new Error("I couldn't calculate the route.");
  }
};

/**
 * 4. Conversational Voice Chat Session
 */
export const chatWithElenii = async (userText: string, userName: string = ""): Promise<string> => {
  if (isBackendConfigured()) {
    console.log("[API Bridge] Routing chatWithElenii to dedicated backend:", BACKEND_URL);
    try {
      const response = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, name: userName })
      });
      if (!response.ok) throw new Error(`Backend returned status ${response.status}`);
      const data = await response.json();
      return data.response || data.text || "I didn't catch that.";
    } catch (error) {
      console.error("[API Bridge] Conversational backend failed. Falling back to local SDK Chat.", error);
    }
  }

  // Local SDK Fallback
  try {
    if (!chatSession) {
      chatSession = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
          systemInstruction: `You are Elenii, a friendly and concise voice assistant for the visually impaired. 
          Your users rely on text-to-speech, so keep your answers short (under 2 sentences when possible) and easy to listen to.
          
          You have capabilities to: 
          1. Scan the environment (visual analysis).
          2. Play Radio and Read News.
          3. Navigate to destinations using walking directions.
          4. Health Assistant: You can provide audio-based health information, symptom guidance, and medication reminders.
          5. Document Reader: You can read text from images or documents.
          
          If the user asks about health, being sick, or medications, adopt a caring, professional health assistant persona.
          If the user asks to do a specific task, guide them to the command.
          ${userName ? `The user's name is ${userName}.` : ''}`
        }
      });
    }

    const response = await chatSession.sendMessage({
      message: userText
    });
    return response.text || "I didn't catch that.";
  } catch (error) {
    console.error("Gemini Chat Direct Error:", error);
    return "I'm having trouble connecting to my brain right now.";
  }
};