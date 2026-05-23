const mongoose = require('mongoose');

const DayPlanSchema = new mongoose.Schema({
  day: {
    type: String, // 'Monday', 'Tuesday', etc.
    required: true,
  },
  goals: [String],
  focus: {
    type: String,
    default: '',
  },
});

const PlanSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  weekStartDate: {
    type: String, // 'YYYY-MM-DD' representing Monday of the week
    required: true,
  },
  weeklyFocus: {
    type: String,
    default: '',
  },
  priorityTasks: [String], // high level priorities for the week
  schedule: [DayPlanSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Ensure a single plan per week for a user
PlanSchema.index({ user: 1, weekStartDate: 1 }, { unique: true });

module.exports = mongoose.model('Plan', PlanSchema);
