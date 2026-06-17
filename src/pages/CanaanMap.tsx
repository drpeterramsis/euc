import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { TRIBE_REGIONS } from '../data/tribeRegions';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { fetchTeamsWithStats } from '../services/teamService';
import toast from 'react-hot-toast';

export default function CanaanMap() {
  const [selectedTribe, setSelectedTribe] = useState<any>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadTeams() {
      try {
        const teamsData = await fetchTeamsWithStats();
        setTeams(teamsData || []);
      } catch (err) {
        console.error('Error fetching teams on map:', err);
      }
    }
    loadTeams();
  }, []);

  const handleTribeClick = (tribe: any) => {
    setSelectedTribe(tribe);
    const matchingTeam = teams.find(
      (t) =>
        t.map_region?.trim().toLowerCase() === tribe.id.trim().toLowerCase() ||
        t.name?.trim().toLowerCase() === tribe.nameAr?.trim().toLowerCase()
    );

    if (matchingTeam) {
      navigate(`/tribes/${matchingTeam.id}`);
    } else {
      toast.error(`📍 السبط "${tribe.nameAr}" لم يتم ربطه بقاعدة البيانات حالياً!`, { id: `unlinked-${tribe.id}` });
    }
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <TransformWrapper
        initialScale={1}
        minScale={0.2}
        maxScale={5}
        centerOnInit={true}
        limitToBounds={false}
        wheel={{ step: 0.1 }}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <div style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              zIndex: 10,
              display: 'flex',
              gap: '6px',
            }}>
              <button onClick={() => zoomIn()} className="p-2 bg-[#D4AF37] text-white rounded">🔍+</button>
              <button onClick={() => zoomOut()} className="p-2 bg-[#D4AF37] text-white rounded">🔍-</button>
              <button onClick={() => resetTransform()} className="p-2 bg-[#D4AF37] text-white rounded">↺</button>
            </div>
            
            <TransformComponent
              wrapperStyle={{ width: '100%', height: '100%', display: 'block' }}
              contentStyle={{ width: '100%', height: '100%' }}
            >
              <svg
                viewBox="0 0 800 1000"
                xmlns="http://www.w3.org/2000/svg"
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'block',
                  minHeight: 'calc(100vh - 96px)',
                }}
                preserveAspectRatio="xMidYMid meet"
              >
                <rect width="800" height="1000" fill="#E8F4E8" />
                <rect x="0" y="0" width="120" height="1000" fill="#A8D4F0" fillOpacity="0.6" />
                
                <path
                  d="M 580,100 Q 590,300 575,500 Q 565,700 580,900"
                  stroke="#5BA4CF" strokeWidth="6"
                  fill="none" strokeLinecap="round"
                />

                {TRIBE_REGIONS.map((tribe: any) => (
                  <g key={tribe.id}>
                    <polygon
                      points={tribe.points}
                      fill={tribe.color}
                      fillOpacity="0.65"
                      stroke="#fff"
                      strokeWidth="2"
                      style={{ cursor: 'pointer', transition: 'fill-opacity 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.fillOpacity = '0.85'}
                      onMouseLeave={e => e.currentTarget.style.fillOpacity = '0.65'}
                      onClick={() => handleTribeClick(tribe)}
                    />
                    <text
                      x={tribe.labelX}
                      y={tribe.labelY}
                      textAnchor="middle"
                      fontSize="20"
                      style={{ userSelect: 'none', pointerEvents: 'none' }}
                    >
                      {tribe.symbol}
                    </text>
                    <text
                      x={tribe.labelX}
                      y={tribe.labelY + 20}
                      textAnchor="middle"
                      fontSize="11"
                      fontFamily="Amiri, serif"
                      fill="#000000"
                      fontWeight="bold"
                      style={{ userSelect: 'none', pointerEvents: 'none' }}
                    >
                      {tribe.nameAr}
                    </text>
                  </g>
                ))}
              </svg>
            </TransformComponent>
          </div>
        )}
      </TransformWrapper>
    </div>
  );
}
