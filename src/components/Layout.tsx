import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MessageCircle, Star, HelpCircle, Moon, Sun } from 'lucide-react';

export default function Layout() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const isActive = (path: string) => location.pathname === path;
  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 relative transition-colors duration-300">
      {/* Top Header */}
      <header className="bg-white dark:bg-slate-800 px-5 py-4 flex items-center justify-between shrink-0 z-30 relative shadow-[0_2px_10px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.2)] rounded-b-3xl mb-1 transition-colors duration-300">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/profile')}>
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-base shadow-md ring-2 ring-white dark:ring-slate-800">
            {userInitial}
          </div>
          <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 text-lg tracking-tight">EnglishGuru</span>
        </div>
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="p-2 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative pb-[65px]">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="absolute bottom-0 w-full h-[65px] bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-around items-center px-2 pb-safe z-20 transition-colors duration-300">
        <Link
          to="/"
          className={`flex flex-col items-center gap-1 p-2 w-20 rounded-xl transition-colors ${
            isActive('/') ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <MessageCircle className={`w-6 h-6 ${isActive('/') ? 'fill-indigo-50 dark:fill-indigo-900/30' : ''}`} />
          <span className="text-[10px] font-medium">Practice</span>
        </Link>
        <Link
          to="/solve"
          className={`flex flex-col items-center gap-1 p-2 w-20 rounded-xl transition-colors ${
            isActive('/solve') ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <HelpCircle className={`w-6 h-6 ${isActive('/solve') ? 'fill-indigo-50 dark:fill-indigo-900/30' : ''}`} />
          <span className="text-[10px] font-medium">Solve</span>
        </Link>
      </nav>
    </div>
  );
}
