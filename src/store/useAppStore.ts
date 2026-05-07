/// <reference types="vite/client" />
import { create } from 'zustand';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface FileFile {
  code: string;
}

interface AppState {
  projectId: string;
  setProjectId: (id: string) => void;
  // AI Keys
  openRouterKey: string | null;
  setOpenRouterKey: (key: string) => void;

  // Code & Files
  files: Record<string, FileFile>;
  setFiles: (files: Record<string, FileFile>) => void;
  updateFile: (path: string, code: string) => void;
  
  // Editor State
  activeFile: string | null;
  setActiveFile: (path: string | null) => void;
  openFiles: string[];
  closeFile: (path: string) => void;
  
  // File CRUD
  createFile: (path: string, content?: string) => void;
  deleteFile: (path: string) => void;
  renameFile: (oldPath: string, newPath: string) => void;
  
  // Workspace UI
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  activeView: 'editor' | 'preview';
  setActiveView: (view: 'editor' | 'preview') => void;

  // Chat & AI State
  messages: ChatMessage[];
  addMessage: (message: Omit<ChatMessage, 'id'>) => void;

  isGenerating: boolean;
  setIsGenerating: (isGenerating: boolean) => void;

  isSaving: boolean;
  setIsSaving: (isSaving: boolean) => void;

  // GitHub Integration
  githubToken: string | null;
  setGithubToken: (token: string | null) => void;

  resetStore: () => void;
  clearMessages: () => void;
}

/** Default starting files for Sandpack */
const initialFiles: Record<string, FileFile> = {
  'src/main.tsx': {
    code: `import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

const root = createRoot(document.getElementById("root"));
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);`
  },
  'src/App.tsx': {
    code: `import React, { useState } from 'react';
import { Sparkles, ShoppingBag, Palette, Zap, Code2, Globe, Cpu, Rocket, ChevronRight, Github } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function App() {
  const [hovered, setHovered] = useState(null);

  const features = [
    { icon: <Zap className="w-5 h-5" />, title: "Instant Build", desc: "Real-time hot reloading", color: "text-amber-400" },
    { icon: <Palette className="w-5 h-5" />, title: "Modern UI", desc: "Tailwind & Lucide", color: "text-emerald-400" },
    { icon: <Cpu className="w-5 h-5" />, title: "AI Core", desc: "Powered by Gemini 1.5", color: "text-blue-400" },
    { icon: <Globe className="w-5 h-5" />, title: "Deploy Ready", desc: "One-click cloud setup", color: "text-purple-400" },
  ];

  return (
    <div className="min-h-screen bg-[#020202] text-white flex flex-col font-sans selection:bg-emerald-500/30">
      {/* Mesh Gradient Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <nav className="relative z-10 border-b border-white/5 bg-black/20 backdrop-blur-md px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/20">
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="font-bold tracking-tight text-lg">VibeStudio <span className="text-emerald-500">AI</span></span>
        </div>
        <div className="flex items-center gap-6">
          {['Docs', 'Showcase', 'Pricing'].map(item => (
            <a key={item} href="#" className="text-sm font-medium text-neutral-400 hover:text-white transition-colors">{item}</a>
          ))}
          <button className="bg-white text-black px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-white/10 hover:scale-105 transition-transform">
            Get Started
          </button>
        </div>
      </nav>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-8 text-center max-w-5xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400 uppercase tracking-widest"
        >
          <Rocket className="w-3 h-3" /> v2.0 is now live
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-6xl md:text-8xl font-black mb-6 tracking-tighter leading-[0.9]"
        >
          Design the future, <br/>
          <span className="bg-gradient-to-r from-emerald-400 via-blue-500 to-purple-600 bg-clip-text text-transparent italic">shipped with vibes.</span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-neutral-500 text-lg md:text-xl max-w-2xl text-center mb-12 leading-relaxed"
        >
          Experience the world's most powerful AI visual IDE. Build production-grade React apps with high-fidelity components in seconds.
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="group relative p-6 rounded-3xl bg-neutral-900/40 border border-white/5 hover:border-emerald-500/30 transition-all duration-500"
            >
              <div className={"p-3 rounded-2xl bg-black/40 border border-white/5 w-fit mb-4 group-hover:scale-110 transition-transform " + f.color}>
                {f.icon}
              </div>
              <h3 className="font-bold text-sm mb-1 text-left">{f.title}</h3>
              <p className="text-neutral-500 text-xs text-left">{f.desc}</p>
            </motion.div>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-20 flex flex-col items-center"
        >
          <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-[0.3em] mb-4">Trusted by modern teams</p>
          <div className="flex items-center gap-8 opacity-30 grayscale">
             <div className="w-24 h-6 bg-white/20 rounded-full" />
             <div className="w-24 h-6 bg-white/20 rounded-full" />
             <div className="w-24 h-6 bg-white/20 rounded-full" />
          </div>
        </motion.div>
      </main>

      <footer className="relative z-10 border-t border-white/5 p-8 flex items-center justify-between text-neutral-600 text-xs mt-auto">
        <div>© 2024 VibeStudio AI. Built for the modern web.</div>
        <div className="flex items-center gap-6">
          <a href="#" className="hover:text-white transition-colors">Twitter</a>
          <a href="#" className="hover:text-white transition-colors">GitHub</a>
          <a href="#" className="hover:text-white transition-colors">Discord</a>
        </div>
      </footer>
    </div>
  );
}
`
  },
  'src/styles.css': {
    code: `body {
  margin: 0;
  padding: 0;
  overflow-x: hidden;
}
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
* { font-family: 'Inter', sans-serif; }
`
  },
  'index.html': {
    code: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>VibeStudio Preview</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
       html, body, #root { height: 100%; margin: 0; }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="src/main.jsx"></script>
  </body>
</html>`
  }
};
;

export const useAppStore = create<AppState>((set) => ({
  projectId: localStorage.getItem('vibestudio_project_id') || Math.random().toString(36).substring(7),
  setProjectId: (id) => {
    localStorage.setItem('vibestudio_project_id', id);
    set({ projectId: id });
  },

  openRouterKey: import.meta.env.VITE_OPENROUTER_API_KEY || localStorage.getItem('vibestudio_key') || null,
  setOpenRouterKey: (key: string) => {
    localStorage.setItem('vibestudio_key', key);
    set({ openRouterKey: key });
  },

  files: initialFiles,
  setFiles: (files) => set({ files }),
  updateFile: (path, code) => set((state) => ({
    files: {
      ...state.files,
      [path]: { code }
    }
  })),

  activeFile: 'src/App.tsx',
  setActiveFile: (path) => set((state) => {
    if (!path) return { activeFile: null };
    const openFiles = [...state.openFiles];
    if (!openFiles.includes(path)) {
      openFiles.push(path);
    }
    return { activeFile: path, openFiles };
  }),
  openFiles: ['src/App.tsx'],
  closeFile: (path) => set((state) => {
    const openFiles = state.openFiles.filter(f => f !== path);
    let activeFile = state.activeFile;
    if (activeFile === path) {
      activeFile = openFiles.length > 0 ? openFiles[openFiles.length - 1] : null;
    }
    return { openFiles, activeFile };
  }),

  createFile: (path, content = '') => set((state) => ({
    files: { ...state.files, [path]: { code: content } }
  })),
  deleteFile: (path) => set((state) => {
    const newFiles = { ...state.files };
    delete newFiles[path];
    const openFiles = state.openFiles.filter(f => f !== path);
    let activeFile = state.activeFile;
    if (activeFile === path) {
      activeFile = openFiles.length > 0 ? openFiles[openFiles.length - 1] : null;
    }
    return { files: newFiles, openFiles, activeFile };
  }),
  renameFile: (oldPath, newPath) => set((state) => {
    const newFiles = { ...state.files };
    newFiles[newPath] = newFiles[oldPath];
    delete newFiles[oldPath];
    const openFiles = state.openFiles.map(f => f === oldPath ? newPath : f);
    let activeFile = state.activeFile;
    if (activeFile === oldPath) activeFile = newPath;
    return { files: newFiles, openFiles, activeFile };
  }),

  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  activeView: 'preview',
  setActiveView: (view) => set({ activeView: view }),

  messages: [],
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, { ...message, id: Math.random().toString(36).substring(7) }]
  })),

  isGenerating: false,
  setIsGenerating: (isGenerating) => set({ isGenerating }),

  isSaving: false,
  setIsSaving: (isSaving) => set({ isSaving }),

  githubToken: localStorage.getItem('vibestudio_github_token') || null,
  setGithubToken: (token) => {
    if (token) localStorage.setItem('vibestudio_github_token', token);
    else localStorage.removeItem('vibestudio_github_token');
    set({ githubToken: token });
  },

  resetStore: () => {
    const newId = Math.random().toString(36).substring(7);
    localStorage.setItem('vibestudio_project_id', newId);
    set({ 
      projectId: newId,
      files: initialFiles, 
      activeFile: 'src/App.tsx', 
      activeView: 'preview',
      messages: [] 
    });
  },
  clearMessages: () => set({ messages: [] }),
}));
