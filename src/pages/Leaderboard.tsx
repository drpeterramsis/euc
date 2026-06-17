import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { fetchTeamsWithStats } from '../services/teamService';
import { notify } from '../utils/toastMessages';
import LoadingOverlay from '../components/LoadingOverlay';
import { useRefresh } from '../context/RefreshContext';

export default function Leaderboard() {
  const [teams, setTeams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { refreshCount } = useRefresh();

  useEffect(() => {
    const fetchTeams = async () => {
      setIsLoading(true);
      try {
        const teamsData = await fetchTeamsWithStats();
        // Since land_tiles(count) was used before, we'll sort based on pointsTotal
        setTeams(teamsData?.sort((a,b) => b.pointsTotal - a.pointsTotal) || []);
      } catch (e) {
        notify.loadFailed();
      } finally {
        setIsLoading(false);
      }
    };
    fetchTeams();
    const interval = setInterval(fetchTeams, 30000);
    return () => clearInterval(interval);
  }, [refreshCount]);

  return (
    <>
      <LoadingOverlay isLoading={isLoading} message="جاري تحميل البيانات..." />
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 sm:p-8 bg-[#FFFDF5] min-h-full">
      <h1 className="text-3xl sm:text-4xl font-title text-[#8B4513] mb-6 sm:mb-8 text-center" style={{ fontFamily: "'Tajawal', sans-serif", fontWeight: 'bold' }}>🏆  لوحة النقاط</h1>
      <div className="space-y-4">
        {teams.map((team, index) => {
          const rank = index + 1;
          const isTop3 = rank <= 3;
          const TOP3_COLORS = [
            { bg: '#FFF9E6', border: '#D4AF37' },
            { bg: '#F5F5F5', border: '#A8A8A8' },
            { bg: '#FFF0E6', border: '#CD7F32' },
          ];

          return (
          <motion.div key={team.id} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: index * 0.05 }} 
          style={{
            display: 'flex',
            flexDirection: 'column',
            padding: '10px 14px',
            borderRadius: '12px',
            backgroundColor: isTop3 ? TOP3_COLORS[rank - 1].bg : '#FFFDF5',
            border: `1.5px solid ${isTop3 ? TOP3_COLORS[rank - 1].border : '#E8D5A3'}`,
            marginBottom: '8px',
            gap: '4px',
            direction: 'rtl',
            boxShadow: isTop3 ? '0 2px 12px rgba(212,175,55,0.2)' : 'none',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'nowrap' }}>
              <span style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 'clamp(0.9rem, 3vw, 1.1rem)', color: '#8B4513', minWidth: '24px', textAlign: 'center', flexShrink: 0 }}>
                {rank <= 3 ? ['🥇','🥈','🥉'][rank - 1] : rank}
              </span>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: team.color, flexShrink: 0, border: '2px solid rgba(255,255,255,0.6)', boxShadow: `0 2px 6px ${team.color}55` }}/>
              <span style={{ fontFamily: "'Amiri', serif", fontSize: 'clamp(1rem, 3.5vw, 1.2rem)', fontWeight: 700, color: '#2C1810', flex: 1 }}>{team.name}</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingRight: '32px', flexWrap: 'wrap', whiteSpace: 'nowrap' }} className="sm:gap-3">
              <span style={{ fontFamily: "'Tajawal', sans-serif", fontSize: 'clamp(0.8rem, 2.5vw, 0.95rem)', color: '#D4AF37', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                <span>🏆</span><span>{team.pointsTotal ?? 0} سكور</span>
              </span>
              <span style={{ color: '#D4AF37', opacity: 0.4 }}>•</span>
              <span style={{ fontFamily: "'Tajawal', sans-serif", fontSize: 'clamp(0.8rem, 2.5vw, 0.95rem)', color: '#6B5B45', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <span>👥</span><span>{team.memberCount ?? 0} عضو</span>
              </span>
              <span style={{ color: '#D4AF37', opacity: 0.4 }}>•</span>
              <span style={{ fontFamily: "'Tajawal', sans-serif", fontSize: 'clamp(0.8rem, 2.5vw, 0.95rem)', color: '#27AE60', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <span>💰</span><span>{team.pointsAvailable ?? 0} متاح</span>
              </span>
            </div>
          </motion.div>
          );
        })}
      </div>
    </motion.div>
    </>
  );
}
