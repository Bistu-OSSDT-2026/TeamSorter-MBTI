import express from 'express';
import Skill from '../models/Skill.js';

const router = express.Router();

// Get all skills (or by parentId if needed)
// Currently returns all for simplicity, but could be filtered by parentId
router.get('/', async (req, res) => {
  try {
    const { parentId, type } = req.query;
    const filter = {};
    if (parentId) filter.parentId = parentId;
    if (type) filter.type = type;

    const skills = await Skill.find(filter).sort({ createdAt: -1 });
    res.json(skills);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a single skill by ID
router.get('/:id', async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id);
    if (!skill) return res.status(404).json({ message: 'Skill not found' });
    res.json(skill);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a new skill or folder
router.post('/', async (req, res) => {
  const { name, description, type, parentId, data } = req.body;
  const skill = new Skill({
    name,
    description,
    type,
    parentId,
    data
  });

  try {
    const newSkill = await skill.save();
    res.status(201).json(newSkill);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update a skill
router.put('/:id', async (req, res) => {
  try {
    const { name, description, data } = req.body;
    const updateData = { updatedAt: Date.now() };
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (data) updateData.data = data;

    const updatedSkill = await Skill.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    if (!updatedSkill) return res.status(404).json({ message: 'Skill not found' });
    res.json(updatedSkill);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a skill
router.delete('/:id', async (req, res) => {
  try {
    const skill = await Skill.findByIdAndDelete(req.params.id);
    if (!skill) return res.status(404).json({ message: 'Skill not found' });

    // Optional: Delete children if it's a folder
    // await Skill.deleteMany({ parentId: req.params.id });

    res.json({ message: 'Skill deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
