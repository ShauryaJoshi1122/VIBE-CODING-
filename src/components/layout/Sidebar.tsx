import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Settings, Key, X, Activity, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';
import { ChatPanel } from '../chat/ChatPanel';

export function Sidebar() {
  const { openRouterKey, setOpenRouterKey } = useAppStore();
  const [showSettings, setShowSettings] = useState(false);
  const [keyInput, setKeyInput] = useState(openRouterKey || '');

  const saveSettings = () => {
    setOpenRouterKey(keyInput);
    setShowSettings(false);
  };

  return (
    <>
      <div className="w-[340px] lg:w-[420px] h-full flex flex-col relative z-20 shrink-0 bg-[#0a0a0a] border-r border-white/5 shadow-[20px_0_40px_rgba(0,0,0,0.4)]">
        <div className="flex-none h-14 border-b border-white/5 flex items-center justify-between px-6 bg-white/[0.01]">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <h2 className="text-sm font-bold tracking-tight text-white/90">VibeStudio <span className="text-emerald-500">AI</span></h2>
          </div>
          <button 
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-xl hover:bg-white/5 text-neutral-500 hover:text-white transition-all ring-1 ring-transparent hover:ring-white/10"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex-1 overflow-hidden relative">
           <ChatPanel />
        </div>
      </div>

      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-gradient-to-r from-white/[0.02] to-transparent">
              <h3 className="text-sm font-medium flex items-center gap-2 text-white/90">
                <Settings className="w-4 h-4 text-emerald-400" /> Platform Settings
              </h3>
              <button onClick={() => setShowSettings(false)} className="text-neutral-500 hover:text-white transition-colors">
                <X className="w-4 h-4"/>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-widest text-neutral-400 mb-2">
                  NVIDIA API Key
                </label>
                <div className="relative group">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 group-focus-within:text-emerald-400 transition-colors" />
                  <input 
                    type="password" 
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-lg py-2.5 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder:text-neutral-700"
                    placeholder="nvapi-..."
                  />
                </div>
                <p className="text-[11px] text-neutral-500 mt-2 leading-relaxed">
                  Required to generate applications using DeepSeek via NVIDIA NIM. Your key is stored locally in your browser.
                </p>
              </div>
              <div className="pt-6 flex justify-end gap-3">
                <button 
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-neutral-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={saveSettings}
                  className="px-5 py-2 bg-white text-black rounded-lg text-xs font-medium hover:bg-neutral-200 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
