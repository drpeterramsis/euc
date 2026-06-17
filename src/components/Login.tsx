import React, { useState } from 'react';
import { loginUser } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import { notify } from '../utils/toastMessages';
import LoadingOverlay from '../components/LoadingOverlay';
import { motion } from 'framer-motion';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password) {
      notify.fillAllFields();
      return;
    }

    setIsLoading(true);

    try {
      const { success, user, error } = await loginUser(username, password);

      if (!success || !user) {
        notify.custom(error || 'اسم المستخدم أو كلمة المرور غير صحيحة', 'error');
        return;
      }

      localStorage.setItem('user', JSON.stringify(user));
      notify.loginSuccess();
      window.location.href = '/';
    } catch (err) {
      notify.custom('حدث خطأ أثناء الاتصال', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <LoadingOverlay isLoading={isLoading} message="جاري تسجيل الدخول..." />
      <div className="max-w-md mx-auto mt-10 p-8 bg-[#FFFDF5] rounded-2xl shadow-2xl border-2 border-[#D4AF37] relative overflow-hidden" dir="rtl" style={{ fontFamily: 'Cairo, sans-serif' }}>
        
        {/* Decorative corner accents */}
        <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-[#D4AF37] rounded-tr-2xl opacity-40"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-[#D4AF37] rounded-bl-2xl opacity-40"></div>

        {/* Church Credits Section */}
        <div className="text-center mb-6 border-b border-[#E8D5A3] pb-4">
          <p className="text-[#8B4513] text-sm font-semibold tracking-wide">كنيسة الشهيد العظيم مارجرجس بمنشية التحرير</p>
          <p className="text-[#8B7355] text-xs mt-1">تحت رعاية وأشراف أسرة الشهداء والشهيدات إعدادي</p>
        </div>

        {/* Stunning Animated Game Logo Symbol */}
        <div className="flex flex-col items-center justify-center mb-6">
          <div className="relative w-28 h-28 flex items-center justify-center">
            {/* Pulsing glow background */}
            <motion.div 
              className="absolute inset-0 bg-amber-100 rounded-full filter blur-xl opacity-60"
              animate={{ scale: [1, 1.25, 1], opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            {/* Spinning outward starburst */}
            <motion.div 
              className="absolute inset-0 flex items-center justify-center text-[#D4AF37] opacity-80"
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              style={{ fontSize: '72px', pointerEvents: 'none' }}
            >
              ⚙️
            </motion.div>
            {/* Inner shield icon with custom pulse */}
            <motion.div 
              className="absolute w-14 h-14 bg-gradient-to-br from-[#8B4513] to-[#5a2e0c] rounded-xl flex items-center justify-center border-2 border-[#D4AF37] shadow-lg"
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <span className="text-2xl" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>🏰</span>
            </motion.div>
          </div>
          
          <h1 className="text-4xl font-extrabold text-[#8B4513] mt-3 tracking-wider">كـنـعـان</h1>
          <p className="text-xs text-[#8B7355] font-mono tracking-widest mt-0.5">KAN3AN STRATEGY</p>
        </div>

        {/* Festival Slogan Page Segment */}
        <div className="bg-amber-50/70 border border-[#E8D5A3] rounded-lg p-3 text-center mb-6">
          <p className="text-xs text-[#8B7355] mb-1">شعار مهرجان 2026</p>
          <p className="text-[#8B4513] font-bold text-base tracking-wide italic">"يَعْظُمُ انْتِصَارُنَا بِالَّذِي أَحَبَّنَا"</p>
        </div>

        {/* Form elements */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#8B7355] pr-1">اسم المستخدم</label>
            <input
              type="text"
              placeholder="أدخل اسم الحساب"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 bg-white border-2 border-[#E8D5A3] rounded-xl text-[#2C1810] placeholder-[#BDBDBD] focus:outline-none focus:border-[#8B4513] focus:ring-1 focus:ring-[#8B4513] transition-all"
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#8B7355] pr-1">كلمة المرور</label>
            <input
              type="password"
              placeholder="أدخل كلمة المرور"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-white border-2 border-[#E8D5A3] rounded-xl text-[#2C1810] placeholder-[#BDBDBD] focus:outline-none focus:border-[#8B4513] focus:ring-1 focus:ring-[#8B4513] transition-all"
            />
          </div>

          <button 
            type="submit" 
            className="w-full mt-2 bg-[#8B4513] hover:bg-[#72380f] active:scale-[0.98] transition-all text-white p-3.5 rounded-xl font-bold text-lg shadow-md hover:shadow-xl hover:translate-y-[-1px]"
          >
            دخول الحساب
          </button>
        </form>

        <div className="text-center mt-6 text-[10px] text-[#A68F73]">
          جميع الحقوق محفوظة للمطور <br /> دكتور بيتر رمسيس توفيق &copy; {new Date().getFullYear()} <br / > +201224169492
        </div>
      </div>
    </>
  );
}
