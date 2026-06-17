import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchAllBuildingTypes } from '../services/buildingTypeService';
import { getSupabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

export default function BuildingRoadmapPage() {
  const [types, setTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await fetchAllBuildingTypes();
        setTypes(data || []);
      } catch (err: any) {
        toast.error('فشل تحميل مخطط مباني الكنعانيين: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[460px] p-8 text-center" style={{ fontFamily: 'Cairo, sans-serif' }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid #F3F3F3',
          borderTop: '3px solid #D4AF37',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <p className="mt-4 text-[#8B4513] font-bold">جاري إعداد خارطة طريق البناء الكنعاني...</p>
      </div>
    );
  }

  // Find prerequisite relationships
  const getPrereqsFor = (bt: any) => {
    if (!bt.prerequisites) return [];
    const ids = bt.prerequisites.split(',').map((s: string) => s.trim()).filter(Boolean);
    return ids.map(id => types.find(t => t.id === id || t.name === id)).filter(Boolean);
  };

  const getUnlocksFor = (bt: any) => {
    return types.filter(t => {
      if (!t.prerequisites) return false;
      const ids = t.prerequisites.split(',').map((s: string) => s.trim()).filter(Boolean);
      return ids.some(id => id === bt.id || id === bt.name);
    });
  };

  const filteredTypes = types.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    (t.name_en && t.name_en.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100%',
      backgroundColor: '#FDF6E3',
      padding: '24px 16px',
      fontFamily: 'Cairo, sans-serif',
      direction: 'rtl'
    }}>
      {/* Page Header */}
      <div className="bg-[#FFFDF5] border-2 border-[#E8D5A3] rounded-2xl p-6 mb-6 shadow-sm">
        <h1 className="text-xl sm:text-2xl font-bold text-[#8B4513] mb-2 flex items-center gap-2">
          🗺️ خارطة طريق ومستلزمات البناء والتشييد
        </h1>
        <p className="text-sm text-[#5C4033] leading-relaxed">
          الدليل الإرشادي لأسباط كنعان لفهم تتابع البناء. بعض المنشآت والتحصينات المتقدمة مثل القلاع والأسوار الكبرى والمخازن تتطلب تشييد منشآت بدائية (ممرات، مجاري مياه، آبار) أولاً لتأهيل الأرض وضمان جاهزية الموارد للقبيلة.
        </p>
      </div>

      {/* Control Row */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative w-full sm:max-w-md">
          <input 
            type="text"
            placeholder="🔍 ابحث عن مبنى لمعرفة شروطه ومستلزماته..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border-2 border-[#D4AF37] bg-white text-[#2C1810] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] placeholder-[#CD853F]/60 text-sm"
          />
          {search && (
            <button 
              onClick={() => setSearch('')}
              className="absolute left-3 top-2.5 text-[#CD853F] hover:text-[#8B4513] text-sm"
            >
              ✕ مسح
            </button>
          )}
        </div>
        <div className="text-xs text-[#8B4513] font-medium bg-[#FFF1D0] px-3 py-1.5 rounded-lg border border-[#D4AF37]/50">
          💡 انقر على أي مبنى أدناه لتمثيل مسار ترابطه تزامنيًا!
        </div>
      </div>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Catalog of Buildings & Connections */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <h2 className="text-base font-bold text-[#8B4513] mr-1">📂 هرمية الأبنية (حسب الأصول المطلوبة)</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredTypes.map((bt) => {
              const prereqs = getPrereqsFor(bt);
              const unlocks = getUnlocksFor(bt);
              const isSelected = selectedId === bt.id;
              
              return (
                <motion.div
                  key={bt.id}
                  onClick={() => setSelectedId(selectedId === bt.id ? null : bt.id)}
                  whileHover={{ scale: 1.02 }}
                  className={`cursor-pointer p-4 rounded-xl border-2 transition-all shadow-sm flex flex-col justify-between h-full ${
                    isSelected 
                      ? 'bg-[#FFF1D0] border-[#D4AF37] ring-4 ring-[#D4AF37]/20 shadow-md' 
                      : 'bg-white border-[#E8D5A3] hover:border-[#D4AF37]'
                  }`}
                >
                  <div>
                    {/* Header: Icon and Cost */}
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-3xl p-1 bg-[#FFF9EA] rounded-lg border border-[#E8D5A3]">
                        {bt.icon || '🏛️'}
                      </span>
                      <span className="text-[11px] font-bold px-2.5 py-1 bg-[#EEFDF2] text-[#27AE60] border border-[#A3E8B5] rounded-full">
                        💰 {bt.cost} ن.
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-sm text-[#2C1810] mb-1">{bt.name}</h3>
                    {bt.name_en && (
                      <p className="text-[11px] font-mono text-[#CD853F] uppercase tracking-wider mb-2">{bt.name_en}</p>
                    )}

                    {/* Prereq summary badges */}
                    {prereqs.length > 0 ? (
                      <div className="mt-2 text-[11px] text-[#A66E1A]">
                        <span className="font-semibold block mb-1">⚠️ يتطلب:</span>
                        <div className="flex flex-wrap gap-1">
                          {prereqs.map((pr: any) => (
                            <span key={pr.id} className="bg-[#FFF3CD] border border-[#FFEBAA] px-1.5 py-0.5 rounded-md text-[10px] font-medium text-[#856404] inline-flex items-center gap-0.5">
                              {pr.icon} {pr.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 text-[11px] text-[#27AE60] bg-[#EEFDF2] py-0.5 px-1.5 rounded-md inline-block font-medium border border-[#A3E8B5]/30">
                        🌱 مبنى أساسي (بلا متطلبات)
                      </div>
                    )}
                  </div>

                  {/* Footnote: Limits per tribe */}
                  <div className="mt-3 pt-3 border-t border-[#F5ECCB]/60 flex justify-between items-center text-[10px] text-[#8B4513]/70 font-semibold">
                    <span>الحد الأقصى للتغطية:</span>
                    <span>{bt.max_per_team ? `✨ ${bt.max_per_team} قطع` : '🔓 غير محدود'}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Interactive Focus Inspector Panel */}
        <div className="lg:col-span-4">
          <div className="sticky top-4 bg-[#FFFDF5] border-2 border-[#D4AF37] rounded-2xl p-6 shadow-md">
            {selectedId ? (
              (() => {
                const bt = types.find(t => t.id === selectedId);
                if (!bt) return <p className="text-center text-[#CD853F]">يرجى اختيار منشأة من القائمة</p>;
                const prereqs = getPrereqsFor(bt);
                const unlocks = getUnlocksFor(bt);

                return (
                  <div className="flex flex-col gap-4">
                    {/* Focal Header */}
                    <div className="text-center pb-4 border-b border-[#F0E6D2]">
                      <span className="text-5xl block mb-2">{bt.icon || '🏛️'}</span>
                      <h3 className="text-lg font-bold text-[#8B4513]">{bt.name}</h3>
                      {bt.name_en && (
                        <p className="text-xs font-mono text-[#CD853F] uppercase tracking-widest">{bt.name_en}</p>
                      )}
                    </div>

                    {/* Direct Visual Path Flowcard */}
                    <div className="my-2 bg-gradient-to-r from-[#FFFDF9] to-[#FFF9E6] border border-[#E8D5A3] rounded-xl p-4 flex flex-col gap-4 items-center">
                      {/* Step 1: Requirements */}
                      <div className="text-center w-full">
                        <span className="text-xs bg-[#E74C3C]/10 text-[#E74C3C] px-2.5 py-1 rounded-full font-bold">1. المنشآت المتطلبة</span>
                        {prereqs.length > 0 ? (
                          <div className="flex flex-col gap-2 mt-2">
                            {prereqs.map((pr: any) => (
                              <div key={pr.id} className="flex items-center gap-2 bg-white border border-[#E8D5A3] p-2 rounded-lg justify-center shadow-sm">
                                <span className="text-xl">{pr.icon}</span>
                                <span className="font-bold text-xs text-[#2C1810]">{pr.name}</span>
                                <span className="text-[10px] text-gray-400">({pr.cost} ن.)</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs text-green-600 mt-2 font-medium">
                            لا يشترط وجود أي مبنى سابق لبناء هذا الصنف!
                          </div>
                        )}
                      </div>

                      {/* DOWN Arrow */}
                      <div className="text-xl text-[#D4AF37] animate-bounce my-1">⬇️</div>

                      {/* Step 2: The Selected Building */}
                      <div className="text-center w-full bg-[#FFF1D0] border-2 border-[#D4AF37] p-3 rounded-xl shadow">
                        <div className="font-bold text-[#8B4513] text-sm flex items-center justify-center gap-1">
                          <span>{bt.icon}</span>
                          <span>{bt.name}</span>
                        </div>
                        <span className="text-[10px] text-[#27AE60] font-bold block mt-1">كلفة البناء: {bt.cost} نقطة أصول</span>
                      </div>

                      {/* DOWN Arrow */}
                      <div className="text-xl text-[#D4AF37] my-1">⬇️</div>

                      {/* Step 3: What It Unlocks */}
                      <div className="text-center w-full">
                        <span className="text-xs bg-[#27AE60]/10 text-[#27AE60] px-2.5 py-1 rounded-full font-bold">3. متاح للتشييد بعد بناء هذا</span>
                        {unlocks.length > 0 ? (
                          <div className="flex flex-col gap-2 mt-2">
                            {unlocks.map((un: any) => (
                              <div key={un.id} className="flex items-center gap-2 bg-white border border-[#E8D5A3] p-2 rounded-lg justify-center shadow-sm">
                                <span className="text-xl">{un.icon}</span>
                                <span className="font-bold text-xs text-[#2C1810]">{un.name}</span>
                                <span className="text-[10px] text-gray-400">({un.cost} ن.)</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-500 mt-2 font-medium">
                            هذا المبنى قمة المسار الفني والتحصيني السبطي!
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Extra Specs */}
                    <div className="space-y-2 mt-1">
                      <div className="flex justify-between text-xs border-b border-[#F5ECCB] pb-2">
                        <span className="text-gray-500">نطاق الحظر والاستبعاد:</span>
                        <span className="font-bold text-[#2C1810]">{bt.exclusion_radius || 10} متر</span>
                      </div>
                      <p className="text-[11px] text-[#8B4513] italic leading-relaxed text-center mt-2">
                        ⚠️ لا تفرط في هدم المنشآت البدائية فكل بنية تمثل متطلبًا ماليًا وتحصينيًا لغيرها.
                      </p>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="text-center py-12 flex flex-col items-center justify-center gap-3">
                <span className="text-5xl animate-pulse">🌾</span>
                <h3 className="font-bold text-[#8B4513]">دليل التخطيط الذكي للفئات</h3>
                <p className="text-xs text-gray-500 leading-relaxed max-w-xs">
                  اختر أي مبنى من جدول الأبنية للاطلاع على هرم تفاعله وصورة تسلسل البناء الكاملة المتصلة به.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
