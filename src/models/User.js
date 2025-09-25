const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const USER_ROLES = ['admin', 'donor', 'ngo', 'volunteer', 'victim'];

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: USER_ROLES, default: 'victim' },
  approved: { type: Boolean, default: false }, // for NGO/Volunteer approval
  contact: { phone: String, address: String },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);
module.exports.USER_ROLES = USER_ROLES;
