const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username:    { type: String, required: true, unique: true, trim: true, minlength: 3, maxlength: 30 },
  email:       { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:    { type: String, required: true, minlength: 6 },
  profilePic:  { type: String, default: '' },
  bio:         { type: String, default: '', maxlength: 200 },
  isOnline:    { type: Boolean, default: false },
  inCall:      { type: Boolean, default: false },
  lastSeen:    { type: Date, default: Date.now },
  isAdmin:     { type: Boolean, default: false },
  isBlocked:   { type: Boolean, default: false },
  blockedUsers:[ { type: mongoose.Schema.Types.ObjectId, ref: 'User' } ],
  chatWallpapers: {
    type: Map,
    of: String,
    default: {}
  },
  notifSound:  { type: Boolean, default: true },
  pushTokens:  [String]
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});
userSchema.methods.matchPassword = async function(p) { return bcrypt.compare(p, this.password); };
userSchema.methods.toJSON = function() { const o = this.toObject(); delete o.password; return o; };
module.exports = mongoose.model('User', userSchema);
