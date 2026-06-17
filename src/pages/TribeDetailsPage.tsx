import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fetchSingleTeamWithMembers } from '../services/teamService';
import { fetchTeamBuildings } from '../services/buildingService';
import InteractiveTribesSvgMap from '../components/map/InteractiveTribesSvgMap';
import { TRIBE_REGIONS_SVG } from '../data/tribesMapMeta';
import { getRoleLabel, getRoleColor, getRoleEmoji } from '../utils/roleLabels';
import { toast } from 'react-hot-toast';
import { useRefresh } from '../context/RefreshContext';

interface TribeDetailsPageProps {
  currentUser: any;
}

export default function TribeDetailsPage({ currentUser }: TribeDetailsPageProps) {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const [team, setTeam] = useState<any>(null);
  const [buildings, setBuildings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { refreshCount } = useRefresh();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/tribes');
    }
  };

  const loadData = useCallback(async () => {
    if (!teamId) return;
    setLoading(true);
    try {
      const [teamData, buildingsData] = await Promise.all([
        fetchSingleTeamWithMembers(teamId),
        fetchTeamBuildings(teamId),
      ]);
      setTeam(teamData);
      setBuildings(buildingsData || []);
    } catch (err: any) {
      toast.error(`❌ فشل تحميل تفاصيل السبط: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    loadData();
  }, [loadData, refreshCount]);

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
        <span style={{ color: '#8B7355', fontSize: '13px' }}>
          جاري التحميل...
        </span>
      </div>
    );
  }

  if (!team) {
    return (
      <div style={{
        textAlign: 'center', padding: '20px 10px', direction: 'rtl',
        color: '#8B7355',
      }}>
        <div style={{ fontSize: '32px', marginBottom: '8px' }}>⚠️</div>
        <p>السبط المطلوب غير موجود</p>
        <button onClick={handleBack} style={{
          marginTop: '6px', padding: '6px 14px', borderRadius: '8px',
          border: 'none', backgroundColor: '#D4AF37', color: '#fff',
          fontWeight: 'bold', cursor: 'pointer', height: '36px',
        }}>
          ⬅️ السفر إلى صفحة الأسباط
        </button>
      </div>
    );
  }

  const leader = team.members?.find((m: any) => m.role === 'team_admin');
  const regionMeta = TRIBE_REGIONS_SVG.find(
    (r) =>
      r.nameAr === team.name ||
      team.map_region?.toLowerCase() === r.id.toLowerCase()
  );

  return (
    <div style={{
      padding: '8px 10px', maxWidth: '1200px', margin: '0 auto', direction: 'rtl',
    }} className="flex flex-col gap-[8px] w-full max-w-full overflow-x-hidden">
      <div>
        <button
          onClick={handleBack}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '6px 10px', borderRadius: '10px',
            border: '1.5px solid #D4AF37', backgroundColor: '#FFFDF5',
            color: '#8B4513', fontSize: '13px', fontWeight: 'bold',
            cursor: 'pointer', height: '36px',
          }}
          className="w-full md:w-auto"
        >
          🔙 العودة
        </button>
      </div>

      <div style={{
        backgroundColor: '#FFFDF5',
        border: `2px solid ${team.color || '#D4AF37'}`,
        borderRightWidth: '8px',
        borderRadius: '10px',
        padding: '14px 16px',
      }} className="flex flex-col w-full">
        <div className="flex flex-col gap-[6px]">
          <div className="flex items-center gap-[6px]">
            <span style={{ fontSize: '32px' }}>{team.symbol || regionMeta?.symbol || '⚔️'}</span>
            <div>
              <h1 style={{
                fontSize: '20px', fontWeight: 700, color: '#2C1810',
                margin: '0 0 6px',
              }}>
                سبط {team.name}
              </h1>
            </div>
          </div>

          <div className="flex flex-col gap-2 w-full md:grid md:grid-cols-3 md:gap-[6px]">
            <BigScoreCard icon="🏆" title="الأسكـور الإجمالي" value={team.pointsTotal} color="#D4AF37" />
            <BigScoreCard icon="🏗️" title="المستثمر بالبناء" value={team.pointsSpent} color="#E74C3C" />
            <BigScoreCard icon="💰" title="النقـاط المتاحـة" value={team.pointsAvailable} color="#27AE60" />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 w-full md:grid md:grid-cols-2 md:gap-[10px] items-start">
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }} className="w-full">
          
          <div style={{
            backgroundColor: '#FFFDF5', borderRadius: '10px',
            border: '2px solid #E8D5A3', padding: '10px 12px',
          }} className="w-full">
            <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: '#8B4513', margin: '0 0 4px' }}>
              🛡️ القائد
            </h3>
            {leader ? (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 10px', backgroundColor: '#FFF8E7',
                borderRadius: '8px', border: '1px solid #D4AF3744',
              }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  backgroundColor: '#2980B9', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '13px', fontWeight: 'bold',
                }}>
                  🛡️
                </div>
                <div>
                  <strong style={{ fontSize: '13px', color: '#2C1810' }}>
                    {leader.name}
                  </strong>
                </div>
              </div>
            ) : (
              <div style={{ color: '#8B7355', fontSize: '12px', textAlign: 'center', padding: '8px' }}>
                لا يوجد قائد.
              </div>
            )}
          </div>

          <div style={{
            backgroundColor: '#FFFDF5', borderRadius: '10px',
            border: '2px solid #E8D5A3', padding: '10px 12px',
          }} className="w-full">
            <h3 style={{
              fontSize: '13px', fontWeight: 'bold',
              color: '#8B4513', margin: '0 0 6px',
            }}>
              👥 الأعضاء ({team.members?.length || 0})
            </h3>

            <div style={{
              display: 'flex', flexDirection: 'column', gap: '4px',
              maxHeight: '300px', overflowY: 'auto',
            }} className="w-full">
              {team.members?.map((member: any) => {
                const roleLabel = getRoleLabel(member.role);
                const color = getRoleColor(member.role);

                return (
                  <div
                    key={member.id}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '8px',
                      backgroundColor: '#FFFDF5',
                      border: '1px solid #F0E6C8',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                    className="w-full flex"
                  >
                    <strong style={{ fontSize: '12px', color: '#2C1810' }}>
                      {member.name}
                    </strong>
                    <div style={{
                      fontSize: '11px',
                      color,
                      padding: '2px 8px',
                      borderRadius: '20px',
                      backgroundColor: color + '12',
                      border: `1px solid ${color}33`,
                    }}>
                      {roleLabel}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }} className="w-full">
          
          <div style={{
            backgroundColor: '#FFFDF5', borderRadius: '10px',
            border: '2px solid #D4AF37', padding: '10px 12px',
          }} className="w-full">
            <h3 style={{
              fontSize: '13px', fontWeight: 'bold',
              color: '#8B4513', margin: '0 0 6px', textAlign: 'center',
            }}>
              🗺️ النطاق الجغرافي
            </h3>
            
            <div style={{
              textAlign: 'center', marginBottom: '6px',
              backgroundColor: `${team.color || '#D4AF37'}22`,
              padding: '6px', borderRadius: '8px',
              fontSize: '12px', fontWeight: 'bold', color: '#2C1810',
            }}>
              📍 <strong>{regionMeta?.nameAr || 'غير محددة'}</strong>
            </div>

            <div style={{ 
              width: '100%', 
              height: '320px', 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              overflow: 'hidden',
              margin: '6px 0'
            }}>
              <InteractiveTribesSvgMap
                teams={[team]}
                highlightedTribeId={regionMeta?.id}
                restrictToTribeRegionId={regionMeta?.id}
                buildings={buildings.map(b => ({ ...b, team }))}
              />
            </div>
          </div>

          <div style={{
            backgroundColor: '#FFFDF5', borderRadius: '10px',
            border: '2px solid #E8D5A3', padding: '10px 12px',
          }} className="w-full">
            <h3 style={{
              fontSize: '13px', fontWeight: 'bold',
              color: '#8B4513', margin: '0 0 6px',
            }}>
              🏘️ المنشآت ({buildings.length})
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }} className="w-full">
              {buildings.map((b) => (
                <div key={b.id} style={{
                    padding: '8px 10px',
                    borderRadius: '8px',
                    backgroundColor: '#FFFDF5',
                    border: '1.5px solid #E8D5A3',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                    <span>{b.building_type?.icon || '🏠'}</span>
                    <strong style={{ color: '#2C1810' }}>
                      {b.name_override || b.building_type?.name || 'منشأة'}
                    </strong>
                  </div>
                  <strong style={{ color: '#C0392B', fontSize: '12px' }}>-{b.points_spent}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BigScoreCard({ icon, title, value, color }: { icon: string; title: string; value: number; color: string }) {
  return (
    <div className="w-full flex items-center justify-between box-border" style={{
      backgroundColor: '#FFFDF5',
      border: `1.5px solid ${color}44`,
      borderRadius: '8px',
      padding: '8px 14px',
      direction: 'rtl',
    }}>
      <div className="flex items-center gap-[8px]">
        <span style={{ fontSize: '18px' }}>{icon}</span>
        <span style={{ color: '#8B7355', fontSize: '13px', fontWeight: 'bold' }}>{title}</span>
      </div>
      <div style={{ color, fontSize: '16px', fontWeight: 'bold' }}>{value}</div>
    </div>
  );
}

