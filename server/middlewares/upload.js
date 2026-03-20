const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const isImage = file.mimetype.startsWith('image/');
    const isWallpaper = req.path?.includes('wallpaper');
    const dir = isWallpaper ? 'uploads/wallpapers' : isImage ? 'uploads/images' : 'uploads/files';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp|pdf|doc|docx|txt|mp3|wav|ogg|mp4|zip/;
  const ext = path.extname(file.originalname).toLowerCase().slice(1);
  allowed.test(ext) ? cb(null, true) : cb(new Error('File type not allowed'), false);
};
module.exports = multer({ storage, fileFilter, limits: { fileSize: 20 * 1024 * 1024 } });
