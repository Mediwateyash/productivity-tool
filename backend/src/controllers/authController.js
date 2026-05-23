const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const localDB = require('../config/localDB');

const JWT_SECRET = process.env.JWT_SECRET || 'dy_productivity_secret_key';

// Register a user
exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    let existingUser = null;
    
    // Check database mode
    if (process.env.USE_LOCAL_JSON === 'true') {
      existingUser = await localDB.findOne('users', { email: email.toLowerCase() });
    } else {
      existingUser = await User.findOne({ email: email.toLowerCase() });
    }

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let newUser = null;
    const userData = {
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      theme: 'dark',
      xp: 0,
      level: 1,
      streak: 0,
    };

    if (process.env.USE_LOCAL_JSON === 'true') {
      newUser = await localDB.create('users', userData);
    } else {
      const userInstance = new User(userData);
      newUser = await userInstance.save();
    }

    // Generate JWT
    const payload = {
      user: {
        id: newUser._id.toString()
      }
    };

    jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
      if (err) throw err;
      res.status(201).json({
        token,
        user: {
          id: newUser._id.toString(),
          name: newUser.name,
          email: newUser.email,
          theme: newUser.theme,
          xp: newUser.xp,
          level: newUser.level,
          streak: newUser.streak
        }
      });
    });

  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error, please try again' });
  }
};

// Login a user
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'Please enter email and password' });
    }

    let user = null;

    if (process.env.USE_LOCAL_JSON === 'true') {
      user = await localDB.findOne('users', { email: email.toLowerCase() });
    } else {
      user = await User.findOne({ email: email.toLowerCase() });
    }

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    const payload = {
      user: {
        id: user._id.toString()
      }
    };

    jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
      if (err) throw err;
      res.json({
        token,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          theme: user.theme,
          xp: user.xp,
          level: user.level,
          streak: user.streak
        }
      });
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error, please try again' });
  }
};

// Get current user profile
exports.getProfile = async (req, res) => {
  try {
    let user = null;

    if (process.env.USE_LOCAL_JSON === 'true') {
      user = await localDB.findById('users', req.user.id);
    } else {
      user = await User.findById(req.user.id).select('-password');
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      theme: user.theme || 'dark',
      xp: user.xp || 0,
      level: user.level || 1,
      streak: user.streak || 0
    });
  } catch (err) {
    console.error('Profile fetching error:', err);
    res.status(500).json({ message: 'Server error, profile fetch failed' });
  }
};

// Update profile / settings
exports.updateProfile = async (req, res) => {
  const { name, theme, xp, level, streak } = req.body;

  try {
    const updates = {};
    if (name) updates.name = name;
    if (theme) updates.theme = theme;
    if (xp !== undefined) updates.xp = xp;
    if (level !== undefined) updates.level = level;
    if (streak !== undefined) updates.streak = streak;

    let updatedUser = null;

    if (process.env.USE_LOCAL_JSON === 'true') {
      updatedUser = await localDB.findByIdAndUpdate('users', req.user.id, updates);
    } else {
      updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        { $set: updates },
        { new: true }
      ).select('-password');
    }

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      id: updatedUser._id.toString(),
      name: updatedUser.name,
      email: updatedUser.email,
      theme: updatedUser.theme,
      xp: updatedUser.xp,
      level: updatedUser.level,
      streak: updatedUser.streak
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ message: 'Server error, update failed' });
  }
};
