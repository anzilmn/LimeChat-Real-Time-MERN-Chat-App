import { create } from 'zustand';
const useThemeStore = create((set) => ({
  isDark: localStorage.getItem('limechat_theme') === 'dark',
  toggle: () => set(s => {
    const d = !s.isDark;
    localStorage.setItem('limechat_theme', d ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', d);
    return { isDark: d };
  }),
  init: () => {
    const d = localStorage.getItem('limechat_theme') === 'dark';
    document.documentElement.classList.toggle('dark', d);
  }
}));
export default useThemeStore;
