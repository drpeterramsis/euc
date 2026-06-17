import React, { useRef, useEffect } from 'react'
import { drawBuilding } from '../../utils/buildingRenderer'

interface Props {
  type: string
  teamColor?: string
  size?: number
}

export function CatalogBuildingIcon({ type, teamColor = '#D4AF37', size = 48 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = size * dpr
    canvas.height = size * dpr
    canvas.style.width = `${size}px`
    canvas.style.height = `${size}px`
    ctx.scale(dpr, dpr)

    let animId: number

    const render = () => {
      ctx.clearRect(0, 0, size, size)

      // Golden semi-transparent game-card background
      ctx.fillStyle = 'rgba(212, 175, 55, 0.08)'
      ctx.beginPath()
      ctx.roundRect(0, 0, size, size, 8)
      ctx.fill()

      // High-end inner golden border
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.16)'
      ctx.lineWidth = 1
      ctx.strokeRect(1, 1, size - 2, size - 2)

      // Render the animated building passing high-fidelity global tick
      const time = Date.now()
      drawBuilding(ctx, type, size / 2, size / 2 + 3, size * 0.82, teamColor, undefined, time)

      animId = requestAnimationFrame(render)
    }

    render()

    return () => {
      cancelAnimationFrame(animId)
    }
  }, [type, teamColor, size])

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '8px',
        display: 'block',
      }}
    />
  )
}
