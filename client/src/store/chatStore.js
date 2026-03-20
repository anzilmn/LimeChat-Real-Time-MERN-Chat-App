import { create } from 'zustand';
import api from '../services/api';

const useChatStore = create((set, get) => ({
  users:        [],
  selectedUser: null,
  messages:     [],
  groups:       [],
  selectedGroup: null,
  onlineUsers:  [],
  inCallUsers:  [],
  typingUsers:  {},
  loading:      false,
  wallpapers:   {},

  fetchUsers: async (search='') => {
    try { const r = await api.get('/users?search=' + search); set({ users: r.data }); } catch {}
  },
  fetchMessages: async (chatId) => {
    set({ loading: true });
    try { const r = await api.get('/messages/' + chatId); set({ messages: r.data, loading: false }); }
    catch { set({ loading: false }); }
  },
  sendMessage: async (data) => {
    try {
      const fd = new FormData();
      Object.keys(data).forEach(k => { if (data[k] != null) fd.append(k, data[k]); });
      const r = await api.post('/messages', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      set(s => ({ messages: [...s.messages, r.data] })); return r.data;
    } catch { return null; }
  },
  editMessage:   async (id, message) => {
    try {
      const r = await api.put('/messages/' + id, { message });
      set(s => ({ messages: s.messages.map(m => m._id === id ? r.data : m) }));
    } catch {}
  },
  deleteMessage: async (id, deleteFor='me') => {
    try {
      await api.delete('/messages/' + id, { data: { deleteFor } });
      if (deleteFor === 'everyone')
        set(s => ({ messages: s.messages.map(m => m._id === id ? { ...m, isDeleted:true, message:'This message was deleted' } : m) }));
      else
        set(s => ({ messages: s.messages.filter(m => m._id !== id) }));
    } catch {}
  },
  clearChat: async (chatId) => {
    try { await api.delete('/messages/clear/' + chatId); set({ messages: [] }); } catch {}
  },
  fetchGroups: async () => {
    try { const r = await api.get('/groups'); set({ groups: r.data }); } catch {}
  },
  fetchGroupMessages: async (groupId) => {
    set({ loading: true });
    try { const r = await api.get('/groups/' + groupId + '/messages'); set({ messages: r.data, loading: false }); }
    catch { set({ loading: false }); }
  },
  sendGroupMessage: async (data) => {
    try {
      const fd = new FormData();
      Object.keys(data).forEach(k => { if (data[k] != null) fd.append(k, data[k]); });
      const r = await api.post('/groups/message', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      set(s => ({ messages: [...s.messages, r.data] })); return r.data;
    } catch { return null; }
  },
  addIncomingMessage: (msg) => {
    set(s => s.messages.find(m => m._id === msg._id) ? s : { messages: [...s.messages, msg] });
  },
  updateMessageStatus: (msgId, status) => {
    set(s => ({ messages: s.messages.map(m => m._id === msgId ? { ...m, status } : m) }));
  },
  fetchWallpapers: async () => {
    try { const r = await api.get('/auth/wallpapers'); set({ wallpapers: r.data }); } catch {}
  },
  setWallpaper: async (chatId, file, presetUrl) => {
    try {
      const fd = new FormData();
      fd.append('chatId', chatId);
      if (file) fd.append('wallpaper', file);
      else if (presetUrl) fd.append('wallpaperUrl', presetUrl);
      const r = await api.post('/auth/wallpaper', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      set(s => ({ wallpapers: { ...s.wallpapers, [chatId]: r.data.wallpaper } }));
    } catch {}
  },
  setOnlineUsers:  (users)      => set({ onlineUsers: users }),
  setInCallUsers:  (users)      => set({ inCallUsers: users }),
  setTyping:       (userId, v)  => set(s => ({ typingUsers: { ...s.typingUsers, [userId]: v } })),
  setSelectedUser: (user)       => set({ selectedUser: user, selectedGroup: null, messages: [] }),
  setSelectedGroup:(group)      => set({ selectedGroup: group, selectedUser: null, messages: [] }),
  clearMessages:   ()           => set({ messages: [] })
}));
export default useChatStore;
