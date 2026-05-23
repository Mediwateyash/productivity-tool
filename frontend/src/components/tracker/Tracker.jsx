import React, { useState, useEffect } from 'react';
import { useAuth } from '../../store/AuthContext';
import { useToast } from '../../store/ToastContext';
import { TrackerSkeleton } from '../ui/Skeleton';
import { 
  CalendarDays, 
  Flame, 
  CheckCircle2, 
  XCircle, 
  TrendingUp, 
  Sparkles,
  Zap,
  HelpCircle,
  Award,
  Check
} from 'lucide-react';

const getLocalDateString = (date = new Date()) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const Tracker = () => {
  const { apiFetch, user, updateProfile } = useAuth();
  const { showToast } = useToast();
  
  // Logs state
  const [logs, setLogs] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  
  // Heatmap helper stats
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [successRate, setSuccessRate] = useState(0);
  
  // Logging form states for clicking dates
  const [selectedDayObj, setSelectedDayObj] = useState(null);
  const [logScore, setLogScore] = useState(80);
  const [logNote, setLogNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Custom onboarding states
  const [customStartDate, setCustomStartDate] = useState(getLocalDateString());
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/logs');
      setLogs(data);
      
      const analData = await apiFetch('/analytics');
      setAnalytics(analData);

      try {
        const tasksData = await apiFetch('/tasks');
        setTasks(tasksData || []);
      } catch (err) {
        console.error('Error fetching tasks for tracker:', err);
      }

      calculateMetrics(data);
    } catch (err) {
      console.error('Error fetching tracker logs:', err);
      showToast('Offline fallback: seeding daily grids.', 'info');
    } finally {
      setLoading(false);
    }
  };

  // Generate date strings for a 60-day cycle starting from a custom start date!
  const generateCycleDates = (startDateStr) => {
    if (!startDateStr) return [];
    const dates = [];
    const start = new Date(startDateStr);
    for (let i = 0; i < 60; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      dates.push({
        index: i + 1,
        dateStr,
        label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        dayOfWeek: d.toLocaleDateString('en-US', { weekday: 'short' })
      });
    }
    return dates;
  };

  // Helper to extract completion date in YYYY-MM-DD format
  const getCompletionDateStr = (item) => {
    if (!item.completed) return null;
    const date = item.completedAt || item.updatedAt || item.createdAt;
    if (!date) return null;
    return getLocalDateString(new Date(date));
  };

  // Helper to dynamically calculate custom tooltip position based on grid placement
  const getTooltipPositionClass = (dayIndex) => {
    const colIndex10 = (dayIndex - 1) % 10;
    const vertical = dayIndex <= 20 ? 'top-full mt-3' : 'bottom-full mb-3';
    let horizontal = 'left-1/2 -translate-x-1/2';
    
    if (colIndex10 < 2) {
      horizontal = 'left-0';
    } else if (colIndex10 > 7) {
      horizontal = 'right-0';
    }
    
    return `${vertical} ${horizontal}`;
  };

  const cycleDates = generateCycleDates(user?.streakStartDate);

  // Metrics calculator
  const calculateMetrics = (logList) => {
    if (!logList || logList.length === 0) {
      setCurrentStreak(0);
      setLongestStreak(0);
      setSuccessRate(0);
      return;
    }

    const sorted = [...logList].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    let longest = 0;
    let current = 0;
    let activeRun = 0;

    sorted.forEach((log) => {
      if (log.status === 'productive') {
        activeRun++;
        if (activeRun > longest) {
          longest = activeRun;
        }
      } else {
        activeRun = 0;
      }
    });

    const todayStr = getLocalDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getLocalDateString(yesterday);

    const todayLog = sorted.find(l => l.date === todayStr);
    const yesterdayLog = sorted.find(l => l.date === yesterdayStr);

    if (todayLog && todayLog.status === 'productive') {
      let run = 0;
      let checkDate = new Date();
      while (true) {
        const checkStr = getLocalDateString(checkDate);
        const match = sorted.find(l => l.date === checkStr);
        if (match && match.status === 'productive') {
          run++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
      current = run;
    } else if (yesterdayLog && yesterdayLog.status === 'productive') {
      let run = 0;
      let checkDate = new Date();
      checkDate.setDate(checkDate.getDate() - 1);
      while (true) {
        const checkStr = getLocalDateString(checkDate);
        const match = sorted.find(l => l.date === checkStr);
        if (match && match.status === 'productive') {
          run++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
      current = run;
    } else {
      current = 0;
    }

    setCurrentStreak(current);
    setLongestStreak(longest || current);

    const productiveCount = logList.filter(l => l.status === 'productive').length;
    setSuccessRate(Math.round((productiveCount / logList.length) * 100));

    if (user && user.streak !== current) {
      updateProfile({ streak: current });
    }
  };

  const handleDateClick = (dayObj) => {
    const todayStr = getLocalDateString();
    const isFuture = new Date(dayObj.dateStr) > new Date(todayStr);
    
    if (isFuture) {
      showToast("🔒 Cannot log progress for future dates. Stay focused on today!", "warning");
      return;
    }

    const existing = logs.find(l => l.date === dayObj.dateStr);
    setSelectedDayObj({
      ...dayObj,
      existingLog: existing || null
    });
    
    if (existing) {
      setLogScore(existing.score || 80);
      setLogNote(existing.note || '');
    } else {
      setLogScore(80);
      setLogNote('');
    }
  };

  const handleSaveLog = async (status) => {
    if (!selectedDayObj) return;

    setSubmitting(true);
    try {
      const response = await apiFetch('/logs', {
        method: 'POST',
        body: JSON.stringify({
          date: selectedDayObj.dateStr,
          status,
          score: logScore,
          note: logNote.trim()
        })
      });

      let updatedLogs;
      const matchIndex = logs.findIndex(l => l.date === selectedDayObj.dateStr);
      if (matchIndex !== -1) {
        updatedLogs = logs.map(l => l.date === selectedDayObj.dateStr ? response : l);
      } else {
        updatedLogs = [response, ...logs];
      }

      setLogs(updatedLogs);
      calculateMetrics(updatedLogs);
      
      const newAnal = await apiFetch('/analytics');
      setAnalytics(newAnal);

      setSelectedDayObj(null);
      showToast('Daily log updated successfully!', 'success');
      
      // Auto achievements update
      await apiFetch('/achievements/check', { method: 'POST' });
    } catch (err) {
      console.error('Error logging daily progress:', err);
      showToast('Failed to save progress log.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartChallenge = async (e) => {
    e.preventDefault();
    setStarting(true);
    try {
      await updateProfile({ streakStartDate: customStartDate });
      showToast('⚡ 60-Day Productivity Challenge started! Procrastination ends now.', 'success');
      
      // Auto achievements update
      await apiFetch('/achievements/check', { method: 'POST' });
    } catch (err) {
      console.error(err);
      showToast('Failed to start streak challenge.', 'error');
    } finally {
      setStarting(false);
    }
  };

  const handleResetChallenge = async () => {
    if (!window.confirm("⚠️ Are you sure you want to restart your 60-day challenge? This will clear your current start date and let you generate a new grid.")) return;
    
    try {
      await updateProfile({ streakStartDate: null });
      setSelectedDayObj(null);
      showToast('Streak challenge reset. You can now establish a new start date.', 'info');
    } catch (err) {
      showToast('Failed to reset challenge.', 'error');
    }
  };

  if (loading) {
    return <TrackerSkeleton />;
  }

  // Onboarding Phase: Show start date configuration panel if no start date exists
  if (!user?.streakStartDate) {
    return (
      <div className="space-y-8 animate-fadeIn max-w-2xl mx-auto py-10">
        {/* Onboarding Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-blue-600/10 text-blue-500 rounded-3xl flex items-center justify-center mx-auto shadow-md">
            <Flame size={32} className="animate-pulse" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white font-sans tracking-tight">
            60-Day Productivity Challenge
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto font-medium">
            Lock in consistency, establish daily momentum, and watch your unbroken focus habits level up.
          </p>
        </div>

        {/* Setup Card */}
        <div className="glass-card p-8 border border-blue-500/20 shadow-xl shadow-blue-500/5 relative overflow-hidden rounded-3xl">
          <div className="absolute top-0 right-0 p-6 text-blue-500/5">
            <CalendarDays size={120} />
          </div>

          <form onSubmit={handleStartChallenge} className="space-y-6 relative z-10">
            <div>
              <span className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-widest block mb-2 font-mono">
                CHALLENGE ONBOARDING
              </span>
              <h3 className="text-xl font-extrabold text-slate-800 dark:text-white font-sans">
                Set Your Challenge Start Date
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed font-medium">
                Choose the day your 60-day streak map will begin. You can customize this to start with today, or select a customized date if you want to align it with a specific milestone.
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Productivity Start Date
              </label>
              <input
                type="date"
                required
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="glass-input text-sm max-w-sm"
              />
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600/5 to-indigo-600/5 border border-blue-500/10 space-y-3">
              <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={14} className="text-blue-500" />
                <span>What Happens Next?</span>
              </h4>
              <ul className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed space-y-1.5 font-medium list-disc pl-4">
                <li>A customizable 60-day interactive grid map will generate starting exactly from your chosen date.</li>
                <li>You can click on any day block to log whether you were **Productive** or **Missed** your daily routine targets.</li>
                <li>Logging productive ticks instantly builds streaks and increases your global consistency percentage!</li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={starting}
              className="w-full glass-btn-primary py-3 text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-1.5 rounded-2xl shadow-lg shadow-blue-500/10 active:scale-98 transition-all"
            >
              <Zap size={14} fill="currentColor" />
              <span>{starting ? 'Starting challenge...' : "Let's Get Started!"}</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white font-sans tracking-tight">
          60 Days Productivity Tracker
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm font-medium">
          Tick off productive days, log daily focus scores, and watch your unbroken streak level up.
        </p>
      </div>

      {/* Grid: Stats Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Metric 1: Current Streak */}
        <div className="glass-card flex items-center justify-between p-5 relative overflow-hidden">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Current Streak</span>
            <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 mt-1 block font-mono">
              {currentStreak} <span className="text-xs font-semibold text-slate-400 uppercase">Days</span>
            </span>
            <span className="text-[10px] text-slate-400 mt-1 block font-medium">Auto-synced profile metric</span>
          </div>
          <div className="p-3.5 bg-orange-500/10 rounded-2xl text-orange-500 animate-pulse">
            <Flame size={26} />
          </div>
        </div>

        {/* Metric 2: Longest Streak */}
        <div className="glass-card flex items-center justify-between p-5 relative overflow-hidden">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Longest Streak</span>
            <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 mt-1 block font-mono">
              {longestStreak} <span className="text-xs font-semibold text-slate-400 uppercase">Days</span>
            </span>
            <span className="text-[10px] text-slate-400 mt-1 block font-medium">All-time record</span>
          </div>
          <div className="p-3.5 bg-yellow-500/10 rounded-2xl text-yellow-500">
            <Award size={26} />
          </div>
        </div>

        {/* Metric 3: Success Percentage */}
        <div className="glass-card flex items-center justify-between p-5 relative overflow-hidden">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Consistency Rate</span>
            <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 mt-1 block font-mono">
              {logs.length > 0 ? `${successRate}%` : '0%'}
            </span>
            <span className="text-[10px] text-slate-400 mt-1 block font-medium">{logs.length} days logged</span>
          </div>
          <div className="p-3.5 bg-emerald-500/10 rounded-2xl text-emerald-500">
            <TrendingUp size={26} />
          </div>
        </div>

      </div>

      {/* Heatmap & Dynamic Modals Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Heatmap grid block (Col span 2) */}
        <div className="lg:col-span-2 glass-card animate-fadeIn">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <CalendarDays size={18} className="text-blue-500" />
              <span>Streak Heatmap Grid</span>
            </h3>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 text-[10px] font-bold bg-blue-500/10 text-blue-500 rounded-lg uppercase tracking-wider font-mono">
                Day 1 Start: {user?.streakStartDate}
              </span>
              <button 
                onClick={handleResetChallenge}
                className="px-2.5 py-1 text-[9px] font-extrabold bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg uppercase tracking-wider transition-colors active:scale-95 border border-red-500/20"
                title="Restart 60-day challenge date"
              >
                Reset Date
              </button>
            </div>
          </div>

          {/* Grid display */}
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-3">
            {cycleDates.map((day) => {
              const match = logs.find(l => l.date === day.dateStr);
              const todayStr = getLocalDateString();
              const isFuture = new Date(day.dateStr) > new Date(todayStr);
              const isToday = day.dateStr === todayStr;

              // Filter tasks and checklist items completed on this day
              const dayTasksAndChecklists = tasks.filter(task => {
                const taskCompletedToday = getCompletionDateStr(task) === day.dateStr;
                const hasSubtaskCompletedToday = task.subtasks && task.subtasks.some(st => getCompletionDateStr(st) === day.dateStr);
                return taskCompletedToday || hasSubtaskCompletedToday;
              }).map(task => {
                const taskCompletedToday = getCompletionDateStr(task) === day.dateStr;
                return {
                  ...task,
                  taskCompletedToday,
                };
              });

              return (
                <div
                  key={day.index}
                  onClick={() => handleDateClick(day)}
                  className={`
                    relative group aspect-square rounded-2xl flex flex-col justify-between p-2 transition-all duration-155 border
                    ${isFuture
                      ? 'bg-slate-100/20 dark:bg-brand-900/10 border-slate-200/20 dark:border-brand-900/30 text-slate-450/40 dark:text-slate-600/40 opacity-40 cursor-not-allowed'
                      : 'cursor-pointer hover:scale-105 active:scale-95'
                    }
                    ${!isFuture && match 
                      ? match.status === 'productive'
                        ? 'bg-gradient-to-br from-emerald-500/25 to-emerald-500/10 border-emerald-500/30 text-emerald-500 dark:text-emerald-400 shadow-sm shadow-emerald-500/5'
                        : 'bg-gradient-to-br from-rose-500/25 to-rose-500/10 border-rose-500/30 text-rose-500 dark:text-rose-400'
                      : !isFuture && 'bg-slate-100/50 hover:bg-slate-200/50 dark:bg-brand-850/40 dark:hover:bg-brand-800/70 border-slate-200/50 dark:border-brand-800/50 text-slate-400 dark:text-slate-500'
                    }
                    ${isToday && !match ? 'ring-2 ring-blue-500/40 border-blue-500 dark:border-blue-400 shadow shadow-blue-500/10' : ''}
                  `}
                >
                  <div className="text-[9px] font-extrabold uppercase text-right leading-none select-none">
                    {day.dayOfWeek}
                  </div>
                  <div className="text-[15px] font-extrabold font-sans tracking-tight leading-none select-none">
                    {day.index}
                  </div>
                  <div className="text-[9px] font-bold truncate leading-none mt-1 select-none">
                    {day.label}
                  </div>

                  {/* Gorgeous Premium Tooltip */}
                  {!isFuture && (
                    <div className={`absolute ${getTooltipPositionClass(day.index)} hidden group-hover:block w-72 bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md border border-slate-700/50 dark:border-brand-800/80 rounded-2xl p-4 text-left shadow-2xl z-50 text-white animate-fadeIn pointer-events-none`}>
                      {/* Day Header */}
                      <div className="flex justify-between items-center pb-2 border-b border-slate-800/80 mb-2">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400">Day {day.index} History</span>
                          <h5 className="text-xs font-bold text-white mt-0.5">{day.label} ({day.dayOfWeek})</h5>
                        </div>
                        {match ? (
                          <span className={`px-2 py-0.5 text-[9px] font-extrabold uppercase rounded-lg ${
                            match.status === 'productive'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}>
                            {match.status}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[9px] font-bold bg-slate-800 text-slate-400 rounded-lg">
                            No log
                          </span>
                        )}
                      </div>

                      {/* Score and Note summary if logged */}
                      {match && (
                        <div className="mb-2 bg-slate-800/40 border border-slate-850 rounded-xl p-2 text-[10px] space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-450 font-semibold">Focus Score:</span>
                            <span className="text-blue-400 font-bold">{match.score}%</span>
                          </div>
                          {match.note && (
                            <div className="text-slate-300 font-medium line-clamp-2 italic">
                              "{match.note}"
                            </div>
                          )}
                        </div>
                      )}

                      {/* Tasks History list */}
                      <div className="space-y-1.5">
                        <div className="text-[9px] font-bold text-slate-450 uppercase tracking-wider">
                          Productivity History:
                        </div>
                        {dayTasksAndChecklists.length === 0 ? (
                          <div className="text-[10px] text-slate-500 py-1.5 italic">
                            No tasks or subtasks completed.
                          </div>
                        ) : (
                          <div className="max-h-36 overflow-y-auto space-y-2 pr-1 pointer-events-auto">
                            {dayTasksAndChecklists.map((t, tIdx) => (
                              <div key={tIdx} className="text-[11px] space-y-1 bg-slate-800/40 p-2 rounded-xl border border-slate-800/50">
                                {/* Task Item */}
                                <div className="flex items-center gap-1.5 min-w-0">
                                  {t.taskCompletedToday ? (
                                    <div className="w-3.5 h-3.5 bg-emerald-500 text-slate-950 rounded flex items-center justify-center shrink-0">
                                      <Check size={10} strokeWidth={3} />
                                    </div>
                                  ) : (
                                    <div className="w-3.5 h-3.5 rounded border border-slate-700 bg-slate-800 shrink-0" />
                                  )}
                                  <span className={`font-bold truncate ${t.taskCompletedToday ? 'text-emerald-400 line-through' : 'text-slate-300'}`}>
                                    {t.title}
                                  </span>
                                </div>
                                
                                {/* Subtasks checklist items */}
                                {t.subtasks && t.subtasks.length > 0 && (
                                  <div className="pl-4.5 space-y-1 border-l border-slate-800/80 mt-1">
                                    {t.subtasks.map((st, stIdx) => {
                                      const isStCompletedToday = getCompletionDateStr(st) === day.dateStr;
                                      return (
                                        <div key={stIdx} className="flex items-center gap-1.5 min-w-0">
                                          {isStCompletedToday ? (
                                            <div className="w-3 h-3 bg-emerald-500/20 text-emerald-400 rounded flex items-center justify-center shrink-0">
                                              <Check size={8} strokeWidth={3} />
                                            </div>
                                          ) : (
                                            <div className="w-3 h-3 rounded-full border border-slate-700 bg-slate-800 shrink-0" />
                                          )}
                                          <span className={`text-[10px] truncate ${isStCompletedToday ? 'text-slate-300 line-through' : 'text-slate-500'}`}>
                                            {st.title}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-[10px] text-slate-400 mt-6 font-medium text-center flex items-center justify-center gap-1">
            <HelpCircle size={12} className="text-slate-400" />
            <span>Click any day grid block above to log status, score, or notes.</span>
          </p>
        </div>

        {/* Right Column: Dynamic Edit Form or AI Advice Card */}
        <div className="space-y-6">
          
          {/* Selected Day Log Editor */}
          {selectedDayObj ? (
            <div className="glass-card border border-blue-500/20 p-5 rounded-2xl animate-fadeIn">
              <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 mb-3 flex items-center justify-between">
                <span>Day {selectedDayObj.index} Status</span>
                <span className="text-xs font-semibold text-slate-400">{selectedDayObj.label}</span>
              </h4>
              
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Productivity Score ({logScore})</label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={logScore}
                    onChange={(e) => setLogScore(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-brand-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-[9px] font-bold text-slate-400 mt-1">
                    <span>10% Tired</span>
                    <span>100% Focused</span>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Daily Note (optional)</label>
                  <textarea
                    placeholder="E.g. Completed 4 Pomodoros, finished DB schemas..."
                    value={logNote}
                    onChange={(e) => setLogNote(e.target.value)}
                    className="glass-input text-xs py-2 h-16 resize-none"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => handleSaveLog('productive')}
                    disabled={submitting}
                    className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-1 active:scale-95 transition-all"
                  >
                    <CheckCircle2 size={13} />
                    <span>Productive</span>
                  </button>
                  
                  <button
                    onClick={() => handleSaveLog('missed')}
                    disabled={submitting}
                    className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-1 active:scale-95 transition-all"
                  >
                    <XCircle size={13} />
                    <span>Missed</span>
                  </button>
                </div>

                <button
                  onClick={() => setSelectedDayObj(null)}
                  className="w-full text-center text-[10px] font-bold text-slate-400 hover:text-slate-350 uppercase tracking-wider mt-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            /* Motivational AI card */
            <div className="glass-card bg-gradient-to-br from-blue-600/5 to-indigo-600/5 border border-blue-500/10 p-5 rounded-2xl">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-500 shrink-0">
                  <Sparkles size={18} className="animate-pulse" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-100 uppercase tracking-wider">AI Streak Advisor</h4>
                  {analytics?.aiSummary ? (
                    <p className="text-slate-600 dark:text-slate-300 text-xs mt-2 leading-relaxed font-medium">
                      {analytics.aiSummary}
                    </p>
                  ) : (
                    <p className="text-slate-500 dark:text-slate-400 text-xs mt-2 leading-relaxed font-medium">
                      No logs submitted today. Click a day on the left cycle grid and submit a productive tick to check your routine diagnostics!
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Gamification milestones tips */}
          <div className="glass-card">
            <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-150 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Zap size={14} className="text-yellow-500 shrink-0" />
              <span>Streak Power Rules</span>
            </h4>
            <p className="text-slate-500 dark:text-slate-450 text-[11px] leading-relaxed font-medium">
              Productive ticks instantly contribute to active streaks and increase consistency rate percentage. Ticking 3 and 7 continuous days automatically triggers milestone achievements!
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
export default Tracker;

