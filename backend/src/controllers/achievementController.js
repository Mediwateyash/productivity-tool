const Achievement = require('../models/Achievement');
const User = require('../models/User');
const Task = require('../models/Task');
const Idea = require('../models/Idea');
const Log = require('../models/Log');
const localDB = require('../config/localDB');

const DEFAULT_ACHIEVEMENTS = [
  { key: 'first-task', title: 'Genesis Plan', description: 'Complete your first productivity task!', icon: 'CheckCircle', xpReward: 100 },
  { key: 'pomodoro-pioneer', title: 'Focus Pioneer', description: 'Complete your first Pomodoro session', icon: 'Flame', xpReward: 150 },
  { key: 'ideas-dump', title: 'Mind Unleashed', description: 'Store your first 3 notes in the Ideas Dump', icon: 'Lightbulb', xpReward: 100 },
  { key: 'streak-3', title: 'Consistent Runner', description: 'Achieve a 3-day productivity streak', icon: 'Award', xpReward: 200 },
  { key: 'streak-7', title: 'Productivity Titan', description: 'Maintain a 7-day streak', icon: 'Crown', xpReward: 500 },
];

// Seed achievements for a user if they don't exist
const ensureAchievements = async (userId) => {
  let list = [];
  if (process.env.USE_LOCAL_JSON === 'true') {
    list = await localDB.find('achievements', { user: userId });
    if (list.length === 0) {
      for (const ach of DEFAULT_ACHIEVEMENTS) {
        const item = await localDB.create('achievements', {
          user: userId,
          ...ach,
          unlocked: false,
          unlockedAt: null
        });
        list.push(item);
      }
    }
  } else {
    list = await Achievement.find({ user: userId });
    if (list.length === 0) {
      const docs = DEFAULT_ACHIEVEMENTS.map(ach => ({
        user: userId,
        ...ach,
        unlocked: false,
        unlockedAt: null
      }));
      await Achievement.insertMany(docs);
      list = await Achievement.find({ user: userId });
    }
  }
  return list;
};

// Get achievements
exports.getAchievements = async (req, res) => {
  try {
    const list = await ensureAchievements(req.user.id);
    res.json(list);
  } catch (err) {
    console.error('getAchievements error:', err);
    res.status(500).json({ message: 'Error retrieving achievements' });
  }
};

// Check and trigger achievement unlocks
exports.checkAchievements = async (req, res) => {
  const userId = req.user.id;

  try {
    // 1. Ensure user achievements are generated
    const achievements = await ensureAchievements(userId);

    // 2. Fetch user details, tasks, ideas, and logs to check rules
    let user = null;
    let completedTasksCount = 0;
    let pomodoroCount = 0;
    let ideasCount = 0;
    let streakCount = 0;

    if (process.env.USE_LOCAL_JSON === 'true') {
      user = await localDB.findById('users', userId);
      const tasks = await localDB.find('tasks', { user: userId, completed: true });
      completedTasksCount = tasks.length;
      
      const allTasks = await localDB.find('tasks', { user: userId });
      pomodoroCount = allTasks.reduce((acc, t) => acc + (t.pomodoros || 0), 0);

      const ideas = await localDB.find('ideas', { user: userId });
      ideasCount = ideas.length;

      streakCount = user.streak || 0;
    } else {
      user = await User.findById(userId);
      completedTasksCount = await Task.countDocuments({ user: userId, completed: true });
      
      const allTasks = await Task.find({ user: userId });
      pomodoroCount = allTasks.reduce((acc, t) => acc + (t.pomodoros || 0), 0);

      ideasCount = await Idea.countDocuments({ user: userId });
      streakCount = user.streak || 0;
    }

    const newlyUnlocked = [];
    let xpGained = 0;

    // Check each locked achievement
    for (const ach of achievements) {
      if (ach.unlocked) continue;

      let shouldUnlock = false;

      if (ach.key === 'first-task' && completedTasksCount >= 1) {
        shouldUnlock = true;
      } else if (ach.key === 'pomodoro-pioneer' && pomodoroCount >= 1) {
        shouldUnlock = true;
      } else if (ach.key === 'ideas-dump' && ideasCount >= 3) {
        shouldUnlock = true;
      } else if (ach.key === 'streak-3' && streakCount >= 3) {
        shouldUnlock = true;
      } else if (ach.key === 'streak-7' && streakCount >= 7) {
        shouldUnlock = true;
      }

      if (shouldUnlock) {
        const unlockData = {
          unlocked: true,
          unlockedAt: new Date().toISOString()
        };

        if (process.env.USE_LOCAL_JSON === 'true') {
          await localDB.findByIdAndUpdate('achievements', ach._id, unlockData);
        } else {
          await Achievement.findByIdAndUpdate(ach._id, { $set: unlockData });
        }

        newlyUnlocked.push({ ...ach, ...unlockData });
        xpGained += ach.xpReward;
      }
    }

    // Award XP and calculate Level-ups if achievements were unlocked
    if (newlyUnlocked.length > 0) {
      let currentXp = user.xp || 0;
      let currentLevel = user.level || 1;
      
      let newXp = currentXp + xpGained;
      
      // Dynamic Level formula: Level up every 500 XP
      let newLevel = Math.floor(newXp / 500) + 1;

      const userUpdates = { xp: newXp, level: newLevel };
      
      if (process.env.USE_LOCAL_JSON === 'true') {
        await localDB.findByIdAndUpdate('users', userId, userUpdates);
      } else {
        await User.findByIdAndUpdate(userId, { $set: userUpdates });
      }

      return res.json({
        unlocked: newlyUnlocked,
        xpGained,
        totalXp: newXp,
        newLevel,
        leveledUp: newLevel > currentLevel
      });
    }

    res.json({ unlocked: [], xpGained: 0 });
  } catch (err) {
    console.error('checkAchievements error:', err);
    res.status(500).json({ message: 'Error checking milestones' });
  }
};
