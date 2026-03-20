require('dotenv').config();
const express   = require('express');
const http      = require('http');
const { Server }= require('socket.io');
const cors      = require('cors');
const helmet    = require('helmet');
const path      = require('path');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const CallLog   = require('./models/CallLog');
const User      = require('./models/User');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173', methods: ['GET','POST'] }
});

connectDB();

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(rateLimit({ windowMs: 15*60*1000, max: 1000 }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth',     require('./routes/auth'));
app.use('/api/users',    require('./routes/users'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/groups',   require('./routes/groups'));
app.use('/api/calls',    require('./routes/calls'));
app.get('/api/health',   (req, res) => res.json({ status: 'LimeChat v2 API 🍋', ts: new Date() }));

// ───────────────────── Socket.io ─────────────────────────────
const onlineUsers = new Map();   // userId → socketId
const callTimeouts = new Map();  // callLogId → timeout

io.on('connection', (socket) => {

  // ── Online presence ──────────────────────────────────────
  socket.on('user:online', (userId) => {
    onlineUsers.set(userId, socket.id);
    socket.userId = userId;
    io.emit('users:online', Array.from(onlineUsers.keys()));
    User.findByIdAndUpdate(userId, { isOnline: true }).catch(() => {});
  });

  // ── Messaging ────────────────────────────────────────────
  socket.on('message:send', (data) => {
    const target = onlineUsers.get(data.receiverId);
    if (target) {
      io.to(target).emit('message:receive', data);
      io.to(target).emit('message:delivered', data._id);
    }
  });
  socket.on('message:edit',   (data) => { const t = onlineUsers.get(data.receiverId); if (t) io.to(t).emit('message:edited', data); });
  socket.on('message:delete', (data) => { const t = onlineUsers.get(data.receiverId); if (t) io.to(t).emit('message:deleted', data); });
  socket.on('message:seen',   ({ messageId, senderId }) => { const t = onlineUsers.get(senderId); if (t) io.to(t).emit('message:seen', { messageId }); });

  // ── Typing ───────────────────────────────────────────────
  socket.on('typing:start', ({ senderId, receiverId }) => { const t = onlineUsers.get(receiverId); if (t) io.to(t).emit('typing:start', { senderId }); });
  socket.on('typing:stop',  ({ senderId, receiverId }) => { const t = onlineUsers.get(receiverId); if (t) io.to(t).emit('typing:stop',  { senderId }); });

  // ── Group events ─────────────────────────────────────────
  socket.on('group:join',         (gid)  => socket.join('group:' + gid));
  socket.on('group:leave',        (gid)  => socket.leave('group:' + gid));
  socket.on('group:message',      (data) => io.to('group:' + data.groupId).emit('group:message:receive', data));
  socket.on('group:typing:start', ({ groupId, username }) => socket.to('group:' + groupId).emit('group:typing:start', { username }));
  socket.on('group:typing:stop',  ({ groupId })           => socket.to('group:' + groupId).emit('group:typing:stop'));

  // ── WebRTC Call Signaling ─────────────────────────────────
  socket.on('call:initiate', async ({ to, type, callLogId, callerName, callerAvatar }) => {
    const target = onlineUsers.get(to);
    // Mark caller as in-call
    User.findByIdAndUpdate(socket.userId, { inCall: true }).catch(() => {});
    if (!target) {
      // Offline → mark missed immediately
      await CallLog.findByIdAndUpdate(callLogId, { status: 'missed', endedAt: new Date() }).catch(() => {});
      socket.emit('call:unavailable', { reason: 'User is offline' });
      User.findByIdAndUpdate(socket.userId, { inCall: false }).catch(() => {});
      return;
    }
    io.to(target).emit('call:incoming', { from: socket.userId, type, callLogId, callerName, callerAvatar });
    // Auto-timeout after 30 seconds
    const timeout = setTimeout(async () => {
      io.to(target).emit('call:timeout');
      socket.emit('call:timeout');
      await CallLog.findByIdAndUpdate(callLogId, { status: 'timeout', endedAt: new Date() }).catch(() => {});
      User.findByIdAndUpdate(socket.userId, { inCall: false }).catch(() => {});
      callTimeouts.delete(callLogId);
    }, 30000);
    callTimeouts.set(callLogId, timeout);
  });

  socket.on('call:accept', async ({ to, callLogId }) => {
    const target = onlineUsers.get(to);
    if (callTimeouts.has(callLogId)) { clearTimeout(callTimeouts.get(callLogId)); callTimeouts.delete(callLogId); }
    await CallLog.findByIdAndUpdate(callLogId, { status: 'completed', startedAt: new Date() }).catch(() => {});
    User.findByIdAndUpdate(socket.userId, { inCall: true }).catch(() => {});
    if (target) io.to(target).emit('call:accepted', { by: socket.userId });
  });

  socket.on('call:reject', async ({ to, callLogId }) => {
    const target = onlineUsers.get(to);
    if (callTimeouts.has(callLogId)) { clearTimeout(callTimeouts.get(callLogId)); callTimeouts.delete(callLogId); }
    await CallLog.findByIdAndUpdate(callLogId, { status: 'rejected', endedAt: new Date() }).catch(() => {});
    User.findByIdAndUpdate(socket.userId, { inCall: false }).catch(() => {});
    if (target) io.to(target).emit('call:rejected', { by: socket.userId });
  });

  socket.on('call:end', async ({ to, callLogId, duration }) => {
    const target = onlineUsers.get(to);
    if (callTimeouts.has(callLogId)) { clearTimeout(callTimeouts.get(callLogId)); callTimeouts.delete(callLogId); }
    if (callLogId) await CallLog.findByIdAndUpdate(callLogId, { status: 'completed', duration: duration || 0, endedAt: new Date() }).catch(() => {});
    User.findByIdAndUpdate(socket.userId, { inCall: false }).catch(() => {});
    if (to) User.findByIdAndUpdate(to, { inCall: false }).catch(() => {});
    if (target) io.to(target).emit('call:ended', { by: socket.userId, duration });
  });

  // WebRTC ICE / SDP exchange
  socket.on('call:offer',         ({ to, offer })     => { const t = onlineUsers.get(to); if (t) io.to(t).emit('call:offer',         { offer,     from: socket.userId }); });
  socket.on('call:answer',        ({ to, answer })    => { const t = onlineUsers.get(to); if (t) io.to(t).emit('call:answer',        { answer,    from: socket.userId }); });
  socket.on('call:ice-candidate', ({ to, candidate }) => { const t = onlineUsers.get(to); if (t) io.to(t).emit('call:ice-candidate', { candidate, from: socket.userId }); });

  // ── Disconnect ───────────────────────────────────────────
  socket.on('disconnect', () => {
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      io.emit('users:online', Array.from(onlineUsers.keys()));
      User.findByIdAndUpdate(socket.userId, { isOnline: false, inCall: false, lastSeen: new Date() }).catch(() => {});
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log('🍋 LimeChat v2 Server → http://localhost:' + PORT));
