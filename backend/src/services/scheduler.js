const cron = require('node-cron');
const User = require('../models/User');
const Task = require('../models/Task');
const Log = require('../models/Log');
const Achievement = require('../models/Achievement');
const localDB = require('../config/localDB');
const emailService = require('./emailService');
const aiService = require('./aiService');

// DB Utility Helpers for environment-resilient querying
const getUsers = async () => {
  if (process.env.USE_LOCAL_JSON === 'true') {
    return await localDB.find('users');
  } else {
    try {
      return await User.find({});
    } catch (e) {
      console.warn('MongoDB query failed in scheduler, falling back to local JSON profiles.', e);
      return await localDB.find('users');
    }
  }
};

const getUserById = async (userId) => {
  if (process.env.USE_LOCAL_JSON === 'true') {
    return await localDB.findById('users', userId);
  } else {
    try {
      return await User.findById(userId);
    } catch (e) {
      return await localDB.findById('users', userId);
    }
  }
};

const updateTaskReminderSent = async (taskId) => {
  if (process.env.USE_LOCAL_JSON === 'true') {
    await localDB.findByIdAndUpdate('tasks', taskId, { reminderSent: true });
  } else {
    try {
      await Task.findByIdAndUpdate(taskId, { $set: { reminderSent: true } });
    } catch (e) {
      await localDB.findByIdAndUpdate('tasks', taskId, { reminderSent: true });
    }
  }
};

/**
 * 1. Background Task Reminders Checker
 * Runs every 5 minutes: check for upcoming tasks that have not received reminders
 */
const runTaskReminderJob = async () => {
  console.log('⏰ Running task reminders cron job check...');
  try {
    const now = new Date();
    let allPendingTasks = [];

    // Query active uncompleted tasks with due dates in the future
    if (process.env.USE_LOCAL_JSON === 'true') {
      const list = await localDB.find('tasks', { completed: false });
      allPendingTasks = list.filter(t => t.dueDate && new Date(t.dueDate) > now && !t.reminderSent);
    } else {
      try {
        allPendingTasks = await Task.find({
          completed: false,
          reminderSent: { $ne: true },
          dueDate: { $ne: null, $gt: now }
        });
      } catch (err) {
        const list = await localDB.find('tasks', { completed: false });
        allPendingTasks = list.filter(t => t.dueDate && new Date(t.dueDate) > now && !t.reminderSent);
      }
    }

    if (allPendingTasks.length === 0) {
      console.log('⏰ No pending task reminders due.');
      return;
    }

    for (const task of allPendingTasks) {
      const userId = task.user ? task.user.toString() : null;
      if (!userId) continue;

      const user = await getUserById(userId);
      if (!user || !user.email) continue;

      // Extract User Notification Preferences
      const prefs = user.emailPreferences || {
        emailNotificationsEnabled: true,
        reminderTiming: 30,
        preferenceReminders: true
      };

      if (!prefs.emailNotificationsEnabled || !prefs.preferenceReminders) {
        continue; // User disabled notifications or reminders specifically
      }

      // Calculate time gap until due date in minutes
      const diffMs = new Date(task.dueDate) - now;
      const diffMins = Math.round(diffMs / 1000 / 60);

      // Check if task is within the user's warning window (default 30m)
      if (diffMins > 0 && diffMins <= (prefs.reminderTiming || 30)) {
        console.log(`⏱️ Scheduling task deadline alert for ${user.email} (Task: "${task.title}", Due in: ${diffMins}m)`);
        
        // Optimistic toggle to avoid parallel queue dispatch duplicates
        await updateTaskReminderSent(task._id.toString());
        
        // Send email
        await emailService.sendTaskDeadlineReminder(user, task);
      }
    }
  } catch (err) {
    console.error('❌ Error executing task reminder background job:', err);
  }
};

/**
 * 2. Daily Summary Digest compiler
 * Runs daily at 7:00 PM: aggregate daily metrics and dispatch digests
 */
const runDailyDigestJob = async () => {
  console.log('⏰ Compiling daily productivity digests...');
  try {
    const users = await getUsers();
    const todayDateStr = new Date().toISOString().split('T')[0];

    for (const user of users) {
      const prefs = user.emailPreferences || {
        emailNotificationsEnabled: true,
        digestFrequency: 'daily',
        preferenceDigest: true
      };

      if (!prefs.emailNotificationsEnabled || !prefs.preferenceDigest || prefs.digestFrequency !== 'daily') {
        continue;
      }

      // Fetch user's tasks
      let tasks = [];
      if (process.env.USE_LOCAL_JSON === 'true') {
        tasks = await localDB.find('tasks', { user: user._id.toString() });
      } else {
        try {
          tasks = await Task.find({ user: user._id });
        } catch (e) {
          tasks = await localDB.find('tasks', { user: user._id.toString() });
        }
      }

      // Filter tasks completed today OR currently pending
      const completedToday = tasks.filter(t => {
        if (!t.completed) return false;
        const completeDate = t.updatedAt || t.createdAt;
        return completeDate && new Date(completeDate).toISOString().split('T')[0] === todayDateStr;
      });

      const pendingTasks = tasks.filter(t => !t.completed);

      // Total daily pomodoros
      const completedPomodoros = completedToday.reduce((sum, t) => sum + (t.pomodoros || 0), 0);

      // Gather or generate a Focus Score
      let dailyFocusScore = 60;
      if (completedToday.length > 0) {
        dailyFocusScore = Math.min(100, 50 + (completedToday.length * 15));
      }

      // Read tomorrow focus if stored in localStorage, or seed a placeholder
      const tomorrowFocus = user.theme === 'dark' ? "Deep Focus Block (Study/Dev Session)" : null;

      const digestStats = {
        completedCount: completedToday.length,
        pendingCount: pendingTasks.length,
        score: dailyFocusScore,
        streak: user.streak || 1,
        pomodoros: completedPomodoros,
        tomorrowFocus
      };

      console.log(`📬 Dispatching Daily Digest to: ${user.email} (Focus score: ${dailyFocusScore}%)`);
      await emailService.sendDailyProductivityDigest(user, digestStats);
    }
  } catch (err) {
    console.error('❌ Error compiling daily digests:', err);
  }
};

/**
 * 3. Weekly Analytics Report compiler
 * Runs weekly on Monday at 8:00 AM: aggregate past 7 days logs & send summaries
 */
const runWeeklyReportJob = async () => {
  console.log('⏰ Compiling weekly productivity analytics reports...');
  try {
    const users = await getUsers();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    for (const user of users) {
      const prefs = user.emailPreferences || {
        emailNotificationsEnabled: true,
        preferenceWeeklyReport: true
      };

      if (!prefs.emailNotificationsEnabled || !prefs.preferenceWeeklyReport) {
        continue;
      }

      // Fetch user tasks, logs & achievements
      let tasks = [];
      let logs = [];
      let achievements = [];

      const userId = user._id.toString();

      if (process.env.USE_LOCAL_JSON === 'true') {
        tasks = await localDB.find('tasks', { user: userId });
        logs = await localDB.find('logs', { user: userId });
        achievements = await localDB.find('achievements', { user: userId });
      } else {
        try {
          tasks = await Task.find({ user: user._id });
          logs = await Log.find({ user: user._id, createdAt: { $gte: oneWeekAgo } });
          achievements = await Achievement.find({ user: user._id });
        } catch (e) {
          tasks = await localDB.find('tasks', { user: userId });
          logs = await localDB.find('logs', { user: userId });
          achievements = await localDB.find('achievements', { user: userId });
        }
      }

      // Filter achievements unlocked in past week
      const unlockedAchievements = achievements.filter(ach => ach.unlocked);

      // Compute weekly analytics using our robust rule-based/Gemini AI Coaching service
      const analysis = await aiService.generateWeeklyProductivityAnalysis(tasks, logs, user.streak || 0);

      const weeklyReports = {
        weeklyRatio: analysis.completionRate,
        consistencyScore: analysis.focusScore,
        productiveHours: analysis.productiveHours,
        achievementsCount: unlockedAchievements.length || 0,
        aiFeedback: analysis.aiSummary
      };

      console.log(`📬 Dispatching Weekly Report to: ${user.email} (Completion rate: ${analysis.completionRate}%)`);
      await emailService.sendWeeklyProductivityReport(user, weeklyReports);
    }
  } catch (err) {
    console.error('❌ Error compiling weekly reports:', err);
  }
};

/**
 * Initialize Background Schedulers
 */
const initializeSchedulers = () => {
  console.log('⏰ Scheduling background productivity cron triggers initialized.');

  // 1. Task Reminders Loop: runs every 5 minutes
  cron.schedule('*/5 * * * *', () => {
    runTaskReminderJob().catch(err => console.error('Task reminder error:', err));
  });

  // 2. Daily Summary Digest: runs daily at 7:00 PM (19:00)
  cron.schedule('0 19 * * *', () => {
    runDailyDigestJob().catch(err => console.error('Daily digest error:', err));
  });

  // 3. Weekly Report: runs weekly on Mondays at 8:00 AM
  cron.schedule('0 8 * * 1', () => {
    runWeeklyReportJob().catch(err => console.error('Weekly report error:', err));
  });
};

module.exports = {
  initializeSchedulers,
  runTaskReminderJob,
  runDailyDigestJob,
  runWeeklyReportJob
};
