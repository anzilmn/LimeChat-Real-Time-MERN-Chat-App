const CallLog = require('../models/CallLog');
const User    = require('../models/User');

exports.createCallLog = async (req, res) => {
  try {
    const { receiverId, type } = req.body;
    const log = await CallLog.create({ callerId: req.user._id, receiverId, type });
    res.status(201).json(log);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.updateCallLog = async (req, res) => {
  try {
    const { status, duration } = req.body;
    const log = await CallLog.findByIdAndUpdate(req.params.id,
      { status, duration, endedAt: new Date() }, { new: true });
    if (!log) return res.status(404).json({ message: 'Log not found' });
    res.json(log);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getMyCallLogs = async (req, res) => {
  try {
    const uid = req.user._id;
    const logs = await CallLog.find({ $or: [{ callerId: uid }, { receiverId: uid }] })
      .populate('callerId','username profilePic')
      .populate('receiverId','username profilePic')
      .sort({ createdAt: -1 }).limit(50);
    res.json(logs);
  } catch (e) { res.status(500).json({ message: e.message }); }
};
