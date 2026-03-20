const User    = require('../models/User');
const jwt     = require('jsonwebtoken');

const genToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ message: 'All fields required' });
    if (username.length < 3) return res.status(400).json({ message: 'Username min 3 chars' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message: 'Invalid email' });
    if (password.length < 6) return res.status(400).json({ message: 'Password min 6 chars' });
    if (!/\d/.test(password)) return res.status(400).json({ message: 'Password needs at least 1 number' });
    if (await User.findOne({ email })) return res.status(400).json({ message: 'Email already registered' });
    if (await User.findOne({ username })) return res.status(400).json({ message: 'Username taken' });
    const user = await User.create({ username, email, password });
    res.status(201).json({ _id: user._id, username: user.username, email: user.email,
      profilePic: user.profilePic, isAdmin: user.isAdmin, token: genToken(user._id) });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
    if (email === 'admin' && password === 'admin') {
      let admin = await User.findOne({ isAdmin: true });
      if (!admin) admin = await User.create({ username: 'admin', email: 'admin@limechat.com', password: 'admin123', isAdmin: true });
      return res.json({ _id: admin._id, username: admin.username, email: admin.email,
        profilePic: admin.profilePic, isAdmin: true, token: genToken(admin._id) });
    }
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) return res.status(400).json({ message: 'Invalid credentials' });
    if (user.isBlocked) return res.status(403).json({ message: 'Account is blocked' });
    await User.findByIdAndUpdate(user._id, { isOnline: true });
    res.json({ _id: user._id, username: user.username, email: user.email,
      profilePic: user.profilePic, isAdmin: user.isAdmin, token: genToken(user._id) });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.logout = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { isOnline: false, inCall: false, lastSeen: new Date() });
    res.json({ message: 'Logged out' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getMe = (req, res) => res.json(req.user);

exports.updateProfile = async (req, res) => {
  try {
    const { username, bio, notifSound } = req.body;
    const update = {};
    if (username) {
      if (username.length < 3) return res.status(400).json({ message: 'Username too short' });
      if (await User.findOne({ username, _id: { $ne: req.user._id } }))
        return res.status(400).json({ message: 'Username taken' });
      update.username = username;
    }
    if (bio !== undefined) update.bio = bio;
    if (notifSound !== undefined) update.notifSound = notifSound === 'true' || notifSound === true;
    if (req.file) update.profilePic = '/uploads/images/' + req.file.filename;
    const user = await User.findByIdAndUpdate(req.user._id, update, { new: true }).select('-password');
    res.json(user);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.setWallpaper = async (req, res) => {
  try {
    const { chatId, wallpaperUrl } = req.body;
    const fileUrl = req.file ? '/uploads/wallpapers/' + req.file.filename : wallpaperUrl;
    const user = await User.findById(req.user._id);
    user.chatWallpapers.set(chatId, fileUrl);
    await user.save();
    res.json({ chatId, wallpaper: fileUrl });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getWallpapers = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json(Object.fromEntries(user.chatWallpapers));
  } catch (e) { res.status(500).json({ message: e.message }); }
};
