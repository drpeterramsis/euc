import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchSingleTeamWithMembers } from '../services/teamService';
import { notify } from '../utils/toastMessages';
import { getSupabase } from '../lib/supabase';
import { fetchTeamActivityLog } from '../services/activityLogService';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 60000) return "منذ لحظات";
  if (diff < 3600000) return `منذ ${Math.floor(diff/60000)} دقيقة`;
  if (diff < 86400000) return `منذ ${Math.floor(diff/3600000)} ساعة`;
  return `منذ ${Math.floor(diff/86400000)} يوم`;
}

export default function ProfilePage({ currentUser }: { currentUser: any }) {
  const [dbUser, setDbUser] = useState<any>(currentUser);
  const [teamData,   setTeamData]   = useState<any>(null);
  const [teamBuildings, setTeamBuildings] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [logsError, setLogsError] = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [activeTab, setActiveTab] = useState<'buildings' | 'members' | 'history'>('buildings');

  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const loadData = async () => {
    setLoading(true);
    try {
      const supabase = getSupabase();
      let activeUser = currentUser;

      // Load latest user details including team assignment from database
      try {
        const { data: latestUser } = await supabase.from('users').select('*').eq('id', currentUser.id).single();
        if (latestUser) {
          activeUser = latestUser;
          setDbUser(latestUser);
          localStorage.setItem('user', JSON.stringify(latestUser));
        }
      } catch (uErr) {
        console.warn('Failed to fetch latest user profile from db, falling back to cache:', uErr);
      }

      if (activeUser.team_id) {
        const [team, buildings, logsData] = await Promise.all([
          fetchSingleTeamWithMembers(activeUser.team_id),
          fetchTeamBuildings(activeUser.team_id),
          fetchTeamActivityLog(activeUser.team_id)
        ]);
        setTeamData(team);
        setTeamBuildings(buildings);
        setActivityLogs(logsData || []);
        setLogsError(false);
      } else {
        setTeamData(null);
        setTeamBuildings([]);
        setActivityLogs([]);
      }
    } catch (err: any) {
      notify.custom(`❌ فشل تحميل البيانات: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const quickLinks = useMemo(() => {
    if (!dbUser) return []
    if (dbUser.role === 'super_admin') return [
      { label: 'لوحة التحكم', icon: '⚙️', path: '/settings', color: '#8E44AD' },
      { label: 'الأسباط', icon: '🗺️', path: '/tribes', color: '#1A5276' },
    ]
    const teamIdPath = dbUser.team_id ? `/tribes/${dbUser.team_id}` : '/tribes';
    if (dbUser.role === 'team_admin') return [
      { label: 'البناء والتحصينات', icon: '🏗️', path: '/buildings', color: '#D4AF37' },
      { label: 'خريطة السبط', icon: '🗺️', path: teamIdPath, color: '#1A5276' },
      { label: 'الأسباط', icon: '⚔️', path: '/tribes', color: '#C0392B' },
    ]
    if (dbUser.role === 'member') return [
      { label: 'خريطة السبط', icon: '🗺️', path: teamIdPath, color: '#1A5276' },
      { label: 'لوحة النقاط', icon: '🏆', path: '/leaderboard', color: '#F39C12' },
    ]
    return []
  }, [dbUser])

  const roleInfo: any = {
    super_admin: { label: 'المشرف العام', emoji: '🛡️', color: '#8E44AD' },
    team_admin:  { label: 'قائد السبط',   emoji: '⚔️', color: '#D4AF37' },
    member:      { label: 'عضو',        emoji: '👥', color: '#16A085' },
  }[dbUser?.role as string] ?? { label: 'مستخدم', emoji: '👤', color: '#888' };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <div className="w-10 h-10 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"/>
      <span className="font-body text-[#8B7355] text-sm">جاري تحميل البيانات...</span>
    </div>
  );

  const isSuperAdmin = dbUser?.role === 'super_admin';

  if (isSuperAdmin) {
    return (
      <div className="max-w-3xl mx-auto p-6" dir="rtl">
        <div className="bg-[#FFFDF5] rounded-2xl border-2 border-[#E8D5A3] p-6 shadow-sm">
          <h2 className="text-2xl font-bold font-title text-[#8B4513] mb-4">الملف الشخصي: مدير النظام</h2>
          <p className="text-[#8B7355] font-body text-xl font-bold mb-4">{dbUser.name}</p>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '4px 16px', borderRadius: '12px',
            backgroundColor: roleInfo.color + '22',
            border: `1px solid ${roleInfo.color}44`,
            fontSize: '14px', fontWeight: 'bold', color: roleInfo.color,
            fontFamily: "'Tajawal', sans-serif",
          }}>
            {roleInfo.emoji} {roleInfo.label}
          </div>
        </div>
      </div>
    );
  }

  const buildingCounts = teamBuildings.reduce((acc: any, b: any) => {
    const typeId = b.building_type_id;
    if (!acc[typeId]) {
      acc[typeId] = { count: 0, typeInfo: b.building_type };
    }
    acc[typeId].count++;
    return acc;
  }, {});
  const uniqueBuildings = Object.values(buildingCounts) as any[];

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6" dir="rtl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold font-title text-[#8B4513] mb-2 flex items-center gap-2">
          👋 أهلاً، {dbUser?.name}
        </h1>
        <div className="flex flex-wrap gap-2 items-center mb-4">
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '4px 16px', borderRadius: '12px',
            backgroundColor: roleInfo.color + '22',
            border: `1px solid ${roleInfo.color}44`,
            fontSize: '14px', fontWeight: 'bold', color: roleInfo.color,
            fontFamily: "'Tajawal', sans-serif",
          }}>
            {roleInfo.emoji} {roleInfo.label}
          </div>
          {teamData && (
            <div 
              className="flex items-center gap-2 px-4 py-1.5 rounded-xl inline-flex font-title font-bold shadow-sm"
              style={{ backgroundColor: `${teamData.color}22`, color: teamData.color, border: `1px solid ${teamData.color}44` }}
            >
              <span>{teamData.symbol || '⚔️'}</span>
              <span>سبط {teamData.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* QUICK LINKS */}
      {quickLinks.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${quickLinks.length}, 1fr)`,
          gap: 8,
          marginBottom: 16,
          padding: '0 4px',
        }}>
          {quickLinks.map(link => (
            <button
              key={link.path + link.label}
              onClick={() => navigate(link.path)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '12px 8px',
                borderRadius: 12,
                border: `2px solid ${link.color}33`,
                background: `${link.color}14`,
                cursor: 'pointer',
                fontFamily: 'Cairo, sans-serif',
                minHeight: 72,
                transition: 'all 0.18s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = `${link.color}28`)}
              onMouseLeave={e => (e.currentTarget.style.background = `${link.color}14`)}
            >
              <span style={{ fontSize: 26 }}>{link.icon}</span>
              <span style={{
                fontSize: 12,
                fontWeight: '700',
                color: link.color,
                textAlign: 'center',
                lineHeight: 1.3,
              }}>
                {link.label}
              </span>
            </button>
          ))}
        </div>
      )}

      {teamData && (
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-4">
            <PointsCard
              label="إجمالي النقاط"
              value={teamData.pointsTotal}
              color="#D4AF37" icon="🏆"
            />
            <PointsCard
              label="تطويرات مبنية"
              value={teamData.pointsSpent}
              color="#E74C3C" icon="🏗️"
            />
            <PointsCard
              label="نقاط متاحة"
              value={teamData.pointsAvailable}
              color="#27AE60" icon="💰"
            />
        </div>
      )}

      <div className="flex gap-2 mb-6 mt-6">
        <button
          onClick={() => setActiveTab('buildings')}
          className={`flex-1 py-3 font-bold font-body rounded-xl flex items-center justify-center gap-2 transition-colors border-2 ${activeTab === 'buildings' ? 'border-[#D4AF37] bg-[#FFF8E7] text-[#8B4513]' : 'border-transparent bg-[#FFFDF5] text-[#8B7355] border-[#E8D5A3]'}`}
        >
          <span className="text-xl">🏕️</span>
          <span className="hidden sm:inline">منشآتي</span>
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={`flex-1 py-3 font-bold font-body rounded-xl flex items-center justify-center gap-2 transition-colors border-2 ${activeTab === 'members' ? 'border-[#D4AF37] bg-[#FFF8E7] text-[#8B4513]' : 'border-transparent bg-[#FFFDF5] text-[#8B7355] border-[#E8D5A3]'}`}
        >
          <span className="text-xl">👥</span>
          <span className="hidden sm:inline">أعضاء السبط</span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-3 font-bold font-body rounded-xl flex items-center justify-center gap-2 transition-colors border-2 ${activeTab === 'history' ? 'border-[#D4AF37] bg-[#FFF8E7] text-[#8B4513]' : 'border-transparent bg-[#FFFDF5] text-[#8B7355] border-[#E8D5A3]'}`}
        >
          <span className="text-xl">📜</span>
          <span className="hidden sm:inline">السجل</span>
        </button>
      </div>

      {activeTab === 'buildings' && (
        <div className="bg-[#FFFDF5] rounded-2xl border-2 border-[#E8D5A3] p-4 sm:p-6 shadow-sm min-h-[300px]">
          {uniqueBuildings.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-[#8B7355] font-body opacity-70 py-12">
              <span className="text-6xl mb-4 grayscale">🏕️</span>
              <p className="text-lg">لا توجد منشآت حتى الآن</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {uniqueBuildings.map((bInfo: any, idx) => (
                <div key={idx} className="bg-[#FFF8E7] border-2 border-[#D4AF37] rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden">
                   <div className="absolute top-0 right-0 bg-[#D4AF37] text-white font-bold px-3 py-1 bg-opacity-90 rounded-bl-lg font-body text-sm shadow-sm backdrop-blur-sm">
                     ×{bInfo.count}
                   </div>
                   <span className="text-5xl mt-2 mb-3">{bInfo.typeInfo?.icon || '🏗️'}</span>
                   <span className="font-bold font-body text-[#2C1810] leading-tight text-sm sm:text-base">
                     {bInfo.typeInfo?.name || 'مبنى غير معروف'}
                   </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'members' && teamData?.members && (
        <div className="bg-[#FFFDF5] rounded-2xl border-2 border-[#E8D5A3] p-4 sm:p-6 shadow-sm min-h-[300px]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {teamData.members.map((member: any) => {
              const mRole: any = {
                team_admin:  { label: 'قائد السبط', emoji: '⚔️', color: '#D4AF37' },
                member:      { label: 'عضو',        emoji: '👥', color: '#16A085' },
                super_admin: { label: 'المشرف العام', emoji: '🛡️', color: '#8E44AD' }
              }[member.role] || { label: 'مستخدم', emoji: '👤', color: '#888' };

              const isMe = member.id === currentUser.id;

              return (
                <div key={member.id} className={`flex items-center gap-4 bg-[#FFF8E7] rounded-xl p-4 border-2 ${isMe ? 'border-[#D4AF37]' : 'border-[#E8D5A3]'} shadow-sm`}>
                  <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg text-white" style={{ backgroundColor: mRole.color }}>
                    {member.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[#2C1810] font-bold truncate">
                      {member.name}
                      {isMe && <span className="text-[#D4AF37] text-xs mr-2">(أنت)</span>}
                    </p>
                    <p className="text-[#8B7355] text-xs font-mono truncate" dir="ltr">@{member.username}</p>
                  </div>
                  <div className="flex-shrink-0 ml-2" style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    padding: '3px 10px', borderRadius: '12px',
                    backgroundColor: mRole.color + '15',
                    border: `1px solid ${mRole.color}40`,
                    fontSize: '11px', fontWeight: 'bold', color: mRole.color,
                  }}>
                    {mRole.emoji} {mRole.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-[#FFFDF5] rounded-2xl border-2 border-[#E8D5A3] p-4 sm:p-6 shadow-sm min-h-[300px]">
           {logsError ? (
             <div className="flex flex-col items-center justify-center h-full text-[#8B7355] font-body py-12">
                <span className="text-6xl mb-4 opacity-50">🚧</span>
                <p className="text-lg font-bold">قريباً</p>
                <p className="text-sm opacity-80 text-center mt-2">سيتم تفعيل السجل قريباً.</p>
             </div>
           ) : activityLogs.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-full text-[#8B7355] font-body py-12">
                <span className="text-6xl mb-4 grayscale">🏕️</span>
                <p className="text-lg font-bold">لا توجد أنشطة بعد</p>
             </div>
           ) : (
             <div className="space-y-4">
               {activityLogs.map((log: any, idx) => {
                 const getActionName = (type: string) => {
                   switch (type) {
                     case 'ADD_POINTS':
                     case 'POINTS_ADD': return 'إضافة نقاط';
                     case 'DEDUCT_POINTS':
                     case 'POINTS_DEDUCT': return 'خصم نقاط';
                     case 'SPEND_POINTS': return 'صرف نقاط';
                     case 'REFUND_POINTS': return 'استرداد نقاط';
                     case 'ADMIN_ADJUST': return 'تعديل إداري';
                     case 'SYSTEM': return 'النظام';
                     case 'BUILD': return 'بناء منشأة';
                     case 'DESTROY':
                     case 'DELETE': return 'هدم منشأة';
                     case 'MOVE': return 'نقل منشأة';
                     default: return type || 'نشاط';
                   }
                 };

                 const getActionColor = (type: string) => {
                   switch (type) {
                     case 'ADD_POINTS':
                     case 'POINTS_ADD': return { bg: '#E6F4EA', text: '#137333', border: '#A3E2AB' };
                     case 'DEDUCT_POINTS':
                     case 'POINTS_DEDUCT': return { bg: '#FCE8E6', text: '#C5221F', border: '#F2B8B5' };
                     case 'SPEND_POINTS': return { bg: '#FFF4E5', text: '#B06000', border: '#FFD1A4' };
                     case 'REFUND_POINTS': return { bg: '#E0F2F1', text: '#00695C', border: '#80CBC4' };
                     case 'ADMIN_ADJUST': return { bg: '#FEF7E0', text: '#B06000', border: '#FDE293' };
                     case 'SYSTEM': return { bg: '#E8F0FE', text: '#1A73E8', border: '#ADCCF9' };
                     case 'BUILD': return { bg: '#FEF9E7', text: '#D4AF37', border: '#F9E79F' };
                     case 'DESTROY':
                     case 'DELETE': return { bg: '#FDEDEC', text: '#E74C3C', border: '#FADBD8' };
                     case 'MOVE': return { bg: '#EBF5FB', text: '#2980B9', border: '#AED6F1' };
                     default: return { bg: '#F1F3F4', text: '#3C4043', border: '#DADCE0' };
                   }
                 };

                 const getRoleLabel = (role: string) => {
                   switch (role) {
                     case 'super_admin': return 'مسؤول عام';
                     case 'team_admin': return 'مسؤول سبط';
                     case 'member': return 'عضو';
                     default: return 'سستم';
                   }
                 };

                 const borderColors = getActionColor(log.action_type);
                 const displayAmount = Number(log.amount || 0);
                 const isSpendAction = displayAmount < 0;
                 const sign = displayAmount > 0 ? '+' : '';
                 const showAmount = log.amount !== undefined;

                 return (
                   <div
                     key={log.id || idx}
                     style={{
                       backgroundColor: '#fff',
                       border: `1.5px solid ${borderColors.border}`,
                       borderRight: `6px solid ${borderColors.border}`,
                       borderRadius: '12px',
                       padding: '16px',
                       display: 'flex',
                       flexDirection: 'column',
                       gap: '12px',
                       boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                     }}
                   >
                     {/* Top row */}
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                         {/* Action Type Badge */}
                         <span style={{
                           backgroundColor: borderColors.bg,
                           color: borderColors.text,
                           padding: '4px 10px',
                           borderRadius: '8px',
                           fontSize: '12px',
                           fontWeight: 'bold',
                           border: `1px solid ${borderColors.border}`
                         }}>
                           {getActionName(log.action_type)}
                         </span>
                       </div>

                       {/* Points Amount Badge */}
                       {showAmount && (
                         <span style={{
                           fontSize: '16px',
                           fontWeight: 'bold',
                           color: displayAmount < 0 ? '#C5221F' : (displayAmount > 0 ? '#137333' : '#5F6368'),
                           fontFamily: "'Cinzel', serif"
                         }}>
                           {sign}{displayAmount} نقطة
                         </span>
                       )}
                     </div>

                     {/* Log Reason / Description */}
                     <div style={{ fontSize: '15px', color: '#2C1810', fontWeight: '500', lineHeight: '1.4', fontFamily: "'Tajawal', sans-serif" }}>
                       {log.reason || log.description}
                     </div>

                     {/* Footer section: Actor details and Time */}
                     <div style={{
                       display: 'flex',
                       justifyContent: 'space-between',
                       alignItems: 'center',
                       borderTop: '1px solid #F1F3F4',
                       paddingTop: '8px',
                       fontSize: '12px',
                       color: '#888',
                       flexWrap: 'wrap',
                       gap: '6px'
                     }}>
                       {/* Actor */}
                       <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                         <span style={{ color: '#6B5B45', fontWeight: 'bold' }}>👤 المنفذ:</span>
                         <span style={{ color: '#2C1810' }}>{log.actor_name || 'النظام'}</span>
                         <span style={{
                           backgroundColor: '#EAEAEA',
                           color: '#666',
                           fontSize: '10px',
                           padding: '1px 6px',
                           borderRadius: '4px',
                           marginRight: '4px'
                         }}>
                           {getRoleLabel(log.actor_role)}
                         </span>
                       </div>

                       {/* Time */}
                       <div>
                         📅 {new Date(log.created_at).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })}
                       </div>
                     </div>

                   </div>
                 );
               })}
             </div>
           )}
        </div>
      )}

    </div>
  );
}

function PointsCard({ label, value, color, icon }: any) {
  return (
    <div style={{
      padding: '12px 8px', borderRadius: '12px',
      backgroundColor: color + '14',
      border: `1.5px solid ${color}33`,
      textAlign: 'center',
    }} className="shadow-sm">
      <div className="text-2xl sm:text-3xl mb-1">{icon}</div>
      <div style={{
        fontFamily: "'Cinzel', serif",
        color: color,
      }} className="text-2xl sm:text-3xl font-bold">
        {value ?? 0}
      </div>
      <div style={{
        fontFamily: "'Tajawal', sans-serif",
        color: '#8B7355',
      }} className="text-[10px] sm:text-xs mt-1 font-medium">
        {label}
      </div>
    </div>
  );
}

async function fetchTeamBuildings(teamId: string) {
  const supabase = getSupabase();
  if(!supabase) return [];
  const { data, error } = await supabase
    .from('map_buildings')
    .select(`
      *,
      building_type:building_type_id (*)
    `)
    .eq('team_id', teamId);
    
  if (error) {
    console.error(error);
    return [];
  }
  return data || [];
}
