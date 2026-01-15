
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ragService } from "./ragService";

export class GeminiService {
  private getClient(): GoogleGenAI {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async askCodeSensei(prompt: string, projectId: string, projectDescription: string): Promise<string> {
    try {
      const ai = this.getClient();
      
      // Fetch indexed codebase context (RAG)
      const codebaseContext = ragService.getContextForPrompt(projectId);
      
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `You are CodeSensei, an expert senior software architect. 
            You help developers understand complex codebases.
            
            PROJECT SUMMARY:
            ${projectDescription}
            
            CODEBASE CONTEXT (indexed from repository):
            ${codebaseContext}
            
            STRICT RULES:
            - Use the provided CODEBASE CONTEXT to give specific, accurate answers based on the actual implementation.
            - If the information isn't in the context, say you don't know rather than hallucinating.
            - Be concise but thorough. Use code blocks for implementation details.
            
            USER QUESTION:
            ${prompt}`,
        config: {
          temperature: 0.1, // Low temperature for high accuracy RAG results
        }
      });

      return response.text || "I'm sorry, I couldn't process that request.";
    } catch (error) {
      console.error("Gemini API Error:", error);
      return "Something went wrong while thinking. Please try again.";
    }
  }

  async generateArchitectureDiagram(context: string): Promise<string> {
    try {
      const ai = this.getClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Based on this project context, generate a Mermaid.js flowchart (graph TD) representing the core system architecture. Return ONLY the mermaid code block, no extra text.
        
        CONTEXT: ${context}`,
      });
      return response.text?.replace(/```mermaid|```/g, '').trim() || "graph TD\nA[App] --> B[Error]";
    } catch (e) {
      return "graph TD\nA[App] --> B[Default Architecture]";
    }
  }

  async generateArchitectureImage(context: string, size: '1K' | '2K' | '4K' = '1K'): Promise<string | null> {
    const ai = this.getClient();
    const prompt = `A clean, professional 3D technical architecture diagram for a software project. 
    The diagram should visualize the system structure, module relationships, and technology stack.
    Style: Modern isometric enterprise architecture, dark theme background, glowing connections.
    Context of the project: ${context}.
    Include labels for major modules like "API Layer", "Services", and "Data Persistence".`;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: size
        }
      }
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    return null;
  }
}

export const geminiService = new GeminiService();
