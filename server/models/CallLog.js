const mongoose = require('mongoose');
const callLogSchema = new mongoose.Schema({
  callerId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type:       { type: String, enum: ['voice','video'], required: true },
  status:     { type: String, enum: ['missed','rejected','completed','timeout'], default: 'missed' },
  duration:   { type: Number, default: 0 },  // seconds
  startedAt:  { type: Date, default: Date.now },
  endedAt:    { type: Date }
}, { timestamps: true });
module.exports = mongoose.model('CallLog', callLogSchema);
