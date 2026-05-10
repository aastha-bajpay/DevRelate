import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateDevRelResponse(question: string, context: string = "") {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are the Zynd AI DevRel Agent. 
      Answer the following developer question accurately.
      Use documentation context if provided.
      Keep it helpful, technical, and concise.
      
      CONTEXT:
      ${context}
      
      QUESTION:
      ${question}`,
      config: {
        temperature: 0.7,
      }
    });

    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm sorry, I encountered an error while processing your request.";
  }
}

export async function triageIssue(content: string) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze this GitHub issue and return a JSON summary.
        FIELDS:
        - "category": (Bug, Feature Request, Documentation, Question)
        - "urgency": (Low, Medium, High)
        - "summary": (One sentence summary)
        
        ISSUE:
        ${content}`,
        config: {
          responseMimeType: "application/json"
        }
      });
  
      return JSON.parse(response.text || "{}");
    } catch (error) {
      console.error("Gemini Triage Error:", error);
      return { category: "Unknown", urgency: "Medium", summary: "Failed to triage." };
    }
}
