import React, { useRef, useEffect, useState } from 'react';
import { TRIBE_REGIONS_SVG } from '../../data/tribesMapMeta';
import { drawBuilding, normalizeBuildingType } from '../../utils/buildingRenderer';

interface InteractiveMapProps {
  teams: any[];
  buildings?: any[];
  onSelectTribe?: (regionId: string) => void;
  highlightedTribeId?: string | null;
  restrictToTribeRegionId?: string | null;
  onBuildingClick?: (building: any, pos?: { x: number; y: number }) => void;
  onBuildingLongPress?: (building: any, pos: { x: number; y: number }) => void;
  onBuildingRightClick?: (building: any, pos: { x: number; y: number }) => void;
  selectedBuildingForPlacement?: any;
  onDropBuilding?: (x: number, y: number, data: string, type?: string) => void;
  onBuildingDragStart?: (e: React.DragEvent, b: any) => void;
  onCancelMobilePlacement?: () => void;
  onMapClick?: (x: number, y: number) => void;
  isDeleteMode?: boolean;
}

// Fixed dimensions exactly as requested by the user
const MAP_SIZE = 550;
const V_WIDTH = 1024;
const V_HEIGHT = 1536;

function parsePointsString(pointsStr: string): Array<{ x: number; y: number }> {
  if (!pointsStr) return [];
  return pointsStr.trim().split(/\s+/).map(pair => {
    const [x, y] = pair.split(',').map(Number);
    return { x: isNaN(x) ? 0 : x, y: isNaN(y) ? 0 : y };
  });
}

function isPointInPoly(pt: { x: number; y: number }, vs: Array<{ x: number; y: number }>) {
  const x = pt.x, y = pt.y;
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i].x, yi = vs[i].y;
    const xj = vs[j].x, yj = vs[j].y;
    const intersect = ((yi > y) !== (yj > y))
        && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

export default function InteractiveTribesSvgMap({
  teams,
  buildings = [],
  onSelectTribe,
  highlightedTribeId,
  restrictToTribeRegionId,
  onBuildingClick,
  onBuildingLongPress: _onBuildingLongPress,
  onBuildingRightClick: _onBuildingRightClick,
  selectedBuildingForPlacement,
  onDropBuilding,
  onBuildingDragStart: _onBuildingDragStart,
  onCancelMobilePlacement,
  onMapClick,
  isDeleteMode = false,
}: InteractiveMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoverPos, setHoverPos] = useState<{ px: number; py: number } | null>(null);

  // Render Layer 1: The plain lush valley ground layer with regions
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reset size to exactly 550x550 for crisp pixel output
    canvas.width = MAP_SIZE;
    canvas.height = MAP_SIZE;

    ctx.clearRect(0, 0, MAP_SIZE, MAP_SIZE);

    // 1. Draw sun-baked dry clay/sand gradient typical of ancient Canaan
    const grad = ctx.createLinearGradient(0, 0, MAP_SIZE, MAP_SIZE);
    grad.addColorStop(0, '#D4C3A3'); // Warm dry clay
    grad.addColorStop(0.5, '#E6DCC3'); // Sandy gold sunlit terrain
    grad.addColorStop(1, '#B9A88C'); // Deep ancient dust
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, MAP_SIZE, MAP_SIZE);

    // 2. ONLY draw Tribe boundaries if there are NO buildings (meaning we are on the Tribes Directory tab)
    const showMapRegions = !buildings || buildings.length === 0;

    if (showMapRegions) {
      TRIBE_REGIONS_SVG.forEach(region => {
        const polyPoints = parsePointsString(region.points);
        if (polyPoints.length < 3) return;

        // Parse team info
        const teamInfo = teams.find(
          t => t.map_region?.toLowerCase() === region.id.toLowerCase() || t.name === region.nameAr
        );

        ctx.beginPath();
        polyPoints.forEach((pt, idx) => {
          const px = (pt.x / V_WIDTH) * MAP_SIZE;
          const py = (pt.y / V_HEIGHT) * MAP_SIZE;
          if (idx === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.closePath();

        // Highlighting logic
        const isHighlighted = highlightedTribeId === region.id;
        const isRestricted = restrictToTribeRegionId && restrictToTribeRegionId !== region.id;

        // Fill color
        let fill = teamInfo ? (teamInfo.color || region.color) : 'transparent';
        if (fill !== 'transparent') {
          ctx.save();
          ctx.fillStyle = fill;
          ctx.globalAlpha = isHighlighted ? 0.45 : isRestricted ? 0.08 : 0.25;
          ctx.fill();
          ctx.restore();
        }

        // Draw boundary strokes
        ctx.save();
        ctx.strokeStyle = teamInfo ? (teamInfo.color || '#D4AF37') : '#D4AF37';
        ctx.lineWidth = isHighlighted ? 2.5 : 1.2;
        ctx.globalAlpha = isHighlighted ? 0.8 : 0.4;
        ctx.stroke();
        ctx.restore();

        // Draw Arabic Tribe name at its center mapping
        const lblX = (region.labelX / V_WIDTH) * MAP_SIZE;
        const lblY = (region.labelY / V_HEIGHT) * MAP_SIZE;
        ctx.save();
        ctx.font = 'bold 9px Cairo, sans-serif';
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(region.nameAr, lblX, lblY);
        ctx.restore();
      });
    }

    // 3. Draw connecting pathways/waters/farming-plots for buildings that "complete each other"
    if (buildings && buildings.length > 0) {
      for (let i = 0; i < buildings.length; i++) {
        const b1 = buildings[i];
        const type1 = normalizeBuildingType(b1.building_type && typeof b1.building_type === 'object' ? b1.building_type.name : b1.building_type);
        
        // We only care about road, stone_road, farm, water
        if (type1 !== 'road' && type1 !== 'stone_road' && type1 !== 'farm' && type1 !== 'water') {
          continue;
        }

        const x1 = Number(b1.x);
        const y1 = Number(b1.y);
        if (isNaN(x1) || isNaN(y1)) continue;

        const cx1 = (x1 / V_WIDTH) * MAP_SIZE;
        const cy1 = (y1 / V_HEIGHT) * MAP_SIZE;

        // Compare with other buildings to find neighbors of the same type
        for (let j = i + 1; j < buildings.length; j++) {
          const b2 = buildings[j];
          const type2 = normalizeBuildingType(b2.building_type && typeof b2.building_type === 'object' ? b2.building_type.name : b2.building_type);
          
          if (type1 !== type2) continue; // Same normalized category to connect

          const x2 = Number(b2.x);
          const y2 = Number(b2.y);
          if (isNaN(x2) || isNaN(y2)) continue;

          const dx = x1 - x2;
          const dy = y1 - y2;
          const dist = Math.sqrt(dx * dx + dy * dy);

          // Connect if they are within proximity (approx. 240 virtual coordinate units, i.e., close neighbors on map grid)
          if (dist < 240) {
            // Avoid diagonal connections showing weird extra segments: only connect if close to horizontal or vertical alignment
            const isAligned = Math.abs(dx) < 45 || Math.abs(dy) < 45;
            if (!isAligned) continue;

            const cx2 = (x2 / V_WIDTH) * MAP_SIZE;
            const cy2 = (y2 / V_HEIGHT) * MAP_SIZE;

            ctx.save();
            ctx.shadowColor = 'transparent';

            if (type1 === 'road') {
              // Soft sandy county road connector
              ctx.strokeStyle = '#bfab80';
              ctx.lineWidth = 14;
              ctx.lineCap = 'round';
              ctx.beginPath();
              ctx.moveTo(cx1, cy1);
              ctx.lineTo(cx2, cy2);
              ctx.stroke();

              // Inner dark dust wear line
              ctx.strokeStyle = '#a69265';
              ctx.lineWidth = 8;
              ctx.stroke();
            } 
            else if (type1 === 'stone_road') {
              // Interlocking slate block road connector
              ctx.strokeStyle = '#546e7a';
              ctx.lineWidth = 18;
              ctx.lineCap = 'round';
              ctx.beginPath();
              ctx.moveTo(cx1, cy1);
              ctx.lineTo(cx2, cy2);
              ctx.stroke();

              ctx.strokeStyle = '#cfd8dc';
              ctx.lineWidth = 12;
              ctx.setLineDash([4, 6]);
              ctx.stroke();
            } 
            else if (type1 === 'farm') {
              // Rich brown ploughed garden soil connector
              ctx.strokeStyle = '#3e2723';
              ctx.lineWidth = 26;
              ctx.lineCap = 'round';
              ctx.beginPath();
              ctx.moveTo(cx1, cy1);
              ctx.lineTo(cx2, cy2);
              ctx.stroke();

              // Sprout tiny crop leaves along the merged farmland patch
              ctx.fillStyle = '#4caf50';
              for (let p = 0.25; p <= 0.75; p += 0.25) {
                const px = cx1 + (cx2 - cx1) * p;
                const py = cy1 + (cy2 - cy1) * p;
                ctx.beginPath();
                ctx.arc(px, py - 2, 2.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#81c784';
                ctx.beginPath();
                ctx.arc(px, py - 4, 1.8, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#4caf50';
              }
            } 
            else if (type1 === 'water') {
              // Deep blue river stream connectors
              ctx.strokeStyle = '#01579b';
              ctx.lineWidth = 22;
              ctx.lineCap = 'round';
              ctx.beginPath();
              ctx.moveTo(cx1, cy1);
              ctx.lineTo(cx2, cy2);
              ctx.stroke();

              // Wave highlights
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
              ctx.lineWidth = 3;
              ctx.setLineDash([6, 12]);
              ctx.stroke();
            }

            ctx.restore();
          }
        }
      }
    }

  }, [teams, highlightedTribeId, restrictToTribeRegionId, buildings]);

  // Click & tap mapping handlers for empty ground clicks
  const processClickAt = (clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = Math.max(0, Math.min(MAP_SIZE, ((clientX - rect.left) / rect.width) * MAP_SIZE));
    const py = Math.max(0, Math.min(MAP_SIZE, ((clientY - rect.top) / rect.height) * MAP_SIZE));

    // Convert to virtual DB coordinate space (1024 x 1536)
    const dbX = (px / MAP_SIZE) * V_WIDTH;
    const dbY = (py / MAP_SIZE) * V_HEIGHT;

    // 1. If on Tribes Page, select matching region
    const showMapRegions = !buildings || buildings.length === 0;
    if (showMapRegions && onSelectTribe) {
      for (const region of TRIBE_REGIONS_SVG) {
        const poly = parsePointsString(region.points);
        if (isPointInPoly({ x: dbX, y: dbY }, poly)) {
          if (!restrictToTribeRegionId || restrictToTribeRegionId === region.id) {
            onSelectTribe(region.id);
            return;
          }
        }
      }
    }

    // 2. Otherwise invoke map click to place or move building
    if (onMapClick) {
      onMapClick(dbX, dbY);
    }
  };

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    processClickAt(e.clientX, e.clientY);
  };

  const lastTouchTime = useRef(0);
  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    const now = Date.now();
    if (now - lastTouchTime.current < 400) return; // avoid dual click bubble trigger
    lastTouchTime.current = now;

    const touch = e.changedTouches[0];
    if (touch) {
      processClickAt(touch.clientX, touch.clientY);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = ((e.clientX - rect.left) / rect.width) * MAP_SIZE;
    const py = ((e.clientY - rect.top) / rect.height) * MAP_SIZE;
    setHoverPos({ px, py });
  };

  const handleMouseLeave = () => {
    setHoverPos(null);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container || !onDropBuilding) return;
    const rect = container.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * MAP_SIZE;
    const py = ((e.clientY - rect.top) / rect.height) * MAP_SIZE;

    const dbX = (px / MAP_SIZE) * V_WIDTH;
    const dbY = (py / MAP_SIZE) * V_HEIGHT;

    const buildingTypeId = e.dataTransfer.getData('application/x-building-type-id');
    const movingId = e.dataTransfer.getData('text/moving-building-id');
    const plainText = e.dataTransfer.getData('text/plain');

    if (buildingTypeId) {
      onDropBuilding(dbX, dbY, buildingTypeId, 'application/x-building-type-id');
    } else if (movingId) {
      onDropBuilding(dbX, dbY, movingId, 'text/moving-building-id');
    } else {
      onDropBuilding(dbX, dbY, plainText, 'text/plain');
    }
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        maxWidth: `${MAP_SIZE}px`,
        maxHeight: `${MAP_SIZE}px`,
        aspectRatio: '1/1',
        margin: '10px auto',
        overflow: 'hidden',
        touchAction: 'none',
        backgroundColor: 'transparent',
        borderRadius: '16px',
        border: '6px solid #1a0a00',
        boxShadow: '0 8px 32px rgba(26, 10, 0, 0.44)',
        cursor: selectedBuildingForPlacement ? 'crosshair' : 'default',
        direction: 'rtl',
        boxSizing: 'border-box',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
      onClick={handleContainerClick}
      onTouchEnd={handleTouchEnd}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {/* LAYER 1: Custom canvas for Ground */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          pointerEvents: 'none',
          display: 'block',
        }}
      />

      {/* LAYER 2: Placed interactive buildings layer */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      >
        {buildings.map(b => {
          const svgX = Number(b.x);
          const svgY = Number(b.y);
          if (isNaN(svgX) || isNaN(svgY)) return null;

          // Convert virtual database coords to percentages for perfect responsive styling
          const pctX = (svgX / V_WIDTH) * 100;
          const pctY = (svgY / V_HEIGHT) * 100;

          return (
            <div
              key={b.id}
              onClick={(e) => {
                e.stopPropagation();
                if (onBuildingClick) {
                  onBuildingClick(b, { x: e.clientX, y: e.clientY });
                }
              }}
              style={{
                position: 'absolute',
                left: `${pctX}%`,
                top: `${pctY}%`,
                width: '44px',
                height: '44px',
                transform: 'translate(-50%, -50%)',
                cursor: 'pointer',
                pointerEvents: 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              className="group"
            >
              <BuildingMiniCanvas building={b} />

              {/* Red overlay indicators if delete mode is on */}
              <div
                style={{
                  position: 'absolute',
                  inset: -4,
                  border: isDeleteMode ? '2px dashed #E74C3C' : 'none',
                  backgroundColor: isDeleteMode ? 'rgba(231, 76, 60, 0.2)' : 'transparent',
                  pointerEvents: 'none',
                }}
              />

              {/* Floating Cairo Font Tooltip for name */}
              <div
                style={{
                  direction: 'rtl',
                  fontFamily: 'Cairo, sans-serif',
                }}
                className="absolute bottom-[-16px] opacity-0 group-hover:opacity-100 bg-[#1a0a00]/92 text-[#D4AF37] border border-[#D4AF37]/50 text-[10px] font-bold px-1.5 py-0.5 rounded shadow transition-all scale-95 group-hover:scale-100 whitespace-nowrap z-50 pointer-events-none"
              >
                {b.name_override || (b.building_type && typeof b.building_type === 'object' ? (b.building_type as any).name : b.building_type) || 'مبنى'}
              </div>
            </div>
          );
        })}

        {/* Placing Building Hover preview style */}
        {selectedBuildingForPlacement && hoverPos && (
          <div
            style={{
              position: 'absolute',
              left: `${(hoverPos.px / MAP_SIZE) * 100}%`,
              top: `${(hoverPos.py / MAP_SIZE) * 100}%`,
              width: '44px',
              height: '44px',
              transform: 'translate(-50%, -50%)',
              opacity: 0.7,
              pointerEvents: 'none',
              zIndex: 100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <BuildingMiniCanvas
              building={{
                building_type: selectedBuildingForPlacement.name,
                team_color: '#49c47a',
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: -2,
                border: '1.5px dashed #49c47a',
                backgroundColor: 'rgba(73, 196, 122, 0.1)',
              }}
            />
          </div>
        )}
      </div>

      {/* Modern, non-obtrusive, elegant placement bar overlay at the top */}
      {selectedBuildingForPlacement && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: 4,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10,
            background: 'rgba(26,10,0,0.92)',
            border: '1px solid #D4AF37',
            borderRadius: 14,
            padding: '4px 10px',
            color: '#D4AF37',
            fontSize: 10,
            fontFamily: 'Cairo, sans-serif',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}
        >
          <span>انقر لوضع {selectedBuildingForPlacement.name}</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onCancelMobilePlacement) onCancelMobilePlacement();
            }}
            style={{
              background: '#E74C3C',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '1px 6px',
              fontSize: '9px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            إلغاء
          </button>
        </div>
      )}
    </div>
  );
}

function BuildingMiniCanvas({ building }: { building: any }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const type = (building.building_type && typeof building.building_type === 'object' ? building.building_type.name : building.building_type) || 'default';

  const getObjColor = (obj: any) => {
    if (!obj) return null;
    if (Array.isArray(obj) && obj.length > 0) return obj[0]?.color || obj[0]?.team_color || null;
    if (typeof obj === 'object') return obj.color || obj.team_color || null;
    return null;
  };
  const color = building.team_color || getObjColor(building.team) || getObjColor(building.teams) || '#D4AF37';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      ctx.clearRect(0, 0, 44, 44);
      const time = Date.now();
      // Draw building of 44 width centered at (22, 22)
      drawBuilding(ctx, type, 22, 22, 44, color, undefined, time);
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [type, color]);

  return (
    <canvas
      ref={canvasRef}
      width={44}
      height={44}
      style={{
        width: '44px',
        height: '44px',
        pointerEvents: 'none',
      }}
    />
  );
}
