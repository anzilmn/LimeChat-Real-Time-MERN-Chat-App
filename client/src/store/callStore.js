import { create } from 'zustand';
import api from '../services/api';

const useCallStore = create((set, get) => ({
  // Outgoing call state
  activeCall: null,    // { callLogId, peerId, type, callerName, status, startTime }
  // Incoming call state
  incomingCall: null,  // { from, type, callLogId, callerName, callerAvatar }
  callDuration: 0,
  durationTimer: null,

  initiateCall: async (receiverId, type, callerName, callerAvatar) => {
    try {
      const r = await api.post('/calls', { receiverId, type });
      set({ activeCall: { callLogId: r.data._id, peerId: receiverId, type, callerName, status: 'calling' } });
      return r.data._id;
    } catch { return null; }
  },

  setIncoming: (data)  => set({ incomingCall: data }),
  clearIncoming: ()    => set({ incomingCall: null }),

  setCallStatus: (status) => {
    set(s => ({ activeCall: s.activeCall ? { ...s.activeCall, status } : null }));
    if (status === 'connected') {
      const timer = setInterval(() => set(s => ({ callDuration: s.callDuration + 1 })), 1000);
      set({ durationTimer: timer });
    }
  },

  endCall: async (status = 'completed') => {
    const { activeCall, durationTimer, callDuration } = get();
    if (durationTimer) clearInterval(durationTimer);
    if (activeCall?.callLogId) {
      await api.put('/calls/' + activeCall.callLogId, { status, duration: callDuration }).catch(() => {});
    }
    set({ activeCall: null, incomingCall: null, callDuration: 0, durationTimer: null });
  }
}));
export default useCallStore;
