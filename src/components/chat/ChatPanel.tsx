import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { generateApp } from '../../lib/ai/openrouter';
import { Send, Loader2, Bot, User, Code2, Play, Sparkles, AlertCircle, X, RefreshCw, LayoutPanelLeft, ShoppingBag } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '../../lib/utils';

export function ChatPanel() {
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { messages, addMessage, isGenerating, setIsGenerating, files, setFiles, openRouterKey, clearMessages } = useAppStore();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isGenerating]);

  const handleClearChat = () => {
    if (confirm("Clear chat history?")) {
      clearMessages();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isGenerating) return;

    const userMessage = input.trim();
    setInput('');
    setError(null);
    addMessage({ role: 'user', content: userMessage });
    setIsGenerating(true);

    try {
      const result = await generateApp(userMessage, files);
      
      let aiMessage = result.message || 'I have updated the files based on your request.';
      addMessage({ role: 'assistant', content: aiMessage });

      if (result.files && Array.isArray(result.files)) {
        const newFiles = { ...files };
        for (const f of result.files) {
          if (f.path && f.code !== undefined) {
             newFiles[f.path] = { code: f.code };
          }
        }
        setFiles(newFiles);
        useAppStore.getState().setActiveView('preview');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during generation.');
      addMessage({ role: 'assistant', content: `**Error:** ${err.message}` });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full relative bg-transparent">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth pb-32 scrollbar-none">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center px-6">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 flex items-center justify-center mb-8 border border-emerald-500/20 shadow-[0_0_40px_rgba(16,185,129,0.1)]">
              <Sparkles className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">Create with VibeStudio</h3>
            <p className="text-sm text-neutral-500 mb-10 max-w-xs leading-relaxed">
              Design, build, and deploy production-grade React apps using natural language.
            </p>
            
            <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
              {[
                { name: "Portfolio", icon: <User className="w-3.5 h-3.5" /> },
                { name: "Dashboard", icon: <LayoutPanelLeft className="w-3.5 h-3.5" /> },
                { name: "E-commerce", icon: <ShoppingBag className="w-3.5 h-3.5" /> },
                { name: "Chat App", icon: <Bot className="w-3.5 h-3.5" /> }
              ].map(template => (
                <button 
                  key={template.name}
                  onClick={() => setInput(`Build a modern ${template.name} using Tailwind CSS.`)}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/5 text-[11px] font-bold text-neutral-400 hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/20 transition-all group"
                >
                  <div className="p-1.5 rounded-lg bg-white/5 group-hover:bg-emerald-500/20 transition-colors">
                    {template.icon}
                  </div>
                  {template.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div 
            key={msg.id} 
            className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
            style={{ animationDelay: `${idx * 100}ms` }}
          >
            <div className="flex items-center gap-3 mb-3">
              {msg.role === 'assistant' ? (
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                  <span className="relative flex h-2 w-2 mr-0.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
                  <User className="w-4 h-4 text-blue-400" />
                </div>
              )}
              <div className="flex flex-col">
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-[0.2em] mb-0.5",
                  msg.role === 'assistant' ? "text-emerald-400" : "text-blue-400"
                )}>
                  {msg.role === 'assistant' ? 'Studio AI' : 'Creator'}
                </span>
                <span className="text-[9px] text-neutral-600 font-mono tracking-wider">04:20 PM</span>
              </div>
            </div>
            
            <div className={cn(
              "text-[13.5px] leading-relaxed",
              msg.role === 'assistant' ? "text-neutral-300 pl-11" : "text-white font-medium"
            )}>
              {msg.role === 'assistant' ? (
                <div className="markdown-body prose prose-invert prose-emerald prose-sm max-w-none bg-white/[0.02] border border-white/5 p-5 rounded-2xl rounded-tl-none shadow-xl backdrop-blur-sm">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/5 rounded-tl-none shadow-xl">
                  {msg.content}
                </div>
              )}
            </div>
          </div>
        ))}

        {isGenerating && (
          <div className="flex items-center gap-4 p-5 bg-white/[0.02] rounded-3xl border border-white/5 shadow-2xl w-full animate-pulse">
            <div className="relative flex items-center justify-center w-8 h-8">
               <span className="absolute w-full h-full rounded-full border-2 border-emerald-500/20 border-t-emerald-400 animate-spin" />
               <Sparkles className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-bold text-white/90">Studio is architecting...</span>
              <span className="text-[11px] text-neutral-500 tracking-wider uppercase font-semibold">Updating workspace files</span>
            </div>
          </div>
        )}
      </div>

      <div className="absolute bottom-0 w-full p-6 pt-16 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/95 to-transparent flex flex-col gap-3">
        {error && (
          <div className="mb-2 px-4 py-3 flex items-start gap-3 bg-red-500/10 rounded-xl border border-red-500/20 text-red-400 text-xs shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="flex-1 font-medium">{error}</span>
            <button onClick={() => setError(null)} className="text-red-400/50 hover:text-red-400 transition-colors"><X className="w-4 h-4"/></button>
          </div>
        )}
        
        <div className="flex items-center justify-between mb-1 px-2">
          {messages.length > 0 && (
            <button 
              onClick={handleClearChat}
              className="text-[10px] font-bold tracking-[0.2em] text-neutral-600 hover:text-emerald-500 transition-colors uppercase flex items-center gap-2"
            >
              <RefreshCw className="w-3 h-3" /> Clear History
            </button>
          )}
          <div className="flex-1" />
        </div>

        <form onSubmit={handleSubmit} className="relative group flex items-end bg-[#111] border border-white/10 rounded-2xl shadow-inner transition-all focus-within:border-emerald-500/30 focus-within:ring-4 focus-within:ring-emerald-500/5 overflow-hidden">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Describe your vision..."
            className="w-full bg-transparent text-[13px] px-5 py-5 pr-14 resize-none outline-none transition-all placeholder:text-neutral-700 max-h-40 min-h-[64px]"
            rows={1}
            disabled={isGenerating}
            style={{ height: 'auto' }}
          />
          <button
            type="submit"
            disabled={!input.trim() || isGenerating}
            className="absolute bottom-3 right-3 w-10 h-10 bg-emerald-500 text-black hover:bg-emerald-400 disabled:opacity-0 disabled:scale-90 rounded-xl transition-all flex items-center justify-center shadow-lg shadow-emerald-500/20 active:scale-95"
          >
            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 translate-x-[1px]" />}
          </button>
        </form>
        <div className="text-center">
           <span className="text-[10px] font-bold text-neutral-700 uppercase tracking-widest">Built with Gemini 1.5 Pro</span>
        </div>
      </div>
    </div>
  );
}
