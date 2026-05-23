const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: String, // format YYYY-MM-DD
    required: true,
  },
  status: {
    type: String,
    enum: ['productive', 'missed'],
    required: true,
  },
  score: {
    type: Number,
    min: 0,
    max: 100,
    default: 50,
  },
  note: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Ensure uniqueness of (user, date) to avoid double entries
LogSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Log', LogSchema);
