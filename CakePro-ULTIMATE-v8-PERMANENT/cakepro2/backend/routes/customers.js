const router   = require('express').Router();
const auth     = require('../middleware/auth');
const Customer = require('../models/Customer');
const Order    = require('../models/Order');

router.get('/', auth, async (req, res) => {
  try {
    const { search } = req.query;
    const q = search ? { $or:[{name:{$regex:search,$options:'i'}},{email:{$regex:search,$options:'i'}},{phone:{$regex:search,$options:'i'}}] } : {};
    const customers = await Customer.find(q).sort({ createdAt: -1 });
    res.json({ success: true, count: customers.length, data: customers });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    const orders = await Order.find({ customer: req.params.id }).sort({ createdAt: -1 }).limit(20);
    res.json({ success: true, data: { customer, orders } });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const c = await Customer.create(req.body);
    res.status(201).json({ success: true, message: 'Customer added', data: c });
  } catch(e) {
    if (e.code === 11000) return res.status(400).json({ success: false, message: 'Email already exists' });
    res.status(400).json({ success: false, message: e.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const c = await Customer.findByIdAndUpdate(req.params.id, req.body, {new:true, runValidators:true});
    if (!c) return res.status(404).json({ success: false, message: 'Customer not found' });
    res.json({ success: true, message: 'Customer updated', data: c });
  } catch(e) { res.status(400).json({ success: false, message: e.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const c = await Customer.findByIdAndDelete(req.params.id);
    if (!c) return res.status(404).json({ success: false, message: 'Customer not found' });
    res.json({ success: true, message: 'Customer deleted' });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
