import React, { useState, useEffect, useCallback } from 'react';
import { getSupabase } from '../lib/supabase';
import { Team, User } from '../types';
import { addUser, checkUsernameExists } from '../services/userService';
import { fetchTeamsWithStats } from '../services/teamService';
import { resetTeamMap, resetAllMaps } from '../services/buildingService';
import { adminDeductPoints } from '../services/pointsService';
import AddUserForm from '../components/AddUserForm';
import { notify } from '../utils/toastMessages';
import LoadingOverlay from '../components/LoadingOverlay';
import { motion, AnimatePresence } from 'framer-motion';
import { FaEdit, FaTrash, FaExchangeAlt, FaPlus } from 'react-icons/fa';
import { TRIBES } from '../data/tribeAssets';
import AddMemberModal from '../components/AddMemberModal';
import AwardPointsModal from '../components/AwardPointsModal';
import MapSettingsTab from '../components/MapSettingsTab';
import GameSettingsTab from '../components/GameSettingsTab';
import SystemSettingsTab from '../components/SystemSettingsTab';
import AllUsersTab from '../components/AllUsersTab';
import { detectMapBuildingsSchema, getTableColumns } from '../utils/schemaInspector';

import ResponsiveTabs from '../components/ResponsiveTabs';

const SETTINGS_TABS_ALL = [
  { value: 'users', label: 'المستخدمون', icon: '👥' },
  { value: 'allUsers', label: 'جميع المستخدمين', icon: '📋' },
  { value: 'map', label: 'الخريطة', icon: '🗺️' },
  { value: 'game', label: 'اللعبة', icon: '🎮' },
  { value: 'system', label: 'النظام', icon: '🔧' },
];

export default function Settings() {
  const [teams, setTeams] = useState<any[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState('users');
  const [selectedTribe, setSelectedTribe] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('جاري تحميل البيانات...');
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showAwardModal, setShowAwardModal] = useState(false);
  
  // RESET UI STATES
  const [resetTargetTeam, setResetTargetTeam] = useState<string>('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetConfirmMode, setResetConfirmMode] = useState<'single' | 'all' | null>(null)

  // RESET HANDLERS
  const [deductLoading, setDeductLoading] = useState(false)
  const [deductAmount, setDeductAmount] = useState<string>('0')
  const [deductReason, setDeductReason] = useState<string>('')
  
  const [detectedSchema, setDetectedSchema] = useState<any>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  useEffect(() => {
    detectMapBuildingsSchema().then(setDetectedSchema);
  }, []);

  const handleDeductPoints = async (teamId: string) => {
    if (!deductAmount || deductAmount === '0' || !deductReason) {
        notify.custom('ادخل مبلغ وسبب', 'error')
        return
    }
    setDeductLoading(true)
    try {
        await adminDeductPoints({ teamId, amount: deductAmount, reason: deductReason, adminId: currentUser.id })
        notify.custom('تم خصم النقاط', 'success')
        setDeductAmount('0')
        setDeductReason('')
    } catch (err: any) {
        notify.custom('فشل: ' + err.message, 'error')
    } finally {
        setDeductLoading(false)
    }
  }

  const handleResetTeamMap = async () => {
    if (!resetTargetTeam) {
      notify.custom('اختر سبطاً أولاً', 'error')
      return
    }
    if (resetConfirmMode !== 'single') {
      setResetConfirmMode('single')
      return
    }
    setResetLoading(true)
    try {
      const result = await resetTeamMap(resetTargetTeam, currentUser.id)
      if (result.success) {
        notify.custom(`تم إعادة تعيين الخريطة  (${result.deletedCount} مبنى محذوف)`, 'success')
        setResetTargetTeam('')
      } else {
        notify.custom('فشل: ' + result.error, 'error')
      }
    } finally {
      setResetLoading(false)
      setResetConfirmMode(null)
    }
  }

  const handleResetAllMaps = async () => {
    if (resetConfirmMode !== 'all') {
      setResetConfirmMode('all')
      return
    }
    setResetLoading(true)
    try {
      const result = await resetAllMaps(currentUser.id)
      if (result.success) {
        notify.custom('تم إعادة تعيين جميع الخرائط', 'success')
      } else {
        notify.custom('فشل: ' + result.error, 'error')
      }
    } finally {
      setResetLoading(false)
      setResetConfirmMode(null)
    }
  }

  const visibleTabs = currentUser?.role === 'super_admin'
    ? SETTINGS_TABS_ALL
    : SETTINGS_TABS_ALL.filter(t => t.value !== 'allUsers');

  const handleOpenModal = useCallback(() => setShowAddModal(true), []);
  const handleCloseModal = useCallback(() => setShowAddModal(false), []);

  const handleSaveMember = useCallback(async (formData: any) => {
    setIsLoading(true);
    setLoadingMessage('جاري إضافة العضو...');

    try {
      const exists = await checkUsernameExists(formData.username);
      if (exists) { 
        notify.custom('❌ اسم المستخدم مستخدم بالفعل', 'error'); 
        return; 
      }

      await addUser({
        ...formData,
        team_id: selectedTribe?.id ?? formData.team_id,
      });

      notify.custom('✅ تم إضافة العضو بنجاح', 'success');
      setShowAddModal(false);

      setTimeout(() => fetchData(), 400);

    } catch (err: any) {
      const errorMap: any = {
        '23505': '❌ اسم المستخدم مستخدم بالفعل',
        '23503': '❌ السبط المحدد غير موجود',
        '42501': '❌ خطأ في الصلاحيات',
        '42703': `❌ عمود غير موجود: ${err.message}`,
        'PGRST204': `❌ عمود غير موجود: ${err.message}`,
      };
      notify.custom(
        errorMap[err.code] ?? `❌ ${err.message}`,
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  }, [selectedTribe]);

  const fetchData = async () => {
    try {
      const supabase = getSupabase();
      if (!supabase) return;
      
      const teamsData = await fetchTeamsWithStats();
      const { data: usersData } = await supabase.from('users').select('*');
      
      setTeams(teamsData || []);
      setUsers(usersData || []);
    } catch (e) {
      notify.loadFailed();
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setCurrentUser(JSON.parse(storedUser));
    fetchData();
  }, []);

  const deleteUser = async (user: User) => {
    if (user.role === 'super_admin' || !confirm(`هل أنت متأكد من حذف ${user.username}؟`)) return;
    setLoadingMessage('جاري حذف العضو...');
    setIsLoading(true);
    try {
      const supabase = getSupabase();
      if (!supabase) return;
      const { error } = await supabase.from('users').delete().eq('id', user.id);
      if (error) throw error;
      notify.userDeleted();
      await fetchData();
    } catch (e) {
      notify.deleteFailed();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <LoadingOverlay isLoading={isLoading} message={loadingMessage} />
      <div 
        className="bg-[#FFFDF5] min-h-full" 
        dir="rtl"
        style={{
          width: '100%',
          maxWidth: '100%',
          overflowX: 'hidden',
          boxSizing: 'border-box',
          padding: '16px'
        }}
      >
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-title text-[#8B4513] mb-4 sm:mb-8">⚙️ الإعدادات</h1>
      
      <ResponsiveTabs
        tabs={visibleTabs}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === 'users' && !selectedTribe && (
        <>
        {currentUser?.role === 'super_admin' && (
          <div className="mb-6">
            <button
              onClick={() => setShowAwardModal(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 20px', borderRadius: '10px',
                border: 'none', backgroundColor: '#D4AF37',
                color: '#fff', fontFamily: "'Tajawal', sans-serif",
                fontSize: '14px', fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(212,175,55,0.35)',
              }}
            >
              🏆 منح نقاط لسبط
            </button>
          </div>
        )}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {teams.map(tribe => (
                <motion.div key={tribe.id} whileHover={{ y: -5, scale: 1.02 }} className="bg-[#FFF8E7] p-4 sm:p-6 rounded-xl border border-[#C9A96E] shadow cursor-pointer" onClick={() => setSelectedTribe(tribe)}>
                    <h3 className="font-title text-base sm:text-xl text-[#8B4513] mb-2">{tribe.name}</h3>
                    <p className="text-xs sm:text-sm text-[#6B5B45]">👥 {tribe.memberCount} أعضاء</p>
                    <div style={{
                      display: 'flex', justifyContent: 'flex-start',
                      alignItems: 'center', marginTop: '8px',
                      flexWrap: 'nowrap', gap: '8px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <span>🏆</span>
                        <span style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: '14px', color: '#D4AF37' }}>
                          {tribe.points_total ?? 0}
                        </span>
                      </div>
                      <span style={{ color: '#D4AF37', opacity: 0.4 }}>|</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <span>💰</span>
                        <span style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: '14px', color: '#27AE60' }}>
                          {(tribe.points_total ?? 0) - (tribe.points_spent ?? 0)}
                        </span>
                      </div>
                    </div>
                </motion.div>
            ))}
        </div>
        </>
      )}

      {activeTab === 'users' && selectedTribe && (
        <div className="w-full">
            <button className="mb-4 text-[#8B4513] text-sm sm:text-base flex items-center gap-1" onClick={() => setSelectedTribe(null)}>← العودة للأسباط</button>
            <h2 className="text-xl sm:text-2xl font-title text-[#8B4513] mb-4 sm:mb-6">أعضاء سبط {selectedTribe.name}</h2>
            <button className="bg-[#8B4513] text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg mb-4 sm:mb-6 flex items-center gap-2 text-sm sm:text-base" onClick={handleOpenModal}><FaPlus/> إضافة عضو</button>
            
            {/* Mobile Cards List (< 640px) */}
            <div className="sm:hidden flex flex-col gap-3">
              {users.filter(u => u.team_id === selectedTribe.id).map(u => (
                 <div key={u.id} className="bg-[#FFF8E7] rounded-xl p-3 border border-[#E8D5A3] flex flex-col gap-2">
                   <div className="flex justify-between items-center">
                     <span className="font-bold text-[#2C1810] text-sm font-mono truncate" dir="ltr">{u.username}</span>
                     <span className="text-[10px] bg-[#E8D5A3] px-2 py-0.5 rounded-full text-[#8B4513] font-bold">{u.role}</span>
                   </div>
                   <div className="flex gap-2 justify-end mt-2 pt-2 border-t border-[#F0E6C8]">
                     <button className="p-1.5 bg-white border border-[#D4AF37] rounded-lg text-[#8B4513]"><FaEdit/></button>
                     <button className="p-1.5 bg-white border border-[#D4AF37] rounded-lg text-[#8B4513]"><FaExchangeAlt/></button>
                     <button onClick={() => deleteUser(u)} className="p-1.5 bg-red-50 border border-red-500 rounded-lg text-red-600"><FaTrash/></button>
                   </div>
                 </div>
              ))}
            </div>

            {/* Desktop Table (>= 640px) */}
            <div className="hidden sm:block overflow-x-auto rounded-lg shadow-sm border border-[#C9A96E]">
              <table className="w-full bg-[#FFF8E7] text-sm sm:text-base whitespace-nowrap">
                  <tbody>
                      {users.filter(u => u.team_id === selectedTribe.id).map(u => (
                          <tr key={u.id} className="border-b last:border-b-0 border-[#C9A96E]/20 hover:bg-[#FFFDF5]">
                              <td className="p-3 sm:p-4">{u.username}</td>
                              <td className="p-3 sm:p-4">{u.role}</td>
                              <td className="p-3 sm:p-4 flex gap-3 text-[#8B4513]">
                                  <button><FaEdit/></button> <button><FaExchangeAlt/></button> <button onClick={() => deleteUser(u)} className="text-red-700"><FaTrash/></button>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
            </div>
        </div>
      )}

      {activeTab === 'allUsers' && <AllUsersTab currentUser={currentUser} />}
      {activeTab === 'map' && <MapSettingsTab />}
      {activeTab === 'game' && <GameSettingsTab />}
      {activeTab === 'system' && <SystemSettingsTab users={users} teams={teams} />}
      
      {activeTab === 'system' && currentUser?.role === 'super_admin' && (
        <div style={{
            marginBottom: 20,
            border: '1px solid rgba(212,175,55,0.3)',
            borderRadius: 10,
            padding: 12,
            background: 'rgba(0,0,0,0.04)',
            fontFamily: 'monospace',
            fontSize: 11,
            direction: 'ltr',
            textAlign: 'left',
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: 6, fontFamily: 'Cairo' }}>
              🔍 تشخيص المخطط
            </div>
            {detectedSchema ? (
                <>
                    <div>X column: <strong>{detectedSchema.xCol}</strong></div>
                    <div>Y column: <strong>{detectedSchema.yCol}</strong></div>
                    <div>Type column: <strong>{detectedSchema.typeCol}</strong></div>
                    <div>Team column: <strong>{detectedSchema.teamCol}</strong></div>
                </>
            ) : <div>جاري الكشف...</div>}
        </div>
      )}
      
      {/* Map Reset UI */}
      {activeTab === 'system' && currentUser?.role === 'super_admin' && (
        <div style={{
          marginTop: 20,
          border: '2px solid rgba(231,76,60,0.35)',
          borderRadius: 10,
          padding: 14,
          background: 'rgba(231,76,60,0.05)',
        }}>
          <div style={{ fontSize: 15, fontWeight: '700', color: '#E74C3C', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Cairo, sans-serif' }}>
            🗺️ إعادة تعيين الخرائط
          </div>
          <div style={{ fontSize: 12, color: '#E74C3C', background: 'rgba(231,76,60,0.1)', borderRadius: 8, padding: '8px 10px', marginBottom: 10, fontFamily: 'Cairo, sans-serif' }}>
            ⚠️ تحذير: هذا الإجراء لا يمكن التراجع عنه. سيتم حذف جميع المباني المُضافة على الخريطة.
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
            <select
              value={resetTargetTeam}
              onChange={e => { setResetTargetTeam(e.target.value); setResetConfirmMode(null) }}
              style={{ flex: 1, minWidth: 140, padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(231,76,60,0.4)', background: 'transparent', fontFamily: 'Cairo, sans-serif', fontSize: 13, cursor: 'pointer' }}
            >
              <option value="">— اختر سبطاً —</option>
              {teams.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <button
              onClick={handleResetTeamMap}
              disabled={!resetTargetTeam || resetLoading}
              style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: resetConfirmMode === 'single' ? '#E74C3C' : 'rgba(231,76,60,0.2)', color: resetConfirmMode === 'single' ? '#fff' : '#E74C3C', fontFamily: 'Cairo, sans-serif', fontSize: 13, fontWeight: '700', cursor: !resetTargetTeam || resetLoading ? 'not-allowed' : 'pointer', opacity: !resetTargetTeam ? 0.5 : 1, transition: 'all 0.2s', whiteSpace: 'nowrap' }}
            >
              {resetLoading && resetConfirmMode === 'single' ? '...' : resetConfirmMode === 'single' ? '⚠️ تأكيد الحذف' : '🗑️ إعادة تعيين السبط'}
            </button>
          </div>
          
          <div style={{ marginTop: 16, borderTop: '1px solid #ccc', paddingTop: 8 }}>
            <div style={{ fontSize: 13, fontWeight: '700', marginBottom: 4, fontFamily: 'Cairo, sans-serif' }}>خصم نقاط (يدوي)</div>
            <input type="number" value={deductAmount} onChange={e => setDeductAmount(e.target.value)} style={{ width: '100%', padding: '6px', borderRadius: 4, marginBottom: 4 }} />
            <input type="text" placeholder="السبب..." value={deductReason} onChange={e => setDeductReason(e.target.value)} style={{ width: '100%', padding: '6px', borderRadius: 4, marginBottom: 4 }} />
            <button onClick={() => handleDeductPoints(resetTargetTeam)} disabled={deductLoading || !resetTargetTeam} style={{ width: '100%', padding: '8px', background: '#e67e22', color: '#fff', border: 'none', borderRadius: 4 }}>خصم النقاط</button>
            <div style={{ fontSize: 11, color: '#e67e22', marginTop: 4 }}>تنبيه: حذف النقاط لا يحذف المباني تلقائياً، يرجى حذف المباني يدوياً أو استخدام زر إعادة تعيين الخريطة أعلاه.</div>
          </div>

          <button
            onClick={handleResetAllMaps}
            disabled={resetLoading}
            style={{ width: '100%', padding: '10px', borderRadius: 8, border: `2px solid #E74C3C`, background: resetConfirmMode === 'all' ? '#E74C3C' : 'transparent', color: resetConfirmMode === 'all' ? '#fff' : '#E74C3C', fontFamily: 'Cairo, sans-serif', fontSize: 14, fontWeight: '700', cursor: resetLoading ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
          >
            {resetLoading && resetConfirmMode === 'all' ? 'جاري الحذف...' : resetConfirmMode === 'all' ? '⚠️ تأكيد: حذف جميع المباني من كل الخرائط' : '🔴 إعادة تعيين جميع الخرائط'}
          </button>
          {resetConfirmMode && !resetLoading && (
            <button
              onClick={() => setResetConfirmMode(null)}
              style={{ width: '100%', marginTop: 6, padding: '8px', borderRadius: 8, border: '1px solid #aaa', background: 'transparent', fontFamily: 'Cairo, sans-serif', fontSize: 13, cursor: 'pointer', color: '#666' }}
            >
              إلغاء
            </button>
          )}
        </div>
      )}

      {showAddModal && (
        <AddMemberModal
          team={selectedTribe}
          onClose={handleCloseModal}
          onSave={handleSaveMember}
        />
      )}

      {showAwardModal && (
        <AwardPointsModal
          teams={teams}
          currentUser={currentUser}
          onClose={() => setShowAwardModal(false)}
          onSuccess={fetchData} 
        />
      )}
    </div>
    </>
  );
}
