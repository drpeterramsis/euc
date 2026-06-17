import React, { useRef, useEffect } from 'react';

interface MapGroundCanvasProps {
  width: number;
  height: number;
}

export default function MapGroundCanvas({ width, height }: MapGroundCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  function seededRand(seed: number) {
    let s = seed;
    return () => {
      s = (s * 16807 + 0) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;

    const rand = seededRand(104);

    // 1. Base Layer: Sun-baked ancient dry Canaan earth (Parchment/Sand/Clay gradient)
    const baseGrad = ctx.createLinearGradient(0, 0, width, height);
    baseGrad.addColorStop(0, '#D4C3A3');   // Warm dry clay
    baseGrad.addColorStop(0.3, '#E6DCC3'); // Sandy gold sunlit terrain
    baseGrad.addColorStop(0.7, '#CBBBA0'); // Shaded silt valley
    baseGrad.addColorStop(1, '#B9A88C');   // Deep ancient dust mud
    ctx.fillStyle = baseGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Barren Desert Sand Dunes & Soft Ripples - Shifting wind mounds
    for (let i = 0; i < 45; i++) {
      const x = rand() * width;
      const y = rand() * height;
      const rx = 40 + rand() * 90;
      const ry = 15 + rand() * 35;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(((rand() - 0.5) * 35) * Math.PI / 180);

      // Radial sand-drift depth
      const moundGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
      moundGrad.addColorStop(0, 'rgba(219, 199, 169, 0.4)');
      moundGrad.addColorStop(0.5, 'rgba(197, 175, 145, 0.2)');
      moundGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = moundGrad;
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 3. Dry stone gravel clusters scattered across the empty terrain instead of tilled green fields
    for (let i = 0; i < 18; i++) {
      const cx = rand() * width;
      const cy = rand() * height;
      const count = 3 + Math.floor(rand() * 4);

      ctx.save();
      ctx.translate(cx, cy);
      ctx.fillStyle = '#A89984';
      ctx.strokeStyle = '#7C6F5E';
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.7;

      for (let j = 0; j < count; j++) {
        const ox = (rand() - 0.5) * 25;
        const oy = (rand() - 0.5) * 15;
        const radius = 3 + rand() * 5;

        ctx.beginPath();
        ctx.arc(ox, oy, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    }

    // 4. Barren Winding Trade Trail (Connecting regions - ancient dirt trail of Canaan)
    ctx.save();
    ctx.strokeStyle = '#A38B6B'; // Antique light-brown clay road
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = 0.7;

    // Soft shadow under path
    ctx.shadowColor = 'rgba(40, 30, 20, 0.15)';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(width * 0.1, 0);
    ctx.bezierCurveTo(width * 0.25, height * 0.2, width * 0.45, height * 0.15, width * 0.5, height * 0.35);
    ctx.bezierCurveTo(width * 0.55, height * 0.55, width * 0.35, height * 0.65, width * 0.45, height * 0.8);
    ctx.bezierCurveTo(width * 0.55, height * 0.95, width * 0.85, height * 0.9, width, height * 0.95);
    ctx.stroke();

    // Core light dust trail
    ctx.strokeStyle = '#DCCFB0';
    ctx.lineWidth = 9;
    ctx.stroke();
    ctx.restore();

    // 5. Canaan sun-baked dry rock boulders on coordinates & borders instead of green forest trees
    const drawDesertRock = (rx: number, ry: number, rsize: number) => {
      ctx.save();
      ctx.translate(rx, ry);

      // Cast shadow
      ctx.fillStyle = 'rgba(56, 45, 34, 0.35)';
      ctx.beginPath();
      ctx.ellipse(0, rsize * 0.3, rsize * 0.45, rsize * 0.15, 0, 0, Math.PI * 2);
      ctx.fill();

      // Rock facets - distinct geometric stones of Canaan
      ctx.fillStyle = '#8C7C66'; // Dark side
      ctx.beginPath();
      ctx.moveTo(-rsize * 0.5, 0);
      ctx.lineTo(-rsize * 0.3, -rsize * 0.4);
      ctx.lineTo(0, -rsize * 0.5);
      ctx.lineTo(rsize * 0.4, 0);
      ctx.lineTo(rsize * 0.2, rsize * 0.2);
      ctx.lineTo(-rsize * 0.2, rsize * 0.25);
      ctx.closePath();
      ctx.fill();

      // Light highlight side
      ctx.fillStyle = '#DFD6C3'; // Pale warm sunlit sandstone face
      ctx.beginPath();
      ctx.moveTo(0, -rsize * 0.5);
      ctx.lineTo(rsize * 0.4, 0);
      ctx.lineTo(0, rsize * 0.1);
      ctx.lineTo(-rsize * 0.3, -rsize * 0.4);
      ctx.closePath();
      ctx.fill();

      // Structural crack lines
      ctx.strokeStyle = '#5E513F';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, -rsize * 0.5);
      ctx.lineTo(0, rsize * 0.1);
      ctx.stroke();

      ctx.restore();
    };

    // Draw heavy rocky formations on top border
    for (let x = 0; x < width + 60; x += 75) {
      const offset = (rand() - 0.5) * 16;
      drawDesertRock(x, 20 + offset, 24 + rand() * 16);
    }

    // Draw heavy rocks on left border
    for (let y = 50; y < height; y += 90) {
      const offset = (rand() - 0.5) * 12;
      drawDesertRock(20 + offset, y, 22 + rand() * 14);
    }

    // Draw heavy rocks on right border
    for (let y = 50; y < height; y += 90) {
      const offset = (rand() - 0.5) * 12;
      drawDesertRock(width - 20 + offset, y, 22 + rand() * 14);
    }

    // 6. Subtle Game Orthogonal Grid lines (ancient survey coordinates mapping)
    ctx.save();
    ctx.strokeStyle = 'rgba(139, 90, 43, 0.05)';
    ctx.lineWidth = 1.0;
    for (let x = 0; x < width; x += 55) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 0; y < height; y += 55) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }
    ctx.restore();

    // 7. Saturated Game Vignette - Sandstorm dust tone over borders for epic biblical ambience
    const vignette = ctx.createRadialGradient(width / 2, height / 2, width * 0.2, width / 2, height / 2, width * 0.75);
    vignette.addColorStop(0, 'rgba(139, 115, 85, 0)');
    vignette.addColorStop(0.65, 'rgba(115, 92, 65, 0.07)');
    vignette.addColorStop(1, 'rgba(82, 60, 36, 0.35)'); // Dusty bronze storm shading
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);

  }, [width, height]);

  return <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, zIndex: 0, pointerEvents: 'none', borderRadius: '12px' }} />;
}
