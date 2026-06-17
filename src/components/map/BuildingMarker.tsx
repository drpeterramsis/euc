import React from 'react';
import { hexToRgba } from '../../utils/colorUtils';

interface BuildingMarkerProps {
  key?: React.Key;
  building: any;
  scale: number;
  isSelected?: boolean;
  onClick: (building: any, e: React.MouseEvent) => void;
  onDragStart?: (e: React.DragEvent, building: any) => void;
}

export default function BuildingMarker({ building, scale, isSelected, onClick, onDragStart }: BuildingMarkerProps) {
  const bt = building.building_type;
  const team = building.team;

  if (!bt) return null;

  // Assuming grid sizes are passed or defaulted
  // In the real DB it might not be present, so defaulting to 2
  const gridX = bt.gridX || 2;
  const gridY = bt.gridY || 2;
  
  const width = gridX * 28;
  const height = gridY * 28;
  const rx = 8;
  
  const markerScale = 1 / scale;

  return (
    <g
      transform={`translate(${building.map_x}, ${building.map_y}) scale(${markerScale})`}
      onClick={(e) => onClick(building, e)}
      style={{ cursor: 'pointer' }}
      draggable={!!onDragStart}
      onDragStart={(e: any) => onDragStart && onDragStart(e, building)}
      className="building-marker-group"
    >
      {/* Drop shadow filter definition could be in the main SVG, but inline drop-shadow via CSS is easier */}
      <rect
        x={-width / 2}
        y={-height / 2}
        width={width}
        height={height}
        rx={rx}
        fill={hexToRgba(bt.color || '#8B4513', 0.92)}
        style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.4))' }}
        stroke={isSelected ? '#fff' : 'transparent'}
        strokeWidth={2}
      />
      
      {/* Large Emoji */}
      <text
        x={0}
        y={4}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={Math.max(18, Math.min(width, height) * 0.5)}
      >
        {bt.icon}
      </text>

      {/* Building name */}
      <text
        x={0}
        y={height / 2 + 12}
        textAnchor="middle"
        fontSize={10}
        fill="#2C1810"
        fontWeight="bold"
        style={{ textShadow: '0px 1px 2px rgba(255,255,255,0.8)' }}
      >
        {building.name_override || bt.name}
      </text>

      {/* Points badge top right */}
      <g transform={`translate(${width / 2}, ${-height / 2})`}>
        <rect x={-20} y={-10} width={20} height={14} rx={3} fill="#2C1810" />
        <text x={-10} y={-3} textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize={9} fontWeight="bold">
          {building.points_spent ?? bt.cost}
        </text>
      </g>

      {/* Team color dot bottom right */}
      {team && (
        <circle
          cx={width / 2 - 4}
          cy={height / 2 - 4}
          r={6}
          fill={team.color || '#D4AF37'}
          stroke="#fff"
          strokeWidth={1.5}
        />
      )}
    </g>
  );
}
