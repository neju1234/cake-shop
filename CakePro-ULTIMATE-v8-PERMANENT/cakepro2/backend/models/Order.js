const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  cake:      { type: mongoose.Schema.Types.ObjectId, ref: 'Cake', required: true },
  cakeName:  { type: String, required: true },
  category:  { type: String },
  quantity:  { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true },
  discount:  { type: Number, default: 0 },
  subtotal:  { type: Number, required: true }
});

const orderSchema = new mongoose.Schema({
  orderNumber:   { type: String, unique: true },
  customer:      { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  customerName:  { type: String },
  items:         [itemSchema],
  subtotal:      { type: Number, required: true },
  promoCode:     { type: String, default: null },
  promoDiscount: { type: Number, default: 0 },
  totalDiscount: { type: Number, default: 0 },
  total:         { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending','confirmed','preparing','ready','delivered','cancelled'],
    default: 'pending'
  },
  paymentMethod: { type: String, enum: ['cash','card','upi','online'], default: 'cash' },
  notes:         { type: String, default: '' },
  deliveryDate:  { type: Date, default: null },
  createdAt:     { type: Date, default: Date.now },
  updatedAt:     { type: Date, default: Date.now }
});

orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `CP-${String(count + 1).padStart(5, '0')}`;
  }
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Order', orderSchema);
