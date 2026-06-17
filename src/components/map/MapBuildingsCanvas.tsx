// src/components/map/MapBuildingsCanvas.tsx
import React, { useRef, useEffect } from 'react'
import { drawBuilding } from '../../utils/buildingRenderer'

interface Building {
  id: string
  x: number
  y: number
  building_type: string
  team_color: string
  team_name?: string
}

interface Props {
  buildings: Building[]
  containerWidth: number
  containerHeight: number
  isDeleteMode?: boolean
  style?: React.CSSProperties
}

export default function MapBuildingsCanvas({
  buildings,
  containerWidth = 1024,
  containerHeight = 1536,
  isDeleteMode = false,
  style,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number

    const render = () => {
      // Clear and redraw
      ctx.clearRect(0, 0, containerWidth, containerHeight)

      // Tint entire canvas subtly if in delete mode
      if (isDeleteMode) {
        ctx.save()
        ctx.fillStyle = 'rgba(231, 76, 60, 0.05)'
        ctx.fillRect(0, 0, containerWidth, containerHeight)
        ctx.restore()
      }

      // Standard icon size
      const ICON_SIZE = 112
      const time = Date.now()

      buildings.forEach(b => {
        const svgX = Number(b.x)
        const svgY = Number(b.y)
        if (isNaN(svgX) || isNaN(svgY)) return

        const type = b.building_type || 'default'
        const getObjColor = (obj: any) => {
          if (!obj) return null;
          if (Array.isArray(obj) && obj.length > 0) return obj[0]?.color || obj[0]?.team_color || null;
          if (typeof obj === 'object') return obj.color || obj.team_color || null;
          return null;
        };
        const color = b.team_color || getObjColor((b as any).team) || getObjColor((b as any).teams) || '#D4AF37'

        // Pass direct timestamp to enable fluent wind sways and animal animations
        drawBuilding(ctx, type, svgX, svgY, ICON_SIZE, color, undefined, time)

        // Print delete mode indicators
        if (isDeleteMode) {
          ctx.save()

          // Red dashed outer circle border
          ctx.beginPath()
          ctx.arc(svgX, svgY, ICON_SIZE * 0.58, 0, Math.PI * 2)
          ctx.strokeStyle = '#E74C3C'
          ctx.lineWidth = 4
          ctx.setLineDash([10, 5])
          ctx.stroke()
          ctx.setLineDash([])

          // Red transparent circular overlay
          ctx.beginPath()
          ctx.arc(svgX, svgY, ICON_SIZE * 0.54, 0, Math.PI * 2)
          ctx.fillStyle = 'rgba(231, 76, 60, 0.15)'
          ctx.fill()

          // Thick Red X
          const size = ICON_SIZE * 0.25
          ctx.beginPath()
          ctx.moveTo(svgX - size, svgY - size)
          ctx.lineTo(svgX + size, svgY + size)
          ctx.moveTo(svgX + size, svgY - size)
          ctx.lineTo(svgX - size, svgY + size)
          ctx.strokeStyle = '#E74C3C'
          ctx.lineWidth = 6
          ctx.lineCap = 'round'
          ctx.stroke()

          ctx.restore()
        }
      })

      animId = requestAnimationFrame(render)
    }

    render()

    return () => {
      cancelAnimationFrame(animId)
    }
  }, [buildings, containerWidth, containerHeight, isDeleteMode])

  return (
    <canvas
      ref={canvasRef}
      width={containerWidth}
      height={containerHeight}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 10,
        pointerEvents: 'none', // clicks pass through to outer selectors
        ...style,
      }}
    />
  )
}
