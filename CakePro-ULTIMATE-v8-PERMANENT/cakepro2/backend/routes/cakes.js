// routes/cakes.js
const router = require('express').Router();
const auth   = require('../middleware/auth');
const upload = require('../middleware/upload');
const Cake   = require('../models/Cake');
const path   = require('path');
const fs     = require('fs');

// GET all cakes (public - no auth needed to view)
router.get('/', async (req, res) => {
  try {
    const { search, category, available, sort } = req.query;
    const q = {};
    if (search)    q.name     = { $regex: search, $options: 'i' };
    if (category)  q.category = category;
    if (available !== undefined) q.available = available === 'true';

    let s = { createdAt: -1 };
    if (sort === 'price_asc')  s = { price: 1 };
    if (sort === 'price_desc') s = { price: -1 };
    if (sort === 'popular')    s = { views: -1 };
    if (sort === 'bestseller') s = { totalSold: -1 };

    const cakes = await Cake.find(q).sort(s);
    res.json({ success: true, count: cakes.length, data: cakes });
  } catch(e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// GET single cake
router.get('/:id', async (req, res) => {
  try {
    const cake = await Cake.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );
    if (!cake) return res.status(404).json({ success: false, message: 'Cake not found' });
    res.json({ success: true, data: cake });
  } catch(e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST create cake
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    const d = { ...req.body };

    // Save image path if uploaded
    if (req.file) {
      d.image = '/uploads/' + req.file.filename;
      console.log('📸 Image saved:', d.image);
    }

    // Parse allergyInfo from comma string to array
    if (typeof d.allergyInfo === 'string') {
      d.allergyInfo = d.allergyInfo.split(',').map(s => s.trim()).filter(Boolean);
    }

    // Parse boolean
    if (typeof d.available === 'string') d.available = d.available === 'true';

    const cake = await Cake.create(d);
    console.log('✅ Cake created:', cake.name, '| Image:', cake.image || 'none');
    res.status(201).json({ success: true, message: 'Cake added successfully', data: cake });
  } catch(e) {
    console.error('❌ Create cake error:', e.message);
    res.status(400).json({ success: false, message: e.message });
  }
});

// PUT update cake
router.put('/:id', auth, upload.single('image'), async (req, res) => {
  try {
    const cake = await Cake.findById(req.params.id);
    if (!cake) return res.status(404).json({ success: false, message: 'Cake not found' });

    const d = { ...req.body };

    // If new image uploaded, delete old one and save new
    if (req.file) {
      if (cake.image) {
        const oldPath = path.join(__dirname, '..', cake.image);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
          console.log('🗑  Deleted old image:', oldPath);
        }
      }
      d.image = '/uploads/' + req.file.filename;
      console.log('📸 New image saved:', d.image);
    }

    if (typeof d.allergyInfo === 'string') {
      d.allergyInfo = d.allergyInfo.split(',').map(s => s.trim()).filter(Boolean);
    }
    if (typeof d.available === 'string') d.available = d.available === 'true';

    d.updatedAt = new Date();

    const updated = await Cake.findByIdAndUpdate(
      req.params.id, d, { new: true, runValidators: true }
    );
    console.log('✅ Cake updated:', updated.name);
    res.json({ success: true, message: 'Cake updated successfully', data: updated });
  } catch(e) {
    console.error('❌ Update cake error:', e.message);
    res.status(400).json({ success: false, message: e.message });
  }
});

// DELETE cake
router.delete('/:id', auth, async (req, res) => {
  try {
    const cake = await Cake.findById(req.params.id);
    if (!cake) return res.status(404).json({ success: false, message: 'Cake not found' });

    // Delete image file from disk
    if (cake.image) {
      const imgPath = path.join(__dirname, '..', cake.image);
      if (fs.existsSync(imgPath)) {
        fs.unlinkSync(imgPath);
        console.log('🗑  Deleted image:', imgPath);
      }
    }

    await Cake.findByIdAndDelete(req.params.id);
    console.log('✅ Cake deleted:', cake.name);
    res.json({ success: true, message: 'Cake deleted successfully' });
  } catch(e) {
    console.error('❌ Delete cake error:', e.message);
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
