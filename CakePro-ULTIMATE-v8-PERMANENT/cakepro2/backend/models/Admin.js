const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const adminSchema = new mongoose.Schema({
  username:    { type: String, required: true, unique: true, trim: true },
  password:    { type: String, required: true },
  name:        { type: String, default: 'Shop Admin' },
  email:       { type: String, default: 'admin@cakepro.com' },
  shopName:    { type: String, default: 'CakePro Bakery' },
  shopAddress: { type: String, default: '42, MG Road, Kochi, Kerala - 682016' },
  shopPhone:   { type: String, default: '9876543210' },
  shopGST:     { type: String, default: 'GST: 32ABCDE1234F1Z5' },
  upiId:       { type: String, default: 'cakepro@upi' },
  createdAt:   { type: Date, default: Date.now }
});

adminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

adminSchema.methods.comparePassword = function(p) { return bcrypt.compare(p, this.password); };

module.exports = mongoose.model('Admin', adminSchema);
