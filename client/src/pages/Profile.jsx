import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiCamera, FiSave, FiBell, FiBellOff } from 'react-icons/fi';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, updateProfile, loading } = useAuthStore();
  const [username, setUsername]   = useState(user?.username || '');
  const [bio, setBio]             = useState(user?.bio || '');
  const [sound, setSound]         = useState(user?.notifSound !== false);
  const [file, setFile]           = useState(null);
  const [preview, setPreview]     = useState(user?.profilePic || '');
  const navigate = useNavigate();

  const onFile = e => { const f = e.target.files[0]; if(f){ setFile(f); setPreview(URL.createObjectURL(f)); } };
  const save   = async () => {
    const fd = new FormData();
    fd.append('username', username);
    fd.append('bio', bio);
    fd.append('notifSound', sound);
    if (file) fd.append('profilePic', file);
    const r = await updateProfile(fd);
    if (r.success) toast.success('Profile updated!');
    else toast.error(r.error || 'Update failed');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center py-8 px-4">
      <div className="w-full max-w-md">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-lime-600 dark:text-lime-400 mb-6 hover:underline text-sm">
          <FiArrowLeft/> Back to Chat
        </button>
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Edit Profile</h2>
          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              {preview
                ? <img src={preview} alt="profile" className="w-24 h-24 rounded-full object-cover border-4 border-lime-400"/>
                : <div className="w-24 h-24 rounded-full bg-gradient-to-br from-lime-400 to-lime-600 flex items-center justify-center text-white text-3xl font-bold border-4 border-lime-400">{username.charAt(0).toUpperCase()}</div>
              }
              <label className="absolute bottom-0 right-0 bg-lime-500 hover:bg-lime-600 text-white p-2 rounded-full cursor-pointer shadow-lg transition">
                <FiCamera size={13}/>
                <input type="file" accept="image/*" className="hidden" onChange={onFile}/>
              </label>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Username</label>
              <input value={username} onChange={e => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-sm outline-none focus:border-lime-400"/>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Bio</label>
              <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} placeholder="About yourself..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-sm outline-none focus:border-lime-400 resize-none"/>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
              <div>
                <p className="font-medium text-sm text-gray-800 dark:text-gray-100">Notification Sounds</p>
                <p className="text-xs text-gray-500">Play sound for new messages</p>
              </div>
              <button onClick={() => setSound(s => !s)}
                className={`relative w-11 h-6 rounded-full transition ${sound?'bg-lime-500':'bg-gray-300 dark:bg-gray-600'}`}>
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${sound?'left-[22px]':'left-0.5'}`}/>
              </button>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 text-xs text-gray-500 dark:text-gray-400 space-y-1">
              <p>Email: <span className="font-medium text-gray-700 dark:text-gray-200">{user?.email}</span></p>
              <p>Role: <span className="text-lime-600 dark:text-lime-400 font-medium">{user?.isAdmin?'👑 Admin':'👤 User'}</span></p>
            </div>
            <button onClick={save} disabled={loading}
              className="w-full py-3 rounded-xl bg-lime-500 hover:bg-lime-600 text-white font-bold text-sm transition flex items-center justify-center gap-2 disabled:opacity-50">
              <FiSave size={15}/> {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
