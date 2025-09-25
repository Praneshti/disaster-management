const express = require('express');
const { body, validationResult } = require('express-validator');
const { verifyToken, requireRoles } = require('../middleware/auth');
const VolunteerTask = require('../models/VolunteerTask');

const router = express.Router();

// View assigned tasks
router.get('/tasks', verifyToken, requireRoles('volunteer'), async (req, res) => {
  const tasks = await VolunteerTask.find({ assignedTo: req.user.id }).sort({ createdAt: -1 });
  res.json(tasks);
});

// Update task status
router.put('/tasks/:id/status', verifyToken, requireRoles('volunteer'),
  body('status').isIn(['pending', 'in_progress', 'completed']),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const updated = await VolunteerTask.findOneAndUpdate({ _id: req.params.id, assignedTo: req.user.id }, { status: req.body.status }, { new: true });
    if (!updated) return res.status(404).json({ message: 'Task not found' });
    res.json(updated);
  }
);

module.exports = router;
