import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { TRIBES } from '../data/tribeAssets';
import { fetchTeamsWithStats } from '../services/teamService';
import { toast } from 'react-hot-toast';

// ════════════════════════════════════════════════
// ARABIC NORMALIZATION & TRIBE ALIASES CONFIG
// ════════════════════════════════════════════════
function cleanAndNormalize(str: string): string {
  if (!str) return '';
  return str
    .trim()
    .replace(/[أإآإآأٱ]/g, 'ا') // Normalize Alifs to plain 'ا'
    .replace(/ة/g, 'ه')       // Teh Marbuta -> Heh
    .replace(/ى/g, 'ي')       // Alef Maksura -> Yeh
    .replace(/[\u064B-\u0652]/g, '') // Remove diacritics / harakat
    .replace(/^سبط\s+/, '')    // Remove "سبط" prefix if any
    .replace(/\s+/g, '')       // Strip all whitespace for maximum tolerance (e.g., 'بني امين' -> 'بنيامين')
    .toLowerCase();
}

const TRIBE_ALIASES: Record<string, string[]> = {
  reuben:   ['راوبين', 'رأوبين', 'روبين', 'reuben', 'ruben'],
  simeon:   ['شمعون', 'simeon', 'simon'],
  levi:     ['لاوي', 'اللاويين', 'levi', 'levy', 'levite'],
  judah:    ['يهوذا', 'يهوذه', 'judah', 'juda', 'jude'],
  issachar: ['يساكر', 'يسكار', 'issachar', 'isachar'],
  zebulun:  ['زبولون', 'زبلون', 'zebulun', 'zebulon'],
  dan:      ['دان', 'dan'],
  naphtali: ['نفتالي', 'naphtali', 'naftali'],
  gad:      ['جاد', 'gad'],
  asher:    ['اشير', 'أشير', 'asher', 'aser'],
  joseph:   ['يوسف', 'افرايم', 'إفرايم', 'منسى', 'منسي', 'joseph', 'ephraim', 'manasseh'],
  benjamin: ['بنيامين', 'benjamin', 'binyamin'],
};

interface TribesInfoProps {
  currentUser?: any;
}

export default function TribesInfo({ currentUser }: TribesInfoProps) {
  const [tribes, setTribes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTribes = useCallback(async () => {
    setLoading(true);
    try {
      const teamsData = await fetchTeamsWithStats();
      
      setTribes(TRIBES.map(t => {
        // Find matching team in teamsData utilizing ID, normalized names, and aliases
        const team = teamsData?.find((tm: any) => {
          const tmName = tm.name || '';
          const tmNameEn = tm.name_en || '';
          
          const cleanTmName = cleanAndNormalize(tmName);
          const cleanTmNameEn = cleanAndNormalize(tmNameEn);

          const key = (t.nameEn || '').toLowerCase();
          const aliases = TRIBE_ALIASES[key] || [];

          // 1. Direct ID check
          if (String(tm.id) === String(t.id)) return true;

          // 2. Exact match of normalized native names
          if (cleanAndNormalize(t.nameAr) === cleanTmName) return true;
          if (cleanAndNormalize(t.nameEn) === cleanTmNameEn) return true;

          // 3. Aliases/variations check
          for (const alias of aliases) {
            const cleanAlias = cleanAndNormalize(alias);
            if (cleanTmName.includes(cleanAlias) || cleanAlias.includes(cleanTmName)) return true;
            if (cleanTmNameEn && (cleanTmNameEn.includes(cleanAlias) || cleanAlias.includes(cleanTmNameEn))) return true;
          }

          // 4. Loose substring match
          if (cleanTmName.includes(cleanAndNormalize(t.nameAr)) || cleanAndNormalize(t.nameAr).includes(cleanTmName)) return true;
          if (cleanTmNameEn && (cleanTmNameEn.includes(cleanAndNormalize(t.nameEn)) || cleanAndNormalize(t.nameEn).includes(cleanTmNameEn))) return true;

          return false;
        }) || { pointsTotal: 0, pointsSpent: 0, memberCount: 0, landsCount: 0 };

        // Ensure safe value extraction for both CamelCase and snake_case properties
        const pointsTotalVal = team.pointsTotal ?? team.points_total ?? team.points ?? 0;
        const pointsSpentVal = team.pointsSpent ?? team.points_spent ?? 0;
        const memberCountVal = team.memberCount ?? team.member_count ?? 0;
        const landsCountVal  = team.landsCount ?? team.lands_count ?? 0;

        return { 
          ...t, 
          points_total: pointsTotalVal,
          points_spent: pointsSpentVal,
          memberCount: memberCountVal, 
          landsCount: landsCountVal,
          teamDbId: team.id
        };
      }));
    } catch (err: any) {
      toast.error(`❌ فشل تحميل الأسباط: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTribes();

    // Re-fetch on tab/window visibility focus
    const onVisible = () => {
      if (document.visibilityState === 'visible') loadTribes();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [loadTribes]);

  if (loading) return <LoadingSpinner />;

  return (
    <div style={{
      padding: '24px 16px 64px', maxWidth: '1200px',
      margin: '0 auto', direction: 'rtl',
    }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{
          fontFamily: "'Amiri', serif",
          fontSize: 'clamp(24px, 5vw, 36px)',
          color: '#8B4513', margin: '0 0 8px',
          fontWeight: 700,
        }}>
          أسباط إسرائيل الاثنا عشر
        </h1>
        <p style={{
          fontFamily: "'Tajawal', sans-serif",
          color: '#8B7355', fontSize: '15px', margin: 0,
        }}>
          اختر سبطك وقاتل من أجل مجده وحصاد بركاته
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: '20px',
      }}>
        {tribes.map(tribe => (
          <TribeCard
            key={tribe.id}
            tribe={tribe}
            isMyTribe={currentUser?.team_id === tribe.teamDbId}
          />
        ))}
      </div>
    </div>
  );
}

function TribeCard({ tribe, isMyTribe }: { tribe: any; isMyTribe: boolean; key?: any }) {
  const pointsAvailable = (tribe.points_total ?? 0) - (tribe.points_spent ?? 0);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, boxShadow: `0 10px 28px ${tribe.color}44` }}
      style={{
        borderRadius: '16px',
        border: `2px solid ${isMyTribe ? tribe.color : (tribe.color ?? '#D4AF37') + '55'}`,
        backgroundColor: '#FFFDF5',
        overflow: 'hidden', position: 'relative',
        transition: 'transform 0.2s, box-shadow 0.2s',
        boxShadow: isMyTribe
          ? `0 6px 24px ${tribe.color}33`
          : '0 2px 8px rgba(0,0,0,0.06)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {isMyTribe && (
        <div style={{
          position: 'absolute', top: '8px', left: '8px', zIndex: 1,
          backgroundColor: tribe.color, color: '#fff',
          borderRadius: '6px', padding: '2px 8px',
          fontSize: '10px', fontFamily: "'Tajawal', sans-serif", fontWeight: 700,
        }}>
          سبطي
        </div>
      )}

      {/* Color top bar */}
      <div style={{ height: '8px', backgroundColor: tribe.color ?? '#D4AF37' }}/>

      <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Symbol + Name */}
        <div style={{ textAlign: 'center', marginBottom: '14px' }}>
          <div style={{ fontSize: '44px', lineHeight: 1.2, marginBottom: '6px' }}>
            {tribe.symbol ?? '⚔️'}
          </div>
          <div style={{
            fontFamily: "'Amiri', serif",
            fontSize: '19px', fontWeight: 700, color: '#2C1810',
          }}>
            {tribe.nameAr}
          </div>
          {tribe.nameEn && (
            <div style={{
              fontFamily: "'Cinzel', serif",
              fontSize: '11px', color: '#8B7355', marginTop: '2px',
            }}>
              {tribe.nameEn}
            </div>
          )}
        </div>

        <div style={{
          height: '1px',
          backgroundColor: (tribe.color ?? '#D4AF37') + '22',
          margin: '10px 0',
        }}/>

        {/* Stats — 3 cols */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
          gap: '4px', textAlign: 'center', marginBottom: '12px'
        }}>
          <StatItem icon="💰" value={pointsAvailable} color="#27AE60" label="متاحة" />
          <StatItem icon="🏆" value={tribe.points_total}     color="#D4AF37" label="إجمالي" />
          <StatItem icon="👥" value={tribe.memberCount}     color="#8B4513" label="أعضاء"  />
        </div>

        {tribe.description && (
          <div style={{
            marginTop: 'auto', fontFamily: "'Tajawal', sans-serif",
            fontSize: '11px', color: '#8B7355',
            textAlign: 'center', lineHeight: 1.5,
            paddingTop: '8px', borderTop: `1px solid ${tribe.color}18`
          }}>
            {tribe.description}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function StatItem({ icon, value, color, label }: any) {
  return (
    <div style={{ padding: '4px 2px' }}>
      <div style={{ fontSize: '15px' }}>{icon}</div>
      <div style={{
        fontFamily: "'Cinzel', serif",
        fontSize: '15px', fontWeight: 700,
        color, marginTop: '2px',
      }}>
        {value ?? 0}
      </div>
      <div style={{
        fontFamily: "'Tajawal', sans-serif",
        fontSize: '9px', color: '#B8A88A', marginTop: '1px',
      }}>
        {label}
      </div>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      justifyContent: 'center', height: '60vh',
      flexDirection: 'column', gap: '16px',
    }}>
      <div style={{
        width: '40px', height: '40px',
        border: '3px solid #D4AF37',
        borderTop: '3px solid transparent',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }}/>
      <span style={{
        fontFamily: "'Tajawal', sans-serif",
        color: '#8B7355', fontSize: '14px',
      }}>
        جاري تحميل الأسباط...
      </span>
    </div>
  );
}
