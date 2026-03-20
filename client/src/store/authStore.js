import { create } from 'zustand';
import api from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';

const useAuthStore = create((set, get) => ({
  user:    JSON.parse(localStorage.getItem('limechat_user')) || null,
  token:   localStorage.getItem('limechat_token') || null,
  loading: false,
  error:   null,

  register: async (data) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post('/auth/register', data);
      localStorage.setItem('limechat_token', res.data.token);
      localStorage.setItem('limechat_user', JSON.stringify(res.data));
      connectSocket(res.data._id);
      set({ user: res.data, token: res.data.token, loading: false });
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      set({ error: msg, loading: false }); return { success: false, error: msg };
    }
  },

  login: async (data) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post('/auth/login', data);
      localStorage.setItem('limechat_token', res.data.token);
      localStorage.setItem('limechat_user', JSON.stringify(res.data));
      connectSocket(res.data._id);
      set({ user: res.data, token: res.data.token, loading: false });
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      set({ error: msg, loading: false }); return { success: false, error: msg };
    }
  },

  logout: async () => {
    try { await api.post('/auth/logout'); } catch {}
    localStorage.removeItem('limechat_token');
    localStorage.removeItem('limechat_user');
    disconnectSocket();
    set({ user: null, token: null });
  },

  updateProfile: async (formData) => {
    set({ loading: true });
    try {
      const res = await api.put('/auth/profile', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const updated = { ...get().user, ...res.data };
      localStorage.setItem('limechat_user', JSON.stringify(updated));
      set({ user: updated, loading: false }); return { success: true };
    } catch (err) { set({ loading: false }); return { success: false, error: err.response?.data?.message }; }
  },

  clearError: () => set({ error: null })
}));
export default useAuthStore;
