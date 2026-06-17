import React from 'react';
import { motion } from 'framer-motion';
import { APP_VERSION } from '../config/version';

export default function AboutPage() {
  const rules = [
    {
      title: '🎯 الهدف وعناصر الفوز',
      desc: 'يتنافس الأسباط الاثني عشر على كسب أكبر عدد من النقاط وبناء المنشآت والقرى على خريطة كنعان التاريخية لتحقيق التنمية الجغرافية والسيادة المستندة إلى التكامل والتنسيق البنائي.'
    },
    {
      title: '💰 قواعد واكتساب النقاط',
      desc: 'يحصل كل سبط على نقاط المكافآت من خلال المسابقات، الأنشطة، والالتزام بحضور الاجتماعات في المهرجان، وهي بمثابة عملة وميزانية السبط للتشييد والتوسع.'
    },
    {
      title: '🏗️ البناء والاستثمار على الخريطة',
      desc: 'يستطيع مسؤول كل سبط والمسؤول العام تشييد منشآت ومجسمات على الخريطة من الكتالوج المعتمد، حيث تُخصم تكلفة كل منشأة تلقائياً من نقاط السبط المتاحة في نفس اللحظة.'
    },
    {
      title: '🔗 شروط الترابط والتكامل الجغرافي',
      desc: 'المباني المتطابقة أو المتجاورة (مثل الطرق، المعابر، ومجاري المياه) تشكل سلاسل مترابطة وخطوط سير متصلة على الخريطة بشكل تلقائي وبصري رائع.'
    },
    {
      title: '🔄 الهدم واسترداد النقاط',
      desc: 'في حالة الرغبة في التراجع أو هدم منشأة، يستطيع المسؤول هدمها لاستعادة نقاط تكلفة التشييد بالكامل إلى ميزانية رصيد السبط مجدداً لتوفير مرونة تكتيكية كاملة.'
    },
    {
      title: '📍 نقل المنشآت وإعادة التموضع',
      desc: 'نقل المباني من بقعة إلى بقعة أخرى في نطاق السبط الجغرافي هو إجراء تنظيمي مجاني تماماً، ولا يترتب عليه خصم أو صرف أي نقاط إضافية.'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-4xl mx-auto p-4 sm:p-8"
      dir="rtl"
      style={{ fontFamily: 'Cairo, sans-serif' }}
    >
      {/* Upper Logo Shield Header */}
      <div className="text-center mb-8 bg-amber-50/40 border-2 border-[#D4AF37] rounded-2xl p-6 relative overflow-hidden shadow-md">
        <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-[#D4AF37] opacity-50"></div>
        <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-[#D4AF37] opacity-50"></div>
        
        <p className="text-[#8B4513] text-sm font-bold tracking-wide">كنيسة الشهيد العظيم مارجرجس بمنشية التحرير</p>
        <p className="text-[#8B7355] text-xs font-medium mt-1">أسرة الشهداء والشهيدات للمرحلة الإعدادية</p>
        
        <h1 className="text-4xl font-black text-[#8B4513] mt-4 mb-2 tracking-wider">كـنـعـان ⚔️</h1>
        <p className="text-sm font-semibold text-[#8B7355] max-w-lg mx-auto leading-relaxed">
          تطبيق استراتيجي تفاعلي لإدارة الميزانيات، تخطيط البناء الرقمي، ومتابعة الأداء والتكامل الجغرافي للأسباط الاثني عشر على خريطة الأرض.
        </p>

        <div className="inline-block bg-amber-100/60 border border-[#E8D5A3] px-4 py-1.5 rounded-full text-xs text-[#8B4513] font-bold mt-4">
          مهرجان 2026 : "يَعْظُمُ انْتِصَارُنَا بِالَّذِي أَحَبَّنَا"
        </div>
      </div>

      {/* Developer and Credits Segment */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-[#FFFDF5] border-2 border-[#D4AF37] rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-2xl">👨‍💻</span>
            <h3 className="text-base font-bold text-[#8B4513] mt-2 mb-1">برمجة وتطوير المنظومة</h3>
            <p className="text-sm text-[#2C1810] font-bold">دكتور بيتر رمسيس توفيق</p>
            <p className="text-xs text-[#8B7355] mt-1 leading-relaxed">
              تصميم وتطوير برمجيات الألعاب الاستراتيجية وأنظمة إدارة النقاط التفاعلية لخدمة التربية الكنسية والأنشطة الشبابية.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-[#F0E6C8] flex justify-between items-center">
            <span className="text-xs text-[#8B7355] font-bold">للتواصل أو الدعم:</span>
            <a href="tel:+201224169492" className="text-sm font-bold text-[#8B4513] hover:underline" dir="ltr">+201224169492</a>
          </div>
        </div>

        <div className="bg-[#FFFDF5] border-2 border-[#D4AF37] rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-2xl">⛪</span>
            <h3 className="text-base font-bold text-[#8B4513] mt-2 mb-1">الجهة المنظمة والمشرفة</h3>
            <p className="text-sm text-[#2C1810] font-bold">كنيسة الشهيد مارجرجس - منشية التحرير</p>
            <p className="text-xs text-[#8B7355] mt-1 leading-relaxed">
              تحت رعاية وأشراف الآباء الموقرين كهنة الكنيسة، ولجنة الخدمة بأسرة الشهداء والشهيدات للمرحلة الإعدادية بالمهرجان السنوي.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-[#F0E6C8] text-left">
            <span className="text-[10px] text-[#8B7355] font-mono">KAN3AN GAME SYSTEM v{APP_VERSION}</span>
          </div>
        </div>
      </div>

      {/* Rules and Instructions */}
      <div className="bg-[#FFFDF5] border-2 border-[#D4AF37] rounded-2xl p-6 shadow-md">
        <h2 className="text-xl font-bold text-[#8B4513] mb-4 pb-2 border-b border-[#E8D5A3] flex items-center gap-2">
          <span>📜</span> دليل ومبادئ وقوانين كنعان
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rules.map((rule, idx) => (
            <div key={idx} className="bg-amber-50/20 border border-[#E8D5A3]/50 rounded-xl p-4 hover:bg-amber-50/40 transition-colors">
              <h4 className="text-sm font-bold text-[#8B4513] mb-1.5 flex items-center gap-1.5">{rule.title}</h4>
              <p className="text-xs leading-relaxed text-[#6B5B45]">{rule.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center mt-8 text-xs text-[#A68F73] font-mono">
        جميع الحقوق محفوظة للمطور د. بيتر رمسيس &copy; {new Date().getFullYear()}
      </div>
    </motion.div>
  );
}
