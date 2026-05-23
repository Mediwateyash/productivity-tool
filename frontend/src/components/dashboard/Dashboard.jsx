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
  Trophy
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';

export const Dashboard = () => {
  const { apiFetch, user } = useAuth();
  const { showToast } = useToast();
  
  // Dashboard states
  const [analytics, setAnalytics] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [todayFocus, setTodayFocus] = useState(localStorage.getItem('dy_today_focus') || '');
  const [focusInput, setFocusInput] = useState('');
  const [chatMessage, setChatMessage] = useState('');
  const [chatReplies, setChatReplies] = useState([
    { sender: 'mentor', text: 'Hey there! Ready to dominate your goals today? Ask me any advice on routine optimization, beating procrastination, or scheduling breaks!' }
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  // Motivational Quotes Seeder
  const quotes = [
    { text: "Concentrate all your thoughts upon the work at hand. The sun's rays do not burn until brought to a focus.", author: "Alexander Graham Bell" },
    { text: "Continuous improvement is better than delayed perfection.", author: "Mark Twain" },
    { text: "Your mind is for having ideas, not holding them.", author: "David Allen" },
    { text: "Action is the foundational key to all success.", author: "Pablo Picasso" },
  ];
  const [currentQuote, setCurrentQuote] = useState(quotes[0]);

  useEffect(() => {
    setCurrentQuote(quotes[Math.floor(Math.random() * quotes.length)]);
    
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const analyticsData = await apiFetch('/analytics');
        setAnalytics(analyticsData);
        
        const tasksData = await apiFetch('/tasks');
        setTasks(tasksData);
      } catch (err) {
        console.error('Error seeding dashboard data:', err);
        showToast('Running in offline sandbox mode.', 'info');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleSaveFocus = (e) => {
    e.preventDefault();
    if (focusInput.trim()) {
      setTodayFocus(focusInput.trim());
      localStorage.setItem('dy_today_focus', focusInput.trim());
      setFocusInput('');
      showToast('Daily priority focus set successfully!', 'success');
    }
  };

  const handleClearFocus = () => {
    setTodayFocus('');
    localStorage.removeItem('dy_today_focus');
    showToast('Daily focus cleared.', 'info');
  };

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

  // Render Skeleton Loader if loading is active!
  if (loading) {
    return <DashboardSkeleton />;
  }

  const completedTasksCount = tasks.filter(t => t.completed).length;
  const pendingTasksCount = tasks.filter(t => !t.completed).length;
  const totalTasks = tasks.length;
  const taskRatio = totalTasks > 0 ? Math.round((completedTasksCount / totalTasks) * 100) : 0;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner Welcomer */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white font-sans tracking-tight">
            Welcome back, {user?.name || 'Developer'}!
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium text-sm flex items-center gap-1.5">
            <Sparkles size={14} className="text-blue-500" />
            <span>AI Coach analysis active. Plan Better. Execute Smarter. Grow Daily.</span>
          </p>
        </div>

        {/* Gamified level indicator */}
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

      {/* Grid: 4 Top Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Stat 1: Daily Focus */}
        <div className="glass-card flex flex-col justify-between min-h-[140px] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 bg-blue-500/10 rounded-bl-3xl text-blue-500">
            <Target size={18} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Today's Core Focus</span>
            {todayFocus ? (
              <div className="mt-3">
                <p className="font-bold text-slate-800 dark:text-slate-100 text-base leading-tight pr-6">{todayFocus}</p>
                <button 
                  onClick={handleClearFocus}
                  className="mt-3 text-[10px] font-extrabold text-red-500 hover:text-red-400 uppercase tracking-wider"
                >
                  Clear Priority
                </button>
              </div>
            ) : (
              <form onSubmit={handleSaveFocus} className="mt-3 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Set your major goal..."
                  value={focusInput}
                  onChange={(e) => setFocusInput(e.target.value)}
                  className="glass-input py-2 text-xs placeholder:text-slate-400 focus:ring-1"
                />
                <button type="submit" className="p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl active:scale-95 transition-all">
                  <ChevronRight size={14} />
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Stat 2: Daily Productivity Score */}
        <div className="glass-card flex items-center gap-5 justify-between min-h-[140px] relative overflow-hidden">
          <div className="flex-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Productivity Score</span>
            <span className="text-4xl font-extrabold text-slate-800 dark:text-slate-100 mt-2 block font-sans tracking-tight">
              {analytics?.focusScore || 50}%
            </span>
            <span className="text-[10px] text-slate-400 mt-2 block font-medium">Weekly average score</span>
          </div>
          <div className="w-16 h-16 rounded-full border-4 border-slate-200 dark:border-brand-800 flex items-center justify-center shrink-0 relative">
            <div className="absolute inset-0 rounded-full border-4 border-blue-600" style={{ clipPath: `polygon(0 0, 100% 0, 100% ${analytics?.focusScore || 50}%, 0 ${analytics?.focusScore || 50}%)` }} />
            <Zap size={22} className="text-blue-500" />
          </div>
        </div>

        {/* Stat 3: Tasks Completed */}
        <div className="glass-card flex items-center gap-5 justify-between min-h-[140px] relative overflow-hidden">
          <div className="flex-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Completed Tasks</span>
            <span className="text-4xl font-extrabold text-slate-800 dark:text-slate-100 mt-2 block font-sans tracking-tight">
              {completedTasksCount} <span className="text-lg font-normal text-slate-400">/ {totalTasks}</span>
            </span>
            <span className="text-[10px] text-slate-400 mt-2 block font-medium">{pendingTasksCount} pending items</span>
          </div>
          <div className="w-16 h-16 rounded-full border-4 border-slate-200 dark:border-brand-800 flex items-center justify-center shrink-0 relative">
            <div className="absolute inset-0 rounded-full border-4 border-emerald-500" style={{ clipPath: `polygon(0 0, 100% 0, 100% ${taskRatio}%, 0 ${taskRatio}%)` }} />
            <CheckCircle size={22} className="text-emerald-500" />
          </div>
        </div>

        {/* Stat 4: Active Streak */}
        <div className="glass-card flex items-center gap-5 justify-between min-h-[140px] relative overflow-hidden">
          <div className="flex-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Daily Streak</span>
            <span className="text-4xl font-extrabold text-slate-800 dark:text-slate-100 mt-2 block font-sans tracking-tight">
              {user?.streak || 0} <span className="text-xs font-normal text-slate-400 uppercase tracking-wider">Days</span>
            </span>
            <span className="text-[10px] text-slate-400 mt-2 block font-medium">Keep ticking daily targets!</span>
          </div>
          <div className="w-16 h-16 rounded-full border-4 border-slate-200 dark:border-brand-800 flex items-center justify-center shrink-0 bg-orange-500/10">
            <Flame size={26} className="text-orange-500 animate-pulse" />
          </div>
        </div>

      </div>

      {/* Main Sections: Charts & AI Coach */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Weekly Progress Graph Card (Col span 2) */}
        <div className="glass-card lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Productivity Analytics</h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Focus scores and weekly trends summary</p>
            </div>
            <div className="px-2.5 py-1 text-[10px] font-bold bg-blue-500/10 text-blue-500 rounded-lg uppercase tracking-wider">
              Live Chart
            </div>
          </div>

          <div className="h-64 w-full">
            {analytics?.charts?.focusTrends ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.charts.focusTrends}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0}/>
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

        {/* Chatbot Productivity Mentor Widget */}
        <div className="glass-card flex flex-col justify-between min-h-[380px]">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-200/50 dark:border-brand-800/40">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
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

          {/* Messages conversation area */}
          <div className="flex-1 overflow-y-auto space-y-3 py-4 max-h-[220px] text-xs">
            {chatReplies.map((msg, i) => (
              <div 
                key={i} 
                className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
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

          {/* Form input bar */}
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

      {/* AI Daily Analysis Summary Block */}
      {analytics?.aiSummary && (
        <div className="glass-card bg-gradient-to-r from-blue-600/5 to-indigo-600/5 dark:from-blue-600/5 dark:to-indigo-600/5 border border-blue-500/10 flex items-start gap-4">
          <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500 shrink-0 mt-0.5">
            <Lightbulb size={20} className="animate-pulse" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 uppercase tracking-wider">AI Productivity Diagnostics</h4>
            <p className="text-slate-600 dark:text-slate-300 text-xs font-medium mt-2 leading-relaxed">
              {analytics.aiSummary}
            </p>
          </div>
        </div>
      )}

      {/* Motivational Quote Footer Card */}
      <div className="glass-card text-center py-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <p className="text-base italic font-serif text-slate-700 dark:text-slate-200 max-w-2xl mx-auto leading-relaxed">
          “{currentQuote.text}”
        </p>
        <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase mt-3">
          — {currentQuote.author}
        </p>
      </div>

    </div>
  );
};
export default Dashboard;
