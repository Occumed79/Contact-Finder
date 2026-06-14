'use client'

import { useEffect, useRef } from 'react'

export default function Radar() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const size = 300
    canvas.width = size
    canvas.height = size

    let angle = 0
    let animationId: number

    const draw = () => {
      ctx.clearRect(0, 0, size, size)

      const centerX = size / 2
      const centerY = size / 2
      const radius = size / 2 - 10

      // Draw circles
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)'
      ctx.lineWidth = 1
      for (let i = 1; i <= 4; i++) {
        ctx.beginPath()
        ctx.arc(centerX, centerY, (radius / 4) * i, 0, Math.PI * 2)
        ctx.stroke()
      }

      // Crosshairs
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)'
      ctx.beginPath()
      ctx.moveTo(centerX, 10)
      ctx.lineTo(centerX, size - 10)
      ctx.moveTo(10, centerY)
      ctx.lineTo(size - 10, centerY)
      ctx.stroke()

      // Grid dots
      ctx.fillStyle = 'rgba(0, 240, 255, 0.1)'
      for (let i = 0; i < 12; i++) {
        const dotAngle = (i / 12) * Math.PI * 2
        const dotX = centerX + Math.cos(dotAngle) * (radius * 0.9)
        const dotY = centerY + Math.sin(dotAngle) * (radius * 0.9)
        ctx.beginPath()
        ctx.arc(dotX, dotY, 2, 0, Math.PI * 2)
        ctx.fill()
      }

      // Blips
      const blips = [
        { angle: 0.5, dist: 0.7, color: '#00ff88' },
        { angle: 2.2, dist: 0.4, color: '#ff3366' },
        { angle: 4.1, dist: 0.85, color: '#ffb800' },
        { angle: 5.5, dist: 0.55, color: '#a855f7' },
      ]

      blips.forEach((blip) => {
        const bx = centerX + Math.cos(blip.angle) * radius * blip.dist
        const by = centerY + Math.sin(blip.angle) * radius * blip.dist

        ctx.fillStyle = blip.color
        ctx.beginPath()
        ctx.arc(bx, by, 4, 0, Math.PI * 2)
        ctx.fill()

        // Pulse ring
        ctx.strokeStyle = blip.color
        ctx.globalAlpha = 0.3
        ctx.beginPath()
        ctx.arc(bx, by, 8, 0, Math.PI * 2)
        ctx.stroke()
        ctx.globalAlpha = 1
      })

      // Sweep line
      angle += 0.02
      const sweepX = centerX + Math.cos(angle) * radius
      const sweepY = centerY + Math.sin(angle) * radius

      const gradient = ctx.createLinearGradient(centerX, centerY, sweepX, sweepY)
      gradient.addColorStop(0, 'rgba(0, 240, 255, 0.8)')
      gradient.addColorStop(1, 'rgba(0, 240, 255, 0)')

      ctx.strokeStyle = gradient
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.lineTo(sweepX, sweepY)
      ctx.stroke()

      // Sweep area
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.arc(centerX, centerY, radius, angle - 0.3, angle)
      ctx.fill()

      // Center dot
      ctx.fillStyle = '#00f0ff'
      ctx.beginPath()
      ctx.arc(centerX, centerY, 3, 0, Math.PI * 2)
      ctx.fill()

      animationId = requestAnimationFrame(draw)
    }

    draw()

    return () => cancelAnimationFrame(animationId)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="opacity-60"
      style={{ width: '100%', maxWidth: '300px', height: 'auto' }}
    />
  )
}
