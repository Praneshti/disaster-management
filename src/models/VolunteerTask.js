const mongoose = require('mongoose');

const volunteerTaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  status: { type: String, enum: ['pending', 'in_progress', 'completed'], default: 'pending' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  relatedRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'Request' },
}, { timestamps: true });

module.exports = mongoose.model('VolunteerTask', volunteerTaskSchema);
