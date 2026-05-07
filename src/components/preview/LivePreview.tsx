import React, { useMemo } from 'react';
import {
  SandpackProvider,
  SandpackPreview,
  SandpackConsole,
} from '@codesandbox/sandpack-react';
import { ExternalLink, Terminal as TerminalIcon } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export function LivePreview() {
  const { files } = useAppStore();

  const sandpackFiles = useMemo(() => {
    const formatted: Record<string, string> = {};
    for (const [path, fileObj] of Object.entries(files)) {
      formatted[path] = fileObj.code;
    }
    return formatted;
  }, [files]);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#050505] relative overflow-hidden">
      <SandpackProvider
        template="vite-react"
        theme="dark"
        files={sandpackFiles}
        customSetup={{
          entry: "src/main.jsx",
          dependencies: {
            "react": "^18.3.1",
            "react-dom": "^18.3.1",
            "lucide-react": "latest",
            "framer-motion": "latest",
            "clsx": "latest",
            "tailwind-merge": "latest"
          }
        }}
        options={{
          recompileMode: "delayed",
          recompileDelay: 500,
          externalResources: ["https://cdn.tailwindcss.com"]
        }}
      >
        <div className="flex-1 flex flex-col min-h-0">
          {/* Browser Frame */}
          <div className="flex-1 flex flex-col m-4 rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-[#0d0d0d] transition-all duration-500 group">
            {/* Browser Header */}
            <div className="h-10 bg-white/[0.03] border-b border-white/5 flex items-center px-4 gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/40" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20 border border-amber-500/40" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/40" />
              </div>
              <div className="flex-1 max-w-sm h-6 bg-black/40 rounded-md border border-white/5 flex items-center px-3 gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500/50 animate-pulse" />
                <span className="text-[10px] text-neutral-500 font-mono truncate">localhost:3000/preview</span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    alert("Production link generation requires a cloud deployment.");
                  }}
                  className="text-[10px] font-bold text-emerald-400/60 hover:text-emerald-400 flex items-center gap-1.5 transition-colors uppercase tracking-wider"
                >
                  <ExternalLink className="w-3 h-3" />
                  Deploy
                </button>
              </div>
            </div>

            {/* Preview Iframe */}
            <div className="flex-1 relative">
              <SandpackPreview 
                showOpenInCodeSandbox={false}
                showRefreshButton={true}
                className="h-full w-full"
                style={{ height: '100%', backgroundColor: 'transparent' }}
              />
            </div>
          </div>

          {/* Collapsible Console */}
          <div className="h-48 shrink-0 border-t border-white/10 flex flex-col bg-black/40 backdrop-blur-xl">
            <div className="h-9 border-b border-white/5 flex items-center justify-between px-4">
              <div className="flex items-center gap-2">
                <TerminalIcon className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">Logs</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-[9px] text-neutral-500 font-mono">Filter: None</div>
                <div className="h-3 w-px bg-white/10" />
                <button className="text-[9px] text-neutral-500 hover:text-white uppercase font-bold transition-colors">Clear</button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden relative">
              <SandpackConsole standalone className="h-full w-full custom-console" />
            </div>
          </div>
        </div>
      </SandpackProvider>
      <style>{`
        .sp-wrapper, .sp-layout { height: 100% !important; background: transparent !important; flex: 1 !important; display: flex !important; flex-direction: column !important; }
        .sp-preview-container { height: 100% !important; flex: 1 !important; }
        .sp-preview-iframe { background: #000 !important; }
        .sp-console { background: transparent !important; padding: 12px 16px !important; }
        .sp-console-item { 
          font-family: 'JetBrains Mono', monospace !important; 
          font-size: 11px !important; 
          border-bottom: 1px solid rgba(255,255,255,0.03) !important; 
          padding: 6px 0 !important; 
          color: #a3a3a3;
        }
        .sp-console-item-log { color: #d4d4d4; }
        .sp-console-item-error { color: #f87171; background: rgba(239, 68, 68, 0.05); }
        .sp-preview-actions { right: 12px !important; bottom: 12px !important; top: auto !important; }
        .sp-preview-actions button { background: rgba(255,255,255,0.05) !important; border: 1px solid rgba(255,255,255,0.1) !important; border-radius: 6px !important; }
      `}</style>
    </div>
  );
}

