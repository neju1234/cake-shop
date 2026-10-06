const router   = require('express').Router();
const auth     = require('../middleware/auth');
const Order    = require('../models/Order');
const Cake     = require('../models/Cake');
const Customer = require('../models/Customer');

router.get('/summary', auth, async (req, res) => {
  try {
    const now   = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const month = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalOrders, totalCustomers, totalCakes,
      todayAgg, monthAgg, allAgg, recentOrders, topCakes, pendingCount] = await Promise.all([
      Order.countDocuments({ status: { $ne: 'cancelled' } }),
      Customer.countDocuments(),
      Cake.countDocuments(),
      Order.aggregate([{ $match: { createdAt:{$gte:today}, status:{$ne:'cancelled'} } }, { $group:{_id:null,rev:{$sum:'$total'},cnt:{$sum:1}} }]),
      Order.aggregate([{ $match: { createdAt:{$gte:month}, status:{$ne:'cancelled'} } }, { $group:{_id:null,rev:{$sum:'$total'},cnt:{$sum:1}} }]),
      Order.aggregate([{ $match: { status:{$ne:'cancelled'} } }, { $group:{_id:null,rev:{$sum:'$total'}} }]),
      Order.find({ status:{$ne:'cancelled'} }).sort({createdAt:-1}).limit(6)
        .select('orderNumber customerName total status createdAt paymentMethod'),
      Cake.find().sort({totalSold:-1}).limit(5).select('name totalSold views category image price'),
      Order.countDocuments({ status: 'pending' })
    ]);

    res.json({ success: true, data: {
      totalOrders, totalCustomers, totalCakes,
      totalRevenue:  allAgg[0]?.rev   || 0,
      todayRevenue:  todayAgg[0]?.rev  || 0,
      todayOrders:   todayAgg[0]?.cnt  || 0,
      monthRevenue:  monthAgg[0]?.rev  || 0,
      monthOrders:   monthAgg[0]?.cnt  || 0,
      pendingCount, recentOrders, topCakes
    }});
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
