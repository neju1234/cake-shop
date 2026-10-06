const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  email:       { type: String, required: true, unique: true, trim: true, lowercase: true },
  phone:       { type: String, required: true, trim: true, match: [/^\d{10}$/, 'Phone must be 10 digits'] },
  address:     { type: String, trim: true, default: '' },
  notes:       { type: String, default: '' },
  totalSpent:  { type: Number, default: 0 },
  totalOrders: { type: Number, default: 0 },
  createdAt:   { type: Date, default: Date.now }
});

module.exports = mongoose.model('Customer', customerSchema);
