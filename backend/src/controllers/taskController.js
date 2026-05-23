const Task = require('../models/Task');
const localDB = require('../config/localDB');

// Get all tasks
exports.getTasks = async (req, res) => {
  try {
    let tasks = [];
    if (process.env.USE_LOCAL_JSON === 'true') {
      tasks = await localDB.find('tasks', { user: req.user.id });
    } else {
      tasks = await Task.find({ user: req.user.id }).sort({ createdAt: -1 });
    }
    res.json(tasks);
  } catch (err) {
    console.error('getTasks error:', err);
    res.status(500).json({ message: 'Error retrieving tasks' });
  }
};

// Create a task
exports.createTask = async (req, res) => {
  const { title, completed, priority, dueDate, category, tags, notes, subtasks } = req.body;

  try {
    if (!title) {
      return res.status(400).json({ message: 'Task title is required' });
    }

    const taskData = {
      user: req.user.id,
      title,
      completed: completed || false,
      completedAt: completed ? new Date() : null,
      priority: priority || 'medium',
      dueDate: dueDate || null,
      category: category || 'general',
      tags: tags || [],
      notes: notes || '',
      pomodoros: 0,
      subtasks: subtasks || [],
    };

    let newTask = null;
    if (process.env.USE_LOCAL_JSON === 'true') {
      newTask = await localDB.create('tasks', taskData);
    } else {
      const taskInstance = new Task(taskData);
      newTask = await taskInstance.save();
    }

    res.status(201).json(newTask);
  } catch (err) {
    console.error('createTask error:', err);
    res.status(500).json({ message: 'Error creating task' });
  }
};

// Update a task
exports.updateTask = async (req, res) => {
  const { title, completed, priority, dueDate, category, tags, notes, pomodoros, subtasks } = req.body;
  const taskId = req.params.id;

  try {
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (completed !== undefined) {
      updates.completed = completed;
      updates.completedAt = completed ? new Date() : null;
    }
    if (priority !== undefined) updates.priority = priority;
    if (dueDate !== undefined) updates.dueDate = dueDate;
    if (category !== undefined) updates.category = category;
    if (tags !== undefined) updates.tags = tags;
    if (notes !== undefined) updates.notes = notes;
    if (pomodoros !== undefined) updates.pomodoros = pomodoros;
    if (subtasks !== undefined) updates.subtasks = subtasks;

    let updatedTask = null;
    if (process.env.USE_LOCAL_JSON === 'true') {
      // Confirm item ownership before update
      const existing = await localDB.findById('tasks', taskId);
      if (!existing) {
        return res.status(404).json({ message: 'Task not found' });
      }
      if (existing.user !== req.user.id) {
        return res.status(401).json({ message: 'Not authorized' });
      }
      updatedTask = await localDB.findByIdAndUpdate('tasks', taskId, updates);
    } else {
      const existing = await Task.findById(taskId);
      if (!existing) {
        return res.status(404).json({ message: 'Task not found' });
      }
      if (existing.user.toString() !== req.user.id) {
        return res.status(401).json({ message: 'Not authorized' });
      }
      updatedTask = await Task.findByIdAndUpdate(
        taskId,
        { $set: updates },
        { new: true }
      );
    }

    res.json(updatedTask);
  } catch (err) {
    console.error('updateTask error:', err);
    res.status(500).json({ message: 'Error updating task' });
  }
};

// Delete a task
exports.deleteTask = async (req, res) => {
  const taskId = req.params.id;

  try {
    if (process.env.USE_LOCAL_JSON === 'true') {
      const existing = await localDB.findById('tasks', taskId);
      if (!existing) {
        return res.status(404).json({ message: 'Task not found' });
      }
      if (existing.user !== req.user.id) {
        return res.status(401).json({ message: 'Not authorized' });
      }
      await localDB.findByIdAndDelete('tasks', taskId);
    } else {
      const existing = await Task.findById(taskId);
      if (!existing) {
        return res.status(404).json({ message: 'Task not found' });
      }
      if (existing.user.toString() !== req.user.id) {
        return res.status(401).json({ message: 'Not authorized' });
      }
      await Task.findByIdAndDelete(taskId);
    }

    res.json({ message: 'Task removed successfully' });
  } catch (err) {
    console.error('deleteTask error:', err);
    res.status(500).json({ message: 'Error deleting task' });
  }
};
