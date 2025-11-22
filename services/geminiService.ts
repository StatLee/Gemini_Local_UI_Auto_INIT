import { GoogleGenAI } from "@google/genai";

let aiClient: GoogleGenAI | null = null;

const getClient = (): GoogleGenAI => {
    if (!aiClient) {
        if (!process.env.API_KEY) {
            throw new Error("API Key not found in environment variables.");
        }
        aiClient = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
    return aiClient;
};

export const askAssistant = async (query: string, context: string): Promise<string> => {
    try {
        const client = getClient();
        const systemInstruction = `You are an expert DevOps and AI engineer specializing in LangChain and Windows deployments. 
        The user is trying to install a python-based LangChain environment on a Windows 11 machine with an RTX 4060 Ti.
        The user is looking at a deployment script generator.
        
        Current Generation Context:
        ${context}

        Answer questions about the scripts, hardware limitations, or configuration details concisely and technically.
        `;

        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: query,
            config: {
                systemInstruction: systemInstruction,
            }
        });

        return response.text || "I couldn't generate a response. Please check your API key.";
    } catch (error) {
        console.error("Gemini API Error:", error);
        return "Error contacting the AI assistant. Please ensure your API key is valid.";
    }
};