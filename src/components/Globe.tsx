'use client'

import { useEffect, useRef } from 'react'

export default function Globe() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const size = 300
    canvas.width = size
    canvas.height = size

    let rotation = 0
    let animationId: number

    const draw = () => {
      ctx.clearRect(0, 0, size, size)

      const centerX = size / 2
      const centerY = size / 2
      const radius = size / 2 - 20

      ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
      ctx.stroke()

      for (let i = -2; i <= 2; i++) {
        const y = centerY + (i * radius * 0.4)
        const rx = Math.sqrt(radius * radius - (y - centerY) * (y - centerY))
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)'
        ctx.beginPath()
        ctx.ellipse(centerX, y, rx, rx * 0.3, 0, 0, Math.PI * 2)
        ctx.stroke()
      }

      rotation += 0.005
      for (let i = 0; i < 6; i++) {
        const angle = ((i / 6) * Math.PI + rotation) % Math.PI
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)'
        ctx.beginPath()
        ctx.ellipse(
          centerX,
          centerY,
          radius * Math.abs(Math.sin(angle)),
          radius,
          0,
          0,
          Math.PI * 2
        )
        ctx.stroke()
      }

      const dots = [
        { lat: 0.3, lon: 0.2, color: '#00ff88' },
        { lat: -0.5, lon: 1.2, color: '#ff3366' },
        { lat: 0.8, lon: 2.5, color: '#ffb800' },
        { lat: -0.3, lon: 3.8, color: '#a855f7' },
        { lat: 0.6, lon: 5.0, color: '#00f0ff' },
        { lat: -0.8, lon: 0.8, color: '#00ff88' },
      ]

      dots.forEach((dot) => {
        const x = centerX + Math.cos(dot.lon + rotation) * Math.cos(dot.lat) * radius * 0.8
        const y = centerY + Math.sin(dot.lat) * radius * 0.8

        ctx.fillStyle = dot.color
        ctx.beginPath()
        ctx.arc(x, y, 3, 0, Math.PI * 2)
        ctx.fill()

        ctx.shadowColor = dot.color
        ctx.shadowBlur = 10
        ctx.beginPath()
        ctx.arc(x, y, 2, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
      })

      ctx.strokeStyle = 'rgba(0, 240, 255, 0.1)'
      ctx.lineWidth = 1
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const x1 = centerX + Math.cos(dots[i].lon + rotation) * Math.cos(dots[i].lat) * radius * 0.8
          const y1 = centerY + Math.sin(dots[i].lat) * radius * 0.8
          const x2 = centerX + Math.cos(dots[j].lon + rotation) * Math.cos(dots[j].lat) * radius * 0.8
          const y2 = centerY + Math.sin(dots[j].lat) * radius * 0.8

          const dist = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
          if (dist < radius * 0.6) {
            ctx.beginPath()
            ctx.moveTo(x1, y1)
            ctx.lineTo(x2, y2)
            ctx.stroke()
          }
        }
      }

      ctx.strokeStyle = 'rgba(0, 240, 255, 0.1)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius + 5, 0, Math.PI * 2)
      ctx.stroke()

      animationId = requestAnimationFrame(draw)
    }

    draw()

    return () => cancelAnimationFrame(animationId)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="opacity-70"
      style={{ width: '100%', maxWidth: '280px', height: 'auto' }}
    />
  )
}
