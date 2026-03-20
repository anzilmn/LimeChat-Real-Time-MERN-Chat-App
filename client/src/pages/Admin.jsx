import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiUsers, FiMessageCircle, FiActivity, FiTrash2, FiSlash, FiCheck, FiPhone, FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import { formatDistanceToNow, format } from 'date-fns';

export default function Admin() {
  const { user }  = useAuthStore();
  const navigate  = useNavigate();
  const [tab, setTab]     = useState('dashboard');
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [callLogs, setCallLogs]  = useState([]);
  const [reports, setReports]    = useState([]);
  const [loading, setLoading]    = useState(true);

  useEffect(() => { if (!user?.isAdmin) { navigate('/'); return; } loadData(); }, []);
  useEffect(() => {
    if (tab === 'calls')   api.get('/users/call-logs').then(r => setCallLogs(r.data)).catch(() => {});
    if (tab === 'reports') api.get('/users/reports').then(r => setReports(r.data)).catch(() => {});
  }, [tab]);

  const loadData = async () => {
    try {
      const [s, u] = await Promise.all([api.get('/users/dashboard'), api.get('/users/all')]);
      setStats(s.data); setUsers(u.data);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  const delUser   = async (id) => {
    if (!confirm('Delete user?')) return;
    await api.delete('/users/' + id);
    setUsers(u => u.filter(x => x._id !== id));
    toast.success('Deleted');
  };
  const blockUser = async (id) => {
    const r = await api.put('/users/' + id + '/block');
    setUsers(u => u.map(x => x._id === id ? { ...x, isBlocked: r.data.isBlocked } : x));
    toast.success(r.data.message);
  };
  const updateReport = async (id, status) => {
    await api.put('/users/reports/' + id, { status });
    setReports(r => r.map(x => x._id === id ? { ...x, status } : x));
    toast.success('Report updated');
  };

  const Stat = ({ label, value, icon: Icon, color }) => (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center text-white`}><Icon size={22}/></div>
      <div><p className="text-2xl font-black text-gray-800 dark:text-gray-100">{value??'–'}</p><p className="text-sm text-gray-500">{label}</p></div>
    </div>
  );

  const callIcon = (type, status) => ({
    voice: { missed:'📞❌', rejected:'📞⛔', completed:'📞✅', timeout:'📞⏱' },
    video: { missed:'📹❌', rejected:'📹⛔', completed:'📹✅', timeout:'📹⏱' }
  }[type]?.[status] || '📞');

  const tabs = [
    ['dashboard','📊 Stats'],
    ['users','👥 Users'],
    ['calls','📞 Calls'],
    ['reports','🚨 Reports']
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="bg-gradient-to-r from-lime-500 to-lime-600 text-white px-6 py-4 flex items-center gap-4 shadow-lg">
        <button onClick={() => navigate('/')} className="p-2 rounded-xl bg-white/20 hover:bg-white/30 transition"><FiArrowLeft size={18}/></button>
        <div>
          <h1 className="font-black text-xl">🍋 Admin Dashboard</h1>
          <p className="text-lime-100 text-xs">LimeChat v2 Management Panel</p>
        </div>
        <button onClick={loadData} className="ml-auto p-2 rounded-xl bg-white/20 hover:bg-white/30 transition"><FiRefreshCw size={16}/></button>
      </div>

      <div className="max-w-5xl mx-auto p-6">
        <div className="flex gap-2 mb-6 flex-wrap">
          {tabs.map(([id,label]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${tab===id?'bg-lime-500 text-white shadow-md':'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-lime-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'}`}>
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-lime-500 border-t-transparent rounded-full animate-spin"/></div>
        ) : tab === 'dashboard' ? (
          <div>
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
              <Stat label="Users"    value={stats.totalUsers}   icon={FiUsers}          color="bg-lime-500"/>
              <Stat label="Online"   value={stats.activeUsers}  icon={FiActivity}       color="bg-blue-500"/>
              <Stat label="Messages" value={stats.totalMessages}icon={FiMessageCircle}  color="bg-purple-500"/>
              <Stat label="Blocked"  value={stats.blockedUsers} icon={FiSlash}          color="bg-orange-500"/>
              <Stat label="Calls"    value={stats.totalCalls}   icon={FiPhone}          color="bg-teal-500"/>
              <Stat label="Reports"  value={stats.pendingReports}icon={FiAlertTriangle} color="bg-red-500"/>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-4">Recent Users</h3>
              <div className="space-y-3">
                {stats.recentUsers?.map(u => (
                  <div key={u._id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-lime-400 to-lime-600 flex items-center justify-center text-white text-sm font-bold">
                      {u.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-800 dark:text-gray-100 truncate">{u.username}</p>
                      <p className="text-xs text-gray-400">{u.email} · {formatDistanceToNow(new Date(u.createdAt),{addSuffix:true})}</p>
                    </div>
                    {u.isOnline && <span className="text-xs bg-lime-100 dark:bg-lime-900/40 text-lime-700 dark:text-lime-400 px-2 py-0.5 rounded-full">Online</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>

        ) : tab === 'users' ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>{['User','Email','Status','Joined','Actions'].map(h=>(
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {users.filter(u => !u.isAdmin).map(u => (
                    <tr key={u._id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-lime-400 to-lime-600 flex items-center justify-center text-white text-xs font-bold">{u.username.charAt(0).toUpperCase()}</div>
                          <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{u.username}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.isBlocked?'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400':u.isOnline?'bg-lime-100 dark:bg-lime-900/30 text-lime-700 dark:text-lime-400':'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>
                          {u.isBlocked?'🚫 Blocked':u.isOnline?'🟢 Online':'⚫ Offline'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">{formatDistanceToNow(new Date(u.createdAt),{addSuffix:true})}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => blockUser(u._id)}
                            className={`p-1.5 rounded-lg ${u.isBlocked?'bg-lime-100 text-lime-600':'bg-orange-100 text-orange-500'} transition hover:opacity-80`}>
                            {u.isBlocked?<FiCheck size={13}/>:<FiSlash size={13}/>}
                          </button>
                          <button onClick={() => delUser(u._id)}
                            className="p-1.5 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-500 hover:opacity-80 transition">
                            <FiTrash2 size={13}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.filter(u=>!u.isAdmin).length===0 && (
                <div className="text-center py-12 text-gray-400"><FiUsers size={28} className="mx-auto mb-2 opacity-40"/><p className="text-sm">No users</p></div>
              )}
            </div>
          </div>

        ) : tab === 'calls' ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="font-bold text-gray-800 dark:text-gray-100">📞 Call Logs</h3>
            </div>
            {callLogs.length === 0
              ? <div className="text-center py-12 text-gray-400"><FiPhone size={28} className="mx-auto mb-2 opacity-40"/><p className="text-sm">No call logs</p></div>
              : <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {callLogs.map(log => (
                    <div key={log._id} className="flex items-center gap-4 px-4 py-3">
                      <span className="text-2xl">{callIcon(log.type, log.status)}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                          {log.callerId?.username} → {log.receiverId?.username}
                        </p>
                        <p className="text-xs text-gray-400">
                          {log.status} · {log.duration ? Math.floor(log.duration/60)+'m '+log.duration%60+'s' : 'no duration'} · {format(new Date(log.createdAt),'MMM d, h:mm a')}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${log.status==='completed'?'bg-lime-100 text-lime-700':log.status==='missed'?'bg-yellow-100 text-yellow-700':'bg-red-100 text-red-700'}`}>
                        {log.status}
                      </span>
                    </div>
                  ))}
                </div>
            }
          </div>

        ) : tab === 'reports' ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="font-bold text-gray-800 dark:text-gray-100">🚨 User Reports</h3>
            </div>
            {reports.length === 0
              ? <div className="text-center py-12 text-gray-400"><FiAlertTriangle size={28} className="mx-auto mb-2 opacity-40"/><p className="text-sm">No reports</p></div>
              : <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {reports.map(r => (
                    <div key={r._id} className="px-4 py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                            <span className="text-red-500">{r.reportedUser?.username}</span> reported by <span className="text-lime-600">{r.reportedBy?.username}</span>
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">Reason: <b>{r.reason}</b> · {r.details}</p>
                          <p className="text-xs text-gray-400">{formatDistanceToNow(new Date(r.createdAt),{addSuffix:true})}</p>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full text-center font-medium ${r.status==='pending'?'bg-yellow-100 text-yellow-700':r.status==='reviewed'?'bg-blue-100 text-blue-700':'bg-gray-100 text-gray-500'}`}>
                            {r.status}
                          </span>
                          {r.status === 'pending' && (
                            <div className="flex gap-1">
                              <button onClick={() => updateReport(r._id,'reviewed')} className="text-xs px-2 py-0.5 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition">Review</button>
                              <button onClick={() => updateReport(r._id,'dismissed')} className="text-xs px-2 py-0.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition">Dismiss</button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
            }
          </div>
        ) : null}
      </div>
    </div>
  );
}
