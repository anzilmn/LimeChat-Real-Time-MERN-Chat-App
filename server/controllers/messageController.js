const Message = require('../models/Message');

exports.getMessages = async (req, res) => {
  try {
    const { chatId } = req.params; const myId = req.user._id;
    const messages = await Message.find({
      $or: [{ senderId: myId, receiverId: chatId }, { senderId: chatId, receiverId: myId }],
      deletedFor: { $ne: myId }
    }).populate('senderId','username profilePic').populate('receiverId','username profilePic')
      .populate('replyTo','message senderId type').sort({ createdAt: 1 });
    await Message.updateMany({ senderId: chatId, receiverId: myId, status: { $ne: 'seen' } }, { $set: { status: 'seen' } });
    res.json(messages);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, message, type, replyTo } = req.body;
    if (!receiverId) return res.status(400).json({ message: 'Receiver required' });
    if (!message && !req.file) return res.status(400).json({ message: 'Content required' });
    const msgData = { senderId: req.user._id, receiverId, message: message || '', type: type || 'text' };
    if (replyTo) msgData.replyTo = replyTo;
    if (req.file) {
      const isImage = req.file.mimetype.startsWith('image/');
      msgData.fileUrl = (isImage ? '/uploads/images/' : '/uploads/files/') + req.file.filename;
      msgData.fileName = req.file.originalname;
      msgData.type = isImage ? 'image' : 'file';
    }
    const msg = await (await Message.create(msgData)).populate([
      { path: 'senderId', select: 'username profilePic' },
      { path: 'receiverId', select: 'username profilePic' },
      { path: 'replyTo', select: 'message senderId type' }
    ]);
    res.status(201).json(msg);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.editMessage = async (req, res) => {
  try {
    const msg = await Message.findById(req.params.id);
    if (!msg) return res.status(404).json({ message: 'Not found' });
    if (msg.senderId.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Unauthorized' });
    msg.message = req.body.message; msg.isEdited = true; await msg.save();
    const populated = await Message.findById(msg._id).populate('senderId','username profilePic').populate('receiverId','username profilePic');
    res.json(populated);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.deleteMessage = async (req, res) => {
  try {
    const { deleteFor } = req.body;
    const msg = await Message.findById(req.params.id);
    if (!msg) return res.status(404).json({ message: 'Not found' });
    if (deleteFor === 'everyone' && msg.senderId.toString() === req.user._id.toString()) {
      msg.isDeleted = true; msg.message = 'This message was deleted'; await msg.save();
    } else { msg.deletedFor.push(req.user._id); await msg.save(); }
    res.json({ message: 'Deleted', id: msg._id, isDeleted: msg.isDeleted });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.clearChat = async (req, res) => {
  try {
    const myId = req.user._id; const { chatId } = req.params;
    await Message.updateMany(
      { $or: [{ senderId: myId, receiverId: chatId }, { senderId: chatId, receiverId: myId }] },
      { $addToSet: { deletedFor: myId } }
    );
    res.json({ message: 'Chat cleared' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.addReaction = async (req, res) => {
  try {
    const msg = await Message.findById(req.params.id);
    if (!msg) return res.status(404).json({ message: 'Not found' });
    const i = msg.reactions.findIndex(r => r.userId.toString() === req.user._id.toString());
    if (i > -1) msg.reactions[i].emoji = req.body.emoji;
    else msg.reactions.push({ userId: req.user._id, emoji: req.body.emoji });
    await msg.save(); res.json(msg);
  } catch (e) { res.status(500).json({ message: e.message }); }
};
