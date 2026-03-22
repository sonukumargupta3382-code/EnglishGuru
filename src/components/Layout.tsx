import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MessageCircle, Star, HelpCircle } from 'lucide-react';

export default function Layout() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname === path;
  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      {/* Top Header */}
      <header className="bg-white px-5 py-4 flex items-center justify-between shrink-0 z-30 relative shadow-[0_2px_10px_rgba(0,0,0,0.04)] rounded-b-3xl mb-1">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/profile')}>
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-base shadow-md ring-2 ring-white">
            {userInitial}
          </div>
          <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 text-lg tracking-tight">EnglishGuru</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative pb-[65px]">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="absolute bottom-0 w-full h-[65px] bg-white border-t border-slate-200 flex justify-around items-center px-2 pb-safe z-20">
        <Link
          to="/"
          className={`flex flex-col items-center gap-1 p-2 w-20 rounded-xl transition-colors ${
            isActive('/') ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <MessageCircle className={`w-6 h-6 ${isActive('/') ? 'fill-indigo-50' : ''}`} />
          <span className="text-[10px] font-medium">Practice</span>
        </Link>
        <Link
          to="/solve"
          className={`flex flex-col items-center gap-1 p-2 w-20 rounded-xl transition-colors ${
            isActive('/solve') ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <HelpCircle className={`w-6 h-6 ${isActive('/solve') ? 'fill-indigo-50' : ''}`} />
          <span className="text-[10px] font-medium">Solve</span>
        </Link>
      </nav>
    </div>
  );
}
