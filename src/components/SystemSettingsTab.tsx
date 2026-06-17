import React, { useState, useEffect } from 'react';
import { APP_VERSION } from '../config/version';
import { getSupabase } from '../lib/supabase';
import { notify } from '../utils/toastMessages';
import PermissionsPanel from './PermissionsPanel';

interface InfoCardProps {
  title: string;
  items: { label: string; value: string | number }[];
}

function InfoCard({ title, items }: InfoCardProps) {
  return (
    <div style={{ padding: '16px', backgroundColor: '#FFF8E7', borderRadius: '12px', border: '1px solid #E8D5A3' }}>
      <h4 style={{ fontFamily: "'Tajawal', sans-serif", fontSize: '16px', fontWeight: 700, color: '#8B4513', marginBottom: '12px' }}>{title}</h4>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px' }}>
        {items.map((item, idx) => (
          <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '12px', color: '#8B7355', fontFamily: "'Tajawal', sans-serif" }}>{item.label}</span>
            <span style={{ fontSize: '16px', fontWeight: 700, color: '#2C1810', fontFamily: "'Cinzel', serif" }}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface SystemSettingsTabProps {
  users?: any[];
  teams?: any[];
}

export default function SystemSettingsTab({ users = [], teams = [] }: SystemSettingsTabProps) {
  const [dbStatus, setDbStatus] = useState<'connected' | 'error' | 'checking'>('checking');
  const [lastChecked, setLastChecked] = useState('');
  const [stats, setStats] = useState({ users: 0, points: 0 });
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetInput, setResetInput] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    checkSystemStatus();
  }, []);

  const checkSystemStatus = async () => {
    setDbStatus('checking');
    const supabase = getSupabase();
    if (!supabase) {
      setDbStatus('error');
      return;
    }

    try {
      const { count: usersCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
      const { data: teamsData } = await supabase.from('teams').select('points');
      const totalPoints = teamsData?.reduce((acc: number, curr: any) => acc + (curr.points || 0), 0) || 0;

      setStats({
        users: usersCount || 0,
        points: totalPoints,
      });

      setDbStatus('connected');
      setLastChecked(new Date().toLocaleTimeString('ar-EG'));
    } catch (e) {
      setDbStatus('error');
    }
  };

  const handleExportCSV = async () => {
    try {
      const supabase = getSupabase();
      if (!supabase) return;
      const { data: teams } = await supabase.from('teams').select('*');
      const { data: users } = await supabase.from('users').select('*');
      
      const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
        + "Members Data\n"
        + "ID,Name,Username,Role,Team ID\n"
        + users?.map((u:any) => `${u.id},${u.name || u.username},${u.username},${u.role},${u.team_id}`).join("\n")
        + "\n\nTeams Data\n"
        + "ID,Name,Points,Map Region\n"
        + teams?.map((t:any) => `${t.id},${t.name},${t.points},${t.map_region}`).join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `canaan_data_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      notify.custom('تم التصدير بنجاح', 'success');
    } catch(e) {
      notify.custom('خطأ في تصدير البيانات', 'error');
    }
  };

  const handleResetGame = async () => {
    if (resetInput !== 'RESET') {
      notify.custom('يرجى كتابة كلمة RESET للتأكيد', 'error');
      return;
    }

    setIsResetting(true);
    try {
      const supabase = getSupabase();
      if (!supabase) return;

      // Reset logic: delete all land tiles, point transactions, and update team points to 0.
      await supabase.from('land_tiles').delete().not('id', 'is', null);
      await supabase.from('point_transactions').delete().not('id', 'is', null);
      
      const { data: teams } = await supabase.from('teams').select('id');
      if (teams) {
        for (const t of teams) {
          await supabase.from('teams').update({ points: 0 }).eq('id', t.id);
        }
      }

      notify.custom('تمت إعادة ضبط اللعبة بنجاح', 'success');
      setShowResetConfirm(false);
      setResetInput('');
      checkSystemStatus();
    } catch(e) {
      notify.custom('حدث خطأ أثناء إعادة الضبط', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', direction: 'rtl', padding: '16px', backgroundColor: '#FFFDF5', borderRadius: '16px', border: '1px solid #E8D5A3' }}>
      
      <div style={{ padding: '16px', backgroundColor: dbStatus === 'connected' ? '#F0FFF4' : dbStatus === 'error' ? '#FFF5F5' : '#FFFDF5', borderRadius: '12px', border: `1.5px solid ${dbStatus === 'connected' ? '#68D391' : dbStatus === 'error' ? '#FC8181' : '#E8D5A3'}` }}>
        <h4 style={{ fontFamily: "'Tajawal', sans-serif", fontSize: '16px', fontWeight: 700, color: '#2C1810', marginBottom: '8px' }}>حالة الاتصال بقاعدة البيانات</h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: dbStatus === 'connected' ? '#27AE60' : dbStatus === 'error' ? '#E74C3C' : '#F39C12' }} />
          <span style={{ fontSize: '14px', fontFamily: "'Tajawal', sans-serif", color: '#6B5B45' }}>
            {dbStatus === 'connected' ? 'متصل' : dbStatus === 'error' ? 'يوجد خطأ في الاتصال' : 'جاري الفحص...'} 
            {dbStatus === 'connected' && ` (آخر فحص: ${lastChecked})`}
          </span>
        </div>
      </div>

      <InfoCard 
        title="معلومات التطبيق" 
        items={[
          { label: 'الإصدار', value: `v${APP_VERSION}` },
          { label: 'عدد المستخدمين', value: stats.users },
          { label: 'عدد الأسباط', value: 12 },
          { label: 'إجمالي النقاط', value: stats.points },
        ]} 
      />

      <PermissionsPanel users={users} teams={teams} />

      <div style={{ padding: '16px', backgroundColor: '#FFF8E7', borderRadius: '12px', border: '1px solid #E8D5A3', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h4 style={{ fontFamily: "'Tajawal', sans-serif", fontSize: '16px', fontWeight: 700, color: '#8B4513' }}>📊 تصدير البيانات</h4>
          <p style={{ fontSize: '13px', color: '#6B5B45', fontFamily: "'Tajawal', sans-serif", marginTop: '4px' }}>تحميل جميع بيانات اللعبة كملف CSV</p>
        </div>
        <button onClick={handleExportCSV} style={{ padding: '8px 16px', backgroundColor: '#27AE60', color: '#fff', border: 'none', borderRadius: '8px', fontFamily: "'Tajawal', sans-serif", fontWeight: 700, cursor: 'pointer' }}>
          ⬇️ تصدير البيانات
        </button>
      </div>

      <div style={{ padding: '16px', backgroundColor: '#FFF5F5', borderRadius: '12px', border: '1px solid #FC8181', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h4 style={{ fontFamily: "'Tajawal', sans-serif", fontSize: '16px', fontWeight: 700, color: '#8B0000' }}>🔴 إعادة ضبط اللعبة</h4>
          <p style={{ fontSize: '13px', color: '#C53030', fontFamily: "'Tajawal', sans-serif", marginTop: '4px' }}>سيتم حذف جميع النقاط والأراضي. لا يمكن التراجع!</p>
        </div>
        <button onClick={() => setShowResetConfirm(true)} style={{ padding: '8px 16px', backgroundColor: '#8B0000', color: '#fff', border: 'none', borderRadius: '8px', fontFamily: "'Tajawal', sans-serif", fontWeight: 700, cursor: 'pointer' }}>
          ⚠️ إعادة الضبط
        </button>
      </div>

      {showResetConfirm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ backgroundColor: '#FFFDF5', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '400px', border: '2px solid #8B0000', direction: 'rtl' }}>
            <h3 style={{ color: '#8B0000', fontFamily: "'Tajawal', sans-serif", fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>تأكيد إعادة الضبط</h3>
            <p style={{ fontSize: '14px', color: '#2C1810', fontFamily: "'Tajawal', sans-serif", marginBottom: '16px', lineHeight: 1.5 }}>
              أنت على وشك حذف جميع البيانات المتعلقة باللعبة، وتصفير النقاط لجميع الأسباط. هذا الإجراء نهائي ولا يمكن التراجع عنه.
            </p>
            <p style={{ fontSize: '13px', color: '#6B5B45', fontFamily: "'Tajawal', sans-serif", marginBottom: '8px' }}>
              للتأكيد، يرجى كتابة كلمة <strong>RESET</strong> في الحقل التالي:
            </p>
            <input 
              type="text" 
              value={resetInput}
              onChange={e => setResetInput(e.target.value)}
              placeholder="اكتب RESET لتأكيد العملية"
              style={{ padding: '10px', width: '100%', borderRadius: '8px', border: '1.5px solid #8B0000', marginBottom: '24px', fontFamily: 'monospace', fontSize: '14px', outline: 'none' }}
              dir="ltr"
            />
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => { setShowResetConfirm(false); setResetInput(''); }}
                style={{ padding: '8px 16px', backgroundColor: 'transparent', color: '#6B5B45', border: '1px solid #E8D5A3', borderRadius: '8px', cursor: 'pointer', fontFamily: "'Tajawal', sans-serif" }}
              >
                إلغاء
              </button>
              <button 
                onClick={handleResetGame}
                disabled={isResetting || resetInput !== 'RESET'}
                style={{ padding: '8px 16px', backgroundColor: '#8B0000', color: '#fff', border: 'none', borderRadius: '8px', cursor: (isResetting || resetInput !== 'RESET') ? 'not-allowed' : 'pointer', opacity: (isResetting || resetInput !== 'RESET') ? 0.5 : 1, fontFamily: "'Tajawal', sans-serif", fontWeight: 700 }}
              >
                {isResetting ? 'جاري إعادة الضبط...' : 'تأكيد وحذف'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
