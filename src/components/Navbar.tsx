import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { User, LogOut, LayoutDashboard, Home, HeartPulse, ShieldCheck, ChevronDown, Settings, ClipboardList, BookOpen } from 'lucide-react';

const Navbar: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="bg-white border-b border-stone-200 shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold text-sky-600 tracking-tight flex items-center gap-2">
          <div className="w-10 h-10 bg-sky-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-sky-100">
            <HeartPulse size={24} />
          </div>
          <span>Terapist Bul</span>
        </Link>

        <div className="flex items-center gap-6">
          <Link to="/" className="text-stone-600 hover:text-sky-600 transition-colors flex items-center gap-1">
            <Home size={18} />
            <span className="hidden sm:inline">Anasayfa</span>
          </Link>

          <Link to="/blog" className="text-stone-600 hover:text-sky-600 transition-colors flex items-center gap-1">
            <BookOpen size={18} />
            <span className="hidden sm:inline">Blog</span>
          </Link>

          {user ? (
            <>
              {profile?.role === 'provider' && (
                <Link to="/dashboard" className="text-stone-600 hover:text-sky-600 transition-colors flex items-center gap-1">
                  <ClipboardList size={18} />
                  <span className="hidden sm:inline">Talepler</span>
                </Link>
              )}
              <Link to="/dashboard" className="text-stone-600 hover:text-sky-600 transition-colors flex items-center gap-1">
                <LayoutDashboard size={18} />
                <span className="hidden sm:inline">Panel</span>
              </Link>
              {user.email === 'ahmetavci3858@gmail.com' && (
                <Link to="/admin" className="text-stone-600 hover:text-sky-600 transition-colors flex items-center gap-1">
                  <ShieldCheck size={18} />
                  <span className="hidden sm:inline">Yönetim</span>
                </Link>
              )}
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-3 pl-4 border-l border-stone-200 hover:bg-stone-50 transition-all p-2 rounded-xl"
                >
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-bold text-stone-900">{profile?.displayName && profile.displayName !== 'Yükleniyor...' ? profile.displayName : (user.displayName || user.email?.split('@')[0])}</span>
                    <span className={`text-[10px] uppercase tracking-wider font-bold ${
                      profile?.role === 'admin' || user.email === 'ahmetavci3858@gmail.com' ? 'text-sky-600' : 
                      profile?.role === 'provider' ? 'text-emerald-600' : 
                      profile?.role === 'seeker' ? 'text-amber-600' : 'text-stone-400'
                    }`}>
                      {profile?.role === 'admin' || user.email === 'ahmetavci3858@gmail.com' ? 'Yönetici' : 
                       profile?.role === 'provider' ? 'Hizmet Veren' : 
                       profile?.role === 'seeker' ? 'Hizmet Alan' : 'Yükleniyor...'}
                    </span>
                  </div>
                  <div className="w-8 h-8 bg-stone-100 rounded-full flex items-center justify-center text-stone-500">
                    <User size={18} />
                  </div>
                  <ChevronDown size={14} className={`text-stone-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-stone-100 shadow-2xl py-2 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-3 border-b border-stone-50 bg-stone-50/50">
                      <p className="text-xs text-stone-500 font-medium">Giriş yapıldı:</p>
                      <p className="text-sm font-bold text-stone-900 truncate">{user.email}</p>
                    </div>
                    
                    <Link 
                      to="/profile" 
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-stone-600 hover:bg-sky-50 hover:text-sky-600 transition-colors"
                    >
                      <Settings size={18} />
                      Profili Düzenle
                    </Link>
                    
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={18} />
                      Çıkış Yap
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link
              to="/auth"
              className="bg-sky-600 text-white px-5 py-2 rounded-full font-medium hover:bg-sky-700 transition-all shadow-md active:scale-95"
            >
              Giriş Yap
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
