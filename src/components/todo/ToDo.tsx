import React, { useState } from 'react';
import { Plus, Trash2, CheckCircle, Circle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface Task {
  id: string;
  text: string;
  completed: boolean;
}

export function ToDo() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [input, setInput] = useState('');

  const completedTasks = tasks.filter(t => t.completed);
  const progress = tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0;

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setTasks([...tasks, { id: crypto.randomUUID(), text: input, completed: false }]);
    setInput('');
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const clearCompleted = () => {
    setTasks(tasks.filter(t => !t.completed));
  };

  return (
    <div className="p-6 bg-app-bg h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-semibold text-neutral-400 tracking-wider uppercase">Project Tasks</h2>
        <div className="text-xs text-neutral-600 font-mono">
           {completedTasks.length} / {tasks.length} completed
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="h-1 w-full bg-border-dark rounded-full mb-6 overflow-hidden">
        <motion.div 
           className="h-full bg-emerald-500"
           initial={{ width: 0 }}
           animate={{ width: `${progress}%` }}
           transition={{ duration: 0.3 }}
        />
      </div>

      <form onSubmit={addTask} className="flex gap-2 mb-6">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="New task..."
          className="flex-1 bg-surface border border-border-dark rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
        />
        <button type="submit" className="px-4 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg flex items-center gap-2 transition-colors">
          <Plus className="w-4 h-4" />
          <span className="text-xs font-medium uppercase">Add</span>
        </button>
      </form>

      <div className="flex-1 overflow-y-auto space-y-px">
        <AnimatePresence>
          {tasks.map(task => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={cn(
                "group flex items-center gap-3 p-3 border-b border-border-dark/50 hover:bg-surface-hover transition-colors",
                task.completed ? "opacity-60" : ""
              )}
            >
              <button 
                onClick={() => toggleTask(task.id)} 
                className="text-neutral-500 hover:text-emerald-400 transition-colors"
              >
                {task.completed ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Circle className="w-4 h-4" />}
              </button>
              <span className={cn("flex-1 text-sm font-mono tracking-tight", task.completed ? "line-through text-neutral-600" : "text-neutral-200")}>
                {task.text}
              </span>
              <button 
                onClick={() => deleteTask(task.id)} 
                className="text-neutral-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {tasks.length > 0 && (
          <button 
            onClick={clearCompleted}
            className="w-full py-3 text-xs text-neutral-600 hover:text-neutral-400 font-mono transition-colors"
          >
            Clear completed tasks
          </button>
         )}

        {tasks.length === 0 && (
          <div className="text-center py-10 text-neutral-600 font-mono text-xs">
            No tasks found.
          </div>
        )}
      </div>
    </div>
  );
}
