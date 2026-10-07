import { useEffect, useMemo, useRef } from 'react'
import type { DataPoint } from '../engine/datasets'

interface Props {
  points: DataPoint[]
  /** (x, y) no domínio [-6, 6] => probabilidade da classe 1 */
  predict: (x: number, y: number) => number
  /** incremente para forçar o redesenho da fronteira */
  version: number
}

const RES = 90

/** Gráfico dos dados + fundo com a fronteira de decisão da rede. */
export function DataCanvas({ points, predict, version }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const predictRef = useRef(predict)
  predictRef.current = predict

  const grid = useMemo(() => {
    const cells = new Float32Array(RES * RES)
    for (let gy = 0; gy < RES; gy++) {
      for (let gx = 0; gx < RES; gx++) {
        const x = -6 + (12 * (gx + 0.5)) / RES
        const y = 6 - (12 * (gy + 0.5)) / RES
        cells[gy * RES + gx] = predictRef.current(x, y)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return cells
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const draw = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      canvas.width = Math.max(1, Math.round(rect.width * dpr))
      canvas.height = Math.max(1, Math.round(rect.width * dpr)) // quadrado
      const S = canvas.width
      ctx.setTransform(1, 0, 0, 1, 0, 0)

      // Fundo: fronteira de decisão via offscreen
      const off = document.createElement('canvas')
      off.width = RES
      off.height = RES
      const octx = off.getContext('2d')
      if (octx) {
        const img = octx.createImageData(RES, RES)
        for (let i = 0; i < RES * RES; i++) {
          const p = grid[i]
          const o = i * 4
          // classe 0 = azul, classe 1 = laranja; confiança => opacidade
          const conf = Math.abs(p - 0.5) * 2
          const alpha = Math.round(28 + conf * 60)
          if (p >= 0.5) {
            img.data[o] = 251
            img.data[o + 1] = 146
            img.data[o + 2] = 60
          } else {
            img.data[o] = 59
            img.data[o + 1] = 130
            img.data[o + 2] = 246
          }
          img.data[o + 3] = alpha
        }
        octx.putImageData(img, 0, 0)
        ctx.imageSmoothingEnabled = true
        ctx.drawImage(off, 0, 0, S, S)
      }

      const toPx = (v: number) => ((v + 6) / 12) * S

      // Grade
      ctx.strokeStyle = 'rgba(161,161,170,0.14)'
      ctx.lineWidth = 1
      for (let g = -6; g <= 6; g += 2) {
        ctx.beginPath()
        ctx.moveTo(toPx(g), 0)
        ctx.lineTo(toPx(g), S)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(0, toPx(-g))
        ctx.lineTo(S, toPx(-g))
        ctx.stroke()
      }

      // Pontos (anel branco = erro de classificação)
      for (const pt of points) {
        const px = toPx(pt.x)
        const py = ((6 - pt.y) / 12) * S
        const prob = predictRef.current(pt.x, pt.y)
        const predicted = prob >= 0.5 ? 1 : 0
        const wrong = predicted !== pt.label
        ctx.beginPath()
        ctx.arc(px, py, wrong ? 6.5 : 4.6, 0, Math.PI * 2)
        ctx.fillStyle = pt.label === 1 ? '#fb9233' : '#3b82f6'
        ctx.fill()
        if (wrong) {
          ctx.strokeStyle = '#f8fafc'
          ctx.lineWidth = 1.6
          ctx.stroke()
        } else {
          ctx.strokeStyle = 'rgba(0,0,0,0.45)'
          ctx.lineWidth = 1
          ctx.stroke()
        }
      }
    }

    draw()
    const ro = new ResizeObserver(draw)
    ro.observe(canvas)
    return () => ro.disconnect()
  }, [points, grid])

  return <canvas ref={canvasRef} className="aspect-square w-full cursor-crosshair" />
}
