import React from 'react';
import { Award, Flame, CheckCircle, Crown, ShieldAlert } from 'lucide-react';

export const Achievements = () => {
  const achievementsList = [
    { key: 'first-task', title: 'Genesis Plan', description: 'Complete your first productivity task!', icon: CheckCircle, xpReward: 100, unlocked: true, unlockedAt: 'May 23, 2026' },
    { key: 'pomodoro-pioneer', title: 'Focus Pioneer', description: 'Complete your first Pomodoro session', icon: Flame, xpReward: 150, unlocked: false, unlockedAt: null },
    { key: 'ideas-dump', title: 'Mind Unleashed', description: 'Store your first 3 notes in the Ideas Dump', icon: Award, xpReward: 100, unlocked: false, unlockedAt: null },
    { key: 'streak-7', title: 'Productivity Titan', description: 'Maintain a 7-day streak', icon: Crown, xpReward: 500, unlocked: false, unlockedAt: null },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white font-sans tracking-tight">Achievements & Milestones</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm font-medium">Claim reward XP badges, unlock gamified badges, and level up your developer metrics!</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Milestones Card Grid (Col span 2) */}
        <div className="lg:col-span-2 glass-card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800 dark:text-slate-100">Reward Badges</h3>
            <span className="px-2.5 py-1 text-[10px] font-bold bg-blue-500/10 text-blue-500 rounded-lg">Milestones Active</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {achievementsList.map((ach) => {
              const Icon = ach.icon;
              return (
                <div 
                  key={ach.key}
                  className={`
                    p-5 rounded-2xl border flex items-start gap-4 transition-all duration-200
                    ${ach.unlocked 
                      ? 'bg-gradient-to-br from-blue-600/5 to-indigo-600/5 border-blue-500/20' 
                      : 'bg-slate-50/50 dark:bg-brand-800/10 border-slate-200/50 dark:border-brand-800/40 opacity-70'}
                  `}
                >
                  <div className={`p-3 rounded-xl shrink-0 ${
                    ach.unlocked ? 'bg-blue-500/10 text-blue-500' : 'bg-slate-200 dark:bg-brand-850 text-slate-400'
                  }`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-205">{ach.title}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-normal font-medium">{ach.description}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <span className="px-1.5 py-0.5 text-[9px] font-extrabold bg-blue-500/10 text-blue-500 rounded">
                        +{ach.xpReward} XP
                      </span>
                      {ach.unlocked && (
                        <span className="text-[9px] text-slate-400 font-semibold">
                          Unlocked {ach.unlockedAt}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Level Progress Indicator */}
        <div className="space-y-6">
          <div className="glass-card">
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-3">Leveling Strategy</h4>
            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed font-medium">
              Every 500 XP awards a full user level! Boost your rank to level up focus indicators, unlock theme configurations, and custom avatar sets.
            </p>
          </div>

          <div className="glass-card">
            <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold text-sm mb-3">
              <ShieldAlert size={16} className="text-blue-500 shrink-0" />
              <span>Badge Cupboards</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed font-medium">
              Complete tasks and maintain daily streaks to automatically claim achievements. Unlocking newly found items triggers confetti canvas celebration particles!
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
export default Achievements;
