const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  theme: {
    type: String,
    default: 'dark',
  },
  xp: {
    type: Number,
    default: 0,
  },
  level: {
    type: Number,
    default: 1,
  },
  streak: {
    type: Number,
    default: 0,
  },
  emailPreferences: {
    emailNotificationsEnabled: { type: Boolean, default: true },
    reminderTiming: { type: Number, default: 30 }, // minutes before due date
    digestFrequency: { type: String, enum: ['daily', 'weekly', 'none'], default: 'daily' },
    preferenceReminders: { type: Boolean, default: true },
    preferenceDigest: { type: Boolean, default: true },
    preferenceWeeklyReport: { type: Boolean, default: true }
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('User', UserSchema);
