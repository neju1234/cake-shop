// middleware/auth.js
// Accepts: session cookie OR Authorization header OR X-Admin-Token header OR ?token= query
const VALID_TOKEN = 'cakepro_admin_authenticated';

module.exports = (req, res, next) => {
  if (req.session && req.session.adminId) return next();
  const h = (req.headers['authorization'] || req.headers['x-admin-token'] || '').replace(/^Bearer\s+/i,'').trim();
  if (h === VALID_TOKEN) return next();
  const q = (req.query.token || '').trim();
  if (q === VALID_TOKEN) return next();
  return res.status(401).json({ success: false, message: 'Unauthorized. Please login.' });
};
