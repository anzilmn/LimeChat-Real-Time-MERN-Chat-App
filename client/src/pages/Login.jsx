import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

export default function Login() {
  const [form, setForm]     = useState({ email:'', password:'' });
  const [errors, setErrors] = useState({});
  const { login, loading, user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => { if (user) navigate('/'); }, [user]);

  const validate = () => {
    const e = {};
    if (!form.email) e.email = 'Required';
    if (!form.password) e.password = 'Required';
    return e;
  };

  const onChange = e => { setForm(f => ({...f,[e.target.name]:e.target.value})); setErrors(er => ({...er,[e.target.name]:''})); };
  const onSubmit = async e => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    const r = await login(form);
    if (r.success) { toast.success('Welcome back! 🍋'); navigate('/'); }
    else toast.error(r.error);
  };

  const field = (name, label, type, ph) => (
    <div key={name}>
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">{label}</label>
      <input name={name} type={type} value={form[name]} onChange={onChange} placeholder={ph} autoComplete={name}
        className={`w-full px-4 py-3 rounded-xl border ${errors[name]?'border-red-400':'border-gray-200 dark:border-gray-600'} bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-sm outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-100 dark:focus:ring-lime-900 transition`}/>
      {errors[name] && <p className="text-red-400 text-xs mt-1">{errors[name]}</p>}
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-lime-50 via-white to-lime-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-7xl mb-3">🍋</div>
          <h1 className="text-4xl font-black text-gray-800 dark:text-white">LimeChat</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">v2 · Calls · Wallpapers · Real-Time</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl shadow-lime-100 dark:shadow-none p-8 border border-lime-100 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Sign In</h2>
          <form onSubmit={onSubmit} className="space-y-4">
            {field('email','Email or "admin"','text','you@example.com')}
            {field('password','Password','password','••••••••')}
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl bg-lime-500 hover:bg-lime-600 text-white font-bold text-sm transition shadow-lg disabled:opacity-50">
              {loading ? 'Signing in...' : 'Sign In 🍋'}
            </button>
          </form>
          <p className="text-xs text-gray-400 text-center mt-3">Admin: email=<b>admin</b> / pass=<b>admin</b></p>
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
            No account? <Link to="/register" className="text-lime-600 dark:text-lime-400 font-semibold hover:underline">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
