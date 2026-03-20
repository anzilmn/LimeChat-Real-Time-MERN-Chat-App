const Group   = require('../models/Group');
const Message = require('../models/Message');

exports.createGroup = async (req, res) => {
  try {
    const { name, description, members } = req.body;
    if (!name || name.length < 3) return res.status(400).json({ message: 'Group name min 3 chars' });
    const group = await Group.create({
      name, description, admin: req.user._id,
      members: [...new Set([...(Array.isArray(members) ? members : [members].filter(Boolean)), req.user._id.toString()])],
      avatar: req.file ? '/uploads/images/' + req.file.filename : ''
    });
    const populated = await Group.findById(group._id)
      .populate('members','username profilePic isOnline')
      .populate('admin','username profilePic');
    res.status(201).json(populated);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getGroups = async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user._id })
      .populate('members','username profilePic isOnline')
      .populate('admin','username profilePic')
      .populate('lastMessage').sort({ updatedAt: -1 });
    res.json(groups);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getGroupMessages = async (req, res) => {
  try {
    const messages = await Message.find({ groupId: req.params.groupId })
      .populate('senderId','username profilePic')
      .populate('replyTo','message senderId type').sort({ createdAt: 1 });
    res.json(messages);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.sendGroupMessage = async (req, res) => {
  try {
    const { groupId, message, type, replyTo } = req.body;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (!group.members.map(String).includes(req.user._id.toString()))
      return res.status(403).json({ message: 'Not a member' });
    const msgData = { senderId: req.user._id, groupId, message: message || '', type: type || 'text' };
    if (replyTo) msgData.replyTo = replyTo;
    if (req.file) {
      const isImage = req.file.mimetype.startsWith('image/');
      msgData.fileUrl = (isImage ? '/uploads/images/' : '/uploads/files/') + req.file.filename;
      msgData.fileName = req.file.originalname;
      msgData.type = isImage ? 'image' : 'file';
    }
    const newMsg = await Message.create(msgData);
    await Group.findByIdAndUpdate(groupId, { lastMessage: newMsg._id });
    const populated = await Message.findById(newMsg._id)
      .populate('senderId','username profilePic')
      .populate('replyTo','message senderId type');
    res.status(201).json(populated);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.addMembers = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Not found' });
    if (group.admin.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Admin only' });
    group.members = [...new Set([...group.members.map(String), ...(req.body.members || [])])];
    await group.save();
    const populated = await Group.findById(group._id).populate('members','username profilePic isOnline').populate('admin','username profilePic');
    res.json(populated);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.leaveGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Not found' });
    group.members = group.members.filter(m => m.toString() !== req.user._id.toString());
    if (group.members.length === 0) { await Group.findByIdAndDelete(group._id); return res.json({ message: 'Group deleted' }); }
    if (group.admin.toString() === req.user._id.toString()) group.admin = group.members[0];
    await group.save(); res.json({ message: 'Left group' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
