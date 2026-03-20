import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

export default function Register() {
  const [form, setForm]     = useState({ username:'', email:'', password:'' });
  const [errors, setErrors] = useState({});
  const { register, loading, user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => { if (user) navigate('/'); }, [user]);

  const validate = () => {
    const e = {};
    if (!form.username) e.username='Required';
    else if (form.username.length<3) e.username='Min 3 chars';
    if (!form.email) e.email='Required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email='Invalid email';
    if (!form.password) e.password='Required';
    else if (form.password.length<6) e.password='Min 6 chars';
    else if (!/\d/.test(form.password)) e.password='Need at least 1 number';
    return e;
  };

  const onChange = e => { setForm(f=>({...f,[e.target.name]:e.target.value})); setErrors(er=>({...er,[e.target.name]:''})); };
  const onSubmit = async e => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    const r = await register(form);
    if (r.success) { toast.success('Welcome! 🍋'); navigate('/'); }
    else toast.error(r.error);
  };

  const strength = p => {
    let s=0;
    if(p.length>=6)s++; if(/\d/.test(p))s++; if(/[A-Z]/.test(p))s++; if(/[^a-zA-Z0-9]/.test(p))s++;
    return s;
  };
  const pw = strength(form.password);
  const pwColors = ['','bg-red-400','bg-yellow-400','bg-lime-400','bg-lime-600'];
  const pwLabels = ['','Weak','Fair','Good','Strong'];

  const fld = (name,label,type,ph) => (
    <div key={name}>
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">{label}</label>
      <input name={name} type={type} value={form[name]} onChange={onChange} placeholder={ph}
        className={`w-full px-4 py-3 rounded-xl border ${errors[name]?'border-red-400':'border-gray-200 dark:border-gray-600'} bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-sm outline-none focus:border-lime-400 transition`}/>
      {errors[name] && <p className="text-red-400 text-xs mt-1">{errors[name]}</p>}
      {name==='password' && form.password && (
        <div className="mt-2">
          <div className="flex gap-1">{[1,2,3,4].map(i=><div key={i} className={`h-1 flex-1 rounded-full transition ${i<=pw?pwColors[pw]:'bg-gray-200 dark:bg-gray-600'}`}/>)}</div>
          <p className={`text-xs mt-1 ${pw>=3?'text-lime-500':pw>=2?'text-yellow-500':'text-red-400'}`}>{pwLabels[pw]}</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-lime-50 via-white to-lime-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-7xl mb-3">🍋</div>
          <h1 className="text-4xl font-black text-gray-800 dark:text-white">LimeChat</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Join the conversation</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 border border-lime-100 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Create Account</h2>
          <form onSubmit={onSubmit} className="space-y-4">
            {fld('username','Username','text','johndoe')}
            {fld('email','Email','email','you@example.com')}
            {fld('password','Password','password','Min 6 chars, 1 number')}
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl bg-lime-500 hover:bg-lime-600 text-white font-bold text-sm transition shadow-lg disabled:opacity-50">
              {loading ? 'Creating...' : 'Create Account 🍋'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
            Already have an account? <Link to="/login" className="text-lime-600 dark:text-lime-400 font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
