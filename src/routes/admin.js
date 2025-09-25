const express = require('express');
const { body, validationResult } = require('express-validator');
const { verifyToken, requireRoles } = require('../middleware/auth');
const User = require('../models/User');
const Request = require('../models/Request');
const VolunteerTask = require('../models/VolunteerTask');
const Donation = require('../models/Donation');

const router = express.Router();

// Approve NGO/Volunteer users
router.put('/users/:id/approve', verifyToken, requireRoles('admin'), async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { approved: true }, { new: true });
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
});

// Approve/Reject victim requests
router.put('/requests/:id/status', verifyToken, requireRoles('admin'),
  body('status').isIn(['approved','rejected','in_progress','completed']),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const item = await Request.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (!item) return res.status(404).json({ message: 'Request not found' });
    res.json(item);
  }
);

// Assign task to volunteer
router.post('/tasks', verifyToken, requireRoles('admin'),
  body('title').notEmpty(),
  body('assignedTo').isMongoId(),
  body('relatedRequest').optional().isMongoId(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const task = await VolunteerTask.create(req.body);
    res.status(201).json(task);
  }
);

// Reports
router.get('/reports/summary', verifyToken, requireRoles('admin'), async (req, res) => {
  const [requests, donations, tasks] = await Promise.all([
    Request.countDocuments(),
    Donation.countDocuments(),
    VolunteerTask.countDocuments(),
  ]);
  const pendingRequests = await Request.countDocuments({ status: 'pending' });
  res.json({ totals: { requests, donations, tasks }, pendingRequests });
});

module.exports = router;
