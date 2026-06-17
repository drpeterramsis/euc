import React, { useState } from 'react';
import { getSupabase } from '../../lib/supabase';

interface LogoutModalProps {
  onConfirm?: () => void;
  onCancel: () => void;
}

export default function LogoutModal({ onConfirm, onCancel }: LogoutModalProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleConfirm = async () => {
    setIsLoggingOut(true);
    try {
      localStorage.removeItem('user');
      sessionStorage.clear();
      const supabase = getSupabase();
      if (supabase) await supabase.auth.signOut();
      if (onConfirm) onConfirm();
      window.location.replace('/login');
    } catch {
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 z-[1000] transition-opacity" 
        onClick={isLoggingOut ? undefined : onCancel}
      />
      <div className="fixed bottom-0 sm:bottom-auto sm:top-1/2 left-1/2 -translate-x-1/2 sm:-translate-y-1/2 w-full sm:w-[400px] bg-[#FFFdf5] sm:rounded-2xl rounded-t-2xl z-[1001] p-6 shadow-2xl flex flex-col gap-4" dir="rtl">
        <div className="flex flex-col items-center mb-2">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-sm">
            <span className="text-2xl">🚪</span>
          </div>
          <h2 className="text-2xl font-bold font-title text-[#8B4513]">تسجيل الخروج</h2>
          <p className="text-[#8B7355] text-center mt-2 font-body font-medium">هل أنت متأكد أنك تريد الخروج؟</p>
        </div>
        
        <div className="flex gap-3 sm:flex-row flex-col mt-4 font-body">
          <button 
            onClick={handleConfirm}
            disabled={isLoggingOut}
            className={`flex-1 min-h-[48px] ${isLoggingOut ? 'bg-red-400' : 'bg-red-600 hover:bg-red-700'} text-white rounded-xl font-bold border-2 border-transparent transition-colors flex items-center justify-center gap-2`}
          >
            {isLoggingOut ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <><span>🚪</span>خروج</>
            )}
          </button>
          <button 
            onClick={onCancel}
            disabled={isLoggingOut}
            className="flex-1 min-h-[48px] bg-white border-2 border-[#D4AF37] text-[#8B4513] hover:bg-[#FFF8E7] rounded-xl font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>✕</span>
            إلغاء
          </button>
        </div>
      </div>
    </>
  );
}
