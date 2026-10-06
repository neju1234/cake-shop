const router   = require('express').Router();
const auth     = require('../middleware/auth');
const Order    = require('../models/Order');
const Cake     = require('../models/Cake');
const Customer = require('../models/Customer');

router.get('/monthly', auth, async (req, res) => {
  try {
    const start = new Date(); start.setMonth(start.getMonth()-11); start.setDate(1); start.setHours(0,0,0,0);
    const data = await Order.aggregate([
      {$match:{createdAt:{$gte:start},status:{$ne:'cancelled'}}},
      {$group:{_id:{y:{$year:'$createdAt'},m:{$month:'$createdAt'}},rev:{$sum:'$total'},cnt:{$sum:1}}},
      {$sort:{'_id.y':1,'_id.m':1}}
    ]);
    res.json({ success:true, data });
  } catch(e) { res.status(500).json({success:false,message:e.message}); }
});

router.get('/daily', auth, async (req, res) => {
  try {
    const start = new Date(); start.setDate(start.getDate()-29); start.setHours(0,0,0,0);
    const data = await Order.aggregate([
      {$match:{createdAt:{$gte:start},status:{$ne:'cancelled'}}},
      {$group:{_id:{y:{$year:'$createdAt'},m:{$month:'$createdAt'},d:{$dayOfMonth:'$createdAt'}},rev:{$sum:'$total'},cnt:{$sum:1}}},
      {$sort:{'_id.y':1,'_id.m':1,'_id.d':1}}
    ]);
    res.json({ success:true, data });
  } catch(e) { res.status(500).json({success:false,message:e.message}); }
});

router.get('/category', auth, async (req, res) => {
  try {
    const data = await Order.aggregate([
      {$match:{status:{$ne:'cancelled'}}},{$unwind:'$items'},
      {$group:{_id:'$items.category',rev:{$sum:'$items.subtotal'},cnt:{$sum:'$items.quantity'}}},
      {$sort:{rev:-1}}
    ]);
    res.json({ success:true, data });
  } catch(e) { res.status(500).json({success:false,message:e.message}); }
});

router.get('/bestsellers', auth, async (req, res) => {
  try {
    const data = await Cake.find().sort({totalSold:-1}).limit(10).select('name totalSold views category image price');
    res.json({ success:true, data });
  } catch(e) { res.status(500).json({success:false,message:e.message}); }
});

router.get('/top-customers', auth, async (req, res) => {
  try {
    const data = await Customer.find().sort({totalSpent:-1}).limit(10).select('name email totalSpent totalOrders');
    res.json({ success:true, data });
  } catch(e) { res.status(500).json({success:false,message:e.message}); }
});

module.exports = router;
