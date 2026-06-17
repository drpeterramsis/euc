import React from 'react';
import { hexToRgba } from '../../utils/colorUtils';
import ExclusionZoneOverlay from './ExclusionZoneOverlay';

interface PlacementGhostProps {
  x: number;
  y: number;
  buildingType: any;
  scale: number;
}

export default function PlacementGhost({ x, y, buildingType, scale }: PlacementGhostProps) {
  if (!buildingType) return null;

  const gridX = buildingType.gridX || 2;
  const gridY = buildingType.gridY || 2;
  const width = gridX * 28;
  const height = gridY * 28;
  const rx = 8;
  const markerScale = 1 / scale;

  return (
    <g style={{ pointerEvents: 'none', opacity: 0.7 }}>
      <ExclusionZoneOverlay
        x={x}
        y={y}
        radius={buildingType.exclusion_radius || 100}
        color={buildingType.color || '#fff'}
        isVisible={true}
      />
      <g transform={`translate(${x}, ${y}) scale(${markerScale})`}>
        <rect
          x={-width / 2}
          y={-height / 2}
          width={width}
          height={height}
          rx={rx}
          fill={hexToRgba(buildingType.color || '#8B4513', 0.6)}
          stroke="#fff"
          strokeWidth={2}
          strokeDasharray="4,4"
        />
        <text
          x={0}
          y={4}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={Math.max(18, Math.min(width, height) * 0.5)}
        >
          {buildingType.icon}
        </text>
      </g>
    </g>
  );
}
