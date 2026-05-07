import React from 'react';
import Editor from '@monaco-editor/react';
import { useAppStore } from '../../store/useAppStore';
import { FileCode2, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export function CodeEditor() {
  const { files, activeFile, setActiveFile, openFiles, closeFile, updateFile } = useAppStore();

  if (!activeFile || !files[activeFile]) {
    return (
      <div className="flex-1 flex flex-col h-full bg-black/40 backdrop-blur-xl relative">
        <div className="h-12 border-b border-white/5 flex items-end px-2 pt-2 bg-black/20">
          {openFiles.length > 0 && (
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none no-scrollbar">
              {openFiles.map(path => {
                const name = path.split('/').pop() || path;
                return (
                  <div key={path} className="flex group shrink-0">
                    <button
                      onClick={() => setActiveFile(path)}
                      className={cn(
                        "px-4 py-2 text-[12px] font-mono flex items-center gap-2 border-t border-x border-white/5 rounded-t-lg transition-all",
                        activeFile === path 
                          ? "bg-white/[0.03] text-emerald-400 font-bold border-b-transparent relative z-10" 
                          : "text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.01]"
                      )}
                    >
                      <FileCode2 className="w-3.5 h-3.5" />
                      {name}
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        closeFile(path);
                      }}
                      className={cn(
                        "px-1.5 py-2 flex items-center justify-center border-t border-r border-white/5 rounded-tr-lg hover:bg-white/10 transition-all",
                        activeFile === path ? "bg-white/[0.03] text-emerald-400" : "text-neutral-500 hover:text-neutral-300"
                      )}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="flex-1 flex items-center justify-center bg-transparent text-neutral-500">
          <div className="text-center p-8 rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-md">
            <FileCode2 className="w-12 h-12 mx-auto mb-4 opacity-20 text-emerald-400" />
            <p className="text-sm font-medium text-white/50">No file selected in Workspace</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-black/40 backdrop-blur-xl relative">
      <div className="h-12 border-b border-white/5 flex items-end px-2 pt-2 bg-black/20">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none no-scrollbar">
          {openFiles.map(path => {
            const name = path.split('/').pop() || path;
            const isActive = activeFile === path;
            return (
              <div key={path} className="flex group shrink-0">
                <button
                  onClick={() => setActiveFile(path)}
                  className={cn(
                    "px-4 py-2 text-[12px] font-mono flex items-center gap-2 border-t border-x border-white/5 rounded-t-lg transition-all",
                    isActive 
                      ? "bg-white/[0.03] text-emerald-300 font-bold border-b-transparent relative z-10 shadow-[0_-4px_12px_rgba(0,0,0,0.5)]" 
                      : "text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.01]"
                  )}
                >
                  <FileCode2 className="w-3.5 h-3.5" />
                  {name}
                  {isActive && <div className="absolute bottom-0 left-0 w-full h-[1px] bg-emerald-500/50" />}
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    closeFile(path);
                  }}
                  className={cn(
                    "px-1.5 py-2 flex items-center justify-center border-t border-r border-white/5 rounded-tr-lg hover:bg-white/10 transition-all",
                    isActive ? "bg-white/[0.03] text-emerald-300 shadow-[0_-4px_12px_rgba(0,0,0,0.5)]" : "text-neutral-500 hover:text-neutral-300"
                  )}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex-1 overflow-hidden relative">
        <Editor
          height="100%"
          defaultLanguage={activeFile.endsWith('.css') ? 'css' : activeFile.endsWith('.json') ? 'json' : 'javascript'}
          theme="vs-dark"
          path={activeFile}
          value={files[activeFile]?.code || ''}
          onChange={(value) => updateFile(activeFile, value || '')}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            fontFamily: 'JetBrains Mono, "Roboto Mono", monospace',
            lineHeight: 1.7,
            padding: { top: 24, bottom: 24 },
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            formatOnPaste: true,
            renderLineHighlight: 'all',
            cursorWidth: 3,
            scrollbar: {
              verticalScrollbarSize: 8,
              horizontalScrollbarSize: 8,
            }
          }}
          loading={<div className="text-emerald-500/50 font-mono text-sm animate-pulse flex items-center gap-2 px-8 py-4"><FileCode2 className="w-4 h-4"/> Initializing Editor...</div>}
        />
      </div>
    </div>
  );
}
