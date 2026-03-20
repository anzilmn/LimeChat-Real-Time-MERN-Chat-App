import { useState } from 'react';
import { FiX, FiAlertTriangle } from 'react-icons/fi';
import api from '../services/api';
import toast from 'react-hot-toast';

const REASONS = ['Spam','Harassment','Fake Account','Abusive Content','Privacy Violation','Other'];

export default function ReportModal({ user, onClose }) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!reason) return toast.error('Select a reason');
    setLoading(true);
    try {
      await api.post('/users/report', { reportedUser: user._id, reason, details });
      toast.success('Report submitted');
      onClose();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm mx-4 animate-fade-in">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
          <h3 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2 text-red-500">
            <FiAlertTriangle size={18}/> Report {user.username}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-red-400"><FiX size={20}/></button>
        </div>
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {REASONS.map(r => (
              <button key={r} onClick={() => setReason(r)}
                className={`py-2 px-3 rounded-xl text-xs font-medium border transition ${reason===r?'bg-red-100 dark:bg-red-900/30 border-red-400 text-red-600 dark:text-red-400':'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-red-300'}`}>
                {r}
              </button>
            ))}
          </div>
          <textarea value={details} onChange={e => setDetails(e.target.value)} placeholder="Additional details (optional)" rows={3}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent text-sm text-gray-800 dark:text-gray-100 outline-none focus:border-red-400 resize-none"/>
          <button onClick={submit} disabled={loading}
            className="w-full py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm transition disabled:opacity-50">
            {loading ? 'Submitting...' : 'Submit Report'}
          </button>
        </div>
      </div>
    </div>
  );
}
