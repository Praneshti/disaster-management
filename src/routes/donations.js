const express = require('express');
const { body, validationResult } = require('express-validator');
const Donation = require('../models/Donation');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const items = await Donation.find().sort({ createdAt: -1 }).limit(500);
    return res.json({ success: true, data: items });
  } catch (err) {
    console.error('GET /api/donations error', err);
    return res.status(500).json({ success:false, message:'Server error' });
  }
});

// Get single donation by ID
router.get('/:id', async (req, res) => {
  try {
    const item = await Donation.findById(req.params.id);
    if (!item) return res.status(404).json({ success:false, message: 'Donation not found' });
    return res.json({ success:true, data: item });
  } catch (err) {
    console.error('GET /api/donations/:id error', err);
    return res.status(500).json({ success:false, message:'Server error' });
  }
});

// Update donation status (would typically be protected)
router.put('/:id/status',
  body('status').isIn(['pending_pickup', 'in_transit', 'distributed', 'completed']),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const item = await Donation.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (!item) return res.status(404).json({ message: 'Donation not found' });
    res.json(item);
  }
);

router.post('/', async (req, res) => {
  try {
    const { donorName, contact, contactInfo, item, itemType, quantity, location, notes, description } = req.body;
    const resolvedItem = item || itemType;
    if (!donorName || !(contact || contactInfo) || !resolvedItem || !quantity || !location) {
      return res.status(400).json({ success:false, message:'Missing required fields' });
    }
    const q = Number(quantity);
    if (isNaN(q) || q < 1) return res.status(400).json({ success:false, message:'Quantity must be >= 1' });
    const doc = await Donation.create({
      donorName,
      contactInfo: contact || contactInfo,
      itemType: resolvedItem,
      quantity: String(q),
      location,
      description: notes || description
    });
    console.log('Saved Donation id=', doc._id);
    return res.status(201).json({ success:true, data: doc });
  } catch (err) {
    console.error('POST /api/donations error', err);
    return res.status(500).json({ success:false, message:'Server error' });
  }
});

module.exports = router;
