const mongoose = require('mongoose');
const groupSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true, minlength: 3 },
  description: { type: String, default: '' },
  avatar:      { type: String, default: '' },
  admin:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' }
}, { timestamps: true });
module.exports = mongoose.model('Group', groupSchema);
