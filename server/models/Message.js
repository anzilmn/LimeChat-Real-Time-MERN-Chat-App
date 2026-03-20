const mongoose = require('mongoose');
const messageSchema = new mongoose.Schema({
  senderId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  groupId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
  message:    { type: String, default: '' },
  type:       { type: String, enum: ['text','image','file','voice','emoji'], default: 'text' },
  fileUrl:    { type: String, default: '' },
  fileName:   { type: String, default: '' },
  status:     { type: String, enum: ['sent','delivered','seen'], default: 'sent' },
  isEdited:   { type: Boolean, default: false },
  isDeleted:  { type: Boolean, default: false },
  deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  reactions:  [{ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, emoji: String }],
  replyTo:    { type: mongoose.Schema.Types.ObjectId, ref: 'Message' }
}, { timestamps: true });
module.exports = mongoose.model('Message', messageSchema);
