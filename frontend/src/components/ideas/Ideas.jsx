import React, { useState } from 'react';
import { Lightbulb, Plus, Search, Tag, Sparkles, AlertCircle } from 'lucide-react';

export const Ideas = () => {
  const [ideas, setIdeas] = useState([
    { _id: '1', title: 'Productivity Gamification Engine', content: 'Design a MERN-based productivity stack with leveling systems, XP milestones, and badging models modeled on core RPG features.', category: 'Startup', tags: ['ideas', 'coding'], date: 'May 23, 2026' },
    { _id: '2', title: 'Local DB Storage Failovers', content: 'Create lightweight file-based local db connectors imitating MongoDB ODM schemas, allowing users to run servers completely without setups.', category: 'Dev', tags: ['architecture'], date: 'May 23, 2026' }
  ]);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white font-sans tracking-tight">Ideas Dump</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm font-medium">Quickly capture, search, filter, and organize raw creative thoughts and startup notes.</p>
        </div>
        <button className="glass-btn-primary flex items-center gap-1.5 text-xs font-bold shrink-0 shadow-md shadow-blue-500/20">
          <Plus size={14} />
          <span>New Note</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Ideas Notes Cards Grid (Col span 2) */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Search filter bar */}
          <div className="relative">
            <Search size={18} className="absolute left-4 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search ideas, tag filters, categories..."
              className="glass-input pl-11 py-3 text-xs placeholder:text-slate-400"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ideas.map((idea) => (
              <div key={idea._id} className="glass-card flex flex-col justify-between hover:scale-[1.01] transition-transform duration-200 cursor-pointer">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2 py-0.5 text-[9px] font-extrabold bg-blue-500/10 text-blue-500 rounded uppercase tracking-wider">
                      {idea.category}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">{idea.date}</span>
                  </div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 text-base leading-tight mb-2">
                    {idea.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium line-clamp-3">
                    {idea.content}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 mt-4 pt-3 border-t border-slate-200/50 dark:border-brand-800/40">
                  <Tag size={10} className="text-slate-400 shrink-0" />
                  {idea.tags.map((t, i) => (
                    <span key={i} className="text-[9px] text-slate-400 font-bold uppercase">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Right Column: AI Auto Categorizer Widget */}
        <div className="space-y-6">
          <div className="glass-card bg-gradient-to-br from-blue-600/5 to-indigo-600/5 border border-blue-500/10">
            <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold text-sm mb-3">
              <Sparkles size={16} className="text-blue-500 animate-pulse" />
              <span>AI Auto Tagging</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed font-medium">
              We automatically index and categorize notes. Tag ideas with hashtags like `#draft` or `#critical` to auto-arrange notes inside settings folders.
            </p>
          </div>

          <div className="glass-card">
            <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold text-sm mb-3">
              <AlertCircle size={16} className="text-amber-500 shrink-0" />
              <span>Markdown Support</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed font-medium">
              Write ideas with full Markdown structure. Type `# Title` to add header nodes or standard list components.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
export default Ideas;
