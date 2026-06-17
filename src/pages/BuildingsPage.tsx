import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  placeBuilding,
  removeBuilding,
  moveBuilding,
  updateBuildingName,
} from '../services/buildingService';
import { fetchAllBuildingTypes } from '../services/buildingTypeService';
import { logActivity } from '../services/activityLogService';
import { fetchTeamPoints, deductTeamPoints, fetchAvailablePoints } from '../services/pointsService';
import { getSupabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import InteractiveTribesSvgMap from '../components/map/InteractiveTribesSvgMap';
import BuildingCatalogStrip from '../components/catalog/BuildingCatalogStrip';
import { useRefresh } from '../context/RefreshContext';
import MapFullscreenWrapper from '../components/map/MapFullscreenWrapper';
import BuildingActionMenu from '../components/map/BuildingActionMenu';
import { detectMapBuildingsSchema } from '../utils/schemaInspector';
import LoadingOverlay from '../components/LoadingOverlay';
import { normalizeBuildingList, buildInsertPayload, normalizeBuildingRow } from '../utils/buildingMapper';
import PrerequisiteWarningModal from '../components/modals/PrerequisiteWarningModal';

interface BuildingType {
  id: string
  cost: number
  name: string
}

export default function BuildingsPage({ currentUser }: { currentUser: any }) {
  const [buildingTypes, setBuildingTypes] = useState<any[]>([]);
  const [allMapBuildings, setAllMapBuildings] = useState<any[]>([]);
  
  const [myBuildings, setMyBuildings] = useState<any[]>([]);
  const [teamPoints, setTeamPoints] = useState({ total: 0, spent: 0, available: 0 });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedType, setSelectedType] = useState<any>(null);
  const [currentUserTeam, setCurrentUserTeam] = useState<any>(null);
  const [allTeams, setAllTeams] = useState<any[]>([]);
  const [detectedSchema, setDetectedSchema] = useState<any>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [prereqWarning, setPrereqWarning] = useState<{ target: any; missing: any } | null>(null);
  
  // UI States
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const isDeleteModeRef = useRef(false);

  // Sync ref to avoid stale closures
  useEffect(() => {
    isDeleteModeRef.current = isDeleteMode;
  }, [isDeleteMode]);

  const toggleDeleteMode = () => {
    const next = !isDeleteMode;
    setIsDeleteMode(next);
    isDeleteModeRef.current = next;
    if (next) {
      setSelectedBuildingForPlacement(null);
      setIsPlacing(false);
      placingRef.current = false;
      toast.success('وضع الهدم مفعّل — اضغط على مبنى لهدمه 🔨');
    } else {
      toast.success('تم إلغاء وضع الهدم');
    }
  };

  const [actionMenu, setActionMenu] = useState<{ building: any; pos: { x: number; y: number } } | null>(null);

  // Mobile Tap Mode Placement State
  const [selectedBuildingForPlacement, setSelectedBuildingForPlacement] = useState<any>(null);

  // Turn off delete mode when choosing a building to place
  useEffect(() => {
    if (selectedBuildingForPlacement) {
      setIsDeleteMode(false);
      isDeleteModeRef.current = false;
    }
  }, [selectedBuildingForPlacement]);

  // Tap-to-Relocate placement state
  const [movingBuilding, setMovingBuilding] = useState<any | null>(null);

  // Renaming state
  const [renamingBuilding, setRenamingBuilding] = useState<any | null>(null);

  const [dropX, setDropX] = useState<number | null>(null);
  const [dropY, setDropY] = useState<number | null>(null);

  const teamId = currentUser?.team_id;
  const isSuperAdmin = currentUser?.role === 'super_admin';
  const { refreshCount } = useRefresh();
  
  const placingRef = useRef(false);
  const [isPlacing, setIsPlacing] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const availablePointsRef = useRef<number>(0);
  
  const supabase = getSupabase();

  // Sync ref variables with active build and points states to bypass closures
  useEffect(() => {
    placingRef.current = !!selectedBuildingForPlacement;
    setIsPlacing(!!selectedBuildingForPlacement);
    availablePointsRef.current = teamPoints.available;
  }, [selectedBuildingForPlacement, teamPoints.available]);

  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const supabase = getSupabase();
      if (!supabase) throw new Error('Database connection failed');
      const schema = await detectMapBuildingsSchema();
      setDetectedSchema(schema);

      const { data: teamsRes } = await supabase.from('teams').select('*');
      setAllTeams(teamsRes || []);

      const [types, teamRes] = await Promise.all([
        fetchAllBuildingTypes(),
        teamId ? supabase.from('teams').select('*').eq('id', teamId).single() : Promise.resolve(null),
      ]);

      setBuildingTypes(types ?? []);
      if (teamId) {
        const points = await fetchTeamPoints(teamId);
        setTeamPoints(points);
      }
      
      if (teamRes?.data) setCurrentUserTeam(teamRes.data);

      await fetchBuildings();
    } catch (err: any) {
      toast.error(`❌ فشل تحميل البيانات: ${err.message}`);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [teamId]);

  useEffect(() => { loadData(); }, [loadData, refreshCount]);

  async function fetchBuildings() {
    console.log('[fetchBuildings] Starting fetch...')

    const { data, error } = await supabase
      .from('map_buildings')
      .select(`
        id,
        x,
        y,
        map_x,
        map_y,
        team_id,
        building_type_id,
        points_spent,
        placed_by,
        placed_at,
        name_override,
        building_types (
          id,
          name,
          name_en,
          icon,
          color,
          cost
        ),
        teams (
          id,
          name,
          color
        )
      `)
      .order('placed_at', { ascending: true })

    if (error) {
      console.error('[fetchBuildings] Error:', error)
      
      // Fallback
      const { data: plain, error: e2 } = await supabase
        .from('map_buildings')
        .select('id, x, y, map_x, map_y, team_id, building_type_id, points_spent, name_override')
        .order('placed_at', { ascending: true })
      
      if (e2) {
        console.error('[fetchBuildings] Fallback also failed:', e2)
        return
      }
      
      console.log('[fetchBuildings] Fallback data:', plain?.length, 'rows')
      const normalized = normalizeBuildingList(plain || []);
      setAllMapBuildings(normalized);
      if (teamId) {
        setMyBuildings(normalized.filter((b: any) => b.team_id === teamId));
      } else {
        setMyBuildings(normalized);
      }
      return
    }

    console.log('[fetchBuildings] Success:', data?.length, 'buildings')
    const normalized = normalizeBuildingList(data || []);
    setAllMapBuildings(normalized);
    if (teamId) {
      setMyBuildings(normalized.filter((b: any) => b.team_id === teamId));
    } else {
      setMyBuildings(normalized);
    }
  }

  const lastPlacementTime = useRef<number>(0);

  const checkPrerequisites = (type: any) => {
    if (type.prerequisites) {
      const prereqIds = type.prerequisites.split(',').map((s: string) => s.trim()).filter(Boolean);
      for (const pId of prereqIds) {
        const hasPrereq = myBuildings.some((b: any) => 
          b.building_type_id === pId || 
          b.building_type === pId || 
          b.building_type?.toLowerCase().includes(pId.toLowerCase())
        );
        if (!hasPrereq) {
          const reqType = buildingTypes.find((t: any) => t.id === pId || t.name === pId);
          const reqObj = reqType || { id: pId, name: 'مبنى متطلب مسبق', cost: 1, type: 'default', icon: '🧱' };
          setPrereqWarning({ target: type, missing: reqObj });
          return false;
        }
      }
    }
    return true;
  };

  // PLACEMENT HANDLING - high fidelity placement without DOM events dependencies
  const handlePlacementAt = useCallback(async (svgX: number, svgY: number) => {
    if (!selectedBuildingForPlacement) return;
    const buildingToPlace = selectedBuildingForPlacement;

    // Cooldown check — prevent double firing
    const now = Date.now();
    if (now - lastPlacementTime.current < 800) {
      console.log('[Placement] Cooldown active, ignoring');
      return;
    }
    lastPlacementTime.current = now;

    // Reset state instantly to avoid dual triggers
    setSelectedBuildingForPlacement(null);

    // Check prerequisites
    if (!checkPrerequisites(buildingToPlace)) {
        return;
    }

    // Minimum distance check
    const MIN_DISTANCE_SVG = 40;
    const tooClose = allMapBuildings.some(b => {
      const dist = Math.hypot(Number(b.x) - svgX, Number(b.y) - svgY);
      return dist < MIN_DISTANCE_SVG;
    });

    if (tooClose) {
      toast.error('هذا المكان قريب جداً من مبنى آخر — اختر مكاناً أبعد');
      return;
    }

    const currentPoints = teamPoints.available;
    if (currentPoints < buildingToPlace.cost) {
      toast.error('لا توجد نقاط كافية للبناء');
      return;
    }

    setActionLoading(true);
    try {
      const payload = buildInsertPayload({
        x: Math.round(svgX * 10) / 10,
        y: Math.round(svgY * 10) / 10,
        teamId: currentUser.team_id,
        buildingTypeId: buildingToPlace.id,
        placedBy: currentUser.id,
        cost: buildingToPlace.cost,
      });

      console.log('[Placement] Placing:', payload);

      const { data: inserted, error: insertError } = await supabase
        .from('map_buildings')
        .insert(payload)
        .select(`
          id, x, y, map_x, map_y, team_id, building_type_id, points_spent, name_override,
          building_types ( id, name, name_en, icon, color, cost ),
          teams ( id, name, color )
        `)
        .single();

      if (insertError || !inserted) {
        toast.error('فشل في وضع المبنى: ' + (insertError?.message || 'خطأ'));
        return;
      }

      const deductResult = await deductTeamPoints(currentUser.team_id, buildingToPlace.cost);
      if (!deductResult.success) {
        await supabase.from('map_buildings').delete().eq('id', inserted.id);
        toast.error('فشل في خصم النقاط — تم إلغاء البناء');
        return;
      }

      const optimistic = normalizeBuildingRow({
        ...inserted,
        teams: { color: currentUserTeam?.color || '#D4AF37', name: currentUserTeam?.name || 'فريق' },
      });

      setAllMapBuildings(prev => [...prev, optimistic]);
      if (currentUser.team_id) {
        setMyBuildings(prev => [...prev, optimistic]);
      }

      toast.success(`تم بناء ${buildingToPlace.name} ✅`);
      
      await logActivity({
        team_id: currentUser.team_id,
        user_id: currentUser.id,
        action_type: 'BUILD',
        amount: -Number(buildingToPlace.cost),
        description: `تم بناء ${buildingToPlace.name}`
      });

      setTimeout(async () => {
        await fetchAvailablePoints(currentUser.team_id);
        await loadData(true);
      }, 500);

    } catch (err) {
      console.error('[Placement] Unexpected error:', err);
      toast.error('حدث خطأ غير متوقع');
    } finally {
      setActionLoading(false);
    }
  }, [currentUser, currentUserTeam, teamPoints, allMapBuildings, selectedBuildingForPlacement, loadData]);

  const handleInitiateBuild = (type: any, x: number, y: number) => {
    if (!teamId) return toast.error('نافذة البناء غير متاحة');
    if (teamPoints.available < type.cost) return toast.error('ليس لديك أصول كافية');

    const myCount = myBuildings.filter(b => b.building_type_id === type.id).length;
    if (type.max_per_team && myCount >= type.max_per_team) return toast.error('الحد الأقصى مستوفى');

    // Check prerequisites scheme rules defined by Super Admin
    if (!checkPrerequisites(type)) return;

    if (type.required_building_id) {
       const hasRequired = myBuildings.some(b => b.building_type_id === type.required_building_id);
       if (!hasRequired) {
          const reqName = buildingTypes.find(t => t.id === type.required_building_id)?.name || 'مبنى سابق';
          return toast.error(`يجب بناء [${reqName}] أولاً`);
       }
    }

    setDropX(x); setDropY(y);
    setSelectedType(type);
    setShowModal(true);
  };

  const handleConfirmBuild = async (nameOverride: string) => {
    if (!selectedType || dropX === null || dropY === null || !teamId) return;
    setActionLoading(true);
    try {
      await placeBuilding({
        teamId,
        buildingTypeId: selectedType.id,
        mapX: dropX,
        mapY: dropY,
        nameOverride,
        placedBy: currentUser.id,
      });

      toast.success(`تم تشييد ${selectedType.name}!`);
      setShowModal(false); setSelectedType(null); setSelectedBuildingForPlacement(null);
      await loadData(true);
    } catch (err: any) { toast.error(err.message); }
    finally {
      setActionLoading(false);
    }
  };

  const handleBuildingDragStart = (e: React.DragEvent, building: any) => {
    if (!isSuperAdmin && building.team_id !== teamId) {
      e.preventDefault(); toast.error('غير مصرح بالتحريك'); return;
    }
    e.dataTransfer.setData('text/moving-building-id', building.id);
  };

  const handleDropOnMap = async (x: number, y: number, itemData: string, itemType?: string) => {
    if (itemType === 'application/x-building-type-id' || itemData.startsWith('id:')) {
      if (itemData.startsWith('id:')) {
        const buildingId = itemData.replace('id:', '');
        setActionLoading(true);
        try {
          await moveBuilding({
            buildingId, mapX: x, mapY: y,
            teamId: isSuperAdmin ? allMapBuildings.find(b => b.id === buildingId)?.team_id : teamId,
            userId: currentUser?.id,
          });
          toast.success('تم النقل بنجاح.');
          await loadData(true);
        } catch (err: any) { toast.error(err.message); }
        finally {
          setActionLoading(false);
        }
        return;
      }
      
      const catalogType = buildingTypes.find(t => t.id === itemData);
      if (catalogType) handleInitiateBuild(catalogType, x, y);
      return;
    }
  };

  const handleRemove = async (buildingOrId: any) => {
    setActionLoading(true);
    try {
      const b = typeof buildingOrId === 'string' 
        ? allMapBuildings.find(x => x.id === buildingOrId) || myBuildings.find(x => x.id === buildingOrId)
        : buildingOrId;

      if (!b) return toast.error('المبنى غير موجود');

      await removeBuilding(b.id, currentUser.team_id || b.team_id, currentUser.id, currentUser.role);
      toast.success('تم هدم المبنى بنجاح!');
      setActionMenu(null);
      await loadData(true);
      setIsDeleteMode(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRenameConfirm = async (newName: string) => {
    if (!renamingBuilding) return;
    try {
      await updateBuildingName({
        buildingId: renamingBuilding.id,
        name: newName,
      });
      toast.success('تم تعديل اسم المبنى بنجاح');
      setRenamingBuilding(null);
      await loadData(true);
    } catch (err: any) {
      toast.error(err.message || 'فشل تعديل الاسم');
    }
  };

  if (loading) return <LoadingOverlay isLoading={true} message="جاري تحميل الخريطة والأبنية والكتالوج..." />;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%', // let the Layout component's absolute top/bottom rules govern total height cleanly
      overflowY: 'auto',
      direction: 'rtl',
      fontFamily: 'Cairo, sans-serif',
      background: '#FDF6E3',
      cursor: isDeleteMode ? 'crosshair' : 'default',
      paddingBottom: 'env(safe-area-inset-bottom, 0px)', // iOS safe area padding
      boxSizing: 'border-box'
    }}>
      <style>{`
        @keyframes pulse-red {
          0%, 100% { box-shadow: 0 0 0 3px rgba(231,76,60,0.25); }
          50%       { box-shadow: 0 0 0 8px rgba(231,76,60,0.0); }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      
      <div style={{
        padding: '18px 20px',
        background: 'linear-gradient(135deg, #2C1810 0%, #1A0A00 100%)',
        borderBottom: '3px solid #D4AF37',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        flexShrink: 0,
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.35)'
      }} className="sm:flex-row sm:justify-between sm:items-center">
         <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
           <span style={{ fontSize: '24px', animation: 'spin 8s linear infinite', display: 'inline-block' }}>⚙️</span>
           <h1 style={{ fontFamily: "'Tajawal', sans-serif", fontSize: '20px', color: '#FFF8E7', margin: 0, fontWeight: '800', letterSpacing: '0.5px', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }} className="sm:text-2xl">ساحة البناء والتحصينات</h1>
         </div>
         <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            {currentUser?.role === 'super_admin' && (
                <button onClick={() => setShowDiagnostics(!showDiagnostics)} style={{ fontSize: 11, cursor: 'pointer', background: 'transparent', border: 'none', color: '#D4AF37', fontWeight: 'bold' }}>
                    {showDiagnostics ? '▲ إخفاء التشخيص' : '▼ تشخيص قاعدة البيانات'}
                </button>
            )}
            {teamId && (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  background: 'linear-gradient(180deg, #3E2723 0%, #1A0A00 100%)', 
                  border: '1.5px solid #D4AF37', 
                  padding: '8px 18px',
                  borderRadius: '24px',
                  fontFamily: 'Cairo, sans-serif',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.4)',
                  animation: 'pulse-gold 2s infinite'
                }}>
                  <style>{`
                    @keyframes pulse-gold {
                      0%, 100% { border-color: #D4AF37; box-shadow: 0 0 5px rgba(212, 175, 55, 0.3); }
                      50% { border-color: #FFDF00; box-shadow: 0 0 15px rgba(212, 175, 55, 0.7); }
                    }
                  `}</style>
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#FFF8E7', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    🏆 النقاط المتاحة: <strong style={{ color: '#00E676', fontSize: '16px', textShadow: '0 0 8px rgba(0,230,118,0.3)' }}>{teamPoints.available}</strong> ⭐
                  </span>
                </div>
            )}
         </div>
      </div>
      
      {showDiagnostics && detectedSchema && (
        <div style={{ padding: 10, background: '#eee', fontSize: 11, fontFamily: 'monospace', flexShrink: 0 }}>
            <div>X: {detectedSchema.xCol}, Y: {detectedSchema.yCol}, Type: {detectedSchema.typeCol}, Team: {detectedSchema.teamCol}</div>
        </div>
      )}

      {/* Elegant static notification bar that NEVER overlaps nor covers the map */}
      {movingBuilding && (
        <div style={{
          backgroundColor: '#FFF1D0',
          borderBottom: '2px solid #D4AF37',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          color: '#8B4513',
          direction: 'rtl',
          fontFamily: 'Cairo, sans-serif',
          flexShrink: 0,
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        }}>
          <span style={{ fontSize: '12px', fontWeight: 'bold' }}>
            📍 جاري نقل <strong style={{ color: '#8B4513' }}>{movingBuilding.name_override || movingBuilding.building_type?.name || 'مبنى'}</strong> - اضغط على الموقع الجديد بالخريطة لتحديده
          </span>
          <button 
            type="button"
            onClick={() => setMovingBuilding(null)}
            style={{
              backgroundColor: '#E74C3C',
              border: 'none',
              color: '#fff',
               borderRadius: '6px',
               padding: '4px 10px',
               fontSize: '11px',
               fontWeight: 'bold',
               cursor: 'pointer',
               fontFamily: 'Cairo'
            }}
          >
            إلغاء النقل
          </button>
        </div>
      )}

      {/* MAP AREA — stacked vertically with room for the bordered map frame */}
      <div 
        ref={mapContainerRef} 
        style={{ 
          width: '100%', 
          position: 'relative', 
          overflow: 'visible', 
          flexShrink: 0, 
          margin: '8px 0' 
        }} 
        className="z-0 h-[344px] md:h-[570px] min-h-[344px]"
      >
        <MapFullscreenWrapper>
          <InteractiveTribesSvgMap
            teams={allTeams}
            buildings={isSuperAdmin ? allMapBuildings : myBuildings}
            onDropBuilding={handleDropOnMap}
            isDeleteMode={isDeleteMode}
            onBuildingClick={(b, pos) => {
                if (isDeleteModeRef.current) {
                  handleRemove(b);
                } else {
                  setActionMenu({ building: b, pos: pos || { x: window.innerWidth/2, y: window.innerHeight/2 } });
                }
            }}
            onBuildingLongPress={(b, pos) => setActionMenu({ building: b, pos })}
            onBuildingRightClick={(b, pos) => setActionMenu({ building: b, pos })}
            onBuildingDragStart={handleBuildingDragStart}
            selectedBuildingForPlacement={selectedBuildingForPlacement}
            onCancelMobilePlacement={() => setSelectedBuildingForPlacement(null)}
            onMapClick={async (x, y) => {
              if (movingBuilding) {
                setActionLoading(true);
                try {
                  await moveBuilding({
                    buildingId: movingBuilding.id,
                    mapX: Math.round(x * 10) / 10,
                    mapY: Math.round(y * 10) / 10,
                    teamId: isSuperAdmin ? movingBuilding.team_id : teamId,
                    userId: currentUser?.id,
                  });
                  toast.success('تم نقل المبنى بنجاح');
                  setMovingBuilding(null);
                  await loadData(true);
                } catch (err: any) {
                  toast.error(err.message || 'فشل نقل المبنى');
                } finally {
                  setActionLoading(false);
                }
              } else if (selectedBuildingForPlacement) {
                handlePlacementAt(x, y);
              }
            }}
          />
        </MapFullscreenWrapper>
      </div>

      <div style={{ flexShrink: 0 }}>
        <BuildingCatalogStrip 
           buildingTypes={buildingTypes} 
           myBuildings={myBuildings} 
           teamPointsAvailable={teamPoints.available}
           onSelectForPlacement={setSelectedBuildingForPlacement}
           onCheckPrerequisites={checkPrerequisites}
           selectedBuildingTypeId={selectedBuildingForPlacement?.id}
           teamColor={currentUserTeam?.color}
        />
      </div>

      <AnimatePresence>
        {actionLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(3px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 999999,
              gap: '16px'
            }}
          >
            <div style={{
              width: '50px',
              height: '50px',
              border: '4px solid #F3F3F3',
              borderTop: '4px solid #D4AF37',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <span style={{
              fontFamily: 'Cairo, sans-serif',
              color: '#fff',
              fontSize: '16px',
              fontWeight: 'bold',
              textShadow: '0 2px 4px rgba(0,0,0,0.5)'
            }}>
              جاري تنفيذ العملية... يرجى الانتظار
            </span>
          </motion.div>
        )}
        {showModal && selectedType && (
          <BuildConfirmModal
            type={selectedType}
            onClose={() => setShowModal(false)}
            onConfirm={handleConfirmBuild}
          />
        )}
        {actionMenu && (
            <BuildingActionMenu 
                building={actionMenu.building}
                position={actionMenu.pos}
                currentUser={currentUser}
                onClose={() => setActionMenu(null)}
                onDelete={handleRemove}
                onMove={(b) => setMovingBuilding(b)}
                onRename={(b) => setRenamingBuilding(b)}
            />
        )}
        {renamingBuilding && (
          <RenameBuildingModal
            building={renamingBuilding}
            onClose={() => setRenamingBuilding(null)}
            onConfirm={handleRenameConfirm}
          />
        )}
        {prereqWarning && (
          <PrerequisiteWarningModal
            onClose={() => setPrereqWarning(null)}
            targetBuilding={prereqWarning.target}
            missingPrereq={prereqWarning.missing}
            teamColor={currentUserTeam?.color}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function BuildConfirmModal({ type, onClose, onConfirm }: any) {
  const [name, setName] = useState('');
  const content = (
    <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose} />
      <motion.div initial={{ scale: 0.9, y: 10, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, y: 10, opacity: 0 }}
        style={{ position: 'relative', backgroundColor: '#FFFDF5', padding: '24px', borderRadius: '12px', width: '100%', maxWidth: '320px', textAlign: 'center', direction: 'rtl', border: '2px solid #D4AF37' }}>
        <div style={{ fontSize: '48px', marginBottom: '8px' }}>{type.icon}</div>
        <h3 style={{ margin: '0 0 16px', color: '#8B4513', fontFamily: 'Cairo' }}>تأكيد بناء {type.name}</h3>
        <input 
           placeholder="اسم اختياري" value={name} onChange={(e) => setName(e.target.value)} 
           style={{ width: '100%', padding: '10px', marginBottom: '16px', border: '1px solid #D4AF37', borderRadius: '4px', fontSize: '16px', fontFamily: 'Cairo' }} 
        />
        <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }} className="sm:flex-row">
          <button onClick={() => onConfirm(name)} style={{ flex: 1, padding: '12px 8px', border: 'none', backgroundColor: '#D4AF37', color: '#fff', borderRadius: '8px', fontWeight: 'bold', fontFamily: 'Cairo', cursor: 'pointer' }}>✓ تأكيد ({type.cost} ن.)</button>
          <button onClick={onClose} style={{ flex: 1, padding: '12px 8px', border: '1px solid #D4AF37', backgroundColor: '#fff', borderRadius: '8px', fontFamily: 'Cairo', cursor: 'pointer' }}>✕ إلغاء</button>
        </div>
      </motion.div>
    </div>
  );
  return createPortal(content, document.body);
}

function RenameBuildingModal({ building, onClose, onConfirm }: any) {
  const [name, setName] = useState(building.name_override || '');
  const content = (
    <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose} />
      <motion.div initial={{ scale: 0.9, y: 10, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, y: 10, opacity: 0 }}
        style={{ position: 'relative', backgroundColor: '#FFFDF5', padding: '24px', borderRadius: '12px', width: '100%', maxWidth: '320px', textAlign: 'center', direction: 'rtl', border: '2px solid #D4AF37', fontFamily: 'Cairo' }}>
        <h3 style={{ margin: '0 0 16px', color: '#8B4513' }}>تعديل اسم {(building.building_type && typeof building.building_type === 'object' ? building.building_type.name : building.building_type) || 'المبنى'}</h3>
        <input 
           placeholder="اسم المبنى الجديد" value={name} onChange={(e) => setName(e.target.value)} 
           style={{ width: '100%', padding: '10px', marginBottom: '16px', border: '1px solid #D4AF37', borderRadius: '8px', fontSize: '16px', fontFamily: 'Cairo' }} 
        />
        <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }} className="sm:flex-row">
          <button onClick={() => onConfirm(name)} style={{ flex: 1, padding: '12px 8px', border: 'none', backgroundColor: '#D4AF37', color: '#fff', borderRadius: '8px', fontWeight: 'bold', fontFamily: 'Cairo', cursor: 'pointer' }}>✓ حفظ الاسم</button>
          <button onClick={onClose} style={{ flex: 1, padding: '12px 8px', border: '1px solid #D4AF37', backgroundColor: '#fff', borderRadius: '8px', fontFamily: 'Cairo', cursor: 'pointer' }}>✕ إلغاء</button>
        </div>
      </motion.div>
    </div>
  );
  return createPortal(content, document.body);
}
