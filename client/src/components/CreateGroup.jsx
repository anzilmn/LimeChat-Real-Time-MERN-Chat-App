import { useState, useEffect } from 'react';
import { FiX, FiUsers } from 'react-icons/fi';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function CreateGroup({ onClose }) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState([]);
  const [avatar, setAvatar] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { api.get('/users').then(r => setUsers(r.data)).catch(() => {}); }, []);
  const toggle = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const create = async () => {
    if (name.length < 3) return toast.error('Name min 3 chars');
    if (!selected.length) return toast.error('Add at least 1 member');
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('name', name); fd.append('description', desc);
      selected.forEach(id => fd.append('members', id));
      if (avatar) fd.append('avatar', avatar);
      await api.post('/groups', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Group created!'); onClose();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-fade-in">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
          <h3 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2"><FiUsers size={18}/> New Group</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-red-400"><FiX size={20}/></button>
        </div>
        <div className="p-5 space-y-3">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Group name (min 3)"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent text-sm text-gray-800 dark:text-gray-100 outline-none focus:border-lime-400"/>
          <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Description (optional)"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent text-sm text-gray-800 dark:text-gray-100 outline-none focus:border-lime-400"/>
          <div>
            <p className="text-xs text-gray-500 mb-2 font-medium">Add Members ({selected.length} selected)</p>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {users.map(u => (
                <label key={u._id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-lime-50 dark:hover:bg-gray-700 cursor-pointer">
                  <input type="checkbox" checked={selected.includes(u._id)} onChange={() => toggle(u._id)} className="accent-lime-500 w-4 h-4"/>
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-lime-400 to-lime-600 flex items-center justify-center text-white text-xs font-bold">{u.username.charAt(0).toUpperCase()}</div>
                  <span className="text-sm text-gray-700 dark:text-gray-200">{u.username}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Avatar (optional)</p>
            <input type="file" accept="image/*" onChange={e => setAvatar(e.target.files[0])}
              className="text-xs text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-lime-100 file:text-lime-700 hover:file:bg-lime-200"/>
          </div>
          <button onClick={create} disabled={loading}
            className="w-full py-3 rounded-xl bg-lime-500 hover:bg-lime-600 text-white font-semibold text-sm transition disabled:opacity-50">
            {loading ? 'Creating...' : 'Create Group'}
          </button>
        </div>
      </div>
    </div>
  );
}
