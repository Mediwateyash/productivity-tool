import React, { useState, useEffect } from 'react';
import { useAuth } from '../../store/AuthContext';
import { useToast } from '../../store/ToastContext';
import { DashboardSkeleton } from '../ui/Skeleton';
import { 
  Flame, 
  CheckCircle, 
  Sparkles, 
  Lightbulb, 
  ChevronRight, 
  Send,
  Zap,
  Target,
  Trophy,
  Plus,
  Trash2,
  Calendar,
  Square,
  Check,
  Compass,
  AlertCircle
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import confetti from 'canvas-confetti';

const getLocalDateString = (date = new Date()) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const Dashboard = () => {
  const { apiFetch, user, updateProfile } = useAuth();
  const { showToast } = useToast();
  
  // State variables
  const [analytics, setAnalytics] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [todayFocus, setTodayFocus] = useState(localStorage.getItem('dy_today_focus') || '');
  const [focusInput, setFocusInput] = useState('');
  
  // Today's schedule quick add input
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [quickTaskPriority, setQuickTaskPriority] = useState('medium');
  const [addingTask, setAddingTask] = useState(false);
  const [weeklyGoals, setWeeklyGoals] = useState([]);
  
  // Conversational AI Coach
  const [chatMessage, setChatMessage] = useState('');
  const [chatReplies, setChatReplies] = useState([
    { sender: 'mentor', text: 'Hey there! Ready to dominate your goals today? Ask me any advice on routine optimization, beating procrastination, or scheduling breaks!' }
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  // Quotes List
  const quotes = [
    { text: "Concentrate all your thoughts upon the work at hand. The sun's rays do not burn until brought to a focus.", author: "Alexander Graham Bell" },
    { text: "Continuous improvement is better than delayed perfection.", author: "Mark Twain" },
    { text: "Your mind is for having ideas, not holding them.", author: "David Allen" },
    { text: "Action is the foundational key to all success.", author: "Pablo Picasso" },
  ];
  const [currentQuote, setCurrentQuote] = useState(quotes[0]);

  // Find Monday helper
  const getMondayStr = (dateObj) => {
    const day = dateObj.getDay();
    const diff = dateObj.getDate() - day + (day === 0 ? -6 : 1);
    const mon = new Date(dateObj.setDate(diff));
    return getLocalDateString(mon);
  };

  useEffect(() => {
    setCurrentQuote(quotes[Math.floor(Math.random() * quotes.length)]);
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const analyticsData = await apiFetch('/analytics');
      setAnalytics(analyticsData);
      
      const tasksData = await apiFetch('/tasks');
      setTasks(tasksData);

      // Load weekly planner goals for today
      const mondayStr = getMondayStr(new Date());
      const planData = await apiFetch(`/plans?weekStartDate=${mondayStr}`);
      if (planData && planData.schedule) {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const todayDayName = dayNames[new Date().getDay()];
        const todayPlan = planData.schedule.find(d => d.day === todayDayName);
        setWeeklyGoals(todayPlan ? (todayPlan.goals || []) : []);
      }
    } catch (err) {
      console.error('Error seeding dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Save Today's Core Focus
  const handleSaveFocus = (e) => {
    e.preventDefault();
    if (focusInput.trim()) {
      setTodayFocus(focusInput.trim());
      localStorage.setItem('dy_today_focus', focusInput.trim());
      setFocusInput('');
      showToast("🎯 Today's core target focus locked!", 'success');
    }
  };

  const handleClearFocus = () => {
    setTodayFocus('');
    localStorage.removeItem('dy_today_focus');
    showToast('Focus target cleared.', 'info');
  };

    // Quick Add Task from Dashboard
  const handleQuickAddTask = async (e) => {
    e.preventDefault();
    if (!quickTaskTitle.trim()) return;

    setAddingTask(true);
    try {
      const todayDateStr = getLocalDateString();
      const newTask = {
        title: quickTaskTitle.trim(),
        priority: quickTaskPriority,
        category: 'general',
        dueDate: todayDateStr, // default to today!
        tags: ['today'],
        notes: 'Added from Dashboard quick input',
        subtasks: []
      };

      const created = await apiFetch('/tasks', {
        method: 'POST',
        body: JSON.stringify(newTask)
      });

      setTasks(prev => [created, ...prev]);
      setQuickTaskTitle('');
      setQuickTaskPriority('medium');
      showToast('Task added to Today\'s Schedule.', 'success');

      // Auto achievements update check
      await apiFetch('/achievements/check', { method: 'POST' });
    } catch (err) {
      console.error('Quick add task failed:', err);
      showToast('Failed to quick add task.', 'error');
    } finally {
      setAddingTask(false);
    }
  };

  // Complete task trigger
  const handleToggleTaskComplete = async (task) => {
    if (task.isWeeklyGoal) {
      if (task.completed) {
        showToast('Weekly goals are marked complete in your backlog.', 'info');
        return;
      }

      // Promote virtual weekly goal to a real completed task in `/tasks`!
      try {
        const todayDateStr = getLocalDateString();
        const promotedTask = {
          title: task.title,
          priority: 'medium',
          category: 'work',
          dueDate: todayDateStr,
          tags: ['weekly-goal', 'today'],
          notes: 'Promoted from Weekly Planner Goal',
          completed: true,
          subtasks: []
        };
        
        const created = await apiFetch('/tasks', {
          method: 'POST',
          body: JSON.stringify(promotedTask)
        });
        
        // Append to list and trigger congratulations confetti!
        setTasks(prev => [created, ...prev]);
        showToast('🎯 Weekly goal promoted & completed! XP rewarded.', 'success');
        
        confetti({
          particleCount: 80,
          spread: 50,
          origin: { y: 0.8 }
        });
        
        await apiFetch('/achievements/check', { method: 'POST' });
      } catch (err) {
        console.error('Promotion failed:', err);
        showToast('Failed to complete weekly goal.', 'error');
      }
      return;
    }

    const nextCompleted = !task.completed;
    try {
      // Optimistic update
      setTasks(prev => prev.map(t => t._id === task._id ? { ...t, completed: nextCompleted } : t));
      
      const updated = await apiFetch(`/tasks/${task._id}`, {
        method: 'PUT',
        body: JSON.stringify({ completed: nextCompleted })
      });
      
      setTasks(prev => prev.map(t => t._id === task._id ? updated : t));
      
      if (nextCompleted) {
        showToast('🎯 Goal complete! XP awarded.', 'success');
        
        // Confetti explosion on dashboard completion!
        confetti({
          particleCount: 80,
          spread: 50,
          origin: { y: 0.8 }
        });

        // Trigger milestones checks
        const checkRes = await apiFetch('/achievements/check', { method: 'POST' });
        if (checkRes.unlocked && checkRes.unlocked.length > 0) {
          showToast('🏆 Milestone Unlocked! Check Achievements Page.', 'success');
        }
      } else {
        showToast('Task status restored to active.', 'info');
      }
    } catch (err) {
      console.error('Toggle complete failed:', err);
      showToast('Failed to complete task.', 'error');
    }
  };

  // Delete task from Dashboard backlog
  const handleDeleteTask = async (task) => {
    if (task.isWeeklyGoal) {
      showToast('Weekly goals can be managed and removed from the Weekly Planner tab.', 'info');
      return;
    }

    try {
      await apiFetch(`/tasks/${task._id}`, { method: 'DELETE' });
      setTasks(prev => prev.filter(t => t._id !== task._id));
      showToast('Task permanently deleted.', 'info');
    } catch (err) {
      console.error('Delete task failed:', err);
      showToast('Failed to delete task.', 'error');
    }
  };

  // Send Conversational Mentor message
  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const userText = chatMessage;
    setChatReplies(prev => [...prev, { sender: 'user', text: userText }]);
    setChatMessage('');
    setChatLoading(true);

    try {
      const response = await apiFetch('/analytics/chat', {
        method: 'POST',
        body: JSON.stringify({ message: userText })
      });
      setChatReplies(prev => [...prev, { sender: 'mentor', text: response.reply }]);
    } catch (err) {
      setChatReplies(prev => [...prev, { sender: 'mentor', text: "Sorry, I am having trouble connecting right now. Try chunking your tasks to get started!" }]);
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  // Filter tasks for Today's Schedule:
  // Show tasks due today OR incomplete tasks tagged 'today' or general active ones.
  const todayStr = getLocalDateString();
  const todayTasks = tasks.filter(t => {
    if (!t.dueDate) return !t.completed; // show incomplete items without deadlines
    const taskDateStr = getLocalDateString(new Date(t.dueDate));
    return taskDateStr === todayStr || (!t.completed && t.tags && t.tags.includes('today'));
  });

  // Map weeklyGoals to virtual tasks if they don't already exist as tasks
  const virtualWeeklyGoals = weeklyGoals
    .filter(goal => !todayTasks.some(t => t.title.toLowerCase() === goal.toLowerCase()))
    .map((goal, index) => {
      const isCompletedInTasks = tasks.some(t => t.title.toLowerCase() === goal.toLowerCase() && t.completed);
      return {
        _id: `weekly_goal_${index}`,
        title: goal,
        completed: isCompletedInTasks,
        priority: 'medium',
        category: 'weekly goal',
        isWeeklyGoal: true
      };
    });

  const todayScheduleList = [...todayTasks, ...virtualWeeklyGoals];
  const todayCompletedCount = todayScheduleList.filter(t => t.completed).length;
  const todayTotalCount = todayScheduleList.length;
  const todayProgressPercent = todayTotalCount > 0 ? Math.round((todayCompletedCount / todayTotalCount) * 100) : 0;

  // General task ratios
  const completedTasksCount = tasks.filter(t => t.completed).length;
  const pendingTasksCount = tasks.filter(t => !t.completed).length;
  const totalTasks = tasks.length;
  const taskRatio = totalTasks > 0 ? Math.round((completedTasksCount / totalTasks) * 100) : 0;

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* 1. Top Welcome Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white font-sans tracking-tight">
            Welcome back, {user?.name || 'Developer'}!
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium text-sm flex items-center gap-1.5">
            <Sparkles size={14} className="text-blue-500" />
            <span>Plan Better. Execute Smarter. Grow Daily.</span>
          </p>
        </div>

        {/* Level bar */}
        <div className="flex items-center gap-3 bg-white dark:bg-brand-900/40 border border-slate-200/50 dark:border-brand-800/50 rounded-2xl p-3 px-4 shadow-sm shrink-0">
          <Trophy size={20} className="text-yellow-500 animate-bounce" />
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Current Level</div>
            <div className="font-extrabold text-slate-800 dark:text-white text-base leading-none mt-0.5">
              Level {user?.level || 1} <span className="text-xs font-semibold text-slate-400">({user?.xp || 0} XP)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. PREMIUM WIDE HEADER: Today's Main Focus Card */}
      <div className="glass-card bg-gradient-to-r from-blue-600/10 to-indigo-650/5 dark:from-blue-600/10 dark:to-indigo-900/10 border-blue-500/20 p-6 rounded-3xl relative overflow-hidden shadow-xl shadow-blue-500/5">
        <div className="absolute top-0 right-0 p-4 bg-blue-500/10 rounded-bl-3xl text-blue-500 animate-pulse">
          <Target size={24} />
        </div>

        <div className="max-w-2xl">
          <span className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-widest block mb-2 font-mono">
            TODAY'S MAIN FOCUS
          </span>

          {todayFocus ? (
            <div className="space-y-4">
              <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white leading-tight font-sans tracking-tight">
                {todayFocus}
              </h1>
              <button 
                onClick={handleClearFocus}
                className="px-3.5 py-1.5 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-[10px] font-extrabold rounded-xl uppercase tracking-wider active:scale-95 transition-all"
              >
                Modify Core Focus
              </button>
            </div>
          ) : (
            <form onSubmit={handleSaveFocus} className="flex flex-col sm:flex-row items-stretch gap-3 mt-2 max-w-lg">
              <input
                type="text"
                required
                placeholder="Declare your major single target focus goal for today..."
                value={focusInput}
                onChange={(e) => setFocusInput(e.target.value)}
                className="glass-input text-xs placeholder:text-slate-400 border-blue-500/30 dark:border-blue-500/20"
              />
              <button 
                type="submit" 
                className="glass-btn-primary px-6 py-2.5 text-xs font-bold uppercase shrink-0 flex items-center justify-center gap-1.5"
              >
                <Zap size={12} fill="currentColor" />
                <span>Establish Focus</span>
              </button>
            </form>
          )}
        </div>
      </div>

      {/* 3. Grid: 4 Top Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Stat 1: Daily Focus Score */}
        <div className="glass-card flex items-center gap-5 justify-between min-h-[120px] relative overflow-hidden">
          <div className="flex-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Focus Score</span>
            <span className="text-4xl font-extrabold text-slate-800 dark:text-slate-100 mt-2 block font-sans tracking-tight">
              {analytics?.focusScore || 50}%
            </span>
            <span className="text-[10px] text-slate-400 mt-2 block font-medium">Weekly average score</span>
          </div>
          <div className="w-14 h-14 rounded-full border-4 border-slate-200 dark:border-brand-800 flex items-center justify-center shrink-0 relative">
            <div className="absolute inset-0 rounded-full border-4 border-blue-600" style={{ clipPath: `polygon(0 0, 100% 0, 100% ${analytics?.focusScore || 50}%, 0 ${analytics?.focusScore || 50}%)` }} />
            <Zap size={20} className="text-blue-500" />
          </div>
        </div>

        {/* Stat 2: Tasks Completed */}
        <div className="glass-card flex items-center gap-5 justify-between min-h-[120px] relative overflow-hidden">
          <div className="flex-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Tasks Ticked</span>
            <span className="text-4xl font-extrabold text-slate-800 dark:text-slate-100 mt-2 block font-sans tracking-tight">
              {completedTasksCount} <span className="text-lg font-normal text-slate-400">/ {totalTasks}</span>
            </span>
            <span className="text-[10px] text-slate-400 mt-2 block font-medium">{pendingTasksCount} pending tasks</span>
          </div>
          <div className="w-14 h-14 rounded-full border-4 border-slate-200 dark:border-brand-800 flex items-center justify-center shrink-0 relative">
            <div className="absolute inset-0 rounded-full border-4 border-emerald-500" style={{ clipPath: `polygon(0 0, 100% 0, 100% ${taskRatio}%, 0 ${taskRatio}%)` }} />
            <CheckCircle size={20} className="text-emerald-500" />
          </div>
        </div>

        {/* Stat 3: Active Streak */}
        <div className="glass-card flex items-center gap-5 justify-between min-h-[120px] relative overflow-hidden">
          <div className="flex-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Daily Streak</span>
            <span className="text-4xl font-extrabold text-slate-800 dark:text-slate-100 mt-2 block font-sans tracking-tight">
              {user?.streak || 0} <span className="text-xs font-normal text-slate-400 uppercase tracking-wider">Days</span>
            </span>
            <span className="text-[10px] text-slate-400 mt-2 block font-medium">Keep ticking daily goals!</span>
          </div>
          <div className="w-14 h-14 rounded-full border-4 border-slate-200 dark:border-brand-800 flex items-center justify-center shrink-0 bg-orange-500/10">
            <Flame size={24} className="text-orange-500 animate-pulse" />
          </div>
        </div>

        {/* Stat 4: Success rate */}
        <div className="glass-card flex items-center gap-5 justify-between min-h-[120px] relative overflow-hidden">
          <div className="flex-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Completions</span>
            <span className="text-4xl font-extrabold text-slate-800 dark:text-slate-100 mt-2 block font-sans tracking-tight">
              {taskRatio}%
            </span>
            <span className="text-[10px] text-slate-400 mt-2 block font-medium">Global completion rate</span>
          </div>
          <div className="w-14 h-14 rounded-full border-4 border-slate-200 dark:border-brand-800 flex items-center justify-center shrink-0 bg-blue-500/10">
            <Trophy size={22} className="text-blue-500" />
          </div>
        </div>

      </div>

      {/* 4. MAIN DOUBLE COLUMN ROW: Today's Schedule & AI Coach */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Today's Schedule Widget (Col span 2) */}
        <div className="lg:col-span-2 glass-card flex flex-col justify-between min-h-[400px]">
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200/50 dark:border-brand-800/30">
              <div>
                <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Calendar size={18} className="text-blue-500" />
                  <span>Today's Schedule Backlog</span>
                </h3>
                <p className="text-[10px] text-slate-450 mt-0.5 font-medium">Tick active milestones and priorities allocated for today</p>
              </div>

              {/* Progress pill */}
              <div className="px-3 py-1 bg-blue-600/10 text-blue-500 dark:text-blue-400 text-[10px] font-extrabold rounded-lg uppercase tracking-wider flex items-center gap-1 font-mono">
                <span>{todayProgressPercent}% COMPLETE</span>
              </div>
            </div>

            {/* Today's progress bar */}
            {todayTotalCount > 0 && (
              <div className="mb-4">
                <div className="w-full h-1.5 bg-slate-200 dark:bg-brand-800/60 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 rounded-full transition-all duration-300"
                    style={{ width: `${todayProgressPercent}%` }}
                  />
                </div>
              </div>
            )}

            {/* Tasks list */}
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {todayTotalCount === 0 ? (
                <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center border-2 border-dashed border-slate-200/50 dark:border-brand-800/40 rounded-2xl">
                  <Compass size={28} className="text-slate-355 mb-2 animate-spin [animation-duration:12s]" />
                  <p className="text-xs font-semibold">Today's schedule backlog is empty.</p>
                  <p className="text-[9px] text-slate-400 mt-0.5 font-medium">Quick add your first objective below to start!</p>
                </div>
              ) : (
                todayScheduleList.map(t => (
                  <div 
                    key={t._id}
                    className={`p-3.5 rounded-xl border flex items-center justify-between gap-4 transition-all duration-150 animate-fadeIn ${
                      t.completed 
                        ? 'bg-slate-50/50 dark:bg-brand-900/10 border-slate-200/50 dark:border-brand-800/30 opacity-60' 
                        : 'bg-slate-100/50 dark:bg-brand-850/30 hover:bg-slate-200/50 dark:hover:bg-brand-800/40 border-slate-200/50 dark:border-brand-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button 
                        onClick={() => handleToggleTaskComplete(t)}
                        className="text-slate-400 hover:text-blue-500 transition-colors mt-0.5 shrink-0"
                      >
                        {t.completed ? (
                          <div className="w-5 h-5 bg-blue-600 text-white rounded flex items-center justify-center shadow shadow-blue-500/10 shrink-0">
                            <Check size={12} />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded border border-slate-300 dark:border-brand-700 bg-white/70 dark:bg-brand-900/40 hover:border-blue-500 dark:hover:border-blue-500/80 transition-colors shrink-0" />
                        )}
                      </button>
                      
                      <div className="min-w-0">
                        <span className={`text-xs font-bold leading-tight block ${
                          t.completed ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'
                        }`}>
                          {t.title}
                        </span>
                        
                        <div className="flex items-center gap-1.5 mt-0.5 text-[8px] text-slate-400 font-bold uppercase tracking-wider">
                          <span className={`px-1 rounded ${
                            t.priority === 'high' 
                              ? 'bg-rose-500/10 text-rose-500' 
                              : t.priority === 'medium'
                              ? 'bg-orange-500/10 text-orange-500'
                              : 'bg-blue-500/10 text-blue-500'
                          }`}>
                            {t.priority}
                          </span>
                          {t.isWeeklyGoal || (t.tags && t.tags.includes('weekly-goal')) ? (
                            <>
                              <span>•</span>
                              <span className="px-1 rounded bg-purple-500/10 text-purple-650 dark:text-purple-400 font-bold flex items-center gap-0.5">
                                📅 Weekly Goal
                              </span>
                            </>
                          ) : (
                            t.category && (
                              <>
                                <span>•</span>
                                <span className="text-slate-500 dark:text-slate-350">{t.category}</span>
                              </>
                            )
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Time indicator (if Pomos or dates exist) */}
                      {t.pomodoros > 0 && (
                        <span className="px-2 py-0.5 bg-orange-500/5 text-orange-500 text-[8px] font-extrabold rounded-lg flex items-center gap-0.5">
                          <Flame size={8} />
                          <span>{t.pomodoros} Pomos</span>
                        </span>
                      )}

                      {/* Discard / Delete Action Button */}
                      <button
                        onClick={() => handleDeleteTask(t)}
                        className="p-1 text-slate-400 hover:text-rose-500 dark:text-slate-500 dark:hover:text-rose-450 hover:bg-slate-200/50 dark:hover:bg-brand-800/60 rounded-md active:scale-90 transition-all shrink-0"
                        title="Delete Task"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Add Form Input bar */}
          <form onSubmit={handleQuickAddTask} className="flex gap-2 pt-4 border-t border-slate-200/50 dark:border-brand-800/30 mt-4">
            <input
              type="text"
              required
              disabled={addingTask}
              placeholder="Quick declare a new objective for today..."
              value={quickTaskTitle}
              onChange={(e) => setQuickTaskTitle(e.target.value)}
              className="glass-input py-2.5 text-xs placeholder:text-slate-400"
            />
            
            <select
              value={quickTaskPriority}
              onChange={(e) => setQuickTaskPriority(e.target.value)}
              className="glass-input py-2.5 px-3 text-[10px] font-bold uppercase w-24 bg-white/70 dark:bg-brand-900/40"
            >
              <option value="high">🔴 High</option>
              <option value="medium">🟡 Med</option>
              <option value="low">🔵 Low</option>
            </select>

            <button
              type="submit"
              disabled={addingTask}
              className="glass-btn-primary px-4 py-2.5 text-xs font-bold flex items-center gap-1 shrink-0"
            >
              <Plus size={14} />
              <span>Add</span>
            </button>
          </form>
        </div>

        {/* AI Coach chat mentor (Col span 1) */}
        <div className="glass-card flex flex-col justify-between min-h-[400px]">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-200/50 dark:border-brand-800/40">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow shadow-blue-500/10">
              <Sparkles size={16} />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-800 dark:text-slate-205">AI Coach Mentor</h4>
              <p className="text-[10px] text-emerald-500 font-semibold tracking-wide flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                <span>Default Provider: Gemini AI</span>
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 py-4 max-h-[240px] text-xs">
            {chatReplies.map((msg, i) => (
              <div 
                key={i} 
                className={`p-3 rounded-2xl max-w-[85%] leading-relaxed animate-fadeIn ${
                  msg.sender === 'user' 
                    ? 'ml-auto bg-blue-600 text-white rounded-br-none' 
                    : 'bg-slate-100 dark:bg-brand-800/50 text-slate-700 dark:text-slate-350 rounded-bl-none border border-slate-205/20'
                }`}
              >
                {msg.text}
              </div>
            ))}
            {chatLoading && (
              <div className="p-3 bg-slate-100 dark:bg-brand-800/50 text-slate-400 rounded-2xl max-w-[50px] rounded-bl-none flex gap-1 items-center justify-center">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            )}
          </div>

          <form onSubmit={handleSendChat} className="flex gap-2 pt-3 border-t border-slate-200/50 dark:border-brand-800/40">
            <input
              type="text"
              placeholder="Ask for focus suggestions..."
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              className="glass-input py-2.5 text-xs placeholder:text-slate-400 focus:ring-1"
            />
            <button 
              type="submit" 
              disabled={chatLoading}
              className="p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl active:scale-95 transition-all"
            >
              <Send size={14} />
            </button>
          </form>
        </div>

      </div>

      {/* 5. DOUBLE COLUMN ROW 2: Graphs & AI Advisor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Weekly Progress Graph Card */}
        <div className="glass-card lg:col-span-2 flex flex-col justify-between min-h-[320px]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Productivity Analytics</h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Focus scores and weekly trends summary</p>
            </div>
            <div className="px-2.5 py-1 text-[10px] font-bold bg-blue-500/10 text-blue-500 rounded-lg uppercase tracking-wider font-mono">
              Live Chart
            </div>
          </div>

          <div className="h-64 w-full">
            {analytics?.charts?.focusTrends ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.charts.focusTrends}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 100]} stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                      borderColor: 'rgba(30, 41, 59, 0.8)',
                      borderRadius: '12px',
                      color: '#f8fafc',
                      fontSize: '12px'
                    }}
                  />
                  <Area type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                No active records. Tick tasks to begin tracking!
              </div>
            )}
          </div>
        </div>

        {/* AI Daily Analysis Summary Block */}
        <div className="flex flex-col justify-between gap-6">
          {analytics?.aiSummary && (
            <div className="glass-card bg-gradient-to-r from-blue-600/5 to-indigo-600/5 dark:from-blue-600/5 dark:to-indigo-600/5 border border-blue-500/10 flex items-start gap-4 flex-1">
              <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500 shrink-0 mt-0.5">
                <Lightbulb size={20} className="animate-pulse" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 uppercase tracking-wider">AI Productivity Diagnostics</h4>
                <p className="text-slate-650 dark:text-slate-300 text-xs font-medium mt-2 leading-relaxed">
                  {analytics.aiSummary}
                </p>
              </div>
            </div>
          )}

          {/* Motivational Quote Footer Card */}
          <div className="glass-card text-center py-6 relative overflow-hidden flex flex-col justify-center min-h-[140px]">
            <p className="text-sm italic font-serif text-slate-700 dark:text-slate-200 max-w-md mx-auto leading-relaxed">
              “{currentQuote.text}”
            </p>
            <p className="text-[10px] text-slate-450 font-bold tracking-wider uppercase mt-2">
              — {currentQuote.author}
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};
export default Dashboard;
