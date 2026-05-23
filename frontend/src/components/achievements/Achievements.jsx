import React, { useState, useEffect } from 'react';
import { useAuth } from '../../store/AuthContext';
import { 
  Award, 
  Flame, 
  CheckCircle, 
  Crown, 
  Sparkles,
  Zap,
  TrendingUp,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const Achievements = () => {
  const { apiFetch, user, updateProfile } = useAuth();
  
  // Achievements list states
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');

  // Stats calculation
  const [unlockedCount, setUnlockedCount] = useState(0);
  const [totalXpReward, setTotalXpReward] = useState(0);

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/achievements');
      setAchievements(data);
      calculateStats(data);
    } catch (err) {
      console.error('Error fetching achievements:', err);
      setError('Unable to fetch milestones. Operating in sandbox.');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (list) => {
    if (!list) return;
    const unlocked = list.filter(a => a.unlocked);
    setUnlockedCount(unlocked.length);
    
    const xpRewardSum = list.reduce((sum, a) => sum + (a.unlocked ? a.xpReward : 0), 0);
    setTotalXpReward(xpRewardSum);
  };

  // Run manually check milestones
  const handleCheckMilestones = async () => {
    setChecking(true);
    try {
      const response = await apiFetch('/achievements/check', { method: 'POST' });
      
      if (response.unlocked && response.unlocked.length > 0) {
        // Confetti explosion!
        triggerConfettiExplosion();
        
        // Notify
        const unlockedTitles = response.unlocked.map(a => a.title).join(', ');
        alert(`🏆 Achievement Unlocked: ${unlockedTitles}! Gained +${response.xpGained} XP!`);
        
        if (response.leveledUp) {
          alert(`⚡ LEVEL UP! You reached Level ${response.newLevel}!`);
        }

        // Refresh lists
        await fetchAchievements();
      } else {
        alert('ℹ️ backlogs checked! No new milestones unlocked today. Keep completing tasks!');
      }
    } catch (err) {
      console.error('Check milestones failed:', err);
    } finally {
      setChecking(false);
    }
  };

  const triggerConfettiExplosion = () => {
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  // Maps Lucide Icons dynamically based on saved strings
  const getBadgeIcon = (iconName) => {
    switch (iconName) {
      case 'CheckCircle': return CheckCircle;
      case 'Flame': return Flame;
      case 'Award': return Award;
      case 'Crown': return Crown;
      default: return Award;
    }
  };

  // XP level formulas helper
  const currentXp = user?.xp || 0;
  const currentLevel = user?.level || 1;
  
  // Level threshold: 500 XP per level
  const baseLevelXp = (currentLevel - 1) * 500;
  const levelProgressXp = currentXp - baseLevelXp;
  const progressPercent = Math.min(Math.round((levelProgressXp / 500) * 100), 100);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header and Manual Check trigger */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white font-sans tracking-tight">
            Achievements & Milestones
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm font-medium">
            Tackle routine tasks, earn Level XP metrics, and unlock gamified badge cupboards.
          </p>
        </div>

        <button
          onClick={handleCheckMilestones}
          disabled={checking}
          className="glass-btn-primary px-4 py-2.5 text-xs flex items-center gap-1.5 font-bold shrink-0 shadow-md shadow-blue-500/20"
        >
          <RotateCcw size={14} className={checking ? 'animate-spin' : ''} />
          <span>{checking ? 'Checking tasks...' : 'Check Achievements'}</span>
        </button>
      </div>

      {/* Grid: Level XP progress bar and basic statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: XP bar and Milestones grid (Col span 2) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Level Progress Visualizer */}
          <div className="glass-card bg-gradient-to-r from-blue-600/5 to-indigo-600/5 border border-blue-500/15 p-6 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 bg-blue-500/10 rounded-bl-3xl text-blue-500">
              <Sparkles size={18} className="animate-pulse" />
            </div>

            <div className="flex items-center gap-4 justify-between mb-4">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Developer Level</span>
                <h3 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 font-sans tracking-tight">
                  Level {currentLevel} <span className="text-xs font-semibold text-slate-400">({currentXp} total XP)</span>
                </h3>
              </div>
              <span className="px-2.5 py-1 text-[10px] font-bold bg-blue-500/10 text-blue-500 rounded-lg uppercase">
                {levelProgressXp} / 500 XP to Lvl {currentLevel + 1}
              </span>
            </div>

            {/* Glowing bar */}
            <div className="w-full h-3 bg-slate-200 dark:bg-brand-800/80 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 shadow shadow-blue-500/50 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="text-right text-[10px] text-slate-400 mt-2 font-medium">
              {progressPercent}% Complete
            </div>
          </div>

          {/* Badge grid */}
          <div className="glass-card">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
              <ShieldCheck size={18} className="text-blue-500" />
              <span>Milestone Badge Cupboard</span>
            </h3>

            {loading ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                Syncing badges...
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {achievements.map((ach) => {
                  const IconComponent = getBadgeIcon(ach.icon);
                  return (
                    <div
                      key={ach._id}
                      className={`
                        p-5 rounded-2xl border flex items-start gap-4 transition-all duration-200 hover:scale-[1.01]
                        ${ach.unlocked 
                          ? 'bg-gradient-to-br from-blue-600/5 to-indigo-600/5 border-blue-500/20 shadow-md shadow-blue-500/5' 
                          : 'bg-slate-100/50 dark:bg-brand-850/20 border-slate-200/50 dark:border-brand-800/40 opacity-70'}
                      `}
                    >
                      <div className={`p-3 rounded-2xl shrink-0 ${
                        ach.unlocked 
                          ? 'bg-blue-600/10 text-blue-600 dark:text-blue-400 shadow-inner' 
                          : 'bg-slate-200 dark:bg-brand-800 text-slate-400'
                      }`}>
                        <IconComponent size={24} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">
                          {ach.title}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-normal font-medium">
                          {ach.description}
                        </p>
                        <div className="flex items-center gap-2 mt-3.5">
                          <span className="px-2 py-0.5 text-[9px] font-extrabold bg-blue-500/10 text-blue-500 rounded">
                            +{ach.xpReward} XP Reward
                          </span>
                          {ach.unlocked && (
                            <span className="text-[9px] text-emerald-500 font-extrabold uppercase tracking-wide flex items-center gap-0.5">
                              <Zap size={9} />
                              <span>Unlocked</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Statistics */}
        <div className="space-y-6">
          <div className="glass-card flex flex-col justify-between min-h-[140px] relative overflow-hidden">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Accumulated Badges</span>
              <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 mt-1 block">
                {unlockedCount} <span className="text-xs font-semibold text-slate-400">/ {achievements.length} unlocked</span>
              </span>
              <span className="text-[10px] text-slate-400 mt-1 block font-medium">milestone completions total</span>
            </div>
            <div className="p-3.5 bg-yellow-500/10 rounded-2xl text-yellow-500 absolute top-4 right-4">
              <Crown size={22} className="animate-pulse" />
            </div>
          </div>

          <div className="glass-card flex flex-col justify-between min-h-[140px] relative overflow-hidden">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">XP Gained from Badges</span>
              <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 mt-1 block">
                {totalXpReward} <span className="text-xs font-semibold text-slate-400">XP</span>
              </span>
              <span className="text-[10px] text-slate-400 mt-1 block font-medium">all-time bonus reward</span>
            </div>
            <div className="p-3.5 bg-emerald-500/10 rounded-2xl text-emerald-500 absolute top-4 right-4">
              <TrendingUp size={22} />
            </div>
          </div>

          <div className="glass-card bg-gradient-to-br from-blue-600/5 to-indigo-600/5 border border-blue-500/10">
            <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-2">milestone leveling guidelines</h4>
            <p className="text-slate-500 dark:text-slate-450 text-[11px] leading-relaxed font-medium">
              Check off active backlogs! Completing daily tasks, checking off productive cycle slots, adding markdown notes, and maintaining streaks yield achievement progress automatically.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
export default Achievements;
