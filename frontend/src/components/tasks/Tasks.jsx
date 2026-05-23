import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../store/AuthContext';
import { useToast } from '../../store/ToastContext';
import { TasksSkeleton } from '../ui/Skeleton';
import { 
  Square, 
  Trash2, 
  Plus, 
  Play, 
  Pause, 
  RotateCcw,
  Sparkles, 
  Calendar,
  Search,
  Filter,
  Check,
  Flame,
  Clock,
  Compass,
  Zap
} from 'lucide-react';

const getLocalDateString = (date = new Date()) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const Tasks = () => {
  const { apiFetch, user } = useAuth();
  const { showToast } = useToast();
  
  // Tasks list state
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filter & Search
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // all, active, completed, high, medium, low
  const [activeCategory, setActiveCategory] = useState('all'); // all, work, study, personal, development, general
  
  // Task add form
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('medium');
  const [category, setCategory] = useState('general');
  const [dueDate, setDueDate] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [notes, setNotes] = useState('');
  
  // NLP Task Parsing Box
  const [nlpInput, setNlpInput] = useState('');
  const [nlpParsing, setNlpParsing] = useState(false);
  const [showNlpBox, setShowNlpBox] = useState(false);
  
  // Pomodoro States
  const [timerSeconds, setTimerSeconds] = useState(1500); // 25 min default
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerMode, setTimerMode] = useState('focus'); // focus, shortBreak, longBreak
  const [activeFocusTaskId, setActiveFocusTaskId] = useState(null);
  const timerRef = useRef(null);

  // Subtask Input state keyed by taskId
  const [subtaskInputs, setSubtaskInputs] = useState({});

  useEffect(() => {
    fetchTasks();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/tasks');
      setTasks(data);
    } catch (err) {
      console.error('Error loading tasks:', err);
      setError('Unable to fetch tasks. Operating in local sandbox mode.');
    } finally {
      setLoading(false);
    }
  };

  // Add a task
  const handleAddTask = async (e) => {
    if (e) e.preventDefault();
    if (!title.trim()) return;

    try {
      const parsedTags = tagsInput
        .split(',')
        .map(t => t.trim().toLowerCase())
        .filter(t => t.length > 0);

      const newTaskData = {
        title: title.trim(),
        priority,
        category,
        dueDate: dueDate || null,
        tags: parsedTags,
        notes: notes.trim(),
        subtasks: []
      };

      const created = await apiFetch('/tasks', {
        method: 'POST',
        body: JSON.stringify(newTaskData)
      });

      setTasks(prev => [created, ...prev]);
      showToast('Daily task added successfully!', 'success');
      
      // Reset form
      setTitle('');
      setPriority('medium');
      setCategory('general');
      setDueDate('');
      setTagsInput('');
      setNotes('');
      
      await checkSystemAchievements();
    } catch (err) {
      console.error('Error adding task:', err);
      showToast('Failed to add task.', 'error');
    }
  };

  // NLP Shortcut Magic Parser
  const handleParseNlp = async (e) => {
    e.preventDefault();
    if (!nlpInput.trim()) return;

    setNlpParsing(true);
    try {
      const parsed = await apiFetch('/analytics/parse-task', {
        method: 'POST',
        body: JSON.stringify({ text: nlpInput })
      });

      // Autofill Add Form
      setTitle(parsed.title || nlpInput);
      setPriority(parsed.priority || 'medium');
      setCategory(parsed.category || 'general');
      if (parsed.dueDate) {
        setDueDate(getLocalDateString(new Date(parsed.dueDate)));
      }
      setTagsInput(parsed.tags ? parsed.tags.join(', ') : '');
      
      setNlpInput('');
      setShowNlpBox(false);
      showToast('AI magic: shorthand task parsed successfully!', 'success');
    } catch (err) {
      console.error('NLP Parse failed:', err);
      showToast('NLP parsing failed, manual input mode active.', 'warning');
    } finally {
      setNlpParsing(false);
    }
  };

  // Delete a task
  const handleDeleteTask = async (taskId) => {
    try {
      await apiFetch(`/tasks/${taskId}`, { method: 'DELETE' });
      setTasks(prev => prev.filter(t => t._id !== taskId));
      showToast('Task removed from backlog.', 'info');
      
      if (activeFocusTaskId === taskId) {
        setActiveFocusTaskId(null);
        setTimerRunning(false);
      }
    } catch (err) {
      console.error('Error deleting task:', err);
      showToast('Failed to delete task.', 'error');
    }
  };

  // Toggle complete state
  const handleToggleComplete = async (task) => {
    const nextCompleted = !task.completed;
    try {
      // Optimistic state updates
      setTasks(prev => prev.map(t => t._id === task._id ? { ...t, completed: nextCompleted } : t));
      
      const updated = await apiFetch(`/tasks/${task._id}`, {
        method: 'PUT',
        body: JSON.stringify({ completed: nextCompleted })
      });
      
      setTasks(prev => prev.map(t => t._id === task._id ? updated : t));
      
      if (nextCompleted) {
        showToast('🎯 Goal complete! XP awarded.', 'success');
        await checkSystemAchievements();
      } else {
        showToast('Task status restored to active.', 'info');
      }
    } catch (err) {
      console.error('Toggle complete failed:', err);
      showToast('Failed to toggle task.', 'error');
    }
  };

  // Add a subtask
  const handleAddSubtask = async (taskId) => {
    const inputVal = subtaskInputs[taskId] || '';
    if (!inputVal.trim()) return;

    const task = tasks.find(t => t._id === taskId);
    if (!task) return;

    const updatedSubtasks = [...(task.subtasks || []), { title: inputVal.trim(), completed: false }];

    try {
      const updated = await apiFetch(`/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify({ subtasks: updatedSubtasks })
      });

      setTasks(prev => prev.map(t => t._id === taskId ? updated : t));
      setSubtaskInputs(prev => ({ ...prev, [taskId]: '' }));
      showToast('Subtask added.', 'success');
    } catch (err) {
      console.error('Add subtask failed:', err);
      showToast('Failed to add subtask.', 'error');
    }
  };

  // Toggle subtask complete state
  const handleToggleSubtask = async (taskId, subtaskIndex) => {
    const task = tasks.find(t => t._id === taskId);
    if (!task) return;

    const updatedSubtasks = task.subtasks.map((st, i) => 
      i === subtaskIndex ? { ...st, completed: !st.completed, completedAt: !st.completed ? new Date().toISOString() : null } : st
    );

    try {
      const updated = await apiFetch(`/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify({ subtasks: updatedSubtasks })
      });

      setTasks(prev => prev.map(t => t._id === taskId ? updated : t));
      showToast('Subtask status updated.', 'info');
    } catch (err) {
      console.error('Toggle subtask failed:', err);
    }
  };

  // XP achievements checker
  const checkSystemAchievements = async () => {
    try {
      const response = await apiFetch('/achievements/check', { method: 'POST' });
      if (response.unlocked && response.unlocked.length > 0) {
        showToast('🏆 Milestone Achieved! Check achievements page.', 'success');
      }
    } catch (err) {
      console.error('Achievements unlock check error:', err);
    }
  };

  // --- POMODORO TIMER CORE FUNCTIONS ---
  const toggleTimer = () => {
    if (timerRunning) {
      clearInterval(timerRef.current);
      setTimerRunning(false);
      showToast('Pomodoro session paused.', 'info');
    } else {
      setTimerRunning(true);
      showToast('Pomodoro session active. Keep focused!', 'success');
      timerRef.current = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const handleTimerComplete = async () => {
    clearInterval(timerRef.current);
    setTimerRunning(false);
    
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-500.wav');
      audio.volume = 0.2;
      audio.play();
    } catch (_) {}

    if (timerMode === 'focus') {
      showToast('🏆 Focus block complete! focused 25 minutes.', 'success');
      
      if (activeFocusTaskId) {
        const taskObj = tasks.find(t => t._id === activeFocusTaskId);
        if (taskObj) {
          const currentPomos = taskObj.pomodoros || 0;
          try {
            const updated = await apiFetch(`/tasks/${activeFocusTaskId}`, {
              method: 'PUT',
              body: JSON.stringify({ pomodoros: currentPomos + 1 })
            });
            setTasks(prev => prev.map(t => t._id === activeFocusTaskId ? updated : t));
          } catch (err) {
            console.error('Pomo increment sync failed:', err);
          }
        }
      }
      
      await checkSystemAchievements();
      
      setTimerMode('shortBreak');
      setTimerSeconds(300); // 5 min break
    } else {
      showToast('⏱️ Break complete! Ready to lock focus?', 'info');
      setTimerMode('focus');
      setTimerSeconds(1500); // 25 min focus
    }
  };

  const resetTimer = () => {
    clearInterval(timerRef.current);
    setTimerRunning(false);
    showToast('Timer reset.', 'info');
    if (timerMode === 'focus') setTimerSeconds(1500);
    else if (timerMode === 'shortBreak') setTimerSeconds(300);
    else setTimerSeconds(900); // 15 min longBreak
  };

  const selectTimerMode = (mode) => {
    clearInterval(timerRef.current);
    setTimerRunning(false);
    setTimerMode(mode);
    if (mode === 'focus') setTimerSeconds(1500);
    else if (mode === 'shortBreak') setTimerSeconds(300);
    else setTimerSeconds(900);
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  // --- FILTERING AND SEARCH GRAPH LOGIC ---
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(search.toLowerCase()) || 
                          (task.notes && task.notes.toLowerCase().includes(search.toLowerCase()));
    
    let matchesTab = true;
    if (activeFilter === 'active') matchesTab = !task.completed;
    else if (activeFilter === 'completed') matchesTab = task.completed;
    else if (activeFilter === 'high') matchesTab = task.priority === 'high';

    let matchesCategory = true;
    if (activeCategory !== 'all') {
      matchesCategory = task.category === activeCategory;
    }

    return matchesSearch && matchesTab && matchesCategory;
  });

  // Render Skeleton view if loading is active
  if (loading) {
    return <TasksSkeleton />;
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header and NLP Switch */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white font-sans tracking-tight">
            Smart Daily Task Log
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm font-medium">
            Plan priorities, track nested tasks, and complete structured Pomodoro blocks.
          </p>
        </div>
        
        <button
          onClick={() => setShowNlpBox(!showNlpBox)}
          className="glass-btn-secondary px-4 py-2 text-xs flex items-center gap-1.5 font-bold shrink-0 border border-blue-500/20 text-blue-600 dark:text-blue-400"
        >
          <Sparkles size={14} className="animate-pulse" />
          <span>{showNlpBox ? 'Standard Input Form' : 'AI Shorthand Magic'}</span>
        </button>
      </div>

      {/* Grid: Task Creator / Parser, and Pomodoro + Backlog */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Tasks Lists, Searches & Forms (Col span 2) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* AI NLP Shorthand Box (Collapsible) */}
          {showNlpBox ? (
            <div className="glass-card bg-gradient-to-r from-blue-600/5 to-indigo-600/5 border border-blue-500/20 p-5 rounded-2xl animate-slideDown">
              <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2 mb-2">
                <Sparkles size={16} className="text-blue-500" />
                <span>NLP Prompt Input Helper</span>
              </h4>
              <p className="text-xs text-slate-400 mb-4 font-medium">
                Type natural summaries like: *"Implement DB models tomorrow urgent @work"* and we'll auto-extract details!
              </p>
              <form onSubmit={handleParseNlp} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Task shorthand description..."
                  value={nlpInput}
                  onChange={(e) => setNlpInput(e.target.value)}
                  className="glass-input text-xs"
                />
                <button
                  type="submit"
                  disabled={nlpParsing}
                  className="glass-btn-primary px-5 text-xs font-bold shrink-0"
                >
                  {nlpParsing ? 'Extracting...' : 'AI magic'}
                </button>
              </form>
            </div>
          ) : (
            /* Standard Manual Input Form */
            <form onSubmit={handleAddTask} className="glass-card p-5 space-y-4 rounded-2xl">
              <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 mb-2">Create New Task</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <input
                    type="text"
                    required
                    placeholder="What are you working on today?"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="glass-input text-sm"
                  />
                </div>
                
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="glass-input text-xs font-semibold py-2.5"
                  >
                    <option value="high">🔴 High Priority</option>
                    <option value="medium">🟡 Medium Priority</option>
                    <option value="low">🔵 Low Priority</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="glass-input text-xs font-semibold py-2.5"
                  >
                    <option value="general">💼 General</option>
                    <option value="work">🏢 Work Projects</option>
                    <option value="study">📚 Study & Research</option>
                    <option value="personal">🏠 Personal Routine</option>
                    <option value="development">💻 Coding & Dev</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="glass-input text-xs py-2.5"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Tags (comma-separated)</label>
                  <input
                    type="text"
                    placeholder="ideas, coding, backlog"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    className="glass-input text-xs py-2.5"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button type="submit" className="glass-btn-primary py-2.5 px-6 text-xs flex items-center gap-1.5 font-bold">
                  <Plus size={14} />
                  <span>Create Daily Task</span>
                </button>
              </div>
            </form>
          )}

          {/* Search, Filter & Categories Navigation Bars */}
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search your daily task backlog..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="glass-input pl-10 py-2.5 text-xs"
                />
              </div>

              {/* Filtering Tabs */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { name: 'All Backlog', filter: 'all' },
                  { name: 'Active', filter: 'active' },
                  { name: 'Completed', filter: 'completed' },
                  { name: '🔴 High', filter: 'high' },
                ].map(tab => (
                  <button
                    key={tab.filter}
                    onClick={() => setActiveFilter(tab.filter)}
                    className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${
                      activeFilter === tab.filter
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 hover:bg-slate-200 dark:bg-brand-800/40 dark:hover:bg-brand-700/60 text-slate-500 dark:text-slate-355'
                    }`}
                  >
                    {tab.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Categories filter strips */}
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/50 dark:border-brand-800/30 pb-2">
              <Filter size={12} className="text-slate-400 shrink-0" />
              {[
                { name: 'All Categories', key: 'all' },
                { name: 'General', key: 'general' },
                { name: 'Work', key: 'work' },
                { name: 'Study', key: 'study' },
                { name: 'Personal', key: 'personal' },
                { name: 'Coding', key: 'development' },
              ].map(cat => (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                    activeCategory === cat.key
                      ? 'bg-blue-500/10 text-blue-500 dark:text-blue-400 font-bold'
                      : 'text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Core Backlog Tasks Listings */}
          <div className="space-y-4">
            {filteredTasks.length === 0 ? (
              <div className="text-center py-16 glass-card flex flex-col items-center justify-center text-slate-400 border-dashed animate-fadeIn">
                <Compass size={32} className="text-slate-300 dark:text-slate-700 mb-2 animate-spin [animation-duration:10s]" />
                <p className="text-xs font-semibold">No tasks found matching your filter criteria.</p>
                <p className="text-[10px] text-slate-450 mt-1 font-medium">Add a task or change active tab triggers to begin!</p>
              </div>
            ) : (
              filteredTasks.map(task => (
                <div 
                  key={task._id}
                  className={`glass-card p-5 transition-all duration-200 border-l-4 ${
                    task.completed 
                      ? 'opacity-60 border-slate-300 dark:border-brand-700/50 bg-slate-50/50 dark:bg-brand-900/10' 
                      : task.priority === 'high' 
                      ? 'border-rose-500 hover:shadow-lg hover:shadow-rose-500/5' 
                      : task.priority === 'medium'
                      ? 'border-orange-400 hover:shadow-lg hover:shadow-orange-500/5' 
                      : 'border-blue-500 hover:shadow-lg hover:shadow-blue-500/5'
                  }`}
                >
                  {/* Task Header Box */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <button 
                        onClick={() => handleToggleComplete(task)}
                        className="p-0.5 text-slate-400 hover:text-blue-500 rounded-lg shrink-0 mt-0.5"
                      >
                        {task.completed ? (
                          <div className="w-5 h-5 bg-blue-600 text-white rounded flex items-center justify-center">
                            <Check size={14} />
                          </div>
                        ) : (
                          <Square size={20} className="stroke-[1.5]" />
                        )}
                      </button>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-bold text-sm tracking-tight ${
                          task.completed 
                            ? 'line-through text-slate-400' 
                            : 'text-slate-800 dark:text-slate-105'
                        }`}>
                          {task.title}
                        </h4>
                        
                        {/* Tags and categories line */}
                        <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[10px] font-medium text-slate-400 shrink-0">
                          <span className="capitalize font-bold text-slate-500 dark:text-slate-350">{task.category}</span>
                          <span>•</span>
                          {task.dueDate && (
                            <span className="flex items-center gap-1">
                              <Calendar size={10} />
                              <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                            </span>
                          )}
                          {task.pomodoros > 0 && (
                            <span className="flex items-center gap-0.5 text-orange-500">
                              <Flame size={10} />
                              <span>{task.pomodoros} Pomos</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Delete and Active Focus selectors */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => {
                          setActiveFocusTaskId(task._id);
                          showToast('Active focus locked to task.', 'info');
                        }}
                        className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                          activeFocusTaskId === task._id
                            ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20'
                            : 'text-slate-400 hover:text-slate-650 dark:hover:text-slate-200'
                        }`}
                      >
                        <Flame size={12} />
                        <span className="hidden sm:inline">Focus</span>
                      </button>
                      
                      <button 
                        onClick={() => handleDeleteTask(task._id)}
                        className="p-2 rounded-xl text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Subtask listing fold */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-brand-800/40">
                    <div className="space-y-2 pl-8">
                      {task.subtasks && task.subtasks.map((st, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs py-1 animate-fadeIn">
                          <button 
                            onClick={() => handleToggleSubtask(task._id, idx)}
                            className="flex items-center gap-2 text-slate-650 dark:text-slate-300 font-medium text-left"
                          >
                            <span className="shrink-0 text-slate-400">
                              {st.completed ? <Check size={12} className="text-emerald-500 bg-emerald-500/10 rounded" /> : <div className="w-3 h-3 rounded-full border border-slate-300 dark:border-brand-600" />}
                            </span>
                            <span className={st.completed ? 'line-through text-slate-400' : ''}>
                              {st.title}
                            </span>
                          </button>
                        </div>
                      ))}

                      {/* Add subtask mini form */}
                      <div className="flex gap-2 pt-1 max-w-sm">
                        <input
                          type="text"
                          placeholder="Add subtask..."
                          value={subtaskInputs[task._id] || ''}
                          onChange={(e) => setSubtaskInputs(prev => ({ ...prev, [task._id]: e.target.value }))}
                          className="glass-input py-1.5 px-3 text-[10px] leading-tight"
                        />
                        <button
                          onClick={() => handleAddSubtask(task._id)}
                          className="px-3 py-1 bg-slate-200 hover:bg-slate-300 dark:bg-brand-850 dark:hover:bg-brand-700 text-[10px] font-bold rounded-lg text-slate-600 dark:text-slate-300 active:scale-95 transition-all"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              ))
            )}
          </div>

        </div>

        {/* Right Column: Pomodoro Focus Timer Panel */}
        <div className="space-y-6">
          <div className="glass-card flex flex-col items-center justify-center py-8 relative overflow-hidden text-center rounded-2xl">
            <div className="absolute top-0 right-0 p-3 bg-orange-500/10 rounded-bl-3xl text-orange-500">
              <Flame size={18} className="animate-pulse" />
            </div>

            {/* Timer Modes Tabs */}
            <div className="flex gap-1.5 bg-slate-100 dark:bg-brand-800/40 border border-slate-200/50 dark:border-brand-800/50 rounded-2xl p-1 mb-6">
              {[
                { name: 'Focus', key: 'focus' },
                { name: 'Short Break', key: 'shortBreak' },
                { name: 'Long Break', key: 'longBreak' },
              ].map(m => (
                <button
                  key={m.key}
                  onClick={() => selectTimerMode(m.key)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all ${
                    timerMode === m.key
                      ? 'bg-white dark:bg-brand-700 text-slate-800 dark:text-slate-100 shadow-sm'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>

            {/* Big Countdown */}
            <h3 className="font-extrabold text-5xl text-slate-800 dark:text-slate-100 font-sans tracking-tight leading-none mb-1">
              {formatTime(timerSeconds)}
            </h3>
            
            {/* Active task details if locked */}
            {activeFocusTaskId ? (
              <div className="mt-3 bg-orange-500/5 border border-orange-500/15 rounded-xl p-2 px-3 flex items-center gap-1.5 text-[10px] text-orange-500 font-bold max-w-[200px] truncate animate-fadeIn">
                <Zap size={10} className="animate-bounce" />
                <span>Target: {tasks.find(t => t._id === activeFocusTaskId)?.title}</span>
              </div>
            ) : (
              <p className="text-[10px] text-slate-400 mt-2 font-medium">Select a Focus target from the left backlog</p>
            )}

            {/* Buttons Control */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={toggleTimer}
                className="w-32 glass-btn-primary py-3 text-xs flex items-center justify-center gap-1.5 font-extrabold uppercase tracking-wider"
              >
                {timerRunning ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                <span>{timerRunning ? 'Pause' : 'Start'}</span>
              </button>

              <button
                onClick={resetTimer}
                className="p-3 bg-slate-100 hover:bg-slate-200 dark:bg-brand-800/40 dark:hover:bg-brand-700/60 rounded-xl text-slate-500 dark:text-slate-300 transition-colors"
              >
                <RotateCcw size={16} />
              </button>
            </div>
          </div>

          {/* Pomodoro Tip Card */}
          <div className="glass-card bg-gradient-to-br from-orange-500/5 to-yellow-500/5 border border-orange-500/10 rounded-2xl">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-orange-500/10 rounded-xl text-orange-500 shrink-0">
                <Clock size={18} />
              </div>
              <div>
                <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-150 uppercase tracking-wider">Pomodoro focus logic</h4>
                <p className="text-slate-500 dark:text-slate-450 text-[11px] leading-relaxed font-medium mt-1.5">
                  Completing a Focus session automatically logs the Pomodoro count to the target task and awards you +100 XP Level Rewards! Keep it ticking.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
export default Tasks;
