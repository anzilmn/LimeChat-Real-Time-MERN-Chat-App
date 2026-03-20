import { Link } from 'react-router-dom';
export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="text-8xl mb-4">🍋</div>
      <h1 className="text-5xl font-black text-gray-800 dark:text-gray-100 mb-2">404</h1>
      <p className="text-gray-500 mb-6">Page not found</p>
      <Link to="/" className="px-6 py-3 bg-lime-500 hover:bg-lime-600 text-white rounded-xl font-semibold transition">Go Home</Link>
    </div>
  );
}
