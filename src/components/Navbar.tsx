import { User } from '../types';
import { LogOut, Shield } from 'lucide-react';
import { getSupabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

interface NavbarProps {
  currentUser: User | null;
}

export default function Navbar({ currentUser }: NavbarProps) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    localStorage.removeItem('user');
    const supabase = getSupabase();
    if (supabase) await supabase.auth.signOut();
    navigate('/login', { replace: true });
  };

  return (
    <nav className="bg-[#0A1628] text-white border-b-2 border-[#C9A84C] sticky top-0 z-50 shadow-md w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏛️</span>
            <span className="text-xl sm:text-2xl font-black tracking-tight text-white cursor-pointer" onClick={() => navigate('/')}>
              كنعان <span className="text-[#C9A84C] font-medium text-xs sm:text-sm mr-1">KAN3AN</span>
            </span>
          </div>

          <div className="flex items-center gap-3.5">
            {currentUser && (
              <>
                <div className="hidden sm:flex flex-col items-end text-right">
                  <span className="text-xs font-bold text-slate-300">{currentUser.username}</span>
                  <span className="text-[10px] text-[#C9A84C] font-extrabold flex items-center gap-0.5 mt-0.5">
                    <Shield size={10} />
                    {currentUser.role === 'super_admin' ? 'أدمن رئيسي' : currentUser.role === 'team_admin' ? 'قائد السبط' : 'عضو'}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="bg-red-700 hover:bg-red-800 text-white font-bold py-1.5 px-3 rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <LogOut size={12} />
                  <span className="hidden sm:inline">خروج</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
