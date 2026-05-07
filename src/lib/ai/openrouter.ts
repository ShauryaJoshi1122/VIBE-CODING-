import { useAppStore } from '../../store/useAppStore';
import { generateWithGemini } from './gemini';

const MODELS = [
  'google/gemini-2.0-pro-exp-02-05:free',
  'google/gemini-2.0-flash-lite-preview-02-05:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'nvidia/llama-3.1-nemotron-70b-instruct:free',
  'cognitivecomputations/dolphin3.0-r1-mistral-24b:free',
  'mistralai/mistral-7b-instruct:free',
  'huggingfaceh4/zephyr-7b-beta:free',
];

export async function generateApp(prompt: string, currentFiles: any) {
  const { openRouterKey } = useAppStore.getState();

  // 1. Try Gemini directly from the browser first (Recommended in AI Studio)
  try {
    const result = await generateWithGemini(prompt, currentFiles);
    if (result && (result.files || result.message)) {
      console.log("[AI] Succeeded using frontend Gemini direct call.");
      return result;
    }
  } catch (err: any) {
    console.warn("[AI] Frontend Gemini direct call failed, trying backend proxy:", err.message);
  }

  // 2. Fallback to backend proxy (for NVIDIA NIM or if Gemini client-side failed)
  try {
    const proxyRes = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        currentFiles,
        openRouterKey
      })
    });

    if (proxyRes.ok) {
      return await proxyRes.json();
    }

    const errData = await proxyRes.json().catch(() => ({}));
    if (errData.error) {
       throw new Error(`AI Error: ${errData.error}`);
    }
  } catch (err: any) {
    if (err.message && err.message.includes('AI Error')) {
      throw err;
    }
    console.error("Backend proxy failed:", err);
  }

  if (!openRouterKey) {
    throw new Error('AI failed to respond. Please check your internet connection or provide an NVIDIA API key in Settings.');
  }

  throw new Error("Unable to complete AI generation. All providers failed.");
}
