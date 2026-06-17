import React, { useState } from 'react';
import { User } from '../types';
import { KeyRound, ShieldAlert, UserCheck } from 'lucide-react';

interface LoginFormProps {
  onLogin: (username: string, role: string, teamId?: number) => void;
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorText, setErrorText] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText(null);

    const u = username.trim().toLowerCase();
    const p = password;

    if (u === 'admin' && p === 'admin123') {
      onLogin('admin', 'super_admin');
    } else if (u === 'yuda_admin' && p === 'yuda123') {
      onLogin('yuda_admin', 'team_admin', 4); // Judah team ID is 4
    } else if (u === 'yuda_member' && p === 'yuda123') {
      onLogin('yuda_member', 'member', 4);
    } else {
      setErrorText('اسم المستخدم أو كلمة المرور غير الصحيحة! يرجى الاستعانة ببيانات الحسابات الموضحة في لوحة التنبيه بالأسفل للتجربة.');
    }
  };

  return (
    <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl border-2 border-[#C9A84C]/30 shadow-2xl relative overflow-hidden transition-all hover:border-[#C9A84C]/60">
        
        {/* Top decorative stripe */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0A1628] via-[#C9A84C] to-[#0A1628]" />

        {/* Brand Banner */}
        <div className="text-center">
          <div className="mx-auto h-20 w-20 bg-[#0A1628]/5 flex items-center justify-center rounded-full border border-[#C9A84C]/40 text-4xl mb-4">
            🏛️
          </div>
          <h2 className="text-3xl font-extrabold text-[#0A1628] tracking-tight">مرحباً بك في كنعان</h2>
          <p className="mt-2 text-sm text-slate-500 font-medium">سجل دخولك لبناء أرض سبطك ومتابعة النقاط</p>
        </div>

        {errorText && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-lg leading-relaxed">
            ⚠️ {errorText}
          </div>
        )}

        {/* Form Body */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-bold text-[#0A1628] mb-2">اسم المستخدم</label>
              <div className="relative">
                <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 pointer-events-none">
                  <UserCheck size={16} />
                </span>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="appearance-none rounded-lg relative block w-full pr-10 pl-3 py-3 border border-slate-300 placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-[#0A1628] focus:border-[#0A1628] sm:text-sm font-medium text-right"
                  placeholder="أدخل اسم المستخدم (مثال: admin)"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-bold text-[#0A1628] mb-2">كلمة المرور</label>
              <div className="relative">
                <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 pointer-events-none">
                  <KeyRound size={16} />
                </span>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none rounded-lg relative block w-full pr-10 pl-3 py-3 border border-slate-300 placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-[#0A1628] focus:border-[#0A1628] sm:text-sm font-medium text-right"
                  placeholder="أدخل كلمة المرور (مثال: admin123)"
                />
              </div>
            </div>
          </div>

        

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-navy bg-[#C9A84C] hover:bg-[#C9A84C]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0A1628] transition-all transform hover:-translate-y-0.5 shadow-lg shadow-[#C9A84C]/20 cursor-pointer"
            >
              دخول الآن 🏛️
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
