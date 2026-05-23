import React, { useState, useEffect } from 'react';
import { useAuth } from '../../store/AuthContext';
import { useToast } from '../../store/ToastContext';
import { PlannerSkeleton } from '../ui/Skeleton';
import { 
  Calendar, 
  Sparkles, 
  Plus, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Target,
  FileText
} from 'lucide-react';

const getLocalDateString = (date = new Date()) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const Planner = () => {
  const { apiFetch } = useAuth();
  const { showToast } = useToast();
  
  // Weekly date offset management
  const [currentWeekMonday, setCurrentWeekMonday] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  // Weekly plan model states
  const [planId, setPlanId] = useState(null);
  const [weeklyFocus, setWeeklyFocus] = useState('');
  const [priorityTasks, setPriorityTasks] = useState([]);
  const [schedule, setSchedule] = useState([
    { day: 'Monday', goals: [], focus: '' },
    { day: 'Tuesday', goals: [], focus: '' },
    { day: 'Wednesday', goals: [], focus: '' },
    { day: 'Thursday', goals: [], focus: '' },
    { day: 'Friday', goals: [], focus: '' },
    { day: 'Saturday', goals: [], focus: '' },
    { day: 'Sunday', goals: [], focus: '' },
  ]);

  // Priority Task Input and goal input states (keyed by day name)
  const [newPriorityInput, setNewPriorityInput] = useState('');
  const [goalInputs, setGoalInputs] = useState({});

  useEffect(() => {
    const mondayStr = getMondayStr(new Date());
    setCurrentWeekMonday(mondayStr);
  }, []);

  useEffect(() => {
    if (currentWeekMonday) {
      fetchWeeklyPlan();
    }
  }, [currentWeekMonday]);

  // Helper: Find Monday of a given date
  const getMondayStr = (dateObj) => {
    const day = dateObj.getDay();
    const diff = dateObj.getDate() - day + (day === 0 ? -6 : 1);
    const mon = new Date(dateObj.setDate(diff));
    return getLocalDateString(mon);
  };

  const fetchWeeklyPlan = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiFetch(`/plans?weekStartDate=${currentWeekMonday}`);
      
      setPlanId(data._id || null);
      setWeeklyFocus(data.weeklyFocus || '');
      setPriorityTasks(data.priorityTasks || []);
      
      if (data.schedule && data.schedule.length > 0) {
        setSchedule(data.schedule);
      } else {
        setSchedule([
          { day: 'Monday', goals: [], focus: '' },
          { day: 'Tuesday', goals: [], focus: '' },
          { day: 'Wednesday', goals: [], focus: '' },
          { day: 'Thursday', goals: [], focus: '' },
          { day: 'Friday', goals: [], focus: '' },
          { day: 'Saturday', goals: [], focus: '' },
          { day: 'Sunday', goals: [], focus: '' },
        ]);
      }
    } catch (err) {
      console.error('Error fetching plan:', err);
      setError('Unable to load schedule. Running offline fallback.');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePlan = async (updatedPlanData) => {
    setSaving(true);
    try {
      const payload = {
        weekStartDate: currentWeekMonday,
        weeklyFocus: updatedPlanData.weeklyFocus ?? weeklyFocus,
        priorityTasks: updatedPlanData.priorityTasks ?? priorityTasks,
        schedule: updatedPlanData.schedule ?? schedule,
      };

      await apiFetch('/plans', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      showToast('Weekly schedule updated.', 'success');
    } catch (err) {
      console.error('Error saving weekly planner:', err);
      showToast('Failed to sync plan.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Shift weeks
  const handleShiftWeek = (offset) => {
    const current = new Date(currentWeekMonday);
    current.setDate(current.getDate() + offset);
    setCurrentWeekMonday(getLocalDateString(current));
  };

  // Goal adding handler per day
  const handleAddGoal = (dayName) => {
    const inputVal = goalInputs[dayName] || '';
    if (!inputVal.trim()) return;

    const nextSchedule = schedule.map(dayObj => {
      if (dayObj.day === dayName) {
        return {
          ...dayObj,
          goals: [...(dayObj.goals || []), inputVal.trim()]
        };
      }
      return dayObj;
    });

    setSchedule(nextSchedule);
    setGoalInputs(prev => ({ ...prev, [dayName]: '' }));
    handleSavePlan({ schedule: nextSchedule });
  };

  // Remove goal handler
  const handleRemoveGoal = (dayName, goalIndex) => {
    const nextSchedule = schedule.map(dayObj => {
      if (dayObj.day === dayName) {
        return {
          ...dayObj,
          goals: dayObj.goals.filter((_, idx) => idx !== goalIndex)
        };
      }
      return dayObj;
    });

    setSchedule(nextSchedule);
    handleSavePlan({ schedule: nextSchedule });
  };

  // Daily focus text update
  const handleUpdateFocus = (dayName, focusVal) => {
    const nextSchedule = schedule.map(dayObj => {
      if (dayObj.day === dayName) {
        return { ...dayObj, focus: focusVal };
      }
      return dayObj;
    });
    setSchedule(nextSchedule);
  };

  // Priority notes handlers
  const handleAddPriority = (e) => {
    e.preventDefault();
    if (!newPriorityInput.trim()) return;

    const nextPriorities = [...priorityTasks, newPriorityInput.trim()];
    setPriorityTasks(nextPriorities);
    setNewPriorityInput('');
    handleSavePlan({ priorityTasks: nextPriorities });
  };

  const handleRemovePriority = (idx) => {
    const nextPriorities = priorityTasks.filter((_, i) => i !== idx);
    setPriorityTasks(nextPriorities);
    handleSavePlan({ priorityTasks: nextPriorities });
  };

  const formatWeekLabel = () => {
    if (!currentWeekMonday) return '';
    const mon = new Date(currentWeekMonday);
    const sun = new Date(currentWeekMonday);
    sun.setDate(sun.getDate() + 6);
    
    const opt = { month: 'short', day: 'numeric' };
    return `${mon.toLocaleDateString('en-US', opt)} — ${sun.toLocaleDateString('en-US', opt)}`;
  };

  if (loading) {
    return <PlannerSkeleton />;
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header and Week Switcher bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white font-sans tracking-tight">
            Weekly Planner
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm font-medium">
            Plan daily focus milestones, align weekly schedules, and configure balances.
          </p>
        </div>

        {/* Calendar week toggles */}
        <div className="flex items-center gap-2 bg-white dark:bg-brand-900/40 border border-slate-200/50 dark:border-brand-800/50 rounded-2xl p-1.5 shadow-sm">
          <button 
            onClick={() => handleShiftWeek(-7)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-brand-800 dark:hover:bg-brand-700 text-slate-500 dark:text-slate-300 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 px-3 font-mono">
            {formatWeekLabel()}
          </span>

          <button 
            onClick={() => handleShiftWeek(7)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-brand-800 dark:hover:bg-brand-700 text-slate-500 dark:text-slate-300 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Main Grid: Weekly Focus block, priorities block, and daily calendar columns */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Column: Weekly Focus and Priority notes (Col span 1) */}
        <div className="space-y-6 lg:col-span-1">
          {/* Box 1: Weekly Focus Target */}
          <div className="glass-card flex flex-col justify-between">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
              <Target size={16} className="text-blue-500" />
              <span>Weekly Core Target</span>
            </h3>
            
            <textarea
              placeholder="What is your ultimate objective for this week?"
              value={weeklyFocus}
              onChange={(e) => setWeeklyFocus(e.target.value)}
              onBlur={() => handleSavePlan({ weeklyFocus })}
              className="glass-input text-xs h-24 placeholder:text-slate-400 focus:bg-white dark:focus:bg-brand-800/80 resize-none leading-relaxed"
            />
            {saving && <span className="text-[9px] text-blue-500 font-semibold mt-2 self-end animate-pulse">Syncing plan...</span>}
          </div>

          {/* Box 2: Weekly Priority Checklist */}
          <div className="glass-card">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
              <FileText size={16} className="text-blue-500" />
              <span>Weekly Priorities</span>
            </h3>

            {/* Input list creator */}
            <form onSubmit={handleAddPriority} className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="High-priority key note..."
                value={newPriorityInput}
                onChange={(e) => setNewPriorityInput(e.target.value)}
                className="glass-input text-[11px] py-2 px-3"
              />
              <button 
                type="submit"
                className="p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl active:scale-95 transition-all"
              >
                <Plus size={14} />
              </button>
            </form>

            {/* Priorities list rendering */}
            <div className="space-y-2">
              {priorityTasks.length === 0 ? (
                <p className="text-[10px] text-slate-400 font-medium">No priority notes added yet.</p>
              ) : (
                priorityTasks.map((t, idx) => (
                  <div key={idx} className="p-2 px-3 rounded-xl bg-slate-50 dark:bg-brand-800/40 border border-slate-150 dark:border-brand-700/20 flex items-center justify-between gap-2 animate-fadeIn">
                    <span className="text-[11px] text-slate-700 dark:text-slate-350 truncate">{t}</span>
                    <button 
                      onClick={() => handleRemovePriority(idx)}
                      className="p-1 text-slate-400 hover:text-red-500 transition-colors shrink-0"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* AI work balancer tips */}
          <div className="glass-card bg-gradient-to-br from-blue-600/5 to-indigo-600/5 border border-blue-500/10 rounded-2xl">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-500 shrink-0">
                <Sparkles size={18} className="animate-pulse" />
              </div>
              <div>
                <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-100 uppercase tracking-wider">Workload Balancer</h4>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed font-medium mt-1.5">
                  Keep goals realistic! We recommend maximum 3 milestones per day. Balance study intervals with planned wellness/relaxing periods.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Columns: Mon to Sun Calendar schedule (Col span 3) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="glass-card">
            <div className="flex items-center justify-between mb-6 border-b border-slate-200/50 dark:border-brand-800/30 pb-4">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Calendar size={18} className="text-blue-500" />
                  <span>Interactive Week Schedule Grid</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 font-medium">Add micro-milestones and targets for each day.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {schedule.map((dayObj) => (
                <div 
                  key={dayObj.day} 
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-brand-850/40 border border-slate-200/40 dark:border-brand-800/40 flex flex-col justify-between min-h-[220px] animate-fadeIn"
                >
                  <div>
                    {/* Day Title bar */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200/50 dark:border-brand-800/40 mb-3">
                      <span className="font-extrabold text-sm text-slate-800 dark:text-slate-200">{dayObj.day}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    </div>

                    {/* Daily Focus description input */}
                    <input
                      type="text"
                      placeholder="Daily theme focus..."
                      value={dayObj.focus || ''}
                      onChange={(e) => handleUpdateFocus(dayObj.day, e.target.value)}
                      onBlur={() => handleSavePlan({ schedule })}
                      className="w-full bg-transparent text-[11px] text-slate-600 dark:text-slate-355 focus:outline-none placeholder:text-slate-400 italic mb-3 block"
                    />

                    {/* Goals list */}
                    <div className="space-y-2 max-h-[110px] overflow-y-auto pr-1">
                      {dayObj.goals && dayObj.goals.map((g, idx) => (
                        <div key={idx} className="flex items-start justify-between gap-2 text-[10px] font-semibold text-slate-700 dark:text-slate-400 group animate-fadeIn">
                          <span className="leading-tight">• {g}</span>
                          <button
                            onClick={() => handleRemoveGoal(dayObj.day, idx)}
                            className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Goal Add form inside card */}
                  <div className="flex gap-1.5 pt-4 mt-2 border-t border-slate-200/40 dark:border-brand-800/20">
                    <input
                      type="text"
                      placeholder="Add goal..."
                      value={goalInputs[dayObj.day] || ''}
                      onChange={(e) => setGoalInputs(prev => ({ ...prev, [dayObj.day]: e.target.value }))}
                      className="glass-input py-1 px-2.5 text-[10px] bg-white/70 dark:bg-brand-900/40"
                    />
                    <button
                      onClick={() => handleAddGoal(dayObj.day)}
                      className="px-2.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold rounded-lg shrink-0 active:scale-95 transition-all"
                    >
                      Add
                    </button>
                  </div>

                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
export default Planner;
