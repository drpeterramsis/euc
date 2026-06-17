import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fetchTeamsWithStats } from '../services/teamService';
import InteractiveTribesSvgMap from '../components/map/InteractiveTribesSvgMap';
import { TRIBE_REGIONS_SVG } from '../data/tribesMapMeta';
import { toast } from 'react-hot-toast';
import { useRefresh } from '../context/RefreshContext';

import MapFullscreenWrapper from '../components/map/MapFullscreenWrapper';
import AwardPointsModal from '../components/AwardPointsModal';
import DeductPointsModal from '../components/DeductPointsModal';

interface TribesPageProps {
  currentUser: any;
}

export default function TribesPage({ currentUser }: TribesPageProps) {
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredTribe, setHoveredTribe] = useState<string | null>(null);
  const navigate = useNavigate();
  const { refreshCount } = useRefresh();

  const [isAwardOpen, setIsAwardOpen] = useState(false);
  const [isDeductOpen, setIsDeductOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchTeamsWithStats();
      setTeams(data || []);
    } catch (err: any) {
      toast.error(`❌ فشل تحميل الأسباط: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData, refreshCount]);

  const handleSelectTribe = (regionId: string) => {
    const matchingTeam = teams.find(
      (t) =>
        t.map_region?.toLowerCase() === regionId.toLowerCase() ||
        TRIBE_REGIONS_SVG.find((r) => r.id === regionId)?.nameAr === t.name
    );

    if (matchingTeam) {
      navigate(`/tribes/${matchingTeam.id}`);
    } else {
      toast.error(`📍 هذا السبط لم يربط بفريق بقاعدة البيانات حالياً!`);
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '60vw', flexDirection: 'column', gap: '6px',
      }}>
        <div style={{
          width: '40px', height: '40px',
          border: '3px solid #D4AF37', borderTop: '3px solid transparent',
          borderRadius: '50%', animation: 'spin 0.8s linear infinite',
        }}/>
        <span style={{ fontFamily: "'Cairo', sans-serif", color: '#8B7355', fontSize: '13px' }}>
          جاري تحميل خريطة كنعان والأسباط...
        </span>
      </div>
    );
  }

  return (
    <div style={{
      padding: '8px 10px', maxWidth: '1200px', margin: '0 auto', direction: 'rtl',
    }}>
      {/* Page Title */}
      <div style={{ textAlign: 'center', marginBottom: '6px' }}>
        <h1 style={{
          fontFamily: "'Cairo', sans-serif",
          fontSize: '18px',
          color: '#8B4513', margin: '0 0 6px',
          fontWeight: 700,
        }}>
          🗺️ الخريطة التفاعلية للأسباط
        </h1>
        <p style={{
          fontFamily: "'Cairo', sans-serif",
          color: '#8B7355', fontSize: '12px', margin: 0,
        }}>
          اضغط على أي سبط بالخريطة أو بالأسفل
        </p>
      </div>

      {/* Split screen layout */}
      <div className="flex flex-col-reverse md:grid md:grid-cols-2 gap-[10px] items-start">
        
        {/* Interactive Map Visualizer */}
        <div className="w-full" style={{
          backgroundColor: '#FFFDF5',
          borderRadius: '10px',
          padding: '10px 12px',
          border: '2px solid #E8D5A3',
          boxShadow: '0 6px 18px rgba(0,0,0,0.04)',
          marginTop: '8px',
        }}>
          <h2 style={{
            fontFamily: "'Cairo', sans-serif",
            fontSize: '13px', fontWeight: 'bold', color: '#8B4513',
            marginBottom: '6px', textAlign: 'center'
          }}>
            📍 خريطة كنعان والأملاك
          </h2>
          <div className="w-full h-[50vh] min-h-[300px] md:h-[calc(100vh-240px)] md:min-h-[480px] md:max-h-[720px] relative z-0">
            <MapFullscreenWrapper>
              <InteractiveTribesSvgMap
                teams={teams}
                onSelectTribe={handleSelectTribe}
                highlightedTribeId={hoveredTribe}
              />
            </MapFullscreenWrapper>
          </div>
        </div>

        {/* Tribe Directory Stats List */}
        <div className="w-full">
          <div style={{
            backgroundColor: '#FFF8E7',
            border: '2px solid #D4AF37',
            borderRadius: '10px',
            padding: '10px 12px',
            marginBottom: '8px',
            textAlign: 'right',
          }}>
            <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: '#2C1810', margin: '0 0 4px' }}>
              🎖️ لوحة توجيه الأسباط
            </h3>
            <p style={{ fontSize: '12px', color: '#8B7355', margin: 0, lineHeight: 1.3 }}>
              يتم تحويل وتلوين كل منطقة بالخريطة لتطابق السبط.
            </p>
            {currentUser?.role === 'super_admin' && (
              <div className="flex gap-2 mt-3 justify-stretch">
                <button
                  onClick={() => {
                    setSelectedTeamId('');
                    setIsAwardOpen(true);
                  }}
                  className="flex-1 py-2 px-3 bg-[#D4AF37] hover:bg-[#C5A32E] text-white rounded-lg text-xs font-bold shadow flex items-center justify-center gap-1 transition-all cursor-pointer"
                >
                  🏆 منح نقاط للسبط
                </button>
                <button
                  onClick={() => {
                    setSelectedTeamId('');
                    setIsDeductOpen(true);
                  }}
                  className="flex-1 py-2 px-3 bg-[#E74C3C] hover:bg-[#C0392B] text-white rounded-lg text-xs font-bold shadow flex items-center justify-center gap-1 transition-all cursor-pointer"
                >
                  🛑 خصم مانيوال
                </button>
              </div>
            )}
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            maxHeight: 'calc(100vh - 120px)',
            overflowY: 'auto',
          }} className="pr-1">
            {teams.map((team) => {
              const regionMeta = TRIBE_REGIONS_SVG.find(
                (r) =>
                  r.nameAr === team.name ||
                  team.map_region?.toLowerCase() === r.id.toLowerCase()
              );

              return (
                <motion.div
                  key={team.id}
                  whileHover={{ y: -2 }}
                  onMouseEnter={() => regionMeta && setHoveredTribe(regionMeta.id)}
                  onMouseLeave={() => setHoveredTribe(null)}
                  onClick={() => navigate(`/tribes/${team.id}`)}
                  style={{
                    backgroundColor: '#FFFDF5',
                    border: `1.5px solid ${team.color || '#D4AF37'}55`,
                    borderRight: `6px solid ${team.color || '#D4AF37'}`,
                    borderRadius: '10px',
                    padding: '10px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    transition: 'all 0.15s ease-in-out',
                    boxShadow: hoveredTribe === regionMeta?.id ? `0 4px 12px ${team.color || '#D4AF37'}22` : 'rgba(0, 0, 0, 0.04) 0px 2px 4px',
                    width: '100%'
                  }}
                >
                  <div className="flex justify-between items-center w-full">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '20px' }}>{team.symbol || regionMeta?.symbol || '⚔️'}</span>
                      <strong style={{
                        fontFamily: "'Cairo', sans-serif",
                        fontSize: '15px',
                        color: '#2C1810',
                      }}>
                        {team.name}
                      </strong>
                    </div>
                  </div>

                  <div className="flex gap-2 justify-start items-center text-[11px] bg-[#FFF8E7] p-2 rounded-lg border border-[#E8D5A3]">
                     <span className="flex items-center gap-0.5 text-[#27AE60] font-bold"><span className="text-sm">⭐</span>{team.pointsAvailable || 0}</span>
                     <span className="text-[#D4AF37] opacity-40">•</span>
                     <span className="flex items-center gap-0.5 text-[#8B4513] font-bold"><span className="text-sm">👥</span>{team.memberCount || 0}</span>
                     <span className="text-[#D4AF37] opacity-40">•</span>
                     <span className="flex items-center gap-0.5 text-[#E74C3C] font-bold"><span className="text-sm">🏗️</span>{team.pointsSpent || 0}</span>
                  </div>

                  {currentUser?.role === 'super_admin' && (
                    <div className="flex gap-2 justify-end w-full mt-2 pt-2 border-t border-[#E8D5A3]/40">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTeamId(team.id);
                          setIsAwardOpen(true);
                        }}
                        className="py-1 px-2.5 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/25 text-[#8B4513] border border-[#D4AF37]/40 rounded-md text-[11px] font-bold flex items-center gap-0.5 transition-all cursor-pointer"
                      >
                        🏆 منح نقاط
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTeamId(team.id);
                          setIsDeductOpen(true);
                        }}
                        className="py-1 px-2.5 bg-[#E74C3C]/10 hover:bg-[#E74C3C]/25 text-[#C0392B] border border-[#E74C3C]/30 rounded-md text-[11px] font-bold flex items-center gap-0.5 transition-all cursor-pointer"
                      >
                        🛑 خصم يدوي
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

      </div>

      {isAwardOpen && (
        <AwardPointsModal
          teams={teams}
          currentUser={currentUser}
          initialTeamId={selectedTeamId}
          onClose={() => {
            setIsAwardOpen(false);
            setSelectedTeamId('');
          }}
          onSuccess={loadData}
        />
      )}

      {isDeductOpen && (
        <DeductPointsModal
          teams={teams}
          currentUser={currentUser}
          initialTeamId={selectedTeamId}
          onClose={() => {
            setIsDeductOpen(false);
            setSelectedTeamId('');
          }}
          onSuccess={loadData}
        />
      )}
    </div>
  );
}
