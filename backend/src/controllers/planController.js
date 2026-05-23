const Plan = require('../models/Plan');
const localDB = require('../config/localDB');

// Get weekly plan by weekStartDate (e.g. YYYY-MM-DD representing Monday)
exports.getPlan = async (req, res) => {
  const { weekStartDate } = req.query;

  if (!weekStartDate) {
    return res.status(400).json({ message: 'weekStartDate parameter is required' });
  }

  try {
    let plan = null;
    if (process.env.USE_LOCAL_JSON === 'true') {
      plan = await localDB.findOne('plans', { user: req.user.id, weekStartDate });
    } else {
      plan = await Plan.findOne({ user: req.user.id, weekStartDate });
    }

    if (!plan) {
      // Return a blank template so frontend is easy to initialize
      return res.json({
        user: req.user.id,
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
      });
    }

    res.json(plan);
  } catch (err) {
    console.error('getPlan error:', err);
    res.status(500).json({ message: 'Error retrieving weekly plan' });
  }
};

// Create or update a weekly plan
exports.upsertPlan = async (req, res) => {
  const { weekStartDate, weeklyFocus, priorityTasks, schedule } = req.body;

  if (!weekStartDate) {
    return res.status(400).json({ message: 'weekStartDate is required' });
  }

  try {
    const planData = {
      user: req.user.id,
      weekStartDate,
      weeklyFocus: weeklyFocus || '',
      priorityTasks: priorityTasks || [],
      schedule: schedule || [],
    };

    let resultPlan = null;
    if (process.env.USE_LOCAL_JSON === 'true') {
      const existing = await localDB.findOne('plans', { user: req.user.id, weekStartDate });
      if (existing) {
        resultPlan = await localDB.findByIdAndUpdate('plans', existing._id, planData);
      } else {
        resultPlan = await localDB.create('plans', planData);
      }
    } else {
      resultPlan = await Plan.findOneAndUpdate(
        { user: req.user.id, weekStartDate },
        { $set: planData },
        { new: true, upsert: true }
      );
    }

    res.json(resultPlan);
  } catch (err) {
    console.error('upsertPlan error:', err);
    res.status(500).json({ message: 'Error saving weekly planner' });
  }
};
