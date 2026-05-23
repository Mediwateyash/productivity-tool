import React from 'react';
import { CalendarDays, Flame, CheckCircle, HelpCircle } from 'lucide-react';

export const Tracker = () => {
  // Generate 60 days of grids
  const days = Array.from({ length: 60 }, (_, i) => {
    // Seed some mock productive days
    const isProductive = i % 5 !== 0; 
    return {
      index: i + 1,
      productive: isProductive,
      date: `Day ${i + 1}`
    };
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white font-sans tracking-tight">60 Days Streak Tracker</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm font-medium">Tick off productive days, cross off missed slots, and watch your streaks level up!</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Heatmap Grid (Col span 2) */}
        <div className="lg:col-span-2 glass-card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <CalendarDays size={18} className="text-blue-500" />
              <span>Productivity Heatmap</span>
            </h3>
            <span className="text-xs text-slate-400 font-semibold tracking-wide uppercase">60 Day Cycle</span>
          </div>

          {/* Grid mapping */}
          <div className="grid grid-cols-10 gap-3 max-w-lg mx-auto">
            {days.map((day) => (
              <div
                key={day.index}
                title={`${day.date}: ${day.productive ? 'Productive' : 'Missed'}`}
                className={`
                  h-10 rounded-xl flex items-center justify-center font-bold text-xs cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95
                  ${day.productive 
                    ? 'bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 border border-emerald-500/20 text-emerald-500 dark:text-emerald-400' 
                    : 'bg-gradient-to-br from-rose-500/20 to-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400'}
                `}
              >
                {day.index}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-6 mt-8 pt-4 border-t border-slate-200/50 dark:border-brand-800/40 text-xs">
            <div className="flex items-center gap-2 text-emerald-500">
              <div className="w-3.5 h-3.5 bg-emerald-500/20 border border-emerald-500/30 rounded" />
              <span className="font-semibold">Productive Days</span>
            </div>
            <div className="flex items-center gap-2 text-rose-500">
              <div className="w-3.5 h-3.5 bg-rose-500/20 border border-rose-500/30 rounded" />
              <span className="font-semibold">Missed Days</span>
            </div>
          </div>
        </div>

        {/* Right Column: Consistency Metrics */}
        <div className="space-y-6">
          <div className="glass-card flex items-center gap-5 justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Streak Power</span>
              <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 mt-1 block">85%</span>
              <span className="text-[10px] text-slate-400 mt-1 block font-medium">Auto streaks integrity</span>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
              <Flame size={24} className="animate-pulse" />
            </div>
          </div>

          <div className="glass-card bg-gradient-to-br from-blue-600/5 to-indigo-600/5 border border-blue-500/10">
            <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold text-sm mb-3">
              <CheckCircle size={16} className="text-blue-500 shrink-0" />
              <span>Streak Milestones</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed font-medium">
              Maintain a 7-day productive streak to unlock the **"Productivity Titan"** badge and claim a premium bonus of 500 XP reward!
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
export default Tracker;
