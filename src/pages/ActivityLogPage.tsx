import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { fetchActivities } from '../services/activityLogService';
import { fetchTeamsWithStats } from '../services/teamService';
import LoadingOverlay from '../components/LoadingOverlay';

export default function ActivityLogPage() {
  const [activities, setActivities] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const isSuperAdmin = user?.role === 'super_admin';

  useEffect(() => {
    const loadTeams = async () => {
      try {
        const teamsData = await fetchTeamsWithStats();
        setTeams(teamsData || []);
      } catch (err) {
        console.error('Failed to load teams for filter:', err);
      }
    };
    if (isSuperAdmin) {
      loadTeams();
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    const loadActivities = async () => {
      setIsLoading(true);
      try {
        const teamIdFilter = isSuperAdmin ? selectedTeamId : (user?.team_id || '');
        const data = await fetchActivities({ teamId: teamIdFilter || undefined });
        setActivities(data);
      } catch (err) {
        console.error('Failed to load activities:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadActivities();
  }, [selectedTeamId, isSuperAdmin, user?.team_id]);

  const getActionName = (item: any) => {
    if (item.reason?.includes('تم نقل') || item.reason?.includes('نقل')) {
      return 'حركة المباني';
    }
    switch (item.action_type) {
      case 'ADD_POINTS': return 'إضافة نقاط';
      case 'DEDUCT_POINTS': return 'خصم نقاط';
      case 'SPEND_POINTS': return 'صرف نقاط';
      case 'REFUND_POINTS': return 'استرداد نقاط';
      case 'ADMIN_ADJUST': return 'تعديل إداري';
      case 'SYSTEM': return 'النظام';
      default: return item.action_type;
    }
  };

  const getActionColor = (item: any) => {
    if (item.reason?.includes('تم نقل') || item.reason?.includes('نقل')) {
      return { bg: '#F1F3F4', text: '#5F6368', border: '#DADCE0' };
    }
    switch (item.action_type) {
      case 'ADD_POINTS': return { bg: '#E6F4EA', text: '#137333', border: '#A3E2AB' };
      case 'DEDUCT_POINTS': return { bg: '#FCE8E6', text: '#C5221F', border: '#F2B8B5' };
      case 'SPEND_POINTS': return { bg: '#FFF4E5', text: '#B06000', border: '#FFD1A4' };
      case 'REFUND_POINTS': return { bg: '#E0F2F1', text: '#00695C', border: '#80CBC4' };
      case 'ADMIN_ADJUST': return { bg: '#FEF7E0', text: '#B06000', border: '#FDE293' };
      case 'SYSTEM': return { bg: '#E8F0FE', text: '#1A73E8', border: '#ADCCF9' };
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

  return (
    <>
      <LoadingOverlay isLoading={isLoading} message="جاري تحميل سجل الأنشطة..." />
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 sm:p-8 bg-[#FFFDF5] min-h-full" style={{ direction: 'rtl', fontFamily: "'Tajawal', sans-serif" }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
          <h1 className="text-3xl font-bold text-[#8B4513] text-center" style={{ fontFamily: "'Tajawal', sans-serif" }}>📜 سجل أنشطة النقاط</h1>
          <p className="text-center text-sm text-[#8B7355]" style={{ fontFamily: "'Tajawal', sans-serif" }}>دفتر الأنشطة وحركة النقاط عبر الأسباط</p>
        </div>

        {/* Filters if Super Admin */}
        {isSuperAdmin && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            backgroundColor: '#FFF8E7', padding: '12px 16px',
            borderRadius: '12px', border: '1.5px solid #E8D5A3',
            marginBottom: '24px', maxWidth: '400px', margin: '0 auto 24px auto'
          }}>
            <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#8B4513', whiteSpace: 'nowrap' }}>تصفية حسب السبط:</label>
            <select
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              style={{
                flex: 1, padding: '8px 12px', borderRadius: '8px',
                border: '1px solid #D4AF37', backgroundColor: '#fff',
                fontSize: '14px', color: '#2C1810', outline: 'none'
              }}
            >
              <option value="">كل الأسباط</option>
              {teams.map(t => (
                <option key={t.id} value={t.id}>{t.symbol} {t.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Activities List */}
        <div className="space-y-4 max-w-4xl mx-auto">
          {activities.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#8B7355', backgroundColor: '#F9F5EC', borderRadius: '12px', border: '1px solid #E8D5A3' }}>
              لا توجد أنشطة مسجلة حتى الآن.
            </div>
          ) : (
             activities.map((item, index) => {
              const borderColors = getActionColor(item);
              const isMoving = item.reason?.includes('تم نقل') || item.reason?.includes('نقل') || item.reason?.includes('حركة');
              const showAmount = !isMoving && (item.action_type === 'ADD_POINTS' || item.action_type === 'SPEND_POINTS' || item.action_type === 'DEDUCT_POINTS' || item.action_type === 'REFUND_POINTS' || item.action_type === 'BUILD' || item.action_type === 'POINTS_ADD' || item.action_type === 'POINTS_DEDUCT');

              const displayAmount = Number(item.amount || 0);
              const isSpendAction = displayAmount < 0;
              const sign = displayAmount > 0 ? '+' : '';

              return (
                <motion.div
                  key={item.id}
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: Math.min(index * 0.03, 1) }}
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
                        {getActionName(item)}
                      </span>

                      {/* Team tag */}
                      {item.team && (
                        <span style={{
                          backgroundColor: '#FFF8E7',
                          color: '#8B4513',
                          border: '1px solid #E8D5A3',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}>
                          {item.team.symbol} {item.team.name}
                        </span>
                      )}
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

                  {/* Log Reason (Description) */}
                  <div style={{ fontSize: '15px', color: '#2C1810', fontWeight: '500', lineHeight: '1.4' }}>
                    {item.reason}
                  </div>

                  {/* Footer section: Actor details and Time */}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    borderTop: '1px solid #F1F3F4', paddingTop: '8px',
                    fontSize: '12px', color: '#888', flexWrap: 'wrap', gap: '6px'
                  }}>
                    {/* Actor */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ color: '#6B5B45', fontWeight: 'bold' }}>👤 المنفذ:</span>
                      <span style={{ color: '#2C1810' }}>{item.actor_name}</span>
                      <span style={{
                        backgroundColor: '#EAEAEA',
                        color: '#666',
                        fontSize: '10px',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        marginRight: '4px'
                      }}>
                        {getRoleLabel(item.actor_role)}
                      </span>
                    </div>

                    {/* Time */}
                    <div>
                      📅 {new Date(item.created_at).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })}
                    </div>
                  </div>

                </motion.div>
              );
            })
          )}
        </div>
      </motion.div>
    </>
  );
}
