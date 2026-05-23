const mongoose = require('mongoose');

const AnalyticsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  weekStartDate: {
    type: String, // 'YYYY-MM-DD' Monday
    required: true,
  },
  focusScore: {
    type: Number,
    default: 50,
  },
  completionRate: {
    type: Number,
    default: 0,
  },
  productiveHours: {
    type: Number,
    default: 0,
  },
  aiSummary: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

AnalyticsSchema.index({ user: 1, weekStartDate: 1 }, { unique: true });

module.exports = mongoose.model('Analytics', AnalyticsSchema);
