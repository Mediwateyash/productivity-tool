import React from 'react';
import { CheckSquare, Flame, Plus, Play, Sparkles } from 'lucide-react';

export const Tasks = () => {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white font-sans tracking-tight">Smart Daily Task Log</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm font-medium">Add, schedule, edit, and tackle your daily priorities using Pomodoro integration.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Tasks Board */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 dark:text-slate-100">Today's Backlog</h3>
              <span className="px-2.5 py-1 text-[10px] font-bold bg-blue-500/10 text-blue-500 rounded-lg">Tasks Active</span>
            </div>
            
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-brand-800/40 border border-slate-150 dark:border-brand-700/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded border border-slate-300 dark:border-brand-600 flex items-center justify-center shrink-0 cursor-pointer" />
                  <div>
                    <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200">Explore DY Productivity Dashboard 🚀</h4>
                    <span className="text-[10px] text-slate-400 font-medium">Category: General • Priority: High</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 text-[10px] font-bold bg-slate-200/50 dark:bg-brand-800 text-slate-600 dark:text-slate-300 rounded-lg">#onboarding</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-brand-800/40 border border-slate-150 dark:border-brand-700/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded border border-slate-300 dark:border-brand-600 flex items-center justify-center shrink-0 cursor-pointer" />
                  <div>
                    <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200">Try custom Pomodoro focus timer ⏱️</h4>
                    <span className="text-[10px] text-slate-400 font-medium">Category: Study • Priority: Medium</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 text-[10px] font-bold bg-slate-200/50 dark:bg-brand-800 text-slate-600 dark:text-slate-300 rounded-lg">#focus</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Pomodoro Widget & NLP Parser */}
        <div className="space-y-6">
          <div className="glass-card flex flex-col items-center justify-center py-8 relative overflow-hidden">
            <Flame size={32} className="text-orange-500 animate-pulse mb-3" />
            <h3 className="font-extrabold text-2xl text-slate-800 dark:text-slate-100 font-sans tracking-tight">25:00</h3>
            <p className="text-[11px] text-slate-400 uppercase tracking-wider font-bold mt-1">Focus Block Time</p>
            <button className="mt-4 glass-btn-primary py-2.5 px-6 text-xs flex items-center gap-1.5 font-bold shadow-md shadow-blue-500/20">
              <Play size={12} fill="currentColor" />
              <span>Start Session</span>
            </button>
          </div>

          <div className="glass-card">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={16} className="text-blue-500" />
              <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">NLP Task Suggestions</h4>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed font-medium">
              Start typing any shortcut in natural language (e.g. *"Read book tomorrow urgent"*) and our AI will schedule it for you.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
export default Tasks;
