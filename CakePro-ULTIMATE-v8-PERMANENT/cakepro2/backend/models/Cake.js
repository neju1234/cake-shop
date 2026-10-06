const mongoose = require('mongoose');

const cakeSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true, minlength: 3 },
  description: { type: String, required: true, maxlength: 500 },
  price:       { type: Number, required: true, min: 0 },
  category:    { type: String, enum: ['birthday','wedding','anniversary','custom','cupcakes','cheesecake','pastry','other'], required: true },
  image:       { type: String, default: null },
  allergyInfo: [{ type: String, enum: ['nuts','dairy','gluten','eggs','soy','wheat','none'] }],
  discount:    { type: Number, default: 0, min: 0, max: 100 },
  available:   { type: Boolean, default: true },
  views:       { type: Number, default: 0 },
  totalSold:   { type: Number, default: 0 },
  createdAt:   { type: Date, default: Date.now },
  updatedAt:   { type: Date, default: Date.now }
}, { toJSON: { virtuals: true } });

cakeSchema.virtual('finalPrice').get(function() {
  return +(this.price * (1 - (this.discount || 0) / 100)).toFixed(2);
});

cakeSchema.pre('save', function(next) { this.updatedAt = Date.now(); next(); });

module.exports = mongoose.model('Cake', cakeSchema);
