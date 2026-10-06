const router = require('express').Router();
const Admin  = require('../models/Admin');
const VALID_TOKEN = 'cakepro_admin_authenticated';

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ success: false, message: 'Username and password required' });
    const admin = await Admin.findOne({ username });
    if (!admin || !(await admin.comparePassword(password)))
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    req.session.adminId   = admin._id;
    req.session.adminName = admin.name;
    res.json({ success: true, token: VALID_TOKEN,
      admin: { id: admin._id, name: admin.name, shopName: admin.shopName } });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {});
  res.json({ success: true });
});

router.get('/me', (req, res) => {
  if (req.session?.adminId)
    return res.json({ success: true, loggedIn: true, name: req.session.adminName });
  const token = (req.headers['authorization'] || req.headers['x-admin-token'] || '').replace(/^Bearer\s+/i,'').trim();
  if (token === VALID_TOKEN)
    return res.json({ success: true, loggedIn: true, name: 'Admin' });
  res.json({ success: true, loggedIn: false });
});

module.exports = router;
