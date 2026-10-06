const router    = require('express').Router();
const auth      = require('../middleware/auth');
const Order     = require('../models/Order');
const Cake      = require('../models/Cake');
const Customer  = require('../models/Customer');
const Promotion = require('../models/Promotion');

// GET all orders
router.get('/', auth, async (req, res) => {
  try {
    const { status, startDate, endDate, customerId } = req.query;
    const q = {};
    if (status)     q.status = status;
    if (customerId) q.customer = customerId;
    if (startDate || endDate) {
      q.createdAt = {};
      if (startDate) q.createdAt.$gte = new Date(startDate);
      if (endDate)   { const e = new Date(endDate); e.setHours(23,59,59,999); q.createdAt.$lte = e; }
    }
    const orders = await Order.find(q)
      .populate('customer','name email phone')
      .populate('items.cake','name image')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: orders.length, data: orders });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

// GET single order (for bill)
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer','name email phone address')
      .populate('items.cake','name image category');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, data: order });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

// GET sales report
router.get('/report/sales', auth, async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query;
    let start, end;
    const now = new Date();
    if (type === 'daily')        { start = new Date(now.getFullYear(),now.getMonth(),now.getDate()); end = new Date(start); end.setHours(23,59,59,999); }
    else if (type === 'monthly') { start = new Date(now.getFullYear(),now.getMonth(),1); end = new Date(now.getFullYear(),now.getMonth()+1,0,23,59,59); }
    else if (startDate && endDate) { start=new Date(startDate); end=new Date(endDate); end.setHours(23,59,59,999); }
    else return res.status(400).json({ success: false, message: 'Provide type or date range' });

    const orders = await Order.find({ createdAt:{$gte:start,$lte:end}, status:{$ne:'cancelled'} })
      .populate('customer','name email phone');
    const totalRevenue = orders.reduce((s,o)=>s+o.total,0);
    res.json({ success: true, data: { orders, totalRevenue:+totalRevenue.toFixed(2), totalOrders:orders.length, from:start, to:end } });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

// POST create order
router.post('/', auth, async (req, res) => {
  try {
    const { customerId, items, promoCode, notes, deliveryDate, paymentMethod } = req.body;
    if (!customerId) return res.status(400).json({ success: false, message: 'Customer required' });
    if (!items?.length) return res.status(400).json({ success: false, message: 'Add at least one item' });

    const customer = await Customer.findById(customerId);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

    let subtotal = 0;
    const orderItems = [];
    for (const item of items) {
      const cake = await Cake.findById(item.cakeId);
      if (!cake) return res.status(404).json({ success: false, message: `Cake not found` });
      if (!cake.available) return res.status(400).json({ success: false, message: `${cake.name} is unavailable` });
      const unit = cake.finalPrice;
      const sub  = +(unit * item.quantity).toFixed(2);
      subtotal  += sub;
      orderItems.push({ cake:cake._id, cakeName:cake.name, category:cake.category, quantity:item.quantity, unitPrice:unit, discount:cake.discount||0, subtotal:sub });
    }

    let promoDiscount = 0, usedCode = null;
    if (promoCode) {
      const p = await Promotion.findOne({ code:promoCode.toUpperCase(), active:true });
      if (!p || p.expiresAt < new Date()) return res.status(400).json({ success: false, message: 'Invalid or expired promo code' });
      if (p.usageLimit && p.usedCount >= p.usageLimit) return res.status(400).json({ success: false, message: 'Promo usage limit reached' });
      if (subtotal < p.minOrderAmount) return res.status(400).json({ success: false, message: `Min order ₹${p.minOrderAmount} for this code` });
      promoDiscount = p.type==='percentage' ? (subtotal*p.value/100) : p.value;
      if (p.maxDiscount) promoDiscount = Math.min(promoDiscount, p.maxDiscount);
      promoDiscount = +promoDiscount.toFixed(2);
      await Promotion.findByIdAndUpdate(p._id, { $inc:{usedCount:1} });
      usedCode = p.code;
    }

    const total = Math.max(0, +(subtotal - promoDiscount).toFixed(2));
    const order = await Order.create({
      customer:customerId, customerName:customer.name,
      items:orderItems, subtotal,
      promoCode:usedCode, promoDiscount, totalDiscount:promoDiscount, total,
      paymentMethod:paymentMethod||'cash', notes, deliveryDate:deliveryDate||null
    });

    for (const it of orderItems) await Cake.findByIdAndUpdate(it.cake, {$inc:{totalSold:it.quantity}});
    await Customer.findByIdAndUpdate(customerId, {$inc:{totalSpent:total, totalOrders:1}});

    res.status(201).json({ success: true, message: 'Order placed!', data: order });
  } catch(e) { res.status(400).json({ success: false, message: e.message }); }
});

// PUT update status
router.put('/:id', auth, async (req, res) => {
  try {
    const o = await Order.findByIdAndUpdate(req.params.id, {status:req.body.status, updatedAt:Date.now()}, {new:true});
    if (!o) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, message: 'Status updated', data: o });
  } catch(e) { res.status(400).json({ success: false, message: e.message }); }
});

// DELETE order
router.delete('/:id', auth, async (req, res) => {
  try {
    const o = await Order.findByIdAndDelete(req.params.id);
    if (!o) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, message: 'Order deleted' });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
