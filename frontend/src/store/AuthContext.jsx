import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('dy_token'));
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Initialize Auth state
  useEffect(() => {
    const initializeAuth = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/auth/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data);
          setIsDemoMode(false);
        } else {
          // Token expired or invalid
          logout();
        }
      } catch (err) {
        console.warn('Backend server unreachable, auto-falling back to Demo Mode locally.');
        // Fallback to local demo profile if server is down!
        const savedDemoUser = localStorage.getItem('dy_demo_user');
        if (savedDemoUser) {
          setUser(JSON.parse(savedDemoUser));
          setIsDemoMode(true);
        } else {
          logout();
        }
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [token]);

  // Unified Fetch Client that automatically appends Auth token and falls back to mock logic if server is offline!
  const apiFetch = async (endpoint, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const mergedOptions = {
      ...options,
      headers
    };

    try {
      const response = await fetch(`${API_URL}${endpoint}`, mergedOptions);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'API request failed');
      }
      return await response.json();
    } catch (err) {
      // If we are in demo mode or server is down, we act as a frontend mock fallback database!
      console.warn(`API call ${endpoint} failed, checking Local Storage fallback.`, err);
      return handleLocalMockFallback(endpoint, options);
    }
  };

  // Mock logic to support 100% full frontend interactivity even when backend is offline!
  const handleLocalMockFallback = (endpoint, options) => {
    const method = options.method || 'GET';
    const body = options.body ? JSON.parse(options.body) : null;

    // 1. Daily tasks
    if (endpoint.startsWith('/tasks')) {
      let tasks = JSON.parse(localStorage.getItem('dy_mock_tasks') || '[]');
      
      if (method === 'GET') {
        return tasks;
      }
      if (method === 'POST') {
        const newTask = {
          _id: 'mock_task_' + Math.random().toString(36).substr(2, 9),
          title: body.title,
          completed: false,
          priority: body.priority || 'medium',
          dueDate: body.dueDate || null,
          category: body.category || 'general',
          tags: body.tags || [],
          notes: body.notes || '',
          pomodoros: 0,
          subtasks: body.subtasks || [],
          createdAt: new Date().toISOString()
        };
        tasks.push(newTask);
        localStorage.setItem('dy_mock_tasks', JSON.stringify(tasks));
        return newTask;
      }
      if (method === 'PUT') {
        const id = endpoint.split('/')[2];
        tasks = tasks.map(t => t._id === id ? { ...t, ...body } : t);
        localStorage.setItem('dy_mock_tasks', JSON.stringify(tasks));
        return tasks.find(t => t._id === id);
      }
      if (method === 'DELETE') {
        const id = endpoint.split('/')[2];
        tasks = tasks.filter(t => t._id !== id);
        localStorage.setItem('dy_mock_tasks', JSON.stringify(tasks));
        return { message: 'Task deleted locally' };
      }
    }

    // 2. 60-day Tracker logs
    if (endpoint.startsWith('/logs')) {
      let logs = JSON.parse(localStorage.getItem('dy_mock_logs') || '[]');
      if (method === 'GET') {
        return logs;
      }
      if (method === 'POST') {
        const existingIndex = logs.findIndex(l => l.date === body.date);
        const logData = {
          _id: 'mock_log_' + Math.random().toString(36).substr(2, 9),
          date: body.date,
          status: body.status,
          score: body.score || 50,
          note: body.note || ''
        };
        if (existingIndex !== -1) {
          logs[existingIndex] = { ...logs[existingIndex], ...logData };
        } else {
          logs.push(logData);
        }
        localStorage.setItem('dy_mock_logs', JSON.stringify(logs));
        return logData;
      }
    }

    // 3. Weekly Planner
    if (endpoint.startsWith('/plans')) {
      if (method === 'GET') {
        const weekStartDate = new URLSearchParams(endpoint.split('?')[1]).get('weekStartDate');
        let plans = JSON.parse(localStorage.getItem('dy_mock_plans') || '[]');
        let plan = plans.find(p => p.weekStartDate === weekStartDate);
        if (!plan) {
          return {
            weekStartDate,
            weeklyFocus: '',
            priorityTasks: [],
            schedule: [
              { day: 'Monday', goals: [], focus: '' },
              { day: 'Tuesday', goals: [], focus: '' },
              { day: 'Wednesday', goals: [], focus: '' },
              { day: 'Thursday', goals: [], focus: '' },
              { day: 'Friday', goals: [], focus: '' },
              { day: 'Saturday', goals: [], focus: '' },
              { day: 'Sunday', goals: [], focus: '' },
            ]
          };
        }
        return plan;
      }
      if (method === 'POST') {
        let plans = JSON.parse(localStorage.getItem('dy_mock_plans') || '[]');
        const existingIndex = plans.findIndex(p => p.weekStartDate === body.weekStartDate);
        if (existingIndex !== -1) {
          plans[existingIndex] = { ...plans[existingIndex], ...body };
        } else {
          plans.push({ _id: 'mock_plan_' + Math.random().toString(36).substr(2, 9), ...body });
        }
        localStorage.setItem('dy_mock_plans', JSON.stringify(plans));
        return body;
      }
    }

    // 4. Ideas Dump
    if (endpoint.startsWith('/ideas')) {
      let ideas = JSON.parse(localStorage.getItem('dy_mock_ideas') || '[]');
      if (method === 'GET') {
        return ideas;
      }
      if (method === 'POST') {
        const newIdea = {
          _id: 'mock_idea_' + Math.random().toString(36).substr(2, 9),
          title: body.title,
          content: body.content || '',
          tags: body.tags || [],
          category: body.category || 'general',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        ideas.push(newIdea);
        localStorage.setItem('dy_mock_ideas', JSON.stringify(ideas));
        return newIdea;
      }
      if (method === 'PUT') {
        const id = endpoint.split('/')[2];
        ideas = ideas.map(i => i._id === id ? { ...i, ...body, updatedAt: new Date().toISOString() } : i);
        localStorage.setItem('dy_mock_ideas', JSON.stringify(ideas));
        return ideas.find(i => i._id === id);
      }
      if (method === 'DELETE') {
        const id = endpoint.split('/')[2];
        ideas = ideas.filter(i => i._id !== id);
        localStorage.setItem('dy_mock_ideas', JSON.stringify(ideas));
        return { message: 'Idea deleted locally' };
      }
    }

    // 5. Achievements
    if (endpoint.startsWith('/achievements')) {
      let achievements = JSON.parse(localStorage.getItem('dy_mock_achievements') || '[]');
      if (achievements.length === 0) {
        achievements = [
          { _id: 'ach1', key: 'first-task', title: 'Genesis Plan', description: 'Complete your first productivity task!', icon: 'CheckCircle', xpReward: 100, unlocked: false },
          { _id: 'ach2', key: 'pomodoro-pioneer', title: 'Focus Pioneer', description: 'Complete your first Pomodoro session', icon: 'Flame', xpReward: 150, unlocked: false },
          { _id: 'ach3', key: 'ideas-dump', title: 'Mind Unleashed', description: 'Store your first 3 notes in the Ideas Dump', icon: 'Lightbulb', xpReward: 100, unlocked: false },
          { _id: 'ach4', key: 'streak-3', title: 'Consistent Runner', description: 'Achieve a 3-day productivity streak', icon: 'Award', xpReward: 200, unlocked: false },
          { _id: 'ach5', key: 'streak-7', title: 'Productivity Titan', description: 'Maintain a 7-day streak', icon: 'Crown', xpReward: 500, unlocked: false },
        ];
        localStorage.setItem('dy_mock_achievements', JSON.stringify(achievements));
      }

      if (method === 'GET') {
        return achievements;
      }

      if (endpoint.endsWith('/check')) {
        let tasks = JSON.parse(localStorage.getItem('dy_mock_tasks') || '[]');
        let completedCount = tasks.filter(t => t.completed).length;
        let pomodoros = tasks.reduce((sum, t) => sum + (t.pomodoros || 0), 0);
        let ideasCount = JSON.parse(localStorage.getItem('dy_mock_ideas') || '[]').length;
        let streak = user?.streak || 0;

        let newlyUnlocked = [];
        let xpGained = 0;

        achievements = achievements.map(ach => {
          if (ach.unlocked) return ach;

          let shouldUnlock = false;
          if (ach.key === 'first-task' && completedCount >= 1) shouldUnlock = true;
          if (ach.key === 'pomodoro-pioneer' && pomodoros >= 1) shouldUnlock = true;
          if (ach.key === 'ideas-dump' && ideasCount >= 3) shouldUnlock = true;
          if (ach.key === 'streak-3' && streak >= 3) shouldUnlock = true;
          if (ach.key === 'streak-7' && streak >= 7) shouldUnlock = true;

          if (shouldUnlock) {
            newlyUnlocked.push(ach);
            xpGained += ach.xpReward;
            return { ...ach, unlocked: true, unlockedAt: new Date().toISOString() };
          }
          return ach;
        });

        if (newlyUnlocked.length > 0) {
          localStorage.setItem('dy_mock_achievements', JSON.stringify(achievements));
          const updatedUser = {
            ...user,
            xp: (user.xp || 0) + xpGained,
            level: Math.floor(((user.xp || 0) + xpGained) / 500) + 1
          };
          setUser(updatedUser);
          localStorage.setItem('dy_demo_user', JSON.stringify(updatedUser));
          
          return {
            unlocked: newlyUnlocked,
            xpGained,
            totalXp: updatedUser.xp,
            newLevel: updatedUser.level,
            leveledUp: updatedUser.level > user.level
          };
        }
        return { unlocked: [], xpGained: 0 };
      }
    }

    // 6. Analytics report
    if (endpoint.startsWith('/analytics')) {
      if (endpoint.includes('/chat')) {
        const chatPrompt = body.message.toLowerCase();
        let reply = "I am your productivity coach. Try setting a clear focus block today and complete 3 high-priority tasks!";
        if (chatPrompt.includes('procrastinate') || chatPrompt.includes('lazy')) {
          reply = "Procrastination occurs when the start barrier is too high. Shrink your tasks! Commit to working for just 5 minutes.";
        } else if (chatPrompt.includes('pomodoro') || chatPrompt.includes('focus')) {
          reply = "The Pomodoro Technique is highly effective! Try doing 25 minutes of deep focus followed by a 5-minute break.";
        }
        return { reply };
      }

      let tasks = JSON.parse(localStorage.getItem('dy_mock_tasks') || '[]');
      let logs = JSON.parse(localStorage.getItem('dy_mock_logs') || '[]');
      let completedCount = tasks.filter(t => t.completed).length;
      let totalCount = tasks.length;
      let completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
      
      let averageDailyScore = 50;
      if (logs.length > 0) {
        averageDailyScore = Math.round(logs.reduce((s, l) => s + l.score, 0) / logs.length);
      }

      return {
        focusScore: averageDailyScore,
        completionRate,
        productiveHours: completedCount * 1.5,
        aiSummary: completionRate > 50 
          ? `Solid progress! Your task completion rate is ${completionRate}%. Try to target early-morning focus blocks tomorrow.` 
          : `Let's work together to boost your focus! Micro-tasks are excellent for breaking procrastination loops.`,
        charts: {
          focusTrends: [
            { name: 'Week 1', score: 62 },
            { name: 'Week 2', score: 68 },
            { name: 'Week 3', score: 75 },
            { name: 'Week 4', score: averageDailyScore }
          ],
          productiveHoursData: [
            { hour: '08:00', productivity: 40 },
            { hour: '10:00', productivity: 85 },
            { hour: '12:00', productivity: 60 },
            { hour: '14:00', productivity: 75 },
            { hour: '16:00', productivity: 90 },
            { hour: '18:00', productivity: 30 }
          ],
          completionGrid: []
        }
      };
    }

    throw new Error('Endpoint not supported in Offline Fallback');
  };

  // Register
  const register = async (name, email, password) => {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      if (response.ok) {
        const data = await response.json();
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('dy_token', data.token);
        setIsDemoMode(false);
        return data.user;
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Registration failed');
      }
    } catch (err) {
      console.warn('Backend unavailable, creating offline Local User profile instead.');
      // Offline fallback profile
      const demoUser = {
        id: 'demo_' + Math.random().toString(36).substr(2, 9),
        name,
        email,
        theme: 'dark',
        xp: 0,
        level: 1,
        streak: 1
      };
      setUser(demoUser);
      setToken('demo_token_active');
      setIsDemoMode(true);
      localStorage.setItem('dy_token', 'demo_token_active');
      localStorage.setItem('dy_demo_user', JSON.stringify(demoUser));
      
      // Initialize some cool seed tasks for them so the dashboard looks awesome immediately!
      const seedTasks = [
        { _id: 'seed_1', title: 'Explore DY Productivity Dashboard 🚀', completed: false, priority: 'high', category: 'general', tags: ['onboarding'], pomodoros: 0, subtasks: [], createdAt: new Date().toISOString() },
        { _id: 'seed_2', title: 'Try custom Pomodoro focus timer ⏱️', completed: false, priority: 'medium', category: 'study', tags: ['focus'], pomodoros: 0, subtasks: [], createdAt: new Date().toISOString() },
        { _id: 'seed_3', title: 'Brainstorm creative project ideas 💡', completed: false, priority: 'low', category: 'work', tags: ['planning'], pomodoros: 0, subtasks: [], createdAt: new Date().toISOString() }
      ];
      localStorage.setItem('dy_mock_tasks', JSON.stringify(seedTasks));

      return demoUser;
    }
  };

  // Login
  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        const data = await response.json();
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('dy_token', data.token);
        setIsDemoMode(false);
        return data.user;
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Login failed');
      }
    } catch (err) {
      console.warn('Backend unavailable, checking for local Demo profiles.');
      const savedUser = localStorage.getItem('dy_demo_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed.email === email) {
          setUser(parsed);
          setToken('demo_token_active');
          setIsDemoMode(true);
          localStorage.setItem('dy_token', 'demo_token_active');
          return parsed;
        }
      }
      throw new Error('Offline database mismatch. Provide the offline user registered email or connect backend.');
    }
  };

  // Update profile
  const updateProfile = async (updates) => {
    if (isDemoMode) {
      const updated = { ...user, ...updates };
      setUser(updated);
      localStorage.setItem('dy_demo_user', JSON.stringify(updated));
      return updated;
    }

    try {
      const updated = await apiFetch('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      setUser(updated);
      return updated;
    } catch (err) {
      console.error('Update profile failed:', err);
    }
  };

  // Logout
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('dy_token');
    // Keep local demo accounts intact so they don't lose mock-offline test sessions!
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      isDemoMode,
      register,
      login,
      logout,
      updateProfile,
      apiFetch
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
