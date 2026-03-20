import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import Login    from './pages/Login';
import Register from './pages/Register';
import Chat     from './pages/Chat';
import Profile  from './pages/Profile';
import Admin    from './pages/Admin';
import NotFound from './pages/NotFound';
import ProtectedRoute from './utils/ProtectedRoute';
import useThemeStore from './store/themeStore';
import { connectSocket } from './services/socket';
import useAuthStore from './store/authStore';

export default function App() {
  const { init } = useThemeStore();
  const { user } = useAuthStore();
  useEffect(() => { init(); if (user) connectSocket(user._id); }, []);

  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{
        style: { background:'#fff', color:'#1e293b', borderRadius:'12px', border:'1px solid #d9f99d', boxShadow:'0 4px 20px rgba(132,204,22,0.15)' },
        success: { iconTheme: { primary:'#84cc16', secondary:'#fff' } },
        error:   { iconTheme: { primary:'#ef4444', secondary:'#fff' } },
        duration: 3000
      }}/>
      <Routes>
        <Route path="/login"    element={<Login/>}/>
        <Route path="/register" element={<Register/>}/>
        <Route path="/"         element={<ProtectedRoute><Chat/></ProtectedRoute>}/>
        <Route path="/profile"  element={<ProtectedRoute><Profile/></ProtectedRoute>}/>
        <Route path="/admin"    element={<ProtectedRoute><Admin/></ProtectedRoute>}/>
        <Route path="*"         element={<NotFound/>}/>
      </Routes>
    </BrowserRouter>
  );
}
