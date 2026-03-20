import { useState, useRef } from 'react';
import { FiX, FiUpload, FiCheck } from 'react-icons/fi';
import useChatStore from '../store/chatStore';
import toast from 'react-hot-toast';

const PRESETS = [
  { label: 'Lime Bubbles',  url: 'https://www.transparenttextures.com/patterns/cubes.png',   bg: '#f0fdf4' },
  { label: 'Dark Grid',     url: 'https://www.transparenttextures.com/patterns/grid-me.png', bg: '#0f172a' },
  { label: 'Soft Dots',     url: 'https://www.transparenttextures.com/patterns/polka-dots.png', bg: '#fefce8' },
  { label: 'Circuit',       url: 'https://www.transparenttextures.com/patterns/circuit-board.png', bg: '#14532d' },
  { label: 'Waves',         url: 'https://www.transparenttextures.com/patterns/wave-grid.png', bg: '#1e3a5f' },
  { label: 'Clean White',   url: '',                                                          bg: '#ffffff' },
  { label: 'Midnight',      url: '',                                                          bg: '#0f172a' },
  { label: 'Lime Gradient', url: '',                                                          bg: 'linear-gradient(135deg,#f0fdf4,#dcfce7)' },
];

export default function WallpaperPicker({ chatId, onClose }) {
  const [selected, setSelected] = useState(null);
  const [uploading, setUploading] = useState(false);
  const { setWallpaper } = useChatStore();
  const fileRef = useRef(null);

  const apply = async (preset) => {
    setSelected(preset.label);
    setUploading(true);
    await setWallpaper(chatId, null, preset.url || preset.bg);
    setUploading(false);
    toast.success('Wallpaper applied!');
    onClose();
  };

  const applyFile = async (file) => {
    setUploading(true);
    await setWallpaper(chatId, file, null);
    setUploading(false);
    toast.success('Wallpaper applied!');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-sm mx-4 animate-fade-in">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
          <h3 className="font-bold text-gray-800 dark:text-gray-100">🖼️ Chat Wallpaper</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-red-400"><FiX size={20}/></button>
        </div>
        <div className="p-5">
          <p className="text-xs text-gray-500 mb-3 font-medium">Choose a preset</p>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {PRESETS.map(p => (
              <button key={p.label} onClick={() => apply(p)} title={p.label}
                className={`relative w-full aspect-square rounded-xl border-2 transition overflow-hidden ${selected===p.label?'border-lime-500 scale-95':'border-gray-200 dark:border-gray-700 hover:border-lime-400'}`}
                style={{ background: p.bg }}>
                {p.url && <div className="absolute inset-0 opacity-40" style={{ backgroundImage: `url(${p.url})`, backgroundSize: '50px' }}/>}
                {selected===p.label && <FiCheck className="absolute inset-0 m-auto text-lime-600" size={18}/>}
              </button>
            ))}
          </div>
          <button onClick={() => fileRef.current.click()}
            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-lime-300 dark:border-lime-700 rounded-xl text-lime-600 dark:text-lime-400 hover:bg-lime-50 dark:hover:bg-lime-900/20 transition text-sm font-medium">
            <FiUpload size={16}/> Upload custom image
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && applyFile(e.target.files[0])}/>
          {uploading && <p className="text-center text-xs text-lime-500 mt-2 animate-pulse">Applying...</p>}
        </div>
      </div>
    </div>
  );
}
