const User    = require('../models/User');
const Message = require('../models/Message');
const CallLog = require('../models/CallLog');
const Report  = require('../models/Report');

exports.getUsers = async (req, res) => {
  try {
    const search = req.query.search || '';
    const users = await User.find({ _id: { $ne: req.user._id }, isAdmin: false,
      username: { $regex: search, $options: 'i' } }).select('-password').sort({ isOnline: -1, lastSeen: -1 });
    res.json(users);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } }).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.deleteUser = async (req, res) => {
  try {
    if (!await User.findByIdAndDelete(req.params.id)) return res.status(404).json({ message: 'User not found' });
    await Message.deleteMany({ $or: [{ senderId: req.params.id }, { receiverId: req.params.id }] });
    res.json({ message: 'User deleted' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.blockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.isBlocked = !user.isBlocked;
    await user.save();
    res.json({ message: user.isBlocked ? 'User blocked' : 'User unblocked', isBlocked: user.isBlocked });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const [totalUsers, activeUsers, totalMessages, blockedUsers, totalCalls, pendingReports, recentUsers] =
      await Promise.all([
        User.countDocuments({ isAdmin: false }),
        User.countDocuments({ isOnline: true, isAdmin: false }),
        Message.countDocuments(),
        User.countDocuments({ isBlocked: true }),
        CallLog.countDocuments(),
        Report.countDocuments({ status: 'pending' }),
        User.find({ isAdmin: false }).select('-password').sort({ createdAt: -1 }).limit(5)
      ]);
    res.json({ totalUsers, activeUsers, totalMessages, blockedUsers, totalCalls, pendingReports, recentUsers });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getCallLogs = async (req, res) => {
  try {
    const logs = await CallLog.find()
      .populate('callerId', 'username profilePic')
      .populate('receiverId', 'username profilePic')
      .sort({ createdAt: -1 }).limit(100);
    res.json(logs);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getUserCallLogs = async (req, res) => {
  try {
    const uid = req.user._id;
    const logs = await CallLog.find({ $or: [{ callerId: uid }, { receiverId: uid }] })
      .populate('callerId', 'username profilePic')
      .populate('receiverId', 'username profilePic')
      .sort({ createdAt: -1 }).limit(50);
    res.json(logs);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.submitReport = async (req, res) => {
  try {
    const { reportedUser, reason, details } = req.body;
    if (!reportedUser || !reason) return res.status(400).json({ message: 'reportedUser and reason required' });
    const report = await Report.create({ reportedBy: req.user._id, reportedUser, reason, details });
    res.status(201).json(report);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getReports = async (req, res) => {
  try {
    const reports = await Report.find()
      .populate('reportedBy', 'username profilePic')
      .populate('reportedUser', 'username profilePic email')
      .sort({ createdAt: -1 });
    res.json(reports);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.updateReport = async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    const report = await Report.findByIdAndUpdate(req.params.id, { status, adminNote }, { new: true });
    if (!report) return res.status(404).json({ message: 'Report not found' });
    res.json(report);
  } catch (e) { res.status(500).json({ message: e.message }); }
};
