import { useState, useEffect } from 'react';
import { FiSearch, FiEdit, FiLogOut, FiSettings, FiUsers, FiMoon, FiSun, FiPhone } from 'react-icons/fi';
import { BsChatDots, BsPeopleFill, BsTelephone } from 'react-icons/bs';
import useChatStore from '../store/chatStore';
import useAuthStore from '../store/authStore';
import useThemeStore from '../store/themeStore';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import CreateGroup from './CreateGroup';
import Avatar from './Avatar';
import api from '../services/api';

export default function Sidebar({ onSelectUser, onSelectGroup }) {
  const [tab, setTab]           = useState('chats');
  const [search, setSearch]     = useState('');
  const [showGroup, setShowGroup] = useState(false);
  const [callLogs, setCallLogs] = useState([]);
  const { users, fetchUsers, onlineUsers, inCallUsers, groups, fetchGroups, selectedUser, selectedGroup } = useChatStore();
  const { user, logout } = useAuthStore();
  const { isDark, toggle } = useThemeStore();
  const navigate = useNavigate();

  useEffect(() => { fetchUsers(search); }, [search]);
  useEffect(() => { fetchGroups(); }, []);
  useEffect(() => {
    if (tab === 'calls') api.get('/calls/my').then(r => setCallLogs(r.data)).catch(() => {});
  }, [tab]);

  const handleLogout = async () => { await logout(); navigate('/login'); };

  const callIcon = (type, status) => {
    if (type === 'video') return status === 'missed' ? '📹❌' : status === 'rejected' ? '📹⛔' : '📹✅';
    return status === 'missed' ? '📞❌' : status === 'rejected' ? '📞⛔' : '📞✅';
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-lime-500 to-lime-600 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar src={user?.profilePic} name={user?.username} online size="md"/>
          <div>
            <p className="font-bold text-white text-sm">{user?.username}</p>
            <p className="text-lime-100 text-xs">{user?.isAdmin ? '👑 Admin' : '🟢 Online'}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={toggle} className="p-2 rounded-full bg-lime-400/30 text-white hover:bg-lime-400/50 transition">
            {isDark ? <FiSun size={15}/> : <FiMoon size={15}/>}
          </button>
          <button onClick={() => navigate('/profile')} className="p-2 rounded-full bg-lime-400/30 text-white hover:bg-lime-400/50 transition">
            <FiSettings size={15}/>
          </button>
          {user?.isAdmin && (
            <button onClick={() => navigate('/admin')} className="p-2 rounded-full bg-lime-400/30 text-white hover:bg-lime-400/50 transition">
              <FiUsers size={15}/>
            </button>
          )}
          <button onClick={handleLogout} className="p-2 rounded-full bg-lime-400/30 text-white hover:bg-red-400/50 transition">
            <FiLogOut size={15}/>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="p-3">
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-xl px-3 py-2">
          <FiSearch className="text-gray-400" size={15}/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
            className="flex-1 bg-transparent text-sm outline-none text-gray-700 dark:text-gray-200 placeholder-gray-400"/>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 dark:border-gray-800 px-2">
        {[['chats','Chats',BsChatDots],['groups','Groups',BsPeopleFill],['calls','Calls',BsTelephone]].map(([id,label,Icon]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex-1 flex items-center justify-center gap-1 py-2.5 text-xs font-medium transition border-b-2 ${tab===id?'border-lime-500 text-lime-600 dark:text-lime-400':'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}>
            <Icon size={13}/> {label}
          </button>
        ))}
      </div>

      {/* Lists */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'chats' && (
          users.length === 0
            ? <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2"><BsChatDots size={28}/><p className="text-sm">No users found</p></div>
            : users.map(u => (
                <button key={u._id} onClick={() => onSelectUser(u)}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-lime-50 dark:hover:bg-gray-800 transition text-left ${selectedUser?._id===u._id?'bg-lime-50 dark:bg-gray-800 border-r-4 border-lime-500':''}`}>
                  <Avatar src={u.profilePic} name={u.username}
                    online={onlineUsers.includes(u._id)}
                    inCall={inCallUsers.includes(u._id)}/>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm text-gray-800 dark:text-gray-100 truncate">{u.username}</p>
                      {!onlineUsers.includes(u._id) && u.lastSeen && (
                        <span className="text-xs text-gray-400">{formatDistanceToNow(new Date(u.lastSeen),{addSuffix:true})}</span>
                      )}
                    </div>
                    <p className="text-xs truncate">
                      {inCallUsers.includes(u._id)
                        ? <span className="text-blue-500">📞 In a call</span>
                        : onlineUsers.includes(u._id)
                          ? <span className="text-lime-500">🟢 Online</span>
                          : <span className="text-gray-400">⚫ Offline</span>}
                    </p>
                  </div>
                </button>
              ))
        )}

        {tab === 'groups' && (
          <div>
            <button onClick={() => setShowGroup(true)}
              className="w-full flex items-center gap-2 px-4 py-3 text-lime-600 dark:text-lime-400 hover:bg-lime-50 dark:hover:bg-gray-800 transition text-sm font-medium border-b border-gray-100 dark:border-gray-800">
              <FiEdit size={13}/> Create New Group
            </button>
            {groups.map(g => (
              <button key={g._id} onClick={() => onSelectGroup(g)}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-lime-50 dark:hover:bg-gray-800 transition text-left ${selectedGroup?._id===g._id?'bg-lime-50 dark:bg-gray-800 border-r-4 border-lime-500':''}`}>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-lime-400 to-lime-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {g.avatar?<img src={g.avatar} className="w-full h-full rounded-full object-cover" alt=""/>:g.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-800 dark:text-gray-100 truncate">{g.name}</p>
                  <p className="text-xs text-gray-400">{g.members?.length} members</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {tab === 'calls' && (
          <div>
            {callLogs.length === 0
              ? <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2 py-12"><BsTelephone size={28}/><p className="text-sm">No call history</p></div>
              : callLogs.map(log => {
                  const other = log.callerId?._id === user?._id ? log.receiverId : log.callerId;
                  const isOut = log.callerId?._id === user?._id;
                  return (
                    <div key={log._id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 dark:border-gray-800">
                      <Avatar src={other?.profilePic} name={other?.username} size="sm"/>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{other?.username}</p>
                        <p className="text-xs text-gray-400">
                          {callIcon(log.type, log.status)} {isOut ? 'Outgoing' : 'Incoming'} ·{' '}
                          {log.duration ? Math.floor(log.duration/60)+'m '+log.duration%60+'s' : log.status}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400">{formatDistanceToNow(new Date(log.createdAt),{addSuffix:true})}</span>
                    </div>
                  );
                })
            }
          </div>
        )}
      </div>

      {showGroup && <CreateGroup onClose={() => { setShowGroup(false); fetchGroups(); }}/>}
    </div>
  );
}
