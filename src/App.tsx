import React from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { CodeEditor } from './components/editor/CodeEditor';
import { FileExplorer } from './components/explorer/FileExplorer';
import { useAppStore } from './store/useAppStore';
import { Code2, LayoutPanelLeft, FileCode2, Download, Package, Github, RefreshCw, Cloud, MessageSquarePlus, X, Check, Loader2, ChevronRight, Sparkles } from 'lucide-react';
import { cn, downloadFile, downloadProject } from './lib/utils';
import { saveProjectToCloud } from './lib/firebase';
import { useState, useEffect } from 'react';

import { ToDo } from './components/todo/ToDo';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const { projectId, files, activeFile, setActiveFile, resetStore, messages, githubToken, setGithubToken, isSaving, setIsSaving, isGenerating, sidebarOpen, setSidebarOpen } = useAppStore();
  const [activeTab, setActiveTab] = useState<'editor' | 'todo'>('editor');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isPushing, setIsPushing] = useState(false);
  const [showGithubModal, setShowGithubModal] = useState(false);
  const [repoName, setRepoName] = useState(`vibe-${projectId}`);
  const [branchName, setBranchName] = useState('main');
  const [createMode, setCreateMode] = useState<'new' | 'existing'>('new');
  const [userRepos, setUserRepos] = useState<any[]>([]);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [pushResult, setPushResult] = useState<{ success: boolean; url?: string; message?: string } | null>(null);

  // Connection test on boot
  useEffect(() => {
    import('./lib/firebase').then(m => m.testConnection());
  }, []);

  // GitHub Auth Listener
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'GITHUB_AUTH_SUCCESS' && event.data?.token) {
        setGithubToken(event.data.token);
        setShowGithubModal(true);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [setGithubToken]);

  const handleDownloadFile = () => {
    if (activeFile && files[activeFile]) {
      const fileName = activeFile.startsWith('/') ? activeFile.substring(1) : activeFile;
      downloadFile(fileName, files[activeFile].code);
    }
  };

  const handleDownloadProject = async () => {
    try {
      await downloadProject(files);
    } catch (error) {
      console.error("Failed to download project:", error);
    }
  };

  const handleSaveToCloud = async () => {
    setIsSaving(true);
    try {
      const success = await saveProjectToCloud(projectId, files, messages);
      if (success) {
        setLastSaved(new Date());
      }
    } catch (e) {
      console.error("Cloud save failed", e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConnectGithub = async () => {
    if (githubToken) {
      setShowGithubModal(true);
      return;
    }

    try {
      const res = await fetch('/api/auth/github/url');
      const text = await res.text();
      
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error(`Server returned HTML instead of JSON. Ensure GITHUB_CLIENT_ID is set in environment secrets. (Raw: ${text.substring(0, 50)}...)`);
      }
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to get auth URL");
      }

      const { url } = data;
      if (!url) throw new Error("No authorization URL returned from server");
      
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      window.open(
        url,
        'github_auth',
        `width=${width},height=${height},left=${left},top=${top}`
      );
    } catch (error: any) {
      console.error("Auth error:", error);
      alert(`GitHub Auth Error: ${error.message || "Failed to start authentication"}`);
    }
  };

  const handlePushToGithub = async () => {
    if (!githubToken || !repoName) return;
    
    setIsPushing(true);
    setPushResult(null);
    try {
      const res = await fetch('/api/github/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: githubToken,
          repoName,
          files,
          description: "Created with VibeStudio AI",
          branch: branchName || "main",
          createRepo: createMode === 'new'
        })
      });
      
      const data = await res.json();
      if (data.success) {
        setPushResult({ success: true, url: data.repoUrl });
      } else {
        setPushResult({ success: false, message: data.error });
      }
    } catch (error: any) {
      setPushResult({ success: false, message: error.message });
    } finally {
      setIsPushing(false);
    }
  };

  // Auto-save to Firebase
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (files && Object.keys(files).length > 2) { // Only save if we have the base project
        try {
          const success = await saveProjectToCloud(projectId, files, messages);
          if (success) setLastSaved(new Date());
        } catch (e) {
          console.error("Auto-save failed", e);
        }
      }
    }, 10000); // Save after 10 seconds of inactivity (less aggressive)

    return () => clearTimeout(timer);
  }, [files, messages, projectId]);

  const handleReset = () => {
    if (confirm("Are you sure you want to start a new chat? All unsaved changes will be lost.")) {
      resetStore();
    }
  };

  const handleCreateModeChange = (mode: 'new' | 'existing') => {
    setCreateMode(mode);
    setRepoName(mode === 'new' ? `vibe-${projectId}` : '');
    setBranchName('main');
  };

  // Fetch User Repos when modal opens
  useEffect(() => {
    if (showGithubModal && githubToken && createMode === 'existing') {
      const fetchRepos = async () => {
        setIsLoadingRepos(true);
        try {
          const res = await fetch('/api/github/repos', {
            headers: { 'Authorization': `Bearer ${githubToken}` }
          });
          const data = await res.json();
          if (Array.isArray(data)) {
            setUserRepos(data);
          }
        } catch (error) {
          console.error("Failed to fetch repos:", error);
        } finally {
          setIsLoadingRepos(false);
        }
      };
      fetchRepos();
    }
  }, [showGithubModal, githubToken, createMode]);

  return (
    <div className="flex h-screen w-full bg-[#000] text-white overflow-hidden font-sans selection:bg-emerald-500/30">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-dot-pattern opacity-[0.15] z-0 pointer-events-none" />
      <div className="radial-glow w-[800px] h-[800px] top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 opacity-20" />
      <div className="radial-glow-green w-[600px] h-[600px] top-0 right-0 translate-x-1/4 -translate-y-1/4 opacity-10" />
      
      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0, x: -340 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -340 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 lg:relative z-50 shrink-0"
          >
            <Sidebar />
          </motion.div>
        )}
      </AnimatePresence>

      {/* GitHub Push Modal */}
      <AnimatePresence>
        {showGithubModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowGithubModal(false);
                setPushResult(null);
              }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-[400px] bg-neutral-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden relative"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                    <Github className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Push to GitHub</h3>
                    <p className="text-[10px] text-neutral-500 uppercase tracking-widest mt-0.5">Export source code</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setShowGithubModal(false);
                    setPushResult(null);
                  }}
                  className="p-2 hover:bg-white/5 rounded-xl transition-colors text-neutral-500 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {!pushResult ? (
                  <>
                    <div className="flex p-1 bg-black/40 rounded-xl border border-white/5 mb-2">
                      <button 
                        onClick={() => handleCreateModeChange('new')}
                        className={cn(
                          "flex-1 py-2 rounded-lg text-[11px] font-bold transition-all",
                          createMode === 'new' ? "bg-white/10 text-white" : "text-neutral-500 hover:text-neutral-300"
                        )}
                      >
                        New Repository
                      </button>
                      <button 
                        onClick={() => handleCreateModeChange('existing')}
                        className={cn(
                          "flex-1 py-2 rounded-lg text-[11px] font-bold transition-all",
                          createMode === 'existing' ? "bg-white/10 text-white" : "text-neutral-500 hover:text-neutral-300"
                        )}
                      >
                        Existing Repository
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest px-1">Repo Name</label>
                        {createMode === 'new' ? (
                          <input 
                            type="text"
                            value={repoName}
                            onChange={(e) => setRepoName(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '-'))}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors"
                            placeholder="my-vibe-project"
                          />
                        ) : (
                          <div className="relative">
                            <select 
                              value={repoName}
                              onChange={(e) => {
                                const repo = userRepos.find(r => r.name === e.target.value);
                                setRepoName(e.target.value);
                                if (repo) setBranchName(repo.default_branch || 'main');
                              }}
                              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors appearance-none"
                              disabled={isLoadingRepos}
                            >
                              <option value="" disabled>{isLoadingRepos ? 'Loading repositories...' : 'Select a repository...'}</option>
                              {userRepos.map(repo => (
                                <option key={repo.name} value={repo.name}>{repo.name}</option>
                              ))}
                            </select>
                            {isLoadingRepos && (
                              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <Loader2 className="w-4 h-4 animate-spin text-neutral-500" />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest px-1">Branch</label>
                        <input 
                          type="text"
                          value={branchName}
                          onChange={(e) => setBranchName(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '-'))}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors"
                          placeholder="main"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handlePushToGithub}
                      disabled={isPushing || !repoName}
                      className="w-full bg-white text-black font-bold h-12 rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:scale-100 mt-2"
                    >
                      {isPushing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Pushing files...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4" />
                          {createMode === 'new' ? 'Create & Push' : 'Push to Branch'}
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <div className="text-center py-4 space-y-4">
                    {pushResult.success ? (
                      <>
                        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                          <Check className="w-8 h-8 text-emerald-400" />
                        </div>
                        <h4 className="font-bold">Project Pushed Successfully!</h4>
                        <p className="text-sm text-neutral-400">Your collection of files has been pushed to your new GitHub repository.</p>
                        <a 
                          href={pushResult.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 text-black font-bold rounded-xl hover:bg-emerald-400 transition-colors mt-2"
                        >
                           View on GitHub <Github className="w-4 h-4" />
                        </a>
                      </>
                    ) : (
                      <>
                        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
                          <X className="w-8 h-8 text-red-400" />
                        </div>
                        <h4 className="font-bold">Push Failed</h4>
                        <p className="text-sm text-neutral-400">{pushResult.message || "An unknown error occurred during the push process."}</p>
                        <button 
                          onClick={() => setPushResult(null)}
                          className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl font-bold hover:bg-white/10 transition-colors"
                        >
                          Try Again
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <motion.main 
        layout
        className={cn(
          "flex-1 flex flex-col relative z-10 overflow-hidden border-none transition-all duration-300",
          !sidebarOpen ? "" : ""
        )}
      >
        <header className="h-14 border-b border-border-dark flex items-center justify-between px-6 bg-app-bg">
          <div className="flex items-center gap-4 shrink-0">
            {!sidebarOpen && (
              <motion.button 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => setSidebarOpen(true)}
                className="p-2 -ml-2 rounded-lg hover:bg-surface-hover text-neutral-400 hover:text-white transition-colors"
                title="Open Sidebar"
              >
                <Sparkles className="w-4 h-4" />
              </motion.button>
            )}
            <h2 className="text-sm font-medium text-neutral-200">
               {activeFile ? activeFile.split('/').pop() : 'Untitled'}
            </h2>
          </div>
          
          <div className="flex items-center gap-2 shrink-0 ml-4">
            <div className="flex flex-col items-end mr-4 hidden md:flex">
              <div className="flex items-center gap-2">
                {isSaving ? (
                  <div className="flex items-center gap-1.5">
                    <Loader2 className="w-3 h-3 text-emerald-500 animate-spin" />
                    <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Syncing Cloud</span>
                  </div>
                ) : lastSaved ? (
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3 h-3 text-neutral-500" />
                    <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                ) : (
                  <span className="text-[10px] text-neutral-600 font-bold uppercase tracking-widest">Local Draft</span>
                )}
              </div>
            </div>

            <button
              onClick={handleConnectGithub}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all group active:scale-95",
                githubToken 
                  ? "bg-neutral-500/10 text-neutral-400 border border-white/5 hover:bg-white/5 hover:text-white" 
                  : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 hover:text-emerald-300"
              )}
            >
              <Github className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
              <span className="hidden lg:inline">{githubToken ? 'Account Linked' : 'Link Github'}</span>
            </button>
            <button
              onClick={handleSaveToCloud}
              disabled={isSaving}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 hover:text-blue-300 transition-all disabled:opacity-50 group active:scale-95"
              title={lastSaved ? `Last saved at ${lastSaved.toLocaleTimeString()}` : 'Save to Cloud'}
            >
              <Cloud className={cn("w-3.5 h-3.5 transition-transform", isSaving ? "animate-pulse" : "group-hover:-translate-y-0.5")} />
              <span className="hidden lg:inline">
                {isSaving ? 'Saving...' : lastSaved ? 'Synced' : 'Save Cloud'}
              </span>
              {lastSaved && !isSaving && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />}
            </button>
            <div className="h-6 w-px bg-white/10 mx-1 hidden sm:block" />
            <button
              onClick={handleDownloadProject}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 hover:text-emerald-300 transition-all hidden sm:flex group active:scale-95"
              title="Download full project"
            >
              <Package className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
              <span className="hidden xl:inline">Export</span>
            </button>
            
            <button
               onClick={handleReset}
               className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] font-semibold bg-white/5 text-neutral-300 hover:text-white hover:bg-white/10 transition-all border border-white/5 hover:border-white/20 active:scale-95"
               title="New Chat"
            >
              <MessageSquarePlus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Chat</span>
            </button>
          </div>
        </header>

        {/* Editor Workspace */}
        <div className="flex-1 overflow-hidden relative bg-black/20">
          <div className="absolute inset-0 flex flex-col sm:flex-row">
            {/* File Explorer */}
            <motion.div 
              layout
              className="w-full sm:w-[240px] h-[35%] sm:h-full bg-white/[0.01] border-b sm:border-b-0 sm:border-r border-white/5 flex flex-col overflow-hidden"
            >
              <div className="flex-1 overflow-y-auto no-scrollbar">
                <FileExplorer 
                  files={files} 
                  activeFile={activeFile} 
                  onFileSelect={(path) => {
                    const actualPath = Object.keys(files).find(k => k === path || k === `/${path}`) || path;
                    setActiveFile(actualPath);
                  }} 
                />
              </div>
            </motion.div>
            <div className="flex-1 overflow-hidden relative">
               <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent z-10" />
               <div className="flex flex-col h-full">
                <div className="h-10 shrink-0 bg-white/[0.02] border-b border-white/5 flex items-center px-6 gap-2 text-[10px] text-neutral-500 font-mono">
                  <button onClick={() => setActiveTab('editor')} className={cn("px-2 py-0.5 rounded hover:text-white transition-colors uppercase tracking-widest", activeTab === 'editor' && "text-emerald-400")}>Editor</button>
                  <button onClick={() => setActiveTab('todo')} className={cn("px-2 py-0.5 rounded hover:text-white transition-colors uppercase tracking-widest", activeTab === 'todo' && "text-emerald-400")}>To-Do</button>
                  {activeTab === 'editor' && activeFile && (
                    <>
                      <div className="w-px h-3 bg-white/10" />
                      <FileCode2 className="w-3.5 h-3.5" />
                      {activeFile.split('/').map((part, i, arr) => (
                        <React.Fragment key={i}>
                          <span className={i === arr.length - 1 ? "text-emerald-400 font-bold" : ""}>{part}</span>
                          {i < arr.length - 1 && <ChevronRight className="w-2.5 h-2.5" />}
                        </React.Fragment>
                      ))}
                    </>
                  )}
                 </div>
                 <div className="flex-1 overflow-hidden">
                    {activeTab === 'editor' ? (
                       <CodeEditor />
                    ) : (
                       <ToDo />
                    )}
                 </div>
               </div>
            </div>
          </div>
        </div>
      </motion.main>
    </div>
  );
}
