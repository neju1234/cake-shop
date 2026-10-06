// middleware/upload.js
// Images saved permanently to backend/uploads/
// This folder MUST NOT be deleted - it stores all cake images
const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

// Absolute path to uploads folder
const uploadDir = path.join(__dirname, '..', 'uploads');

// Create folder if it doesn't exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Unique filename: cake-timestamp-random.ext
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext    = path.extname(file.originalname).toLowerCase();
    cb(null, 'cake-' + unique + ext);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedExt  = /\.(jpeg|jpg|png|webp)$/i.test(file.originalname);
  const allowedMime = /^image\/(jpeg|jpg|png|webp)$/.test(file.mimetype);
  if (allowedExt && allowedMime) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG, PNG or WEBP images allowed'), false);
  }
};

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit (increased from 2MB)
});
