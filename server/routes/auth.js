const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/authController');
const { protect } = require('../middlewares/auth');
const upload  = require('../middlewares/upload');

router.post('/register', ctrl.register);
router.post('/login',    ctrl.login);
router.post('/logout',   protect, ctrl.logout);
router.get('/me',        protect, ctrl.getMe);
router.put('/profile',   protect, upload.single('profilePic'), ctrl.updateProfile);
router.post('/wallpaper',protect, upload.single('wallpaper'), ctrl.setWallpaper);
router.get('/wallpapers',protect, ctrl.getWallpapers);
module.exports = router;
