const mongoose = require('mongoose');

const promoSchema = new mongoose.Schema({
  code:           { type: String, required: true, unique: true, uppercase: true, trim: true },
  description:    { type: String, default: '' },
  type:           { type: String, enum: ['percentage','fixed'], required: true },
  value:          { type: Number, required: true, min: 0 },
  minOrderAmount: { type: Number, default: 0 },
  maxDiscount:    { type: Number, default: null },
  usageLimit:     { type: Number, default: null },
  usedCount:      { type: Number, default: 0 },
  active:         { type: Boolean, default: true },
  expiresAt:      { type: Date, required: true },
  createdAt:      { type: Date, default: Date.now }
});

module.exports = mongoose.model('Promotion', promoSchema);
