'use client'

import { useEffect, useRef } from 'react'

const CHARS =
  '01<>{}[]();:=+*/&#$%01ABCDEF01ΞETHRH0xmintnft{}[]01'

export function FallingCodeBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    let animationId = 0
    let width = 0
    let height = 0
    let columns: number[] = []
    let columnSpeeds: number[] = []
    const fontSize = 13

    const resize = () => {
      const parent = canvas.parentElement
      width = parent?.clientWidth || window.innerWidth
      height = parent?.clientHeight || window.innerHeight
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const colCount = Math.max(8, Math.floor(width / 22))
      columns = Array.from({ length: colCount }, () => Math.random() * -40)
      columnSpeeds = Array.from({ length: colCount }, () => 0.35 + Math.random() * 0.55)
    }

    resize()
    window.addEventListener('resize', resize)
    const parent = canvas.parentElement
    const observer =
      parent && typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => resize())
        : null
    observer?.observe(parent!)

    const draw = () => {
      ctx.fillStyle = 'rgba(5, 6, 7, 0.08)'
      ctx.fillRect(0, 0, width, height)

      ctx.font = `${fontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`
      ctx.textBaseline = 'top'

      for (let i = 0; i < columns.length; i++) {
        const x = i * 22
        const y = columns[i] * fontSize
        const char = CHARS[Math.floor(Math.random() * CHARS.length)]

        // Head glow
        ctx.fillStyle = 'rgba(255, 43, 214, 0.55)'
        ctx.fillText(char, x, y)

        // Trailing dimmer glyph
        const trail = CHARS[Math.floor(Math.random() * CHARS.length)]
        ctx.fillStyle = 'rgba(45, 226, 255, 0.22)'
        ctx.fillText(trail, x, y - fontSize)

        columns[i] += columnSpeeds[i]

        if (y > height && Math.random() > 0.975) {
          columns[i] = Math.random() * -20
          columnSpeeds[i] = 0.35 + Math.random() * 0.55
        }
      }

      animationId = requestAnimationFrame(draw)
    }

    // Seed a dark base so first frames aren't flashy
    ctx.fillStyle = '#050607'
    ctx.fillRect(0, 0, width, height)
    animationId = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resize)
      observer?.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 h-full w-full opacity-40"
    />
  )
}
