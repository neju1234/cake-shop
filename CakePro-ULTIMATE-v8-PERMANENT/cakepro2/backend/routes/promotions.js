const router    = require('express').Router();
const auth      = require('../middleware/auth');
const Promotion = require('../models/Promotion');

router.get('/',    auth, async (req, res) => { try { res.json({ success:true, data: await Promotion.find().sort({createdAt:-1}) }); } catch(e) { res.status(500).json({success:false,message:e.message}); } });
router.post('/',   auth, async (req, res) => { try { const p=await Promotion.create(req.body); res.status(201).json({success:true,message:'Created',data:p}); } catch(e) { if(e.code===11000) return res.status(400).json({success:false,message:'Code already exists'}); res.status(400).json({success:false,message:e.message}); } });
router.put('/:id', auth, async (req, res) => { try { const p=await Promotion.findByIdAndUpdate(req.params.id,req.body,{new:true}); if(!p) return res.status(404).json({success:false,message:'Not found'}); res.json({success:true,data:p}); } catch(e) { res.status(400).json({success:false,message:e.message}); } });
router.delete('/:id', auth, async (req, res) => { try { await Promotion.findByIdAndDelete(req.params.id); res.json({success:true,message:'Deleted'}); } catch(e) { res.status(500).json({success:false,message:e.message}); } });

router.post('/validate', async (req, res) => {
  try {
    const { code, orderAmount } = req.body;
    const p = await Promotion.findOne({ code:code?.toUpperCase(), active:true });
    if (!p || p.expiresAt < new Date()) return res.status(400).json({success:false,message:'Invalid or expired code'});
    if (p.usageLimit && p.usedCount >= p.usageLimit) return res.status(400).json({success:false,message:'Usage limit reached'});
    if (orderAmount < p.minOrderAmount) return res.status(400).json({success:false,message:`Minimum order ₹${p.minOrderAmount}`});
    let disc = p.type==='percentage' ? (orderAmount*p.value/100) : p.value;
    if (p.maxDiscount) disc = Math.min(disc, p.maxDiscount);
    res.json({ success:true, discount:+disc.toFixed(2), promo:p });
  } catch(e) { res.status(500).json({success:false,message:e.message}); }
});

module.exports = router;
