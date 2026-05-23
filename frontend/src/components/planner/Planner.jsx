import React from 'react';
import { Calendar, CheckSquare, Sparkles, AlertCircle } from 'lucide-react';

export const Planner = () => {
  const scheduleDays = [
    { name: 'Monday', focus: 'Draft backend models and database failovers', priority: 'High' },
    { name: 'Tuesday', focus: 'Establish AuthContext API pipelines', priority: 'Medium' },
    { name: 'Wednesday', focus: 'Build dashboard widgets and graph visualizations', priority: 'High' },
    { name: 'Thursday', focus: 'Polish 60 Days Tracker grids', priority: 'Low' },
    { name: 'Friday', focus: 'Implement voice ideas dump notes', priority: 'Medium' },
    { name: 'Saturday', focus: 'Verify local fallback engines', priority: 'Low' },
    { name: 'Sunday', focus: 'Recharge & Plan weekly schedule', priority: 'None' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white font-sans tracking-tight">Weekly Planner</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm font-medium">Map out your weekly focus goals, structure priority tasks, and optimize schedules.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Weekly Schedule List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Calendar size={18} className="text-blue-500" />
                <span>Weekly Schedule</span>
              </h3>
              <span className="px-2.5 py-1 text-[10px] font-bold bg-blue-500/10 text-blue-500 rounded-lg">Active Week</span>
            </div>

            <div className="space-y-3">
              {scheduleDays.map((day, i) => (
                <div key={i} className="p-4 rounded-xl bg-slate-50 dark:bg-brand-800/40 border border-slate-150 dark:border-brand-700/20 flex items-start justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">{day.name}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{day.focus || 'Rest and recharge'}</p>
                  </div>
                  {day.priority !== 'None' && (
                    <span className={`px-2 py-0.5 text-[9px] font-extrabold rounded uppercase tracking-wider ${
                      day.priority === 'High' 
                        ? 'bg-rose-500/10 text-rose-500' 
                        : day.priority === 'Medium' 
                        ? 'bg-orange-500/10 text-orange-500' 
                        : 'bg-blue-500/10 text-blue-500'
                    }`}>
                      {day.priority} Priority
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Workload AI Diagnostic */}
        <div className="space-y-6">
          <div className="glass-card bg-gradient-to-br from-indigo-600/5 to-blue-600/5 border border-indigo-500/10">
            <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold text-sm mb-3">
              <Sparkles size={16} className="text-indigo-500 animate-pulse" />
              <span>AI Weekly Assistant</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed font-medium">
              We noticed task load peaks on Wednesday. To avoid burnout, try distributing micro-tasks to Thursday afternoon, and scheduling 10-minute stretching breaks.
            </p>
          </div>

          <div className="glass-card">
            <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold text-sm mb-3">
              <AlertCircle size={16} className="text-amber-500 shrink-0" />
              <span>Planner Integration</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed font-medium">
              Keep your weekly priority notes in focus. Complete tasks directly from your dashboard to earn Level XP!
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
export default Planner;
