import { GoogleGenAI } from "@google/genai";

const SYSTEM_PROMPT = `You are VibeStudio AI, an elite autonomous software engineer.
You must generate real, runnable applications. The user wants to build a project using React.

### GUIDELINES:
1.  **Modular Code**: For large projects, split code into multiple files (components, hooks, utils, services).
2.  **Modern UI**: Use Tailwind CSS for styling. Use Framer Motion (motion/react) for animations and Lucide-React for icons.
3.  **No Mocking**: Use real libraries and pattern.
4.  **JSON ONLY**: Your response must be an absolute JSON object. No markdown wrapping.
5.  **Escape Newlines**: All newlines in the "code" field of the JSON must be escaped as \\n.

{
  "message": "A brief message to the user explaining what you did",
  "files": [
    {
      "path": "/src/components/Button.tsx",
      "code": "..."
    }
  ]
}

DO NOT output anything outside of this JSON.
Ensure valid JSON escape sequences.
All core files should be under /src/ directory (e.g., /src/App.jsx, /src/main.jsx).
Always include /index.html with the correct script tag: <script type="module" src="/src/main.jsx"></script>.`;

export async function generateWithGemini(prompt: string, currentFiles: Record<string, { code: string }>) {
  const geminiKey = (process.env as any).GEMINI_API_KEY;
  
  if (!geminiKey || geminiKey === '$GEMINI_API_KEY' || geminiKey.trim() === '') {
    throw new Error("Gemini API key is not configured in the environment.");
  }

  const ai = new GoogleGenAI({ apiKey: geminiKey });
  
  // Format files as context
  const fileContext = Object.entries(currentFiles)
    .map(([path, file]) => `--- FILE: ${path} ---\n${file.code}`)
    .join('\n\n');

  // Try flash models
  const models = ['gemini-2.0-flash', 'gemini-1.5-flash'];
  let lastError = null;

  for (const model of models) {
    try {
      console.log(`[Frontend AI] Trying ${model}...`);
      const response = await ai.models.generateContent({
        model: model,
        contents: [{ role: 'user', parts: [{ text: `CONTEXT FILES:\n${fileContext}\n\nUSER REQUEST: ${prompt}` }] }],
        config: {
          systemInstruction: SYSTEM_PROMPT,
          responseMimeType: "application/json",
          temperature: 0.1,
        },
      });

      const content = response.text;
      if (content) {
        try {
          return JSON.parse(content);
        } catch (e) {
          const match = content.match(/```(?:json)?\n?([\s\S]*?)\n?```/i);
          if (match) {
            return JSON.parse(match[1].trim());
          }
           // Fallback to extraction if needed
           const firstBrace = content.indexOf('{');
           const lastBrace = content.lastIndexOf('}');
           if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
             return JSON.parse(content.substring(firstBrace, lastBrace + 1));
           }
        }
      }
    } catch (err: any) {
      console.error(`[Frontend AI] ${model} failed:`, err);
      lastError = err;
    }
  }

  throw lastError || new Error("Gemini failed to generate content.");
}
