import { GoogleGenAI } from "@google/genai";

let ai: GoogleGenAI | null = null;

function getAI() {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set. Please check your environment variables.");
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
}

const MODEL_NAME = "gemini-3-flash-preview";

export async function classifyAlert(text: string) {
  try {
    const genAI = getAI();
    
    const prompt = `Classify this hotel emergency report and provide technical and calm instructions. 
      Return ONLY valid JSON.
      {
        "type": "fire|medical|security|general",
        "severity": "critical|high|low",
        "confidence": 0.9,
        "guestAction": "instruction for guest",
        "staffAction": "instruction for staff",
        "responderBriefing": "technical briefing",
        "summary": "short summary",
        "translations": { "hi": "hindi", "ta": "tamil", "zh": "chinese", "fr": "french" }
      }
      Report: "${text}"`;

    const response = await genAI.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini Classification Error:", error);
    return null;
  }
}

export async function generateIncidentReport(data: any) {
  try {
    const genAI = getAI();
    
    const prompt = `Generate a formal hotel incident report based on these details:
      Hotel: ${data.hotelName}
      Alert: ${data.type} (${data.severity})
      Location: Floor ${data.floor}, Room ${data.room}
      Guest: ${data.guestName}
      Responder: ${data.responderName}
      Events:
      ${data.events.map((e: any) => `- [${new Date(e.time).toLocaleTimeString()}] ${e.action} (by ${e.actor})`).join('\n')}`;

    const response = await genAI.models.generateContent({
      model: MODEL_NAME,
      contents: prompt
    });

    return response.text;
  } catch (error) {
    console.error("Gemini Report Generation Error:", error);
    return "Report generation unavailable.";
  }
}

export async function generateSafetyBriefing(data: any) {
  try {
    const genAI = getAI();
    
    const prompt = `Write a friendly, 3-sentence personalized hotel safety briefing for a guest.
      Include nearest exit info for Floor ${data.floor}, assembly point info, and panic button reminder.
      Guest: ${data.name}, Hotel: ${data.hotelName}`;

    const response = await genAI.models.generateContent({
      model: MODEL_NAME,
      contents: prompt
    });

    return response.text;
  } catch (error) {
    console.error("Gemini Briefing Error:", error);
    return "Stay calm. Follow exit signs to the nearest stairwell. Use the panic button in the app for immediate help.";
  }
}

export async function formatResponderMessage(alertType: string, rawMessage: string) {
  try {
    const genAI = getAI();
    
    const prompt = `You are a calm emergency responder. Rewrite this message for a distressed hotel guest. 
      Keep it professional and clear. Max 2 sentences.
      Type: ${alertType}
      Original: "${rawMessage}"`;

    const response = await genAI.models.generateContent({
      model: MODEL_NAME,
      contents: prompt
    });

    return response.text;
  } catch (error) {
    console.error("Gemini Formatting Error:", error);
    return rawMessage;
  }
}
