const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI;
  
  if (!mongoURI) {
    console.log('\x1b[33m%s\x1b[0m', '⚠️  No MONGO_URI provided in env. Switching to Local JSON Database storage.');
    process.env.USE_LOCAL_JSON = 'true';
    return;
  }

  try {
    // Attempt Mongoose connection with a 5-second timeout
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('\x1b[32m%s\x1b[0m', '🚀 Connected to MongoDB Cloud Atlas successfully!');
    process.env.USE_LOCAL_JSON = 'false';
  } catch (err) {
    console.error('\x1b[31m%s\x1b[0m', '❌ MongoDB connection failed:', err.message);
    console.log('\x1b[33m%s\x1b[0m', '⚠️  Auto-switching to Local JSON Database storage.');
    process.env.USE_LOCAL_JSON = 'true';
  }
};

module.exports = connectDB;
