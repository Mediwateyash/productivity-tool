const Idea = require('../models/Idea');
const localDB = require('../config/localDB');

// Get all ideas
exports.getIdeas = async (req, res) => {
  try {
    let ideas = [];
    if (process.env.USE_LOCAL_JSON === 'true') {
      ideas = await localDB.find('ideas', { user: req.user.id });
    } else {
      ideas = await Idea.find({ user: req.user.id }).sort({ updatedAt: -1 });
    }
    res.json(ideas);
  } catch (err) {
    console.error('getIdeas error:', err);
    res.status(500).json({ message: 'Error retrieving ideas' });
  }
};

// Create a new idea note
exports.createIdea = async (req, res) => {
  const { title, content, tags, category } = req.body;

  try {
    if (!title) {
      return res.status(400).json({ message: 'Idea title is required' });
    }

    const ideaData = {
      user: req.user.id,
      title,
      content: content || '',
      tags: tags || [],
      category: category || 'general',
      updatedAt: new Date().toISOString()
    };

    let newIdea = null;
    if (process.env.USE_LOCAL_JSON === 'true') {
      newIdea = await localDB.create('ideas', ideaData);
    } else {
      const ideaInstance = new Idea(ideaData);
      newIdea = await ideaInstance.save();
    }

    res.status(201).json(newIdea);
  } catch (err) {
    console.error('createIdea error:', err);
    res.status(500).json({ message: 'Error creating idea' });
  }
};

// Update an idea
exports.updateIdea = async (req, res) => {
  const { title, content, tags, category } = req.body;
  const ideaId = req.params.id;

  try {
    const updates = { updatedAt: new Date().toISOString() };
    if (title !== undefined) updates.title = title;
    if (content !== undefined) updates.content = content;
    if (tags !== undefined) updates.tags = tags;
    if (category !== undefined) updates.category = category;

    let updatedIdea = null;
    if (process.env.USE_LOCAL_JSON === 'true') {
      const existing = await localDB.findById('ideas', ideaId);
      if (!existing) {
        return res.status(404).json({ message: 'Idea not found' });
      }
      if (existing.user !== req.user.id) {
        return res.status(401).json({ message: 'Not authorized' });
      }
      updatedIdea = await localDB.findByIdAndUpdate('ideas', ideaId, updates);
    } else {
      const existing = await Idea.findById(ideaId);
      if (!existing) {
        return res.status(404).json({ message: 'Idea not found' });
      }
      if (existing.user.toString() !== req.user.id) {
        return res.status(401).json({ message: 'Not authorized' });
      }
      updatedIdea = await Idea.findByIdAndUpdate(
        ideaId,
        { $set: updates },
        { new: true }
      );
    }

    res.json(updatedIdea);
  } catch (err) {
    console.error('updateIdea error:', err);
    res.status(500).json({ message: 'Error updating idea' });
  }
};

// Delete an idea
exports.deleteIdea = async (req, res) => {
  const ideaId = req.params.id;

  try {
    if (process.env.USE_LOCAL_JSON === 'true') {
      const existing = await localDB.findById('ideas', ideaId);
      if (!existing) {
        return res.status(404).json({ message: 'Idea not found' });
      }
      if (existing.user !== req.user.id) {
        return res.status(401).json({ message: 'Not authorized' });
      }
      await localDB.findByIdAndDelete('ideas', ideaId);
    } else {
      const existing = await Idea.findById(ideaId);
      if (!existing) {
        return res.status(404).json({ message: 'Idea not found' });
      }
      if (existing.user.toString() !== req.user.id) {
        return res.status(401).json({ message: 'Not authorized' });
      }
      await Idea.findByIdAndDelete(ideaId);
    }

    res.json({ message: 'Idea deleted successfully' });
  } catch (err) {
    console.error('deleteIdea error:', err);
    res.status(500).json({ message: 'Error deleting idea' });
  }
};
