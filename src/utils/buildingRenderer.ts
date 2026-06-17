export function normalizeBuildingType(raw: any): string {
  if (typeof raw !== 'string') return 'default'
  const s = raw.toLowerCase().trim()
  if (s.includes('خيمة') || s.includes('خيمه') || s.includes('tent')) return 'tent'
  if (s.includes('بئر') || s.includes('بير') || s.includes('well')) return 'well'
  if (s.includes('مياه') || s.includes('ماء') || s.includes('قناة') || s.includes('مجرى') || s.includes('water') || s.includes('river') || s.includes('stream') || s.includes('رقعة مياة')) return 'water'
  if (s.includes('زيتون') || s.includes('معصرة') || s.includes('olive') || s.includes('press')) return 'olive_press'
  if (s.includes('قصر') || s.includes('palace')) return 'palace'
  if (s.includes('ثكنة') || s.includes('ثكنه') || s.includes('barracks') || s.includes('guard')) return 'barracks'
  if (s.includes('فرن') || s.includes('برونز') || s.includes('forge') || s.includes('bronze')) return 'forge'
  if (s.includes('أثرية') || s.includes('رقمية') || s.includes('قلعة') || s.includes('القلعة') || s.includes('citadel') || s.includes('castle')) return 'citadel'
  if (s.includes('طريق صخرى') || s.includes('طريق حجر') || s.includes('stone road') || s.includes('paved') || s.includes('طولى')) return 'stone_road'
  if (s.includes('طريق') || s.includes('ممر') || s.includes('رصيف') || s.includes('road') || s.includes('path') || s.includes('way') || s.includes('رملي') || s.includes('ملتوى')) return 'road'
  if (s.includes('شجر') || s.includes('زرع') || s.includes('نخل') || s.includes('غابة') || s.includes('شجيرة') || s.includes('plant') || s.includes('tree') || s.includes('palm') || s.includes('bush') || s.includes('نخلة')) return 'tree'
  if (s.includes('مزرعة') || s.includes('مزرعه') || s.includes('farm') || s.includes('حقل') || s.includes('شعير') || s.includes('قمح') || s.includes('زراعية') || s.includes('رقعة') || s.includes('أرض زراعية') || s.includes('ارض زراعية')) return 'farm'
  if (s.includes('مخزن') || s.includes('storage') || s.includes('store') || s.includes('حبوب')) return 'storehouse'
  if (s.includes('برج') || s.includes('مراقبة') || s.includes('tower') || s.includes('watch')) return 'tower'
  if (s.includes('سوق') || s.includes('market')) return 'market'
  if (s.includes('سور أفقى') || s.includes('سور افقي') || s.includes('horizontal wall')) return 'horizontal_wall'
  if (s.includes('سور رأسى') || s.includes('سور راسي') || s.includes('vertical wall')) return 'vertical_wall'
  if (s.includes('سور') || s.includes('wall') || s.includes('جدار')) return 'wall'
  if (s.includes('هيكل') || s.includes('معبد') || s.includes('temple')) return 'temple'
  if (s.includes('اسطبل') || s.includes('إسطبل') || s.includes('stable')) return 'stable'
  if (s.includes('مذبح') || s.includes('altar')) return 'altar'
  if (s.includes('معسكر') || s.includes('تدريب') || s.includes('camp') || s.includes('training')) return 'camp'
  if (s.includes('بيت') || s.includes('منزل') || s.includes('house') || s.includes('stone') || s.includes('صغير')) return 'house'
  if (s.includes('صحراوية') || s.includes('desert') || s.includes('رمل')) return 'desert'
  if (s.includes('صخرية') || s.includes('rocky') || s.includes('صخر')) return 'rocky_land'
  if (s.includes('رعوية') || s.includes('رعويه') || s.includes('pasture') || s.includes('grazing')) return 'pasture'
  if (s.includes('فرخة') || s.includes('فرخه') || s.includes('chicken') || s.includes('hen')) return 'chicken'
  if (s.includes('ارنب') || s.includes('أرنب') || s.includes('rabbit')) return 'rabbit'
  if (s.includes('معزة') || s.includes('معزه') || s.includes('ماعز') || s.includes('goat')) return 'goat'
  if (s.includes('حصان') || s.includes('horse')) return 'horse'
  if (s.includes('حمار') || s.includes('donkey')) return 'donkey'
  if (s.includes('خنزير') || s.includes('pig')) return 'pig'
  if (s.includes('بط') || s.includes('بطة') || s.includes('بطه') || s.includes('duck')) return 'duck'
  if (s.includes('كلب') || s.includes('dog')) return 'dog'
  if (s.includes('قطة') || s.includes('قطه') || s.includes('cat')) return 'cat'
  if (s.includes('بقرة') || s.includes('cow')) return 'cow'
  if (s.includes('خروف') || s.includes('sheep')) return 'sheep'
  if (s.includes('طيور') || s.includes('bird')) return 'birds'
  if (s.includes('بوابة') || s.includes('gate')) return 'gate'
  return 'default'
}

export function drawBuilding(
  ctx: CanvasRenderingContext2D,
  rawType: string,
  x: number,
  y: number,
  size: number,
  teamColor: string,
  _callback?: () => void,
  time: number = Date.now()
): void {
  const type = normalizeBuildingType(rawType)
  const s = Math.max(52, size)

  // Draw the actual building shape natively on the background with animated parameters
  drawPureCanvasBuilding(ctx, rawType, type, x, y, s, teamColor, time)
}

function drawPureCanvasBuilding(
  ctx: CanvasRenderingContext2D,
  rawType: string,
  type: string,
  x: number,
  y: number,
  s: number,
  tc: string,
  time: number
): void {
  ctx.save()
  ctx.translate(x, y)

  // Base shadows
  ctx.shadowColor = 'rgba(12, 36, 12, 0.4)'
  ctx.shadowBlur = 14
  ctx.shadowOffsetX = 3
  ctx.shadowOffsetY = 6

  switch (type) {
    case 'tent': {
      // Ground shadow
      ctx.fillStyle = 'rgba(15, 30, 15, 0.25)'
      ctx.beginPath(); ctx.ellipse(0, s * 0.35, s * 0.44, s * 0.12, 0, 0, Math.PI * 2); ctx.fill()
      ctx.shadowColor = 'transparent'

      // Wooden support poles
      ctx.fillStyle = '#6d4c41'
      ctx.fillRect(-s * 0.35, s * 0.1, s * 0.05, s * 0.25)
      ctx.fillRect(s * 0.3, s * 0.1, s * 0.05, s * 0.25)

      // Main tent fabric (High style striped layout)
      ctx.fillStyle = tc
      ctx.beginPath()
      ctx.moveTo(0, -s * 0.45)
      ctx.lineTo(-s * 0.4, s * 0.32)
      ctx.lineTo(s * 0.4, s * 0.32)
      ctx.closePath(); ctx.fill()

      // Horizontal stripes (Visual rhythm)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.22)'
      ctx.beginPath()
      ctx.moveTo(0, -s * 0.45)
      ctx.lineTo(-s * 0.2, s * 0.32)
      ctx.lineTo(-s * 0.1, s * 0.32)
      ctx.lineTo(0, -s * 0.45)
      ctx.lineTo(s * 0.1, s * 0.32)
      ctx.lineTo(s * 0.2, s * 0.32)
      ctx.closePath(); ctx.fill()

      // Cute inner flap opening
      ctx.fillStyle = '#2b1008'
      ctx.beginPath()
      ctx.moveTo(0, -s * 0.05)
      ctx.lineTo(-s * 0.12, s * 0.32)
      ctx.lineTo(s * 0.12, s * 0.32)
      ctx.closePath(); ctx.fill()

      // Flapping tent flaps animation
      const flapSwing = Math.sin(time / 180) * s * 0.03
      ctx.fillStyle = tc
      // Left flap
      ctx.beginPath()
      ctx.moveTo(0, -s * 0.05)
      ctx.lineTo(-s * 0.12 + flapSwing, s * 0.32)
      ctx.lineTo(-s * 0.24 + flapSwing / 2, s * 0.32)
      ctx.closePath(); ctx.fill()
      // Right flap
      ctx.beginPath()
      ctx.moveTo(0, -s * 0.05)
      ctx.lineTo(s * 0.12 + flapSwing, s * 0.32)
      ctx.lineTo(s * 0.24 + flapSwing / 2, s * 0.32)
      ctx.closePath(); ctx.fill()

      // Flag on top with wind wave animation
      ctx.strokeStyle = '#d7ccc8'; ctx.lineWidth = 2.5
      ctx.beginPath(); ctx.moveTo(0, -s * 0.45); ctx.lineTo(0, -s * 0.65); ctx.stroke()

      const flagWiggle = Math.sin(time / 140) * s * 0.05
      ctx.fillStyle = '#ff3d00'
      ctx.beginPath()
      ctx.moveTo(0, -s * 0.65)
      ctx.lineTo(s * 0.22, -s * 0.58 + flagWiggle)
      ctx.lineTo(0, -s * 0.51)
      ctx.closePath(); ctx.fill()
      break
    }

    case 'well': {
      // Ground shadow
      ctx.fillStyle = 'rgba(15, 30, 15, 0.25)'
      ctx.beginPath(); ctx.ellipse(0, s * 0.38, s * 0.36, s * 0.1, 0, 0, Math.PI * 2); ctx.fill()
      ctx.shadowColor = 'transparent'

      // Detailed circular stone base (Isometric stack)
      ctx.fillStyle = '#78909c'
      ctx.beginPath(); ctx.ellipse(0, s * 0.22, s * 0.3, s * 0.12, 0, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#455a64'
      ctx.fillRect(-s * 0.3, s * 0.08, s * 0.6, s * 0.15)
      ctx.fillStyle = '#b0bec5'
      ctx.beginPath(); ctx.ellipse(0, s * 0.08, s * 0.3, s * 0.12, 0, 0, Math.PI * 2); ctx.fill()

      // Paved brick lines for stone textures
      ctx.strokeStyle = '#37474f'; ctx.lineWidth = 1.5
      for (let i = -2; i <= 2; i++) {
        const blkX = i * s * 0.08
        ctx.beginPath(); ctx.moveTo(blkX, s * 0.08); ctx.lineTo(blkX, s * 0.23); ctx.stroke()
      }

      // Deep blue water reservoir
      ctx.fillStyle = '#0288d1'
      ctx.beginPath(); ctx.ellipse(0, s * 0.08, s * 0.22, s * 0.08, 0, 0, Math.PI * 2); ctx.fill()

      // Water Ripple Animation
      const rippleRadius = Math.abs(Math.sin(time / 600)) * s * 0.16 + s * 0.04
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'; ctx.lineWidth = 1.5
      ctx.beginPath(); ctx.ellipse(0, s * 0.08, rippleRadius, rippleRadius * 0.36, 0, 0, Math.PI * 2); ctx.stroke()

      // Two wooden support posts
      ctx.fillStyle = '#5d4037'
      ctx.fillRect(-s * 0.24, -s * 0.3, s * 0.05, s * 0.38)
      ctx.fillRect(s * 0.19, -s * 0.3, s * 0.05, s * 0.38)

      // Wooden roof over well
      ctx.fillStyle = tc
      ctx.beginPath()
      ctx.moveTo(0, -s * 0.44)
      ctx.lineTo(-s * 0.32, -s * 0.28)
      ctx.lineTo(s * 0.32, -s * 0.28)
      ctx.closePath(); ctx.fill()

      // Highlight/texture on well roof
      ctx.fillStyle = 'rgba(255, 255, 255, 0.18)'
      ctx.beginPath()
      ctx.moveTo(0, -s * 0.44)
      ctx.lineTo(-s * 0.16, -s * 0.36)
      ctx.lineTo(s * 0.16, -s * 0.36)
      ctx.closePath(); ctx.fill()

      // Rope and animated iron bucket bobbing up/down
      const bucketBobY = Math.sin(time / 400) * s * 0.12 - s * 0.03
      ctx.strokeStyle = '#d7ccc8'; ctx.lineWidth = 1.8
      ctx.beginPath(); ctx.moveTo(0, -s * 0.28); ctx.lineTo(0, bucketBobY); ctx.stroke()

      // Wooden bucket
      ctx.fillStyle = '#8d6e63'
      ctx.fillRect(-s * 0.06, bucketBobY, s * 0.12, s * 0.1)
      ctx.fillStyle = '#5d4037'
      ctx.fillRect(-s * 0.06, bucketBobY + s * 0.06, s * 0.12, s * 0.04)
      ctx.strokeStyle = '#212121'; ctx.lineWidth = 2
      ctx.beginPath(); ctx.arc(0, bucketBobY, s * 0.05, Math.PI, 0); ctx.stroke()
      break
    }

    case 'road': {
      ctx.shadowColor = 'transparent'
      const norm = (rawType || '').toLowerCase();
      // Draw road base and inner tread according to the specific layout structure
      if (norm.includes('عمود') || norm.includes('vertical')) {
        // Vertical
        ctx.fillStyle = '#bfab80'
        ctx.fillRect(-s * 0.18, -s * 0.5, s * 0.36, s)
        
        ctx.fillStyle = '#a69265'
        ctx.fillRect(-s * 0.08, -s * 0.5, s * 0.16, s)
      } else if (norm.includes('شمال غرب') || norm.includes('north west') || norm.includes('nw')) {
        // NW Corner: Curve from Left (-s*0.5, 0) to Top (0, -s*0.5)
        ctx.strokeStyle = '#bfab80'; ctx.lineWidth = s * 0.36; ctx.lineCap = 'butt';
        ctx.beginPath(); ctx.moveTo(-s * 0.5, 0); ctx.quadraticCurveTo(0, 0, 0, -s * 0.5); ctx.stroke();

        ctx.strokeStyle = '#a69265'; ctx.lineWidth = s * 0.16;
        ctx.beginPath(); ctx.moveTo(-s * 0.5, 0); ctx.quadraticCurveTo(0, 0, 0, -s * 0.5); ctx.stroke();
      } else if (norm.includes('شمال شرق') || norm.includes('north east') || norm.includes('ne')) {
        // NE Corner: Curve from Right (s*0.5, 0) to Top (0, -s*0.5)
        ctx.strokeStyle = '#bfab80'; ctx.lineWidth = s * 0.36; ctx.lineCap = 'butt';
        ctx.beginPath(); ctx.moveTo(s * 0.5, 0); ctx.quadraticCurveTo(0, 0, 0, -s * 0.5); ctx.stroke();

        ctx.strokeStyle = '#a69265'; ctx.lineWidth = s * 0.16;
        ctx.beginPath(); ctx.moveTo(s * 0.5, 0); ctx.quadraticCurveTo(0, 0, 0, -s * 0.5); ctx.stroke();
      } else if (norm.includes('جنوب غرب') || norm.includes('south west') || norm.includes('sw')) {
        // SW Corner: Curve from Left (-s*0.5, 0) to Bottom (0, s*0.5)
        ctx.strokeStyle = '#bfab80'; ctx.lineWidth = s * 0.36; ctx.lineCap = 'butt';
        ctx.beginPath(); ctx.moveTo(-s * 0.5, 0); ctx.quadraticCurveTo(0, 0, 0, s * 0.5); ctx.stroke();

        ctx.strokeStyle = '#a69265'; ctx.lineWidth = s * 0.16;
        ctx.beginPath(); ctx.moveTo(-s * 0.5, 0); ctx.quadraticCurveTo(0, 0, 0, s * 0.5); ctx.stroke();
      } else if (norm.includes('جنوب شرق') || norm.includes('south east') || norm.includes('se')) {
        // SE Corner: Curve from Right (s*0.5, 0) to Bottom (0, s*0.5)
        ctx.strokeStyle = '#bfab80'; ctx.lineWidth = s * 0.36; ctx.lineCap = 'butt';
        ctx.beginPath(); ctx.moveTo(s * 0.5, 0); ctx.quadraticCurveTo(0, 0, 0, s * 0.5); ctx.stroke();

        ctx.strokeStyle = '#a69265'; ctx.lineWidth = s * 0.16;
        ctx.beginPath(); ctx.moveTo(s * 0.5, 0); ctx.quadraticCurveTo(0, 0, 0, s * 0.5); ctx.stroke();
      } else {
        // Horizontal (Default)
        ctx.fillStyle = '#bfab80'
        ctx.fillRect(-s * 0.5, -s * 0.18, s, s * 0.36)

        ctx.fillStyle = '#a69265'
        ctx.fillRect(-s * 0.5, -s * 0.08, s, s * 0.16)
      }
      break
    }

    case 'stone_road': {
      ctx.shadowColor = 'transparent'
      const norm = (rawType || '').toLowerCase();
      if (norm.includes('عمود') || norm.includes('vertical')) {
        // Slate base
        ctx.fillStyle = '#546e7a'
        ctx.fillRect(-s * 0.22, -s * 0.5, s * 0.44, s)
        
        ctx.strokeStyle = '#263238'; ctx.lineWidth = 1.5;
        for (let dy = -s * 0.5; dy <= s * 0.5; dy += s * 0.25) {
          ctx.beginPath(); ctx.moveTo(-s * 0.22, dy); ctx.lineTo(s * 0.22, dy); ctx.stroke();
        }
        ctx.strokeStyle = '#cfd8dc'; ctx.lineWidth = 2; ctx.setLineDash([4, 6]);
        ctx.beginPath(); ctx.moveTo(0, -s * 0.5); ctx.lineTo(0, s * 0.5); ctx.stroke();
        ctx.setLineDash([]);
      } else if (norm.includes('شمال غرب') || norm.includes('north west') || norm.includes('nw')) {
        ctx.strokeStyle = '#546e7a'; ctx.lineWidth = s * 0.44; ctx.lineCap = 'butt';
        ctx.beginPath(); ctx.moveTo(-s * 0.5, 0); ctx.quadraticCurveTo(0, 0, 0, -s * 0.5); ctx.stroke();

        ctx.strokeStyle = '#cfd8dc'; ctx.lineWidth = 2; ctx.setLineDash([4, 6]);
        ctx.beginPath(); ctx.moveTo(-s * 0.5, 0); ctx.quadraticCurveTo(0, 0, 0, -s * 0.5); ctx.stroke();
        ctx.setLineDash([]);
      } else if (norm.includes('شمال شرق') || norm.includes('north east') || norm.includes('ne')) {
        ctx.strokeStyle = '#546e7a'; ctx.lineWidth = s * 0.44; ctx.lineCap = 'butt';
        ctx.beginPath(); ctx.moveTo(s * 0.5, 0); ctx.quadraticCurveTo(0, 0, 0, -s * 0.5); ctx.stroke();

        ctx.strokeStyle = '#cfd8dc'; ctx.lineWidth = 2; ctx.setLineDash([4, 6]);
        ctx.beginPath(); ctx.moveTo(s * 0.5, 0); ctx.quadraticCurveTo(0, 0, 0, -s * 0.5); ctx.stroke();
        ctx.setLineDash([]);
      } else if (norm.includes('جنوب غرب') || norm.includes('south west') || norm.includes('sw')) {
        ctx.strokeStyle = '#546e7a'; ctx.lineWidth = s * 0.44; ctx.lineCap = 'butt';
        ctx.beginPath(); ctx.moveTo(-s * 0.5, 0); ctx.quadraticCurveTo(0, 0, 0, s * 0.5); ctx.stroke();

        ctx.strokeStyle = '#cfd8dc'; ctx.lineWidth = 2; ctx.setLineDash([4, 6]);
        ctx.beginPath(); ctx.moveTo(-s * 0.5, 0); ctx.quadraticCurveTo(0, 0, 0, s * 0.5); ctx.stroke();
        ctx.setLineDash([]);
      } else if (norm.includes('جنوب شرق') || norm.includes('south east') || norm.includes('se')) {
        ctx.strokeStyle = '#546e7a'; ctx.lineWidth = s * 0.44; ctx.lineCap = 'butt';
        ctx.beginPath(); ctx.moveTo(s * 0.5, 0); ctx.quadraticCurveTo(0, 0, 0, s * 0.5); ctx.stroke();

        ctx.strokeStyle = '#cfd8dc'; ctx.lineWidth = 2; ctx.setLineDash([4, 6]);
        ctx.beginPath(); ctx.moveTo(s * 0.5, 0); ctx.quadraticCurveTo(0, 0, 0, s * 0.5); ctx.stroke();
        ctx.setLineDash([]);
      } else {
        // Horizontal (default)
        ctx.fillStyle = '#546e7a'
        ctx.fillRect(-s * 0.5, -s * 0.22, s, s * 0.44)

        ctx.strokeStyle = '#263238'; ctx.lineWidth = 1.5;
        for (let dx = -s * 0.5; dx <= s * 0.5; dx += s * 0.25) {
          ctx.beginPath(); ctx.moveTo(dx, -s * 0.22); ctx.lineTo(dx, s * 0.22); ctx.stroke();
        }
        ctx.strokeStyle = '#cfd8dc'; ctx.lineWidth = 2; ctx.setLineDash([4, 6]);
        ctx.beginPath(); ctx.moveTo(-s * 0.5, 0); ctx.lineTo(s * 0.5, 0); ctx.stroke();
        ctx.setLineDash([]);
      }
      break
    }

    case 'tree': {
      // Wind swaying angle
      const treeSway = Math.sin(time / 340 + x * 0.05) * 0.05

      // Ground shadow
      ctx.fillStyle = 'rgba(15, 30, 15, 0.25)'
      ctx.beginPath(); ctx.ellipse(-s * treeSway * 1.5, s * 0.32, s * 0.28, s * 0.08, 0, 0, Math.PI * 2); ctx.fill()
      ctx.shadowColor = 'transparent'

      // Tree Trunk
      ctx.fillStyle = '#4e342e'
      ctx.fillRect(-s * 0.05, 0, s * 0.1, s * 0.32)

      // Rotate leafy canopy from the trunk base
      ctx.save()
      ctx.translate(0, s * 0.1)
      ctx.rotate(treeSway)

      // Volumetric overlapping leafy groups (Like Stable Diffusion lush round forms)
      const layers = [
        { cx: 0, cy: -s * 0.3, r: s * 0.28, fill: '#1b5e20' }, // Bottom deep forest shadow
        { cx: -s * 0.1, cy: -s * 0.2, r: s * 0.22, fill: '#2e7d32' },
        { cx: s * 0.1, cy: -s * 0.2, r: s * 0.22, fill: '#2e7d32' },
        { cx: -s * 0.08, cy: -s * 0.34, r: s * 0.2, fill: '#4caf50' },
        { cx: s * 0.08, cy: -s * 0.34, r: s * 0.2, fill: '#4caf50' },
        { cx: 0, cy: -s * 0.44, r: s * 0.18, fill: '#81c784' }, // Top bright highlights
      ]

      layers.forEach((l) => {
        ctx.fillStyle = l.fill
        ctx.beginPath()
        ctx.arc(l.cx, l.cy, l.r, 0, Math.PI * 2)
        ctx.fill()

        // Soft highlight curve on each leaf ball to give 3D volume
        ctx.fillStyle = 'rgba(255, 255, 255, 0.09)'
        ctx.beginPath()
        ctx.arc(l.cx - l.r * 0.2, l.cy - l.r * 0.2, l.r * 0.5, 0, Math.PI * 2)
        ctx.fill()
      })

      // Red apples blinking/swinging in the branches
      const appleSwing = Math.sin(time / 220) * 1.5
      ctx.fillStyle = '#ff1744'
      const apples = [
        { ax: -s * 0.1, ay: -s * 0.25 },
        { ax: s * 0.12, ay: -s * 0.16 },
        { ax: -s * 0.02, ay: -s * 0.38 },
        { ax: s * 0.08, ay: -s * 0.32 }
      ]
      apples.forEach(ap => {
        ctx.beginPath()
        ctx.arc(ap.ax + appleSwing * 0.3, ap.ay + appleSwing * 0.2, s * 0.028, 0, Math.PI * 2)
        ctx.fill()
      })

      ctx.restore()
      break
    }

    case 'water': {
      ctx.shadowColor = 'transparent'
      // Draw flat square that covers the grid block completely without borders or shadows
      ctx.fillStyle = '#29B6F6' // Vibrant pure water blue
      ctx.fillRect(-s * 0.5, -s * 0.5, s, s)
      break
    }

    case 'farm': {
      ctx.shadowColor = 'transparent'
      // Base tilled soil flat cover
      ctx.fillStyle = '#5D4037' // Rich agricultural chocolate soil
      ctx.fillRect(-s * 0.5, -s * 0.5, s, s)

      // Draw horizontal tilled crop soil rows
      ctx.fillStyle = '#4E342E'
      ctx.fillRect(-s * 0.5, -s * 0.3, s, s * 0.12)
      ctx.fillRect(-s * 0.5, 0, s, s * 0.12)
      ctx.fillRect(-s * 0.5, s * 0.3, s, s * 0.12)

      // Crop sprouts on sides
      ctx.fillStyle = '#81C784'
      ;[-s * 0.35, s * 0.35].forEach(px => {
        ;[-s * 0.24, s * 0.06, s * 0.36].forEach(py => {
          ctx.beginPath()
          ctx.arc(px, py, s * 0.05, 0, Math.PI * 2)
          ctx.fill()
        })
      })

      // Draw beautiful dynamic windmill in the middle!
      ctx.save()
      ctx.translate(0, -s * 0.05)

      // Tower base (stone/brick windmill torso)
      ctx.fillStyle = '#F5F5F5' // pristine white tower body
      ctx.beginPath()
      ctx.moveTo(-s * 0.12, s * 0.25)
      ctx.lineTo(-s * 0.08, -s * 0.12)
      ctx.lineTo(s * 0.08, -s * 0.12)
      ctx.lineTo(s * 0.12, s * 0.25)
      ctx.closePath(); ctx.fill()

      // Small wooden door
      ctx.fillStyle = '#795548'
      ctx.fillRect(-s * 0.03, s * 0.12, s * 0.06, s * 0.13)

      // Conical Red Roof
      ctx.fillStyle = '#E53935' // deep red
      ctx.beginPath()
      ctx.moveTo(-s * 0.1, -s * 0.11)
      ctx.lineTo(0, -s * 0.26)
      ctx.lineTo(s * 0.1, -s * 0.11)
      ctx.closePath(); ctx.fill()

      // Rotating blades
      ctx.save()
      ctx.translate(0, -s * 0.08)
      const bladeAngle = (time / 400) % (Math.PI * 2)
      ctx.rotate(bladeAngle)

      // Blades cross
      ctx.strokeStyle = '#D7CCC8'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(-s * 0.26, 0); ctx.lineTo(s * 0.26, 0)
      ctx.moveTo(0, -s * 0.26); ctx.lineTo(0, s * 0.26)
      ctx.stroke()

      // Windmill sail cloths on blades
      ctx.fillStyle = '#FFFFFF'
      ;[0, Math.PI / 2, Math.PI, Math.PI * 1.5].forEach(ang => {
        ctx.save()
        ctx.rotate(ang)
        ctx.fillRect(s * 0.04, s * 0.01, s * 0.18, s * 0.04)
        ctx.restore()
      })

      ctx.restore() // End rotating blades
      ctx.restore() // End translator
      break
    }

    case 'storehouse': {
      // Ground shadow
      ctx.fillStyle = 'rgba(15, 30, 15, 0.25)'
      ctx.beginPath(); ctx.ellipse(0, s * 0.42, s * 0.42, s * 0.1, 0, 0, Math.PI * 2); ctx.fill()
      ctx.shadowColor = 'transparent'

      // Wood granary walls
      ctx.fillStyle = '#ffb300'
      ctx.fillRect(-s * 0.36, -s * 0.05, s * 0.72, s * 0.46)

      // Wood logs textures (Lines)
      ctx.strokeStyle = '#ff6f00'; ctx.lineWidth = 1.8
      ;[-s * 0.05, s * 0.08, s * 0.21, s * 0.34].forEach(ly => {
        ctx.beginPath(); ctx.moveTo(-s * 0.36, ly); ctx.lineTo(s * 0.36, ly); ctx.stroke()
      })

      // High color terracotta roof
      ctx.fillStyle = tc
      ctx.beginPath()
      ctx.moveTo(0, -s * 0.45)
      ctx.lineTo(-s * 0.42, -s * 0.05)
      ctx.lineTo(s * 0.42, -s * 0.05)
      ctx.closePath(); ctx.fill()

      // Roof shade
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)'
      ctx.beginPath()
      ctx.moveTo(0, -s * 0.45)
      ctx.lineTo(0, -s * 0.05)
      ctx.lineTo(s * 0.42, -s * 0.05)
      ctx.closePath(); ctx.fill()

      // Large arching cargo door
      ctx.fillStyle = '#3e2723'
      ctx.beginPath(); ctx.rect(-s * 0.13, s * 0.12, s * 0.26, s * 0.29); ctx.fill()
      ctx.fillStyle = '#271203'
      ctx.beginPath(); ctx.arc(0, s * 0.13, s * 0.13, Math.PI, 0); ctx.fill()

      // Shiny visual glowing lantern blinking in front of door
      const lampGlw = Math.abs(Math.sin(time / 200)) * 6 + 3
      ctx.fillStyle = '#ffea00'
      ctx.beginPath(); ctx.arc(0, s * 0.1, 3, 0, Math.PI * 2); ctx.fill()
      ctx.save()
      ctx.shadowColor = '#ffff00'
      ctx.shadowBlur = lampGlw
      ctx.fillStyle = '#ffffff'
      ctx.beginPath(); ctx.arc(0, s * 0.1, 2, 0, Math.PI * 2); ctx.fill()
      ctx.restore()

      // Small sacks of wheat resting outside storehouse
      ctx.fillStyle = '#a1887f'
      ctx.beginPath(); ctx.ellipse(-s * 0.24, s * 0.32, s * 0.08, s * 0.09, -0.2, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#d7ccc8'
      ctx.beginPath(); ctx.ellipse(s * 0.23, s * 0.34, s * 0.07, s * 0.08, 0.3, 0, Math.PI * 2); ctx.fill()
      break
    }

    case 'tower': {
      // Ground shadow
      ctx.fillStyle = 'rgba(15, 30, 15, 0.25)'
      ctx.beginPath(); ctx.ellipse(0, s * 0.44, s * 0.25, s * 0.07, 0, 0, Math.PI * 2); ctx.fill()
      ctx.shadowColor = 'transparent'

      // Square fortress lower base
      ctx.fillStyle = '#546e7a'
      ctx.fillRect(-s * 0.22, s * 0.18, s * 0.44, s * 0.26)
      // Square middle base
      ctx.fillStyle = '#78909c'
      ctx.fillRect(-s * 0.17, -s * 0.2, s * 0.34, s * 0.38)

      // Watchtower top crenellated battlements
      ctx.fillStyle = tc
      ctx.fillRect(-s * 0.2, -s * 0.36, s * 0.4, s * 0.16)
      // Teeth
      ctx.fillStyle = tc
      ;[-s * 0.2, -s * 0.07, s * 0.07].forEach((bx) => {
        ctx.fillRect(bx, -s * 0.44, s * 0.11, s * 0.09)
      })

      // Arrow slits
      ctx.fillStyle = '#1c313a'
      ctx.fillRect(-s * 0.02, -s * 0.12, s * 0.04, s * 0.11)
      ctx.fillRect(-s * 0.02, s * 0.24, s * 0.04, s * 0.11)

      // Flapping sentinel team flag on pole sways in wind
      const flagOsc = Math.sin(time / 160) * s * 0.05
      ctx.strokeStyle = '#b0bec5'; ctx.lineWidth = 2.5
      ctx.beginPath(); ctx.moveTo(s * 0.12, -s * 0.36); ctx.lineTo(s * 0.12, -s * 0.65); ctx.stroke()

      ctx.fillStyle = '#ff1744'
      ctx.beginPath()
      ctx.moveTo(s * 0.12, -s * 0.65)
      ctx.lineTo(s * 0.34, -s * 0.57 + flagOsc)
      ctx.lineTo(s * 0.12, -s * 0.49)
      ctx.closePath(); ctx.fill()
      break
    }

    case 'market': {
      // Ground shadow
      ctx.fillStyle = 'rgba(15, 30, 15, 0.25)'
      ctx.beginPath(); ctx.ellipse(0, s * 0.42, s * 0.44, s * 0.1, 0, 0, Math.PI * 2); ctx.fill()
      ctx.shadowColor = 'transparent'

      // Sturdy sand limestone walls
      ctx.fillStyle = '#fff59d'
      ctx.fillRect(-s * 0.38, -s * 0.04, s * 0.76, s * 0.46)

      // Stripes on beautiful canopy (bazaar stall design)
      ctx.fillStyle = tc
      ctx.beginPath()
      ctx.moveTo(-s * 0.44, -s * 0.04)
      ctx.lineTo(0, -s * 0.4)
      ctx.lineTo(s * 0.44, -s * 0.04)
      ctx.closePath(); ctx.fill()

      const stripeWiggle = Math.sin(time / 200) * 2
      ctx.fillStyle = 'rgba(255, 255, 255, 0.28)'
      ;[-s * 0.28, -s * 0.1, s * 0.1, s * 0.28].forEach((ax, index) => {
        ctx.beginPath()
        ctx.moveTo(ax, -s * 0.04)
        ctx.lineTo(ax + stripeWiggle, -s * 0.18)
        ctx.lineTo(ax + s * 0.09 + stripeWiggle, -s * 0.18)
        ctx.lineTo(ax + s * 0.09, -s * 0.04)
        ctx.closePath(); ctx.fill()
      })

      // Stall details (arched windows with fruits inside)
      ctx.fillStyle = '#3e2723'
      ctx.fillRect(-s * 0.28, s * 0.08, s * 0.16, s * 0.18)
      ctx.fillRect(s * 0.12, s * 0.08, s * 0.16, s * 0.18)
      // Fruit colors
      ctx.fillStyle = '#ff1744' // Tomatoes/Apples
      ctx.beginPath(); ctx.arc(-s * 0.2, s * 0.2, 3, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#ffd600' // Lemons/Bananas
      ctx.beginPath(); ctx.arc(s * 0.2, s * 0.2, 3, 0, Math.PI * 2); ctx.fill()

      // Entry path/mat
      ctx.fillStyle = '#ff5722'
      ctx.fillRect(-s * 0.1, s * 0.36, s * 0.2, s * 0.08)
      break
    }

    case 'temple': {
      // Ground shadow
      ctx.fillStyle = 'rgba(15, 30, 15, 0.25)'
      ctx.beginPath(); ctx.ellipse(0, s * 0.44, s * 0.42, s * 0.09, 0, 0, Math.PI * 2); ctx.fill()
      ctx.shadowColor = 'transparent'

      // Columns pedestals
      ctx.fillStyle = '#ffd54f'
      ctx.fillRect(-s * 0.4, s * 0.28, s * 0.8, s * 0.12)

      // Core Ivory Altar wall
      ctx.fillStyle = '#faf8f0'
      ctx.fillRect(-s * 0.32, -s * 0.12, s * 0.64, s * 0.4)

      // Classic Temple columns (Ivory blocks with shading)
      ;[-s * 0.25, -s * 0.09, s * 0.07, s * 0.23].forEach(cx => {
        ctx.fillStyle = '#bcaaa4'
        ctx.fillRect(cx, -s * 0.12, s * 0.08, s * 0.4)
        ctx.fillStyle = '#efebe9'
        ctx.fillRect(cx + 2, -s * 0.12, s * 0.05, s * 0.4)
      })

      // Gilded pediment roof (Glint shine animation)
      ctx.fillStyle = tc
      ctx.beginPath()
      ctx.moveTo(-s * 0.36, -s * 0.12)
      ctx.lineTo(0, -s * 0.45)
      ctx.lineTo(s * 0.36, -s * 0.12)
      ctx.closePath(); ctx.fill()

      const shineX = (time / 15) % (s * 1.6) - s * 0.8
      ctx.save()
      ctx.beginPath()
      ctx.moveTo(-s * 0.36, -s * 0.12)
      ctx.lineTo(0, -s * 0.45)
      ctx.lineTo(s * 0.36, -s * 0.12)
      ctx.clip()

      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)'
      ctx.fillRect(shineX, -s * 0.5, s * 0.16, s * 0.6)
      ctx.restore()

      // Large golden sun emblem on pediment
      ctx.fillStyle = '#ffd54f'
      ctx.beginPath(); ctx.arc(0, -s * 0.12, s * 0.08, 0, Math.PI * 2); ctx.fill()
      break
    }

    case 'horizontal_wall': {
      ctx.shadowColor = 'transparent'
      // Draw horizontal flat path guide
      ctx.strokeStyle = '#78909c'
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.moveTo(-s * 0.5, s * 0.1)
      ctx.lineTo(s * 0.5, s * 0.1)
      ctx.stroke()

      // Cute brick texture lines
      ctx.strokeStyle = '#cfd8dc'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(-s * 0.5, s * 0.08)
      ctx.lineTo(s * 0.5, s * 0.08)
      ctx.stroke()

      // Vertical reinforcement pillars in team color
      ctx.fillStyle = tc
      ;[-s * 0.4, -s * 0.18, 0, s * 0.18, s * 0.4].forEach(px => {
        ctx.fillRect(px - 3, s * 0.0, 6, s * 0.25)
        ctx.fillStyle = '#37474f'
        ctx.fillRect(px - 4, s * 0.25, 8, s * 0.05)
        ctx.fillStyle = tc
      })
      break
    }

    case 'vertical_wall': {
      ctx.shadowColor = 'transparent'
      // Draw vertical flat path guide
      ctx.strokeStyle = '#78909c'
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.moveTo(0, -s * 0.5)
      ctx.lineTo(0, s * 0.5)
      ctx.stroke()

      // Cute brick texture lines
      ctx.strokeStyle = '#cfd8dc'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(-s * 0.02, -s * 0.5)
      ctx.lineTo(-s * 0.02, s * 0.5)
      ctx.stroke()

      // Horizontal reinforcement pillars in team color
      ctx.fillStyle = tc
      ;[-s * 0.4, -s * 0.18, 0, s * 0.18, s * 0.4].forEach(py => {
        ctx.fillRect(-3, py - 3, s * 0.25, 6)
        ctx.fillStyle = '#37474f'
        ctx.fillRect(-4, py - 4, s * 0.05, 8)
        ctx.fillStyle = tc
      })
      break
    }

    case 'wall': {
      // Ground shadow
      ctx.fillStyle = 'rgba(15, 30, 15, 0.25)'
      ctx.beginPath(); ctx.ellipse(0, s * 0.42, s * 0.46, s * 0.09, 0, 0, Math.PI * 2); ctx.fill()
      ctx.shadowColor = 'transparent'

      // Detailed dark brick fort wall boundary
      ctx.fillStyle = '#78909c'
      ctx.fillRect(-s * 0.46, s * 0.04, s * 0.92, s * 0.38)

      // Paved bricks layout
      const bColor = ['#90a4ae', '#cfd8dc']
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 4; c++) {
          const shift = r % 2 === 0 ? 0 : s * 0.12
          ctx.fillStyle = bColor[(r + c) % 2]
          ctx.fillRect(-s * 0.44 + c * s * 0.22 + shift, s * 0.06 + r * s * 0.12, s * 0.19, s * 0.1)
          ctx.strokeStyle = '#37474f'; ctx.lineWidth = 1
          ctx.strokeRect(-s * 0.44 + c * s * 0.22 + shift, s * 0.06 + r * s * 0.12, s * 0.19, s * 0.1)
        }
      }

      // Battlements tooth on top with team color layout
      ctx.fillStyle = tc
      ;[-s * 0.4, -s * 0.22, -s * 0.04, s * 0.14, s * 0.32].forEach((bx) => {
        ctx.fillRect(bx, -s * 0.12, s * 0.11, s * 0.16)
      })

      // Arch slot inside wall
      ctx.fillStyle = '#263238'
      ctx.beginPath(); ctx.rect(-s * 0.1, s * 0.14, s * 0.2, s * 0.28); ctx.fill()
      ctx.beginPath(); ctx.arc(0, s * 0.14, s * 0.1, Math.PI, 0); ctx.fill()
      break
    }

    case 'stable': {
      // Ground shadow
      ctx.fillStyle = 'rgba(15, 30, 15, 0.25)'
      ctx.beginPath(); ctx.ellipse(0, s * 0.42, s * 0.44, s * 0.1, 0, 0, Math.PI * 2); ctx.fill()
      ctx.shadowColor = 'transparent'

      // Heavy log stable barn walls
      ctx.fillStyle = '#8d6e63'
      ctx.fillRect(-s * 0.38, -s * 0.04, s * 0.76, s * 0.46)

      // Terracotta beautiful stable roof
      ctx.fillStyle = tc
      ctx.beginPath()
      ctx.moveTo(-s * 0.44, -s * 0.04)
      ctx.lineTo(0, -s * 0.42)
      ctx.lineTo(s * 0.44, -s * 0.04)
      ctx.closePath(); ctx.fill()

      // Roof shade highlighting
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'
      ctx.beginPath()
      ctx.moveTo(-s * 0.44, -s * 0.04)
      ctx.lineTo(0, -s * 0.28)
      ctx.lineTo(s * 0.44, -s * 0.04)
      ctx.closePath(); ctx.fill()

      // Open stables bays
      ctx.fillStyle = '#4e342e'
      ctx.fillRect(-s * 0.32, s * 0.08, s * 0.22, s * 0.34)
      ctx.fillRect(s * 0.1, s * 0.08, s * 0.22, s * 0.34)

      // Animated horse/donkey head peeking out bobbing
      const horseBob = Math.sin(time / 280) * s * 0.03
      ctx.fillStyle = '#cfd8dc'
      ctx.beginPath()
      // Left horse bobbing
      ctx.ellipse(-s * 0.21, s * 0.22 + horseBob, s * 0.05, s * 0.08, 0.2, 0, Math.PI * 2); ctx.fill()

      // Fences in front of horse bays
      ctx.strokeStyle = '#5d4037'; ctx.lineWidth = 3
      ctx.beginPath(); ctx.moveTo(-s * 0.35, s * 0.26); ctx.lineTo(-s * 0.07, s * 0.26); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(s * 0.07, s * 0.26); ctx.lineTo(s * 0.35, s * 0.26); ctx.stroke()
      break
    }

    case 'altar': {
      // Ground shadow
      ctx.fillStyle = 'rgba(15, 30, 15, 0.25)'
      ctx.beginPath(); ctx.ellipse(0, s * 0.42, s * 0.36, s * 0.09, 0, 0, Math.PI * 2); ctx.fill()
      ctx.shadowColor = 'transparent'

      // Detailed ancient tiered ash stonework slabs (altar stack)
      ;[
        { y: s * 0.26, w: s * 0.7, h: s * 0.14, c: '#757575' },
        { y: s * 0.16, w: s * 0.56, h: s * 0.12, c: '#9e9e9e' },
        { y: s * 0.06, w: s * 0.42, h: s * 0.11, c: '#bdbdbd' },
      ].forEach(({ y, w, h, c }) => {
        ctx.fillStyle = c
        ctx.fillRect(-w / 2, y, w, h)
        ctx.strokeStyle = '#424242'; ctx.lineWidth = 1.5
        ctx.strokeRect(-w / 2, y, w, h)
      })

      // Gold container rim atop altar
      ctx.fillStyle = tc
      ctx.beginPath(); ctx.ellipse(0, s * 0.06, s * 0.15, s * 0.05, 0, 0, Math.PI * 2); ctx.fill()

      // Crackling high fidelity fire particles & flames animation!
      const firePhaseY = Math.cos(time / 110) * 0.16 + 1.0
      const firePhaseX = Math.sin(time / 90) * 0.15 + 0.85

      const fireBeads = [
        { x: -s * 0.08, h: s * 0.26, c1: '#ff3d00', c2: '#ffea00' },
        { x: 0, h: s * 0.34, c1: '#ff6f00', c2: '#ffff00' },
        { x: s * 0.08, h: s * 0.26, c1: '#ff3d00', c2: '#ffea00' }
      ]

      fireBeads.forEach(({ x, h, c1, c2 }) => {
        ctx.save()
        ctx.translate(x, s * 0.06)
        ctx.scale(firePhaseX, firePhaseY)

        // Outer transparent heat distortion glow
        ctx.fillStyle = 'rgba(255, 87, 34, 0.26)'
        ctx.beginPath()
        ctx.arc(0, -h * 0.4, h * 0.38, 0, Math.PI * 2); ctx.fill()

        // Deep flame cone
        ctx.fillStyle = c1
        ctx.beginPath()
        ctx.moveTo(-s * 0.06, 0)
        ctx.quadraticCurveTo(-s * 0.08, -h * 0.5, 0, -h)
        ctx.quadraticCurveTo(s * 0.08, -h * 0.5, s * 0.06, 0)
        ctx.closePath(); ctx.fill()

        // Core bright yellow combustion cone
        ctx.fillStyle = c2
        ctx.beginPath()
        ctx.moveTo(-s * 0.035, 0)
        ctx.quadraticCurveTo(-s * 0.05, -h * 0.4, 0, -h * 0.7)
        ctx.quadraticCurveTo(s * 0.05, -h * 0.4, s * 0.035, 0)
        ctx.closePath(); ctx.fill()
        ctx.restore()
      })
      break
    }

    case 'camp': {
      // Ground shadow
      ctx.fillStyle = 'rgba(15, 30, 15, 0.25)'
      ctx.beginPath(); ctx.ellipse(0, s * 0.42, s * 0.42, s * 0.1, 0, 0, Math.PI * 2); ctx.fill()
      ctx.shadowColor = 'transparent'

      // Submersion soil floor
      ctx.fillStyle = '#ffcc80'; ctx.globalAlpha = 0.25
      ctx.beginPath(); ctx.ellipse(0, s * 0.35, s * 0.4, s * 0.12, 0, 0, Math.PI * 2); ctx.fill()
      ctx.globalAlpha = 1.0

      // Drawing 3 cute miniature tents inside the camp (Canaan tribal gather)
      const subTents = [
        { tx: -s * 0.22, sc: 0.62, color: tc },
        { tx: 0, sc: 0.74, color: tc },
        { tx: s * 0.22, sc: 0.62, color: tc }
      ]

      subTents.forEach(({ tx, sc, color }) => {
        const ts = s * sc
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.moveTo(tx, s * 0.35 - ts * 0.52)
        ctx.lineTo(tx - ts * 0.26, s * 0.35)
        ctx.lineTo(tx + ts * 0.26, s * 0.35)
        ctx.closePath(); ctx.fill()

        // Inner flap shaded flap
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'
        ctx.beginPath()
        ctx.moveTo(tx, s * 0.35 - ts * 0.52)
        ctx.lineTo(tx - ts * 0.08, s * 0.35 - ts * 0.2)
        ctx.lineTo(tx + ts * 0.08, s * 0.35 - ts * 0.2)
        ctx.closePath(); ctx.fill()
      })

      // Central campfire with dynamic crackling smoke dots rising
      const campfireSizeY = Math.sin(time / 100) * 1.5 + 4
      ctx.fillStyle = '#6d4c41' // Logs
      ctx.fillRect(-s * 0.05, s * 0.3, s * 0.1, s * 0.04)
      ctx.fillStyle = '#ff6f00' // Fire flame dot
      ctx.beginPath(); ctx.arc(0, s * 0.28, campfireSizeY, 0, Math.PI * 2); ctx.fill()
      break
    }

    case 'house': {
      // Ground shadow
      ctx.fillStyle = 'rgba(15, 30, 15, 0.25)'
      ctx.beginPath(); ctx.ellipse(0, s * 0.42, s * 0.4, s * 0.1, 0, 0, Math.PI * 2); ctx.fill()
      ctx.shadowColor = 'transparent'

      // Sandstone blocks walls (Stucco/Terracotta layout style)
      ctx.fillStyle = '#ffe082'
      ctx.fillRect(-s * 0.32, -s * 0.04, s * 0.64, s * 0.46)

      // Red tile terracotta roof block
      ctx.fillStyle = tc
      ctx.beginPath()
      ctx.moveTo(-s * 0.38, -s * 0.04)
      ctx.lineTo(0, -s * 0.44)
      ctx.lineTo(s * 0.38, -s * 0.04)
      ctx.closePath(); ctx.fill()

      // Roof shading
      ctx.fillStyle = 'rgba(255, 255, 255, 0.18)'
      ctx.beginPath()
      ctx.moveTo(-s * 0.38, -s * 0.04)
      ctx.lineTo(0, -s * 0.28)
      ctx.lineTo(s * 0.38, -s * 0.04)
      ctx.closePath(); ctx.fill()

      // Wooden entrance door
      ctx.fillStyle = '#5d4037'
      ctx.fillRect(-s * 0.1, s * 0.14, s * 0.2, s * 0.28)
      ctx.fillStyle = '#ffd54f' // Golden handle
      ctx.beginPath(); ctx.arc(s * 0.06, s * 0.28, 2, 0, Math.PI * 2); ctx.fill()

      // Warm glowing yellow windows (Happy strategy cozy look!)
      const glw = Math.abs(Math.sin(time / 450)) * 0.25 + 0.75
      ctx.fillStyle = `rgba(255, 224, 130, ${glw})`
      ctx.fillRect(-s * 0.25, s * 0.06, s * 0.11, s * 0.11)
      ctx.fillRect(s * 0.14, s * 0.06, s * 0.11, s * 0.11)

      ctx.strokeStyle = '#5d4037'; ctx.lineWidth = 1.2
      ctx.strokeRect(-s * 0.25, s * 0.06, s * 0.11, s * 0.11)
      ctx.strokeRect(s * 0.14, s * 0.06, s * 0.11, s * 0.11)

      // Chimney stack
      ctx.fillStyle = '#8d6e63'
      ctx.fillRect(s * 0.18, -s * 0.34, s * 0.08, s * 0.25)
      ctx.fillStyle = '#3e2723'
      ctx.fillRect(s * 0.16, -s * 0.36, s * 0.12, s * 0.04)

      // Chimney puffing smoke rings animation expanding & rising!
      const smokeCycle = (time / 800) % 3
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)'
      for (let i = 0; i < 3; i++) {
        const age = (smokeCycle + i) % 3
        const rFactor = s * 0.03 + age * s * 0.03
        const smokeY = -s * 0.36 - age * s * 0.12
        const smokeX = s * 0.22 + Math.sin(time / 200 + age) * s * 0.03
        ctx.globalAlpha = Math.max(0, 1.0 - age / 3)
        ctx.beginPath()
        ctx.arc(smokeX, smokeY, rFactor, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1.0
      break
    }

    case 'desert': {
      ctx.shadowColor = 'transparent'
      // Draw flat square that covers the grid block completely without borders or shadows
      ctx.fillStyle = '#E4D5B1' // Dry warm desert sand
      ctx.fillRect(-s * 0.5, -s * 0.5, s, s)

      // Very subtle wind ripples inside but no border
      ctx.strokeStyle = '#D5BFA2'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(-s * 0.4, -s * 0.25)
      ctx.quadraticCurveTo(0, -s * 0.35, s * 0.4, -s * 0.25)
      ctx.moveTo(-s * 0.3, s * 0.25)
      ctx.quadraticCurveTo(0, s * 0.15, s * 0.3, s * 0.25)
      ctx.stroke()

      // Cute tiny desert scrub cactus inside (not wiggly)
      ctx.fillStyle = '#6E8E3D'
      ctx.fillRect(-3, -s * 0.12, 6, s * 0.24)
      ctx.fillRect(-7, -s * 0.06, 4, 3)
      ctx.fillRect(3, s * 0.01, 4, 3)
      break
    }

    case 'rocky_land': {
      ctx.shadowColor = 'transparent'
      // Draw flat square that covers the grid block completely without borders or shadows
      ctx.fillStyle = '#78909c' // Slate/rock gray base
      ctx.fillRect(-s * 0.5, -s * 0.5, s, s)

      // Very subtle cracked rock lines to look contiguous when placed side-by-side
      ctx.strokeStyle = '#546e7a'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      // Isometric rock cracks
      ctx.moveTo(-s * 0.5, -s * 0.2)
      ctx.lineTo(s * 0.5, -s * 0.2)
      ctx.moveTo(-s * 0.2, -s * 0.5)
      ctx.lineTo(-s * 0.2, s * 0.5)
      ctx.moveTo(s * 0.3, -s * 0.5)
      ctx.lineTo(s * 0.3, s * 0.5)
      ctx.stroke()

      // Some little 3D rocky pyramids/pillars resting on top
      ctx.fillStyle = '#90a4ae'
      ctx.beginPath()
      ctx.moveTo(-s * 0.15, s * 0.1)
      ctx.lineTo(0, -s * 0.2)
      ctx.lineTo(s * 0.15, s * 0.1)
      ctx.closePath(); ctx.fill()

      // Shading facet on right of rock peak
      ctx.fillStyle = '#455a64'
      ctx.beginPath()
      ctx.moveTo(0, s * 0.1)
      ctx.lineTo(0, -s * 0.2)
      ctx.lineTo(s * 0.15, s * 0.1)
      ctx.closePath(); ctx.fill()
      break
    }

    case 'pasture': {
      ctx.shadowColor = 'transparent'
      // Solid rich green background represent pure shepherding green grass only
      ctx.fillStyle = '#228B22' // Forest Green
      ctx.fillRect(-s * 0.5, -s * 0.5, s, s)

      // Highlight inner area
      ctx.fillStyle = '#32CD32' // Lime Green
      ctx.fillRect(-s * 0.42, -s * 0.42, s * 0.84, s * 0.84)

      // Light green details for beautiful blades of grass
      ctx.strokeStyle = '#7FFF00' // Chartreuse
      ctx.lineWidth = 2.5
      const grassOffsets = [
        { x: -s * 0.25, y: -s * 0.25 },
        { x: s * 0.25, y: -s * 0.2 },
        { x: -s * 0.15, y: s * 0.2 },
        { x: s * 0.2, y: s * 0.25 },
        { x: 0, y: 0 }
      ]
      grassOffsets.forEach(g => {
        ctx.beginPath()
        ctx.moveTo(g.x, g.y + s * 0.08)
        ctx.quadraticCurveTo(g.x - s * 0.05, g.y - s * 0.05, g.x - s * 0.08, g.y - s * 0.06)
        ctx.moveTo(g.x, g.y + s * 0.08)
        ctx.quadraticCurveTo(g.x, g.y - s * 0.08, g.x, g.y - s * 0.1)
        ctx.moveTo(g.x, g.y + s * 0.08)
        ctx.quadraticCurveTo(g.x + s * 0.05, g.y - s * 0.05, g.x + s * 0.08, g.y - s * 0.06)
        ctx.stroke()
      })
      break
    }

    case 'chicken': {
      const birdBounce = Math.sin(time / 160) * s * 0.04
      ctx.save()
      ctx.translate(0, -Math.abs(birdBounce))

      // Shadow
      ctx.fillStyle = 'rgba(15, 30, 15, 0.2)'
      ctx.beginPath(); ctx.ellipse(0, s * 0.3, s * 0.18, s * 0.06, 0, 0, Math.PI * 2); ctx.fill()
      ctx.shadowColor = 'transparent'

      // Round white/fat body
      ctx.fillStyle = '#FFF8E7'
      ctx.beginPath(); ctx.arc(-s * 0.04, s * 0.08, s * 0.16, 0, Math.PI * 2); ctx.fill()

      // Cute wing
      ctx.fillStyle = '#FFE4B5'
      ctx.beginPath(); ctx.ellipse(-s * 0.03, s * 0.1, s * 0.09, s * 0.06, Math.PI / 8, 0, Math.PI * 2); ctx.fill()

      // Red crown on head
      ctx.fillStyle = '#FF3333'
      ctx.beginPath()
      ctx.arc(-s * 0.1, -s * 0.18, s * 0.03, 0, Math.PI * 2)
      ctx.arc(-s * 0.15, -s * 0.15, s * 0.04, 0, Math.PI * 2)
      ctx.arc(-s * 0.05, -s * 0.15, s * 0.03, 0, Math.PI * 2)
      ctx.fill()

      // Head
      ctx.fillStyle = '#FFFFFF'
      ctx.beginPath(); ctx.arc(-s * 0.1, -s * 0.06, s * 0.09, 0, Math.PI * 2); ctx.fill()

      // Yellow/Orange bill
      ctx.fillStyle = '#FF9800'
      ctx.beginPath()
      ctx.moveTo(-s * 0.18, -s * 0.08)
      ctx.lineTo(-s * 0.26, -s * 0.04)
      ctx.lineTo(-s * 0.18, 0)
      ctx.closePath(); ctx.fill()

      // Black tiny eye
      ctx.fillStyle = '#000000'
      ctx.beginPath(); ctx.arc(-s * 0.13, -s * 0.08, 1.8, 0, Math.PI * 2); ctx.fill()

      // Legs/Feet
      ctx.strokeStyle = '#FF9800'; ctx.lineWidth = 2.5
      ctx.beginPath()
      ctx.moveTo(-s * 0.08, s * 0.22); ctx.lineTo(-s * 0.08, s * 0.3)
      ctx.moveTo(s * 0.02, s * 0.22); ctx.lineTo(s * 0.02, s * 0.3)
      ctx.stroke()

      ctx.restore()
      break
    }

    case 'rabbit': {
      const rHop = Math.max(0, Math.sin(time / 240)) * s * 0.08
      ctx.save()
      ctx.translate(0, -rHop)

      // Shadow
      ctx.fillStyle = 'rgba(15, 30, 15, 0.2)'
      ctx.beginPath(); ctx.ellipse(0, s * 0.3, s * 0.19, s * 0.06, 0, 0, Math.PI * 2); ctx.fill()
      ctx.shadowColor = 'transparent'

      // Fluffy gray / white body
      ctx.fillStyle = '#ECEFF1'
      ctx.beginPath(); ctx.ellipse(-s * 0.04, s * 0.12, s * 0.15, s * 0.11, 0, 0, Math.PI * 2); ctx.fill()

      // Tail
      ctx.fillStyle = '#FFFFFF'
      ctx.beginPath(); ctx.arc(s * 0.1, s * 0.08, s * 0.04, 0, Math.PI * 2); ctx.fill()

      // Head
      ctx.fillStyle = '#ECEFF1'
      ctx.beginPath(); ctx.arc(-s * 0.14, s * 0.04, s * 0.08, 0, Math.PI * 2); ctx.fill()

      // Ear wiggles animation
      const earSwing = Math.sin(time / 140) * 0.1
      ctx.save()
      ctx.translate(-s * 0.14, -s * 0.02)
      ctx.rotate(earSwing)
      ctx.fillStyle = '#ECEFF1'
      ctx.beginPath(); ctx.ellipse(-s * 0.02, -s * 0.1, s * 0.03, s * 0.09, 0, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#FFCDD2' // Pink inner ear
      ctx.beginPath(); ctx.ellipse(-s * 0.02, -s * 0.1, s * 0.015, s * 0.07, 0, 0, Math.PI * 2); ctx.fill()
      ctx.restore()

      // Red tiny eye
      ctx.fillStyle = '#E91E63'
      ctx.beginPath(); ctx.arc(-s * 0.17, s * 0.02, 2, 0, Math.PI * 2); ctx.fill()

      // Stubby feet
      ctx.fillStyle = '#CFD8DC'
      ctx.beginPath()
      ctx.ellipse(-s * 0.08, s * 0.22, s * 0.04, s * 0.03, 0, 0, Math.PI * 2)
      ctx.ellipse(s * 0.01, s * 0.22, s * 0.04, s * 0.03, 0, 0, Math.PI * 2)
      ctx.fill()

      ctx.restore()
      break
    }

    case 'goat': {
      const goatWiggle = Math.sin(time / 280) * 0.02
      ctx.save()
      ctx.scale(1.0 + goatWiggle, 1.0 - goatWiggle)

      // Shadow
      ctx.fillStyle = 'rgba(15, 30, 15, 0.2)'
      ctx.beginPath(); ctx.ellipse(0, s * 0.32, s * 0.25, s * 0.08, 0, 0, Math.PI * 2); ctx.fill()
      ctx.shadowColor = 'transparent'

      // Grey Body
      ctx.fillStyle = '#90A4AE'
      ctx.beginPath(); ctx.ellipse(0, s * 0.08, s * 0.22, s * 0.14, 0, 0, Math.PI * 2); ctx.fill()

      // Head
      ctx.beginPath(); ctx.ellipse(-s * 0.16, -s * 0.02, s * 0.07, s * 0.08, Math.PI / 10, 0, Math.PI * 2); ctx.fill()

      // Curved grey horns
      ctx.strokeStyle = '#37474F'; ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(-s * 0.13, -s * 0.1, s * 0.04, Math.PI, Math.PI * 1.5)
      ctx.stroke()

      // Little cute beard
      ctx.strokeStyle = '#F5F5F5'; ctx.lineWidth = 2.5
      ctx.beginPath(); ctx.moveTo(-s * 0.2, s * 0.04); ctx.lineTo(-s * 0.22, s * 0.1); ctx.stroke()

      // 4 Black Legs
      ctx.fillStyle = '#37474F'
      ctx.fillRect(-s * 0.12, s * 0.18, s * 0.04, s * 0.12)
      ctx.fillRect(-s * 0.05, s * 0.19, s * 0.04, s * 0.11)
      ctx.fillRect(s * 0.05, s * 0.19, s * 0.04, s * 0.11)
      ctx.fillRect(s * 0.12, s * 0.18, s * 0.04, s * 0.12)

      ctx.restore()
      break
    }

    case 'horse': {
      const horseBounce = Math.sin(time / 200) * s * 0.02
      ctx.save()
      ctx.translate(0, -Math.abs(horseBounce))

      // Shadow
      ctx.fillStyle = 'rgba(15, 30, 15, 0.24)'
      ctx.beginPath(); ctx.ellipse(0, s * 0.35, s * 0.3, s * 0.08, 0, 0, Math.PI * 2); ctx.fill()
      ctx.shadowColor = 'transparent'

      // Brown sturdy body
      ctx.fillStyle = '#8D6E63'
      ctx.beginPath(); ctx.ellipse(0, s * 0.08, s * 0.26, s * 0.16, 0, 0, Math.PI * 2); ctx.fill()

      // Stately long neck
      ctx.beginPath()
      ctx.moveTo(-s * 0.22, s * 0.06)
      ctx.lineTo(-s * 0.14, -s * 0.18)
      ctx.lineTo(-s * 0.04, -s * 0.12)
      ctx.lineTo(-s * 0.12, s * 0.14)
      ctx.closePath(); ctx.fill()

      // Head
      ctx.beginPath(); ctx.ellipse(-s * 0.18, -s * 0.18, s * 0.09, s * 0.06, -Math.PI / 12, 0, Math.PI * 2); ctx.fill()

      // Dark Mane
      ctx.fillStyle = '#3E2723'
      ctx.beginPath()
      ctx.moveTo(-s * 0.12, -s * 0.14)
      ctx.quadraticCurveTo(-s * 0.04, -s * 0.08, -s * 0.06, s * 0.1)
      ctx.lineTo(-s * 0.12, s * 0.1)
      ctx.closePath(); ctx.fill()

      // Legs
      ctx.fillStyle = '#3E2723'
      ctx.fillRect(-s * 0.15, s * 0.2, s * 0.05, s * 0.15)
      ctx.fillRect(-s * 0.06, s * 0.21, s * 0.05, s * 0.14)
      ctx.fillRect(s * 0.06, s * 0.21, s * 0.05, s * 0.14)
      ctx.fillRect(s * 0.15, s * 0.2, s * 0.05, s * 0.15)

      // Tail
      ctx.strokeStyle = '#3E2723'; ctx.lineWidth = 4
      ctx.beginPath()
      ctx.moveTo(s * 0.24, s * 0.06)
      ctx.quadraticCurveTo(s * 0.35, s * 0.12, s * 0.32, s * 0.25)
      ctx.stroke()

      ctx.restore()
      break
    }

    case 'donkey': {
      const dWiggle = Math.sin(time / 220) * 0.02
      ctx.save()
      ctx.scale(1.0, 1.0 + dWiggle)

      // Shadow
      ctx.fillStyle = 'rgba(15, 30, 15, 0.2)'
      ctx.beginPath(); ctx.ellipse(0, s * 0.34, s * 0.28, s * 0.08, 0, 0, Math.PI * 2); ctx.fill()
      ctx.shadowColor = 'transparent'

      // Grey sturdy body
      ctx.fillStyle = '#78909C'
      ctx.beginPath(); ctx.ellipse(0, s * 0.08, s * 0.25, s * 0.15, 0, 0, Math.PI * 2); ctx.fill()

      // Neck
      ctx.beginPath()
      ctx.moveTo(-s * 0.2, s * 0.06)
      ctx.lineTo(-s * 0.13, -s * 0.16)
      ctx.lineTo(-s * 0.04, -s * 0.1)
      ctx.lineTo(-s * 0.12, s * 0.12)
      ctx.closePath(); ctx.fill()

      // Head
      ctx.fillStyle = '#78909C'
      ctx.beginPath(); ctx.ellipse(-s * 0.17, -s * 0.16, s * 0.08, s * 0.06, -Math.PI / 12, 0, Math.PI * 2); ctx.fill()

      // Long beautiful donkey ears
      ctx.fillStyle = '#546E7A'
      ctx.beginPath()
      ctx.ellipse(-s * 0.14, -s * 0.25, s * 0.025, s * 0.07, -Math.PI / 18, 0, Math.PI * 2)
      ctx.ellipse(-s * 0.18, -s * 0.24, s * 0.025, s * 0.07, -Math.PI / 10, 0, Math.PI * 2)
      ctx.fill()

      // Legs
      ctx.fillStyle = '#37474F'
      ctx.fillRect(-s * 0.15, s * 0.2, s * 0.05, s * 0.14)
      ctx.fillRect(-s * 0.06, s * 0.21, s * 0.05, s * 0.13)
      ctx.fillRect(s * 0.06, s * 0.21, s * 0.05, s * 0.13)
      ctx.fillRect(s * 0.15, s * 0.2, s * 0.05, s * 0.14)

      ctx.restore()
      break
    }

    case 'pig': {
      const pBreathe = 1.0 + Math.sin(time / 200) * 0.02
      ctx.save()
      ctx.scale(pBreathe, pBreathe)

      // Shadow
      ctx.fillStyle = 'rgba(15, 30, 15, 0.18)'
      ctx.beginPath(); ctx.ellipse(0, s * 0.32, s * 0.26, s * 0.08, 0, 0, Math.PI * 2); ctx.fill()
      ctx.shadowColor = 'transparent'

      // Cute Pink plump body
      ctx.fillStyle = '#FF8A80' // Piggy Pink
      ctx.beginPath(); ctx.ellipse(0, s * 0.08, s * 0.24, s * 0.17, 0, 0, Math.PI * 2); ctx.fill()

      // Head
      ctx.beginPath(); ctx.arc(-s * 0.18, s * 0.05, s * 0.1, 0, Math.PI * 2); ctx.fill()

      // Snout
      ctx.fillStyle = '#FF5252'
      ctx.beginPath()
      ctx.roundRect(-s * 0.28, s * 0.04, s * 0.07, s * 0.06, 3)
      ctx.fill()

      // Snout holes
      ctx.fillStyle = '#3E2723'
      ctx.beginPath()
      ctx.arc(-s * 0.26, s * 0.06, 1.2, 0, Math.PI * 2)
      ctx.arc(-s * 0.24, s * 0.08, 1.2, 0, Math.PI * 2)
      ctx.fill()

      // Small pink ears
      ctx.fillStyle = '#FF5252'
      ctx.beginPath()
      ctx.ellipse(-s * 0.14, -s * 0.05, s * 0.025, s * 0.04, -Math.PI / 6, 0, Math.PI * 2)
      ctx.fill()

      // Curly tail
      ctx.strokeStyle = '#FF5252'; ctx.lineWidth = 2.5
      ctx.beginPath()
      ctx.arc(s * 0.24, s * 0.06, s * 0.03, 0, Math.PI * 1.5)
      ctx.stroke()

      // Tiny legs
      ctx.fillStyle = '#FF5252'
      ctx.fillRect(-s * 0.14, s * 0.22, s * 0.04, s * 0.08)
      ctx.fillRect(-s * 0.06, s * 0.23, s * 0.04, s * 0.07)
      ctx.fillRect(s * 0.06, s * 0.23, s * 0.04, s * 0.07)
      ctx.fillRect(s * 0.14, s * 0.22, s * 0.04, s * 0.08)

      ctx.restore()
      break
    }

    case 'duck': {
      const duckWaddle = Math.sin(time / 180) * s * 0.03
      ctx.save()
      ctx.translate(0, -Math.abs(duckWaddle))

      // Shadow
      ctx.fillStyle = 'rgba(15, 30, 15, 0.16)'
      ctx.beginPath(); ctx.ellipse(0, s * 0.28, s * 0.18, s * 0.06, 0, 0, Math.PI * 2); ctx.fill()
      ctx.shadowColor = 'transparent'

      // Duck white body
      ctx.fillStyle = '#FFFFFF'
      ctx.beginPath(); ctx.ellipse(-s * 0.02, s * 0.08, s * 0.15, s * 0.1, 0, 0, Math.PI * 2); ctx.fill()

      // Cute neck & head
      ctx.beginPath()
      ctx.arc(-s * 0.12, s * 0.02, s * 0.07, 0, Math.PI * 2); ctx.fill()

      // Orange Bill
      ctx.fillStyle = '#FF9800'
      ctx.beginPath()
      ctx.ellipse(-s * 0.18, s * 0.02, s * 0.05, s * 0.025, 0, 0, Math.PI * 2); ctx.fill()

      // Tiny eye
      ctx.fillStyle = '#212121'
      ctx.beginPath(); ctx.arc(-s * 0.13, 0, 1.5, 0, Math.PI * 2); ctx.fill()

      // Duck Tail
      ctx.fillStyle = '#FFFFFF'
      ctx.beginPath()
      ctx.moveTo(s * 0.1, s * 0.06)
      ctx.lineTo(s * 0.18, s * 0.02)
      ctx.lineTo(s * 0.12, s * 0.12)
      ctx.closePath(); ctx.fill()

      ctx.restore()
      break
    }

    case 'dog': {
      const dogTail = Math.sin(time / 100) * 0.4
      ctx.save()

      // Shadow
      ctx.fillStyle = 'rgba(15, 30, 15, 0.2)'
      ctx.beginPath(); ctx.ellipse(0, s * 0.32, s * 0.24, s * 0.07, 0, 0, Math.PI * 2); ctx.fill()
      ctx.shadowColor = 'transparent'

      // Golden retriever body
      ctx.fillStyle = '#FFA726'
      ctx.beginPath(); ctx.ellipse(0, s * 0.08, s * 0.22, s * 0.13, 0, 0, Math.PI * 2); ctx.fill()

      // Head
      ctx.beginPath(); ctx.arc(-s * 0.16, s * 0.02, s * 0.08, 0, Math.PI * 2); ctx.fill()

      // Muzzle
      ctx.beginPath(); ctx.ellipse(-s * 0.22, s * 0.04, s * 0.04, s * 0.03, 0, 0, Math.PI * 2); ctx.fill()

      // Black tip mouth/nose
      ctx.fillStyle = '#212121'
      ctx.beginPath(); ctx.arc(-s * 0.24, s * 0.03, 2, 0, Math.PI * 2); ctx.fill()

      // Cute floppy ears
      ctx.fillStyle = '#E65100'
      ctx.beginPath(); ctx.ellipse(-s * 0.14, s * 0.02, s * 0.02, s * 0.05, 0, 0, Math.PI * 2); ctx.fill()

      // Four dark stub legs
      ctx.fillStyle = '#FFA726'
      ctx.fillRect(-s * 0.12, s * 0.18, s * 0.04, s * 0.10)
      ctx.fillRect(-s * 0.05, s * 0.19, s * 0.04, s * 0.09)
      ctx.fillRect(s * 0.05, s * 0.19, s * 0.04, s * 0.09)
      ctx.fillRect(s * 0.12, s * 0.18, s * 0.04, s * 0.10)

      // Wagging tail animation!
      ctx.save()
      ctx.translate(s * 0.18, s * 0.05)
      ctx.rotate(dogTail)
      ctx.fillStyle = '#FFA726'
      ctx.beginPath()
      ctx.ellipse(s * 0.05, -s * 0.05, s * 0.02, s * 0.06, Math.PI / 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()

      ctx.restore()
      break
    }

    case 'cat': {
      const catTail = Math.sin(time / 140) * 0.3
      ctx.save()

      // Shadow
      ctx.fillStyle = 'rgba(15, 30, 15, 0.16)'
      ctx.beginPath(); ctx.ellipse(0, s * 0.32, s * 0.2, s * 0.06, 0, 0, Math.PI * 2); ctx.fill()
      ctx.shadowColor = 'transparent'

      // Sleek orange cat body
      ctx.fillStyle = '#FF7043'
      ctx.beginPath(); ctx.ellipse(0, s * 0.1, s * 0.18, s * 0.1, 0, 0, Math.PI * 2); ctx.fill()

      // Head
      ctx.beginPath(); ctx.arc(-s * 0.13, s * 0.04, s * 0.07, 0, Math.PI * 2); ctx.fill()

      // Pointy cute ears
      ctx.beginPath()
      ctx.moveTo(-s * 0.17, -s * 0.02)
      ctx.lineTo(-s * 0.18, -s * 0.08)
      ctx.lineTo(-s * 0.13, -s * 0.02)
      ctx.fill()
      ctx.beginPath()
      ctx.moveTo(-s * 0.12, -s * 0.02)
      ctx.lineTo(-s * 0.09, -s * 0.08)
      ctx.lineTo(-s * 0.09, -s * 0.02)
      ctx.fill()

      // Whiskers
      ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(-s * 0.17, s * 0.05); ctx.lineTo(-s * 0.24, s * 0.04)
      ctx.moveTo(-s * 0.17, s * 0.06); ctx.lineTo(-s * 0.25, s * 0.07)
      ctx.stroke()

      // Four small legs
      ctx.fillStyle = '#D84315'
      ctx.fillRect(-s * 0.1, s * 0.18, s * 0.03, s * 0.08)
      ctx.fillRect(-s * 0.04, s * 0.18, s * 0.03, s * 0.08)
      ctx.fillRect(s * 0.04, s * 0.18, s * 0.03, s * 0.08)
      ctx.fillRect(s * 0.09, s * 0.18, s * 0.03, s * 0.08)

      // Curling Tail animation
      ctx.save()
      ctx.translate(s * 0.14, s * 0.08)
      ctx.rotate(catTail)
      ctx.strokeStyle = '#FF7043'; ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.quadraticCurveTo(s * 0.06, -s * 0.1, s * 0.02, -s * 0.18)
      ctx.stroke()
      ctx.restore()

      ctx.restore()
      break
    }

    case 'cow': {
      // breathing scale oscillation
      const cowBreathe = 1.0 + Math.sin(time / 320) * 0.025
      const cowHop = Math.max(0, Math.sin(time / 450)) * s * 0.03

      ctx.save()
      ctx.scale(cowBreathe, cowBreathe)
      ctx.translate(0, -cowHop)

      // Shadow
      ctx.fillStyle = 'rgba(15, 30, 15, 0.25)'
      ctx.beginPath(); ctx.ellipse(0, s * 0.32, s * 0.32, s * 0.09, 0, 0, Math.PI * 2); ctx.fill()
      ctx.shadowColor = 'transparent'

      // Chunky black-and-white rounded isometric cow body
      ctx.fillStyle = '#ffffff'
      ctx.beginPath(); ctx.ellipse(0, s * 0.08, s * 0.26, s * 0.18, 0, 0, Math.PI * 2); ctx.fill()

      // Spotted black markings on hide
      ctx.fillStyle = '#212121'
      ctx.beginPath(); ctx.arc(-s * 0.1, s * 0.02, s * 0.09, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(s * 0.08, s * 0.12, s * 0.08, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(0, s * 0.04, s * 0.06, 0, Math.PI * 2); ctx.fill()

      // Four small black stub legs
      ctx.fillStyle = '#212121'
      ctx.fillRect(-s * 0.18, s * 0.2, s * 0.05, s * 0.1)
      ctx.fillRect(-s * 0.08, s * 0.22, s * 0.05, s * 0.08)
      ctx.fillRect(s * 0.06, s * 0.22, s * 0.05, s * 0.08)
      ctx.fillRect(s * 0.14, s * 0.2, s * 0.05, s * 0.1)

      // Friendly pink nose face structure peeking out right-directed
      ctx.fillStyle = '#ffffff'
      ctx.beginPath(); ctx.arc(-s * 0.2, s * 0.02, s * 0.09, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#ff8a80' // Pink muzzle
      ctx.beginPath(); ctx.arc(-s * 0.25, s * 0.05, s * 0.06, 0, Math.PI * 2); ctx.fill()

      // Cute horns
      ctx.strokeStyle = '#b0bec5'; ctx.lineWidth = 2.5
      ctx.beginPath(); ctx.arc(-s * 0.18, -s * 0.06, s * 0.03, Math.PI, Math.PI * 1.6); ctx.stroke()

      // Tail wiggles animation
      const tailWobble = Math.sin(time / 140) * 0.4
      ctx.save()
      ctx.translate(s * 0.24, s * 0.08)
      ctx.rotate(tailWobble)
      ctx.strokeStyle = '#212121'; ctx.lineWidth = 3
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(s * 0.08, s * 0.05); ctx.stroke()
      ctx.restore()

      ctx.restore()
      break
    }

    case 'sheep': {
      // cloud breathing scale oscillation & bounding hop
      const sheepBreathe = 1.0 + Math.sin(time / 280) * 0.03
      const sheepHop = Math.max(0, Math.sin(time / 300)) * s * 0.06

      ctx.save()
      ctx.scale(sheepBreathe, sheepBreathe)
      ctx.translate(0, -sheepHop)

      // Shadow
      ctx.fillStyle = 'rgba(15, 30, 15, 0.25)'
      ctx.beginPath(); ctx.ellipse(0, s * 0.32, s * 0.26, s * 0.08, 0, 0, Math.PI * 2); ctx.fill()
      ctx.shadowColor = 'transparent'

      // Fluffy woolly puff balls body
      ctx.fillStyle = '#eceff1'
      const puffs = [
        { cx: 0, cy: s * 0.06, r: s * 0.15 },
        { cx: -s * 0.12, cy: s * 0.08, r: s * 0.12 },
        { cx: s * 0.12, cy: s * 0.08, r: s * 0.12 },
        { cx: -s * 0.08, cy: -s * 0.02, r: s * 0.11 },
        { cx: s * 0.08, cy: -s * 0.02, r: s * 0.11 },
        { cx: 0, cy: -s * 0.04, r: s * 0.12 }
      ]
      puffs.forEach(p => {
        ctx.beginPath(); ctx.arc(p.cx, p.cy, p.r, 0, Math.PI * 2); ctx.fill()
      })

      // Little dark sheep legs
      ctx.fillStyle = '#37474f'
      ctx.fillRect(-s * 0.1, s * 0.18, s * 0.04, s * 0.1)
      ctx.fillRect(-s * 0.04, s * 0.19, s * 0.04, s * 0.09)
      ctx.fillRect(s * 0.04, s * 0.19, s * 0.04, s * 0.09)
      ctx.fillRect(s * 0.08, s * 0.18, s * 0.04, s * 0.1)

      // Dark cute head sticking out leftwards
      ctx.fillStyle = '#37474f'
      ctx.beginPath(); ctx.ellipse(-s * 0.16, s * 0.06, s * 0.07, s * 0.08, -0.3, 0, Math.PI * 2); ctx.fill()

      // Floppy pink ears trace wiggling
      const earOsc = Math.sin(time / 200) * 0.2
      ctx.fillStyle = '#ff8a80'
      ctx.save()
      ctx.translate(-s * 0.18, s * 0.01)
      ctx.rotate(earOsc)
      ctx.beginPath(); ctx.ellipse(0, 0, s * 0.02, s * 0.04, 0.4, 0, Math.PI * 2); ctx.fill()
      ctx.restore()

      ctx.restore()
      break
    }

    case 'birds': {
      ctx.shadowColor = 'transparent'
      // Birds soaring circular paths on tiles
      const flightRadius = s * 0.4
      const birdCycleVal = (time / 1200) % (Math.PI * 2)

      const wingFlap = Math.sin(time / 100) * s * 0.12
      const drawOneBird = (bx: number, by: number, scaleVal: number) => {
        ctx.save()
        ctx.translate(bx, by)
        ctx.scale(scaleVal, scaleVal)

        // Shaded wings beating up and down
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        // Left wing
        ctx.moveTo(0, 0)
        ctx.quadraticCurveTo(-s * 0.15, -wingFlap, -s * 0.24, -s * 0.04)
        ctx.quadraticCurveTo(-s * 0.12, -s * 0.02, 0, 0)
        // Right wing
        ctx.quadraticCurveTo(s * 0.15, -wingFlap, s * 0.24, -s * 0.04)
        ctx.quadraticCurveTo(s * 0.12, -s * 0.02, 0, 0)
        ctx.closePath(); ctx.fill()

        // Bird head
        ctx.fillStyle = '#ffb300'
        ctx.beginPath(); ctx.arc(0, -s * 0.06, 3, 0, Math.PI * 2); ctx.fill()
        ctx.restore()
      }

      // Orbital flights coordinate calculation
      const bx1 = Math.cos(birdCycleVal) * flightRadius
      const by1 = Math.sin(birdCycleVal) * flightRadius * 0.5 - s * 0.2
      const bx2 = Math.cos(birdCycleVal + Math.PI) * (flightRadius * 0.8)
      const by2 = Math.sin(birdCycleVal + Math.PI) * (flightRadius * 0.4) - s * 0.3

      drawOneBird(bx1, by1, 1.0)
      drawOneBird(bx2, by2, 0.85)
      break
    }

    case 'gate': {
      // Ground shadow
      ctx.fillStyle = 'rgba(15, 30, 15, 0.25)'
      ctx.beginPath(); ctx.ellipse(0, s * 0.4, s * 0.44, s * 0.1, 0, 0, Math.PI * 2); ctx.fill()
      ctx.shadowColor = 'transparent'

      // Left Pillar Limestone block
      ctx.fillStyle = '#78909c'
      ctx.fillRect(-s * 0.38, -s * 0.24, s * 0.13, s * 0.62)
      // Right Pillar
      ctx.fillRect(s * 0.25, -s * 0.24, s * 0.13, s * 0.62)

      // Column Caps with team colors
      ctx.fillStyle = tc
      ctx.fillRect(-s * 0.42, -s * 0.32, s * 0.21, s * 0.1)
      ctx.fillRect(s * 0.21, -s * 0.32, s * 0.21, s * 0.1)

      // Wrought steel/wood gates swung slightly inwards
      const doorSwingRatio = Math.sin(time / 600) * s * 0.04 + s * 0.18
      ctx.fillStyle = '#5d4037'
      // Left gate
      ctx.fillRect(-s * 0.25, s * 0.02, doorSwingRatio, s * 0.32)
      ctx.strokeStyle = '#212121'; ctx.lineWidth = 1.5
      ctx.strokeRect(-s * 0.25, s * 0.02, doorSwingRatio, s * 0.32)

      // Right gate
      ctx.fillRect(s * 0.25 - doorSwingRatio, s * 0.02, doorSwingRatio, s * 0.32)
      ctx.strokeRect(s * 0.25 - doorSwingRatio, s * 0.02, doorSwingRatio, s * 0.32)

      // Golden Ring handles
      ctx.strokeStyle = '#ffd54f'; ctx.lineWidth = 2
      ctx.beginPath(); ctx.arc(-s * 0.25 + doorSwingRatio - 4, s * 0.18, 4, 0, Math.PI * 2); ctx.stroke()
      ctx.beginPath(); ctx.arc(s * 0.25 - doorSwingRatio + 4, s * 0.18, 4, 0, Math.PI * 2); ctx.stroke()
      break
    }

    case 'olive_press': {
      // Ground shadow
      ctx.fillStyle = 'rgba(15, 30, 15, 0.22)'
      ctx.beginPath(); ctx.ellipse(0, s * 0.38, s * 0.38, s * 0.1, 0, 0, Math.PI * 2); ctx.fill()
      ctx.shadowColor = 'transparent'

      // Stone tiled floor circular base
      ctx.fillStyle = '#90a4ae'
      ctx.beginPath(); ctx.ellipse(0, s * 0.22, s * 0.32, s * 0.12, 0, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#607d8b'
      ctx.fillRect(-s * 0.32, s * 0.08, s * 0.64, s * 0.14)
      ctx.fillStyle = '#b0bec5'
      ctx.beginPath(); ctx.ellipse(0, s * 0.08, s * 0.32, s * 0.12, 0, 0, Math.PI * 2); ctx.fill()

      // Central stone pressing wheel & wooden beam
      ctx.fillStyle = '#455a64'
      // Pressing wheel (looks like stone mill)
      ctx.beginPath(); ctx.ellipse(-s * 0.08, -s * 0.05, s * 0.08, s * 0.16, Math.PI / 6, 0, Math.PI * 2); ctx.fill()
      ctx.strokeStyle = '#263238'; ctx.lineWidth = 1.5
      ctx.stroke()

      // Wooden beam
      ctx.strokeStyle = '#5d4037'; ctx.lineWidth = 4
      ctx.beginPath(); ctx.moveTo(-s * 0.28, s * 0.05); ctx.lineTo(s * 0.24, -s * 0.1); ctx.stroke()

      // Clay amphora olive oil jars (terracotta color)
      ctx.fillStyle = '#d84315'
      ctx.beginPath(); ctx.ellipse(s * 0.18, s * 0.18, s * 0.08, s * 0.11, 0, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#ff7043'
      ctx.beginPath(); ctx.arc(s * 0.18, s * 0.08, s * 0.05, 0, Math.PI * 2); ctx.fill()
      // Jar neck
      ctx.fillStyle = '#d84315'
      ctx.fillRect(s * 0.14, s * 0.02, s * 0.08, s * 0.06)

      // Spilled golden olive oil drop with simple blinking glow animation
      const spillGlow = Math.abs(Math.sin(time / 200)) * 2 + 1
      ctx.fillStyle = '#ffd54f' // Pure yellow oil
      ctx.shadowColor = '#ffb300'
      ctx.shadowBlur = spillGlow
      ctx.beginPath(); ctx.ellipse(0, s * 0.12, s * 0.04, s * 0.025, 0, 0, Math.PI * 2); ctx.fill()
      break
    }

    case 'barracks': {
      // Ground shadow
      ctx.fillStyle = 'rgba(15, 30, 15, 0.25)'
      ctx.beginPath(); ctx.ellipse(0, s * 0.42, s * 0.44, s * 0.1, 0, 0, Math.PI * 2); ctx.fill()
      ctx.shadowColor = 'transparent'

      // Sturdy dark iron-slate walls
      ctx.fillStyle = '#455a64'
      ctx.fillRect(-s * 0.38, -s * 0.05, s * 0.76, s * 0.46)

      // Heavy defense rampart battlements top
      ctx.fillStyle = tc
      ctx.fillRect(-s * 0.42, -s * 0.15, s * 0.84, s * 0.1)
      ;[-s * 0.38, -s * 0.14, s * 0.1, s * 0.28].forEach(bx => {
        ctx.fillRect(bx, -s * 0.25, s * 0.1, s * 0.1)
      })

      // Large iron fortified double door
      ctx.fillStyle = '#263238'
      ctx.fillRect(-s * 0.15, s * 0.12, s * 0.3, s * 0.29)
      ctx.strokeStyle = '#cfd8dc'; ctx.lineWidth = 1.5
      ctx.strokeRect(-s * 0.15, s * 0.12, s * 0.3, s * 0.29)

      // Mounted crossed bronze spears behind a round shield above the door
      ctx.strokeStyle = '#b87333'; ctx.lineWidth = 2.5
      ctx.beginPath(); ctx.moveTo(-s * 0.24, s * 0.04); ctx.lineTo(s * 0.24, -s * 0.08); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(s * 0.24, s * 0.04); ctx.lineTo(-s * 0.24, -s * 0.08); ctx.stroke()

      // Shield center
      ctx.fillStyle = '#ffb300'
      ctx.beginPath(); ctx.arc(0, -s * 0.02, s * 0.1, 0, Math.PI * 2); ctx.fill()
      ctx.strokeStyle = '#b87333'; ctx.lineWidth = 1.5
      ctx.stroke()
      break
    }

    case 'forge': {
      // Ground shadow
      ctx.fillStyle = 'rgba(15, 30, 15, 0.25)'
      ctx.beginPath(); ctx.ellipse(0, s * 0.42, s * 0.4, s * 0.09, 0, 0, Math.PI * 2); ctx.fill()
      ctx.shadowColor = 'transparent'

      // Slate stone forge kiln masonry dome
      ctx.fillStyle = '#37474f'
      ctx.beginPath()
      ctx.arc(0, s * 0.16, s * 0.32, Math.PI, 0)
      ctx.lineTo(s * 0.32, s * 0.41)
      ctx.lineTo(-s * 0.32, s * 0.41)
      ctx.closePath(); ctx.fill()

      // Arched furnace mouth showing molten bronze
      ctx.fillStyle = '#212121'
      ctx.beginPath()
      ctx.arc(0, s * 0.24, s * 0.16, Math.PI, 0)
      ctx.lineTo(s * 0.16, s * 0.41)
      ctx.lineTo(-s * 0.16, s * 0.41)
      ctx.closePath(); ctx.fill()

      // Glowing liquid gold/orange metal inside
      const glowScale = Math.abs(Math.sin(time / 140)) * s * 0.02 + s * 0.12
      const grad = ctx.createRadialGradient(0, s * 0.32, 0, 0, s * 0.32, s * 0.18)
      grad.addColorStop(0, '#ffff00')
      grad.addColorStop(0.5, '#ff9100')
      grad.addColorStop(1, '#ff3d00')
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(0, s * 0.32, glowScale, Math.PI, 0)
      ctx.closePath(); ctx.fill()

      // Sparkles rising out of chimney
      const sparkCycle = (time / 400) % 2
      ctx.fillStyle = '#ffc107'
      for (let i = 0; i < 4; i++) {
        const age = (sparkCycle + i * 0.5) % 2
        const spkY = s * 0.05 - age * s * 0.18
        const spkX = (Math.sin(time / 120 + i) * s * 0.08)
        ctx.globalAlpha = Math.max(0, 1.0 - age / 2)
        ctx.beginPath()
        ctx.arc(spkX, spkY, 2, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1.0

      // Iron anvil block resting adjacent on left
      ctx.fillStyle = '#212121'
      ctx.beginPath()
      ctx.moveTo(-s * 0.2, s * 0.32)
      ctx.lineTo(-s * 0.32, s * 0.32)
      ctx.lineTo(-s * 0.34, s * 0.25)
      ctx.lineTo(-s * 0.18, s * 0.25)
      ctx.closePath(); ctx.fill()
      break
    }

    case 'citadel': {
      // Ground shadow
      ctx.fillStyle = 'rgba(15, 30, 15, 0.3)'
      ctx.beginPath(); ctx.ellipse(0, s * 0.44, s * 0.46, s * 0.11, 0, 0, Math.PI * 2); ctx.fill()
      ctx.shadowColor = 'transparent'

      // Left citadel tower base
      ctx.fillStyle = '#78909c'
      ctx.fillRect(-s * 0.4, 0, s * 0.2, s * 0.44)
      ctx.fillStyle = tc
      ctx.fillRect(-s * 0.42, -s * 0.08, s * 0.24, s * 0.08)

      // Right citadel tower base
      ctx.fillStyle = '#78909c'
      ctx.fillRect(s * 0.2, 0, s * 0.2, s * 0.44)
      ctx.fillStyle = tc
      ctx.fillRect(s * 0.18, -s * 0.08, s * 0.24, s * 0.08)

      // High central keeps dome
      ctx.fillStyle = '#b0bec5'
      ctx.fillRect(-s * 0.24, -s * 0.22, s * 0.48, s * 0.64)

      // Golden dome of citadel crowning center
      ctx.fillStyle = '#ffca28'
      ctx.beginPath()
      ctx.arc(0, -s * 0.22, s * 0.2, Math.PI, 0)
      ctx.closePath(); ctx.fill()

      // Large team color central sash streaming down the front keep wall
      ctx.fillStyle = tc
      ctx.fillRect(-s * 0.06, -s * 0.15, s * 0.12, s * 0.3)

      // Arch entrance gate
      ctx.fillStyle = '#263238'
      ctx.beginPath()
      ctx.rect(-s * 0.11, s * 0.18, s * 0.22, s * 0.24)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(0, s * 0.18, s * 0.11, Math.PI, 0)
      ctx.fill()
      break
    }

    case 'palace': {
      // Ground shadow
      ctx.fillStyle = 'rgba(15, 30, 15, 0.35)'
      ctx.beginPath(); ctx.ellipse(0, s * 0.42, s * 0.48, s * 0.12, 0, 0, Math.PI * 2); ctx.fill()
      ctx.shadowColor = 'transparent'

      // Foundations (Terraces)
      ctx.fillStyle = '#78909c' // slate grey stone
      ctx.fillRect(-s * 0.42, s * 0.15, s * 0.84, s * 0.25)
      ctx.fillStyle = '#cfd8dc' // edge highlights
      ctx.fillRect(-s * 0.42, s * 0.15, s * 0.84, s * 0.03)

      // Main central palace block
      ctx.fillStyle = '#eceff1' // polished white marble
      ctx.fillRect(-s * 0.24, -s * 0.15, s * 0.48, s * 0.3)

      // Two side Towers (Minarets/Pillars)
      ctx.fillStyle = '#b0bec5'
      ctx.fillRect(-s * 0.38, -s * 0.25, s * 0.11, s * 0.4) // Left tower
      ctx.fillRect(s * 0.27, -s * 0.25, s * 0.11, s * 0.4)  // Right tower

      // Tower roofs (Golden domes)
      ctx.fillStyle = '#ffd54f' // gold
      ctx.beginPath()
      ctx.arc(-s * 0.325, -s * 0.25, s * 0.065, Math.PI, 0)
      ctx.closePath(); ctx.fill()
      ctx.beginPath()
      ctx.arc(s * 0.325, -s * 0.25, s * 0.065, Math.PI, 0)
      ctx.closePath(); ctx.fill()

      // Large central grand golden dome
      ctx.fillStyle = '#ffb300' // vibrant royal gold dome
      ctx.beginPath()
      ctx.arc(0, -s * 0.15, s * 0.18, Math.PI, 0)
      ctx.closePath(); ctx.fill()

      // Central arched royal door with gold trim
      ctx.fillStyle = '#37474f' // dark wood door
      ctx.beginPath()
      ctx.rect(-s * 0.08, s * 0.08, s * 0.16, s * 0.2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(0, s * 0.08, s * 0.08, Math.PI, 0)
      ctx.fill()

      // Gold knobs/trim
      ctx.strokeStyle = '#ffd54f'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(0, s * 0.08, s * 0.08, Math.PI, 0)
      ctx.lineTo(-s * 0.08, s * 0.28)
      ctx.lineTo(s * 0.08, s * 0.28)
      ctx.closePath(); ctx.stroke()

      // High floating royal banners in team color (animated wave)
      const bannerOsc = Math.sin(time / 220) * 4
      ctx.fillStyle = '#795548' // wood post
      ctx.fillRect(-2, -s * 0.45, 4, s * 0.3)

      // Flag banner waving
      ctx.fillStyle = tc
      ctx.beginPath()
      ctx.moveTo(2, -s * 0.42)
      ctx.lineTo(s * 0.2, -s * 0.36 + bannerOsc * 0.5)
      ctx.lineTo(2, -s * 0.3)
      ctx.closePath(); ctx.fill()
      break
    }

    default: {
      // Cute classic detailed wooden house for other fallbacks
      ctx.fillStyle = 'rgba(15, 30, 15, 0.25)'
      ctx.beginPath(); ctx.ellipse(0, s * 0.42, s * 0.38, s * 0.1, 0, 0, Math.PI * 2); ctx.fill()
      ctx.shadowColor = 'transparent'

      ctx.fillStyle = '#d7ccc8'
      ctx.fillRect(-s * 0.32, -s * 0.05, s * 0.64, s * 0.46)

      ctx.fillStyle = tc
      ctx.beginPath()
      ctx.moveTo(-s * 0.38, -s * 0.05)
      ctx.lineTo(0, -s * 0.44)
      ctx.lineTo(s * 0.38, -s * 0.05)
      ctx.closePath(); ctx.fill()

      ctx.fillStyle = '#3e2723'
      ctx.fillRect(-s * 0.1, s * 0.12, s * 0.2, s * 0.3)
      break
    }
  }

  ctx.restore()
}
