import { useAppStore } from '../../store/useAppStore';
import { generateWithGemini } from './gemini';

const MODELS = [
  'nvidia/llama-3.1-nemotron-70b-instruct',
  'meta/llama-3.1-70b-instruct',
  'deepseek-ai/deepseek-v4-flash',
];

export async function generateApp(prompt: string, currentFiles: any) {
  const { openRouterKey } = useAppStore.getState();
  const errors: string[] = [];

  // 1. Try Gemini directly from the browser first (Recommended in AI Studio)
  try {
    const result = await generateWithGemini(prompt, currentFiles);
    if (result && (result.files || result.message)) {
      console.log("[AI] Succeeded using frontend Gemini direct call.");
      return result;
    }
  } catch (err: any) {
    console.warn("[AI] Frontend Gemini direct call failed:", err.message);
    errors.push(`Frontend Gemini: ${err.message}`);
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
       errors.push(`Backend AI: ${errData.error}`);
    } else {
       errors.push(`Backend AI: Service unavailable (${proxyRes.status})`);
    }
  } catch (err: any) {
    console.error("Backend proxy failed:", err);
    errors.push(`Network/Proxy: ${err.message}`);
  }

  const detailedError = errors.join('\n');
  throw new Error(`Generation failed:\n${detailedError}\n\nPlease check your API keys in Settings.`);
}
