import React from 'react';
import { hexToRgba } from '../../utils/colorUtils';

interface ExclusionZoneOverlayProps {
  key?: React.Key;
  x: number;
  y: number;
  radius: number;
  color: string;
  isVisible: boolean;
}

export default function ExclusionZoneOverlay({ x, y, radius, color, isVisible }: ExclusionZoneOverlayProps) {
  if (!isVisible) return null;

  return (
    <circle
      cx={x}
      cy={y}
      r={radius}
      fill="none"
      stroke={hexToRgba(color, 0.5)}
      strokeWidth={2}
      strokeDasharray="6,4"
      className="exclusion-zone"
      style={{ pointerEvents: 'none' }}
    />
  );
}
