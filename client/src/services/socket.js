import { io } from 'socket.io-client';
let socket = null;
export const connectSocket = (userId) => {
  if (socket?.connected) return socket;
  socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
    transports: ['websocket','polling']
  });
  socket.on('connect', () => { console.log('🔌 Socket connected'); socket.emit('user:online', userId); });
  socket.on('disconnect', () => console.log('🔌 Socket disconnected'));
  return socket;
};
export const getSocket = () => socket;
export const disconnectSocket = () => { if (socket) socket.disconnect(); socket = null; };
