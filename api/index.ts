import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import * as path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SYSTEM_PROMPT = `You are VibeStudio AI, an elite autonomous software engineer.
You must generate real, runnable applications. The user wants to build a project using React.

### GUIDELINES:
1.  **Modular Code**: For large projects, split code into multiple files (components, hooks, utils, services).
2.  **Modern UI**: Use Tailwind CSS for styling. Use Framer Motion (motion/react) for animations and Lucide-React for icons.
3.  **No Mocking**: Use real libraries and patterns.
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
All core files should be under /src/ directory (e.g., /src/App.tsx, /src/main.tsx).
Always include /index.html with the correct script tag: <script type="module" src="/src/main.tsx"></script>.`;

async function createServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(cookieParser());

  // --- GitHub OAuth & API Routes ---
  
  app.get("/api/auth/github/url", (req, res) => {
    const clientId = process.env.GITHUB_CLIENT_ID;
    if (!clientId) {
      return res.status(500).json({ error: "GITHUB_CLIENT_ID not configured" });
    }

    // Determine the base URL from the incoming request headers to handle proxy
    const protocol = req.get('x-forwarded-proto') || req.protocol;
    const host = req.get('host');
    const baseUrl = `${protocol}://${host}`;
    
    // Check if process.env.APP_URL is set, otherwise use the detected baseUrl
    const redirectUri = `${process.env.APP_URL || baseUrl}/api/auth/github/callback`;

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: "public_repo,repo",
      state: Math.random().toString(36).substring(7),
    });

    res.json({ url: `https://github.com/login/oauth/authorize?${params.toString()}` });
  });

  app.get("/api/auth/github/callback", async (req, res) => {
    const { code } = req.query;
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    if (!code || !clientId || !clientSecret) {
      return res.status(400).send("Invalid request or missing credentials");
    }

    try {
      const response = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
        }),
      });

      const data = await response.json();
      const accessToken = data.access_token;

      if (!accessToken) {
        return res.status(401).send("Failed to obtain access token from GitHub");
      }

      // Send the token back to the opener window and close the popup
      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ 
                  type: 'GITHUB_AUTH_SUCCESS', 
                  token: '${accessToken}' 
                }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentication successful. You can close this window.</p>
          </body>
        </html>
      `);
    } catch (error: any) {
      console.error("GitHub Auth Error:", error);
      res.status(500).send(`Authentication failed: ${error.message}`);
    }
  });

  app.get("/api/github/repos", async (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Missing token" });

    try {
      const response = await fetch("https://api.github.com/user/repos?sort=updated&per_page=100", {
        headers: {
          "Authorization": `token ${token}`,
          "Accept": "application/vnd.github.v3+json",
        }
      });

      if (!response.ok) throw new Error("Failed to fetch repositories");
      const repos = await response.json();
      
      // Simplify data sent to client
      const simplifiedRepos = repos.map((repo: any) => ({
        name: repo.name,
        full_name: repo.full_name,
        default_branch: repo.default_branch
      }));

      res.json(simplifiedRepos);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/github/push", async (req, res) => {
    const { token, repoName, files, description, branch = "main", createRepo = true } = req.body;

    if (!token || !repoName || !files) {
      return res.status(400).json({ error: "Missing required fields (token, repoName, files)" });
    }

    try {
      const headers = {
        "Authorization": `token ${token}`,
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "VibeStudio-AI"
      };

      // Get user info first
      const userRes = await fetch("https://api.github.com/user", { headers });
      if (!userRes.ok) throw new Error("Failed to verify GitHub token");
      const userData = await userRes.json();
      const username = userData.login;

      // Check if repo exists
      let repoData;
      const checkRepoRes = await fetch(`https://api.github.com/repos/${username}/${repoName}`, { headers });
      
      if (checkRepoRes.status === 404) {
        if (!createRepo) {
          return res.status(404).json({ error: `Repository '${username}/${repoName}' not found. Please create it first or check the name.` });
        }
        // Create repo
        console.log(`[GitHub] Creating repo: ${repoName}`);
        const createRes = await fetch("https://api.github.com/user/repos", {
          method: "POST",
          headers,
          body: JSON.stringify({
            name: repoName,
            description: description || "Project created with VibeStudio AI",
            auto_init: true
          })
        });
        repoData = await createRes.json();
        
        if (!createRes.ok) {
          throw new Error(`Failed to create repository: ${repoData.message}`);
        }
      } else {
        repoData = await checkRepoRes.json();
      }

      // Check if branch exists, if not create it from default branch
      const checkBranchRes = await fetch(`https://api.github.com/repos/${username}/${repoName}/branches/${branch}`, { headers });
      if (checkBranchRes.status === 404) {
        // Get default branch sha
        const defaultBranch = repoData.default_branch || 'main';
        const getDefaultBranchRes = await fetch(`https://api.github.com/repos/${username}/${repoName}/git/ref/heads/${defaultBranch}`, { headers });
        
        if (getDefaultBranchRes.ok) {
          const refData = await getDefaultBranchRes.json();
          const sha = refData.object.sha;
          
          await fetch(`https://api.github.com/repos/${username}/${repoName}/git/refs`, {
            method: "POST",
            headers,
            body: JSON.stringify({
              ref: `refs/heads/${branch}`,
              sha
            })
          });
          console.log(`[GitHub] Created branch ${branch} from ${defaultBranch}`);
        }
      }

      const pushResults = [];
      const fileEntries = Object.entries(files as Record<string, { code: string }>);
      
      for (const [filePath, fileData] of fileEntries) {
        const path = filePath.startsWith('/') ? filePath.substring(1) : filePath;
        
        // Get current file sha on this branch if it exists
        const getFileRes = await fetch(`https://api.github.com/repos/${username}/${repoName}/contents/${path}?ref=${branch}`, { headers });
        let sha;
        if (getFileRes.ok) {
          const currentFile = await getFileRes.json();
          sha = currentFile.sha;
        }

        const putRes = await fetch(`https://api.github.com/repos/${username}/${repoName}/contents/${path}`, {
          method: "PUT",
          headers,
          body: JSON.stringify({
            message: `Update ${path} via VibeStudio AI`,
            content: Buffer.from(fileData.code).toString('base64'),
            sha,
            branch
          })
        });
        
        if (!putRes.ok) {
          const err = await putRes.json();
          console.warn(`[GitHub] Failed to push ${path} to ${branch}:`, err.message);
          pushResults.push({ path, status: 'error', message: err.message });
        } else {
          pushResults.push({ path, status: 'success' });
        }
      }

      res.json({ 
        success: true, 
        repoUrl: `${repoData.html_url}/tree/${branch}`,
        results: pushResults 
      });

    } catch (error: any) {
      console.error("GitHub Push Error:", error);
      res.status(500).json({ error: error.message || "Failed to push to GitHub" });
    }
  });

  // API routes...
  app.post("/api/generate", async (req, res) => {
    try {
      const { prompt, currentFiles, openRouterKey } = req.body;

      const errors: string[] = [];

      // Format files as context
      const fileContext = currentFiles ? Object.entries(currentFiles as Record<string, { code: string }>)
        .map(([path, file]) => `--- FILE: ${path} ---\n${file.code}`)
        .join('\n\n') : '';

      // 1. Try Gemini first if we have the server-side key
      const geminiKey = process.env.GEMINI_API_KEY;
      const isPlaceholder = !geminiKey || geminiKey === '$GEMINI_API_KEY' || geminiKey.trim() === '';
      
      if (!isPlaceholder) {
        console.log("[AI] Using server-side Gemini...");
        const modelsToTry = ["gemini-2.0-flash", "gemini-1.5-flash"];
        
        for (const modelName of modelsToTry) {
          try {
            const ai = new GoogleGenAI({ apiKey: geminiKey! });
            
            const response = await ai.models.generateContent({
              model: modelName,
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
                return res.json(JSON.parse(content));
              } catch (e) {
                console.warn(`[AI] ${modelName} returned invalid JSON, trying to fix...`);
                const match = content.match(/```(?:json)?\n?([\s\S]*?)\n?```/i);
                if (match) {
                  return res.json(JSON.parse(match[1].trim()));
                }
              }
            }
          } catch (err: any) {
            console.error(`${modelName} API Error:`, err.message);
            let msg = err.message;
            try {
              const parsed = JSON.parse(err.message);
              if (parsed.error?.message) msg = parsed.error.message;
            } catch (e) {}
            errors.push(`Gemini (${modelName}): ${msg}`);
          }
        }
      } else {
        errors.push("Gemini API Key missing or using placeholder ($GEMINI_API_KEY).");
      }

      // 2. Try NVIDIA NIM if user provided a key OR if we have a default NVIDIA key
      let apiKeyToUse = openRouterKey;
      if (!apiKeyToUse || apiKeyToUse === '$NVIDIA_API_KEY' || apiKeyToUse.trim() === '') {
        apiKeyToUse = process.env.NVIDIA_API_KEY;
      }

      if (apiKeyToUse && apiKeyToUse !== '$NVIDIA_API_KEY' && apiKeyToUse.trim() !== '') {
        // Force NVIDIA NIM models
        const endpointsAndModels = [
          { endpoint: 'https://integrate.api.nvidia.com/v1/chat/completions', model: 'nvidia/llama-3.1-nemotron-70b-instruct' },
          { endpoint: 'https://integrate.api.nvidia.com/v1/chat/completions', model: 'deepseek-ai/deepseek-v4-flash' },
          { endpoint: 'https://integrate.api.nvidia.com/v1/chat/completions', model: 'meta/llama-3.1-70b-instruct' }
        ];

        let hasSuccess = false;
        let allAuthFailed = true;

        for (const { endpoint, model } of endpointsAndModels) {
          try {
            console.log(`[AI] Proxying to ${model} at ${endpoint}`);
            const response = await fetch(endpoint, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${apiKeyToUse}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                model: model,
                messages: [
                  { role: 'system', content: SYSTEM_PROMPT },
                  { role: 'user', content: `CONTEXT FILES:\n${fileContext}\n\nUSER REQUEST: ${prompt}` }
                ],
                temperature: 0.2,
                top_p: 0.95,
                max_tokens: 8192,
                ...(model.includes('deepseek') ? { chat_template_kwargs: { thinking: true, reasoning_effort: "high" } } : {})
              })
            });

            if (!response.ok) {
              const errText = await response.text();
              if (response.status !== 401) {
                allAuthFailed = false;
              }
              errors.push(`[${model}] HTTP ${response.status}: ${errText}`);
              continue;
            }

            const data = await response.json();
            let content = data.choices[0]?.message?.content;

            if (!content) {
              allAuthFailed = false;
              errors.push(`[${model}] Empty response`);
              continue;
            }

            // Strip think blocks generated by some reasoning models
            content = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

            try {
              return res.json(JSON.parse(content));
            } catch (e) {
              allAuthFailed = false;
              const match = content.match(/```(?:json)?\n?([\s\S]*?)\n?```/i);
              if (match) {
                try {
                  return res.json(JSON.parse(match[1].trim()));
                } catch (err) {}
              }
              const firstBrace = content.indexOf('{');
              const lastBrace = content.lastIndexOf('}');
              if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                try {
                  return res.json(JSON.parse(content.substring(firstBrace, lastBrace + 1)));
                } catch (err) {}
              }
              errors.push(`[${model}] Failed to parse AI response as JSON.`);
            }
          } catch (err: any) {
            allAuthFailed = false;
            errors.push(`[${model}] fetch error: ${err.message}`);
          }
        }
        
        if (allAuthFailed && errors.length > 0) {
          // If we had a Gemini error too, include it
          const geminiErr = errors.find(e => e.startsWith('Gemini Error:'));
          let errorMsg = "Authentication failed. Please verify your NVIDIA API Key in Settings.";
          if (geminiErr) {
            errorMsg = `Authentication failed. ${geminiErr}. Also tried NVIDIA but it failed too.`;
          }
          return res.status(401).json({ error: errorMsg });
        }

        return res.status(500).json({ error: `All models failed. Details:\\n${errors.join('\\n')}` });
    }

    // If no NVIDIA key, but we had a Gemini error
    if (errors.length > 0) {
        return res.status(500).json({ error: errors.join('\n') });
    }

    return res.status(500).json({ error: "No AI API Keys found or configured. Please set GEMINI_API_KEY or NVIDIA_API_KEY." });

    } catch (e: any) {
      console.error("[API Error]", e);
      res.status(500).json({ error: e.message || "Error communicating with AI" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  return app;
}

const app = await createServer();

// Start listener only if not in Vercel environment
if (process.env.NODE_VMC_ID || process.env.RENDER || process.env.PORT || !process.env.VERCEL) {
  const port = Number(process.env.PORT) || 3000;
  app.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

export default app;
