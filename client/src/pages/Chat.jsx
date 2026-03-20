import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import IncomingCallModal from '../components/IncomingCallModal';
import CallScreen from '../components/CallScreen';
import useChatStore from '../store/chatStore';
import useAuthStore from '../store/authStore';
import useThemeStore from '../store/themeStore';
import useCallStore from '../store/callStore';
import { connectSocket, getSocket } from '../services/socket';
import { playNotif } from '../services/sounds';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function Chat() {
  const { setSelectedUser, setSelectedGroup, setOnlineUsers, fetchWallpapers } = useChatStore();
  const { user } = useAuthStore();
  const { init }  = useThemeStore();
  const { incomingCall, setIncoming, clearIncoming, initiateCall, setCallStatus, activeCall, endCall } = useCallStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    init();
    fetchWallpapers();
    if (!user) return;
    const socket = connectSocket(user._id);

    socket.on('users:online', (list) => {
      setOnlineUsers(list);
    });

    // Incoming call
    socket.on('call:incoming', ({ from, type, callLogId, callerName, callerAvatar }) => {
      setIncoming({ from, type, callLogId, callerName, callerAvatar });
      playNotif();
    });

    // Caller side: call unavailable
    socket.on('call:unavailable', ({ reason }) => {
      toast.error(reason || 'User unavailable');
      endCall('missed');
    });

    // Timeout notification
    socket.on('call:timeout', () => {
      toast.error('No answer');
    });

    return () => {
      socket.off('users:online');
      socket.off('call:incoming');
      socket.off('call:unavailable');
      socket.off('call:timeout');
    };
  }, [user]);

  const handleSelectUser = (u) => {
    setSelectedUser(u);
    if (window.innerWidth < 768) setSidebarOpen(false);
  };
  const handleSelectGroup = (g) => {
    setSelectedGroup(g);
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const handleStartCall = async (targetUser, type) => {
    if (!user) return;
    const logId = await initiateCall(targetUser._id, type, user.username, user.profilePic);
    if (!logId) return toast.error('Could not start call');
    const socket = getSocket();
    socket?.emit('call:initiate', {
      to:           targetUser._id,
      type,
      callLogId:    logId,
      callerName:   user.username,
      callerAvatar: user.profilePic
    });
  };

  const handleAcceptCall = () => {
    // CallScreen handles actual WebRTC once mounted as callee
    setCallStatus('connecting');
  };

  const handleRejectCall = () => {
    const socket = getSocket();
    socket?.emit('call:reject', { to: incomingCall.from, callLogId: incomingCall.callLogId });
    clearIncoming();
    toast('Call declined');
  };

  // Show call screen when active call OR after accepting incoming
  const showCallScreen = !!(activeCall) || (incomingCall && useCallStore.getState().callDuration > -1 && !incomingCall);

  return (
    <div className="h-screen flex bg-white dark:bg-gray-900 overflow-hidden">
      {!sidebarOpen && (
        <button onClick={() => setSidebarOpen(true)}
          className="md:hidden fixed top-4 left-4 z-30 bg-lime-500 text-white p-2 rounded-xl shadow-lg text-lg">☰</button>
      )}
      <div className={`${sidebarOpen?'flex':'hidden'} md:flex w-full md:w-80 lg:w-96 flex-shrink-0 flex-col`}>
        <Sidebar onSelectUser={handleSelectUser} onSelectGroup={handleSelectGroup}/>
      </div>
      <div className={`${!sidebarOpen?'flex':'hidden'} md:flex flex-1 flex-col min-w-0`}>
        <ChatWindow onStartCall={handleStartCall}/>
      </div>

      {/* Incoming call modal */}
      {incomingCall && !activeCall && (
        <IncomingCallModal
          call={incomingCall}
          onAccept={handleAcceptCall}
          onReject={handleRejectCall}
        />
      )}

      {/* Active call screen (fullscreen overlay) */}
      {activeCall && <CallScreen/>}
    </div>
  );
}
