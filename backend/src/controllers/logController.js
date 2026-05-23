const Log = require('../models/Log');
const localDB = require('../config/localDB');

// Get all logs (for streak and heatmap)
exports.getLogs = async (req, res) => {
  try {
    let logs = [];
    if (process.env.USE_LOCAL_JSON === 'true') {
      logs = await localDB.find('logs', { user: req.user.id });
    } else {
      logs = await Log.find({ user: req.user.id }).sort({ date: 1 });
    }
    res.json(logs);
  } catch (err) {
    console.error('getLogs error:', err);
    res.status(500).json({ message: 'Error retrieving logs' });
  }
};

// Create or update log for a specific date
exports.upsertLog = async (req, res) => {
  const { date, status, score, note } = req.body;

  try {
    if (!date || !status) {
      return res.status(400).json({ message: 'Date and status are required' });
    }

    const logData = {
      user: req.user.id,
      date, // YYYY-MM-DD
      status,
      score: score !== undefined ? score : 50,
      note: note || '',
    };

    let resultLog = null;

    if (process.env.USE_LOCAL_JSON === 'true') {
      const existing = await localDB.findOne('logs', { user: req.user.id, date });
      if (existing) {
        resultLog = await localDB.findByIdAndUpdate('logs', existing._id, logData);
      } else {
        resultLog = await localDB.create('logs', logData);
      }
    } else {
      resultLog = await Log.findOneAndUpdate(
        { user: req.user.id, date },
        { $set: logData },
        { new: true, upsert: true }
      );
    }

    res.json(resultLog);
  } catch (err) {
    console.error('upsertLog error:', err);
    res.status(500).json({ message: 'Error updating log' });
  }
};
