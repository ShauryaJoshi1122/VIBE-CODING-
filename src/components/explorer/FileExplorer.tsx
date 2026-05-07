import React, { useMemo, useState } from 'react';
import { ChevronRight, ChevronDown, FileCode2, FileJson, FileText, FileCode, Folder, FolderOpen, Box, Plus, FolderPlus, Trash2, Edit2, X, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAppStore } from '../../store/useAppStore';

interface FileTreeItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileTreeItem[];
}

interface FileExplorerProps {
  files: Record<string, any>;
  activeFile: string | null;
  onFileSelect: (path: string) => void;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({ files, activeFile, onFileSelect }) => {
  const { createFile, deleteFile, renameFile } = useAppStore();
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set(['src']));
  const [isCreating, setIsCreating] = useState<'file' | 'directory' | null>(null);
  const [creationPath, setCreationPath] = useState('');
  const [newName, setNewName] = useState('');
  const [renamingPath, setRenamingPath] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const fileTree = useMemo(() => {
    const root: FileTreeItem[] = [];
    const paths = Object.keys(files).sort();

    paths.forEach(path => {
      const parts = path.startsWith('/') ? path.substring(1).split('/') : path.split('/');
      let currentLevel = root;
      let currentPath = '';

      parts.forEach((part, index) => {
        currentPath += (currentPath ? '/' : '') + part;
        const isLast = index === parts.length - 1;
        let existing = currentLevel.find(item => item.name === part);

        if (!existing) {
          existing = {
            name: part,
            path: currentPath,
            type: isLast ? 'file' : 'directory',
            children: isLast ? undefined : []
          };
          currentLevel.push(existing);
        }

        if (!isLast) {
          currentLevel = existing.children!;
        }
      });
    });

    return root;
  }, [files]);

  const toggleDir = (path: string) => {
    setExpandedDirs(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const fullPath = creationPath ? `${creationPath}/${newName.trim()}` : newName.trim();
    if (isCreating === 'file') {
      createFile(fullPath);
      onFileSelect(fullPath);
    } else {
      createFile(`${fullPath}/.keep`, '');
      setExpandedDirs(prev => new Set(prev).add(fullPath));
    }

    setIsCreating(null);
    setNewName('');
  };

  const handleRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameValue.trim() || !renamingPath) return;

    const parts = renamingPath.split('/');
    parts[parts.length - 1] = renameValue.trim();
    const newPath = parts.join('/');

    renameFile(renamingPath, newPath);
    setRenamingPath(null);
    setRenameValue('');
  };

  const getFileIcon = (name: string, active: boolean) => {
    const ext = name.split('.').pop()?.toLowerCase();
    const className = cn("w-4 h-4", active ? "text-emerald-400" : "text-neutral-500 group-hover:text-neutral-300");

    switch (ext) {
      case 'ts':
      case 'tsx':
        return <FileCode2 className={className} />;
      case 'js':
      case 'jsx':
        return <FileCode className={className} />;
      case 'json':
        return <FileJson className={className} />;
      case 'css':
        return <FileText className={className} />;
      case 'html':
        return <Box className={className} />;
      default:
        return <FileCode2 className={className} />;
    }
  };

  const renderTree = (items: FileTreeItem[], level: number = 0) => {
    return items.map(item => {
      const isExpanded = expandedDirs.has(item.path);
      const isActive = activeFile === item.path || (activeFile && (activeFile === `/${item.path}`));
      const isRenaming = renamingPath === item.path;
      
      if (item.type === 'directory') {
        return (
          <div key={item.path} className="select-none">
            {isRenaming ? (
              <form onSubmit={handleRename} className="flex items-center gap-2 px-3 py-1.5" style={{ paddingLeft: `${level * 12 + 12}px` }}>
                <Folder className="w-4 h-4 text-emerald-500/40 shrink-0" />
                <input 
                  autoFocus
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  className="flex-1 bg-black/40 border border-emerald-500/30 rounded px-1.5 py-0.5 text-[12px] outline-none text-white"
                  onBlur={() => setRenamingPath(null)}
                />
              </form>
            ) : (
              <div
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all group hover:bg-white/5",
                  "text-neutral-400 hover:text-neutral-200"
                )}
                style={{ paddingLeft: `${level * 12 + 12}px` }}
              >
                <div onClick={() => toggleDir(item.path)} className="w-4 h-4 flex items-center justify-center shrink-0 cursor-pointer">
                  {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                </div>
                <div onClick={() => toggleDir(item.path)} className="flex items-center gap-2 flex-1 truncate cursor-pointer">
                  {isExpanded ? (
                    <FolderOpen className="w-4 h-4 text-emerald-500/60 shrink-0" />
                  ) : (
                    <Folder className="w-4 h-4 text-emerald-500/40 shrink-0" />
                  )}
                  <span className="truncate">{item.name}</span>
                </div>
                
                <div className="hidden group-hover:flex items-center gap-1">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setIsCreating('file'); setCreationPath(item.path); setNewName(''); }}
                    className="p-1 hover:bg-white/10 rounded transition-colors text-neutral-500 hover:text-emerald-400"
                    title="New File"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setRenamingPath(item.path); setRenameValue(item.name); }}
                    className="p-1 hover:bg-white/10 rounded transition-colors text-neutral-500 hover:text-blue-400"
                    title="Rename"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); if(confirm(`Delete ${item.name} and all its contents?`)) deleteFile(item.path); }}
                    className="p-1 hover:bg-white/10 rounded transition-colors text-neutral-500 hover:text-red-400"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            {isExpanded && (
              <div className="mt-0.5">
                {isCreating && creationPath === item.path && (
                  <form onSubmit={handleCreate} className="flex items-center gap-2 px-3 py-1.5 animate-in slide-in-from-left-2" style={{ paddingLeft: `${(level + 1) * 12 + 28}px` }}>
                    {isCreating === 'file' ? <FileCode2 className="w-4 h-4 text-emerald-500/40" /> : <Folder className="w-4 h-4 text-emerald-500/40" />}
                    <input 
                      autoFocus
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="flex-1 bg-black/40 border border-emerald-500/30 rounded px-1.5 py-0.5 text-[12px] outline-none text-white"
                      placeholder={isCreating === 'file' ? "file.js" : "folder"}
                      onBlur={() => { if(!newName) setIsCreating(null); }}
                    />
                  </form>
                )}
                {item.children && renderTree(item.children, level + 1)}
              </div>
            )}
          </div>
        );
      }

      return (
        <div 
          key={item.path}
          className="group relative"
        >
          {isRenaming ? (
            <form onSubmit={handleRename} className="flex items-center gap-2 px-3 py-1.5" style={{ paddingLeft: `${level * 12 + 28}px` }}>
              <ScaleIcon name={item.name} />
              <input 
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                className="flex-1 bg-black/40 border border-emerald-500/30 rounded px-1.5 py-0.5 text-[12px] outline-none text-white"
                onBlur={() => setRenamingPath(null)}
              />
            </form>
          ) : (
            <div
              onClick={() => onFileSelect(item.path)}
              className={cn(
                "w-full flex items-center gap-3 text-left px-3 py-1.5 rounded-lg text-[12px] font-mono transition-all truncate border group mb-0.5 cursor-pointer",
                isActive 
                  ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20 ring-1 ring-emerald-500/10" 
                  : "text-neutral-400 hover:bg-white/5 hover:text-neutral-200 border-transparent"
              )}
              style={{ paddingLeft: `${level * 12 + 28}px` }}
            >
              <div className="shrink-0">{getFileIcon(item.name, isActive)}</div>
              <span className="truncate flex-1">{item.name}</span>
              
              <div className="hidden group-hover:flex items-center gap-1 shrink-0">
                <button 
                  onClick={(e) => { e.stopPropagation(); setRenamingPath(item.path); setRenameValue(item.name); }}
                  className="p-1 hover:bg-white/10 rounded transition-colors text-neutral-500 hover:text-blue-400"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); if(confirm(`Delete ${item.name}?`)) deleteFile(item.path); }}
                  className="p-1 hover:bg-white/10 rounded transition-colors text-neutral-500 hover:text-red-400"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>

              {isActive && !isRenaming && (
                <div className="ml-1 w-1 h-1 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              )}
            </div>
          )}
        </div>
      );
    });
  };

  const ScaleIcon = ({ name }: { name: string }) => {
    const ext = name.split('.').pop()?.toLowerCase();
    const className = "w-4 h-4 text-neutral-500";
    if (ext === 'ts' || ext === 'tsx') return <FileCode2 className={className} />;
    return <FileCode className={className} />;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
        <div className="text-[10px] font-bold tracking-[0.2em] text-neutral-500 uppercase flex items-center gap-2">
          <FileCode2 className="w-3.5 h-3.5 text-emerald-500/60" /> Explorer
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => { setIsCreating('file'); setCreationPath(''); setNewName(''); }}
            className="p-1.5 hover:bg-white/5 rounded-lg text-neutral-500 hover:text-white transition-colors"
            title="New File"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={() => { setIsCreating('directory'); setCreationPath(''); setNewName(''); }}
            className="p-1.5 hover:bg-white/5 rounded-lg text-neutral-500 hover:text-white transition-colors"
            title="New Folder"
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto space-y-0.5 px-3 py-2 scrollbar-none">
        {isCreating && !creationPath && (
          <form onSubmit={handleCreate} className="flex items-center gap-2 px-3 py-1.5 animate-in slide-in-from-left-2 mb-1">
            {isCreating === 'file' ? <FileCode2 className="w-4 h-4 text-emerald-500/40" /> : <Folder className="w-4 h-4 text-emerald-500/40" />}
            <input 
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="flex-1 bg-black/40 border border-emerald-500/30 rounded px-1.5 py-0.5 text-[12px] outline-none text-white"
              placeholder={isCreating === 'file' ? "file.js" : "folder"}
              onBlur={() => { if(!newName) setIsCreating(null); }}
            />
          </form>
        )}
        {renderTree(fileTree)}
      </div>
    </div>
  );
};
