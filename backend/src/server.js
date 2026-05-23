const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Create Express Server
const app = express();

// Connect to Database (falls back to local JSON files if unavailable)
connectDB();

// Middlewares
app.use(cors());
app.use(express.json());

// Base Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    environment: process.env.NODE_ENV || 'development',
    databaseMode: process.env.USE_LOCAL_JSON === 'true' ? 'Local JSON Files' : 'MongoDB Cloud Atlas'
  });
});

// Define Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/logs', require('./routes/logs'));
app.use('/api/plans', require('./routes/plans'));
app.use('/api/ideas', require('./routes/ideas'));
app.use('/api/achievements', require('./routes/achievements'));
app.use('/api/analytics', require('./routes/analytics'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ message: 'Internal server error, please contact support' });
});

// Run server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('\x1b[36m%s\x1b[0m', `🔥 Server starting up...`);
  console.log('\x1b[36m%s\x1b[0m', `💻 DY Productivity backend active on port http://localhost:${PORT}`);
});
