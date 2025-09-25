const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  donorName: { type: String, required: true },
  itemType: { type: String, required: true },
  quantity: { type: String, required: true }, 
  location: { type: String, required: true },
  contactInfo: { type: String, required: true },
  availability: { type: String },
  description: { type: String },
  anonymous: { type: Boolean, default: false },
  status: { type: String, enum: ['pending_pickup', 'in_transit', 'distributed', 'completed'], default: 'pending_pickup' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Donation', donationSchema);
