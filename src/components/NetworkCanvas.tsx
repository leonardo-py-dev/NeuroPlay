import { useEffect, useRef } from 'react'

interface Props {
  layers: number[]
  weights: number[][][]
  /** activations[l][i] — saída atual de cada neurônio (para colorir os nós) */
  activations?: number[][] | null
  running: boolean
}

interface Particle {
  layer: number // índice da camada de origem (0..L-2)
  from: number
  to: number
  t: number
  speed: number
}

const POS = '#3b82f6' // azul = peso positivo
const NEG = '#fb9233' // laranja = peso negativo

/** Canvas que desenha a arquitetura da rede, pesos e fluxo de sinal. */
export function NetworkCanvas({ layers, weights, activations, running }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef({ layers, weights, activations, running })
  stateRef.current = { layers, weights, activations, running }
  const particlesRef = useRef<Particle[]>([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let last = performance.now()

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      canvas.width = Math.max(1, Math.round(rect.width * dpr))
      canvas.height = Math.max(1, Math.round(rect.height * dpr))
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    const nodePos = (W: number, H: number) => {
      const { layers } = stateRef.current
      const padX = 46
      const padY = 34
      const cols = layers.map((n, l) => {
        const xs = layers.length === 1 ? W / 2 : padX + ((W - padX * 2) * l) / (layers.length - 1)
        const rows: { x: number; y: number }[] = []
        for (let i = 0; i < n; i++) {
          const y = n === 1 ? H / 2 : padY + ((H - padY * 2) * i) / (n - 1)
          rows.push({ x: xs, y })
        }
        return rows
      })
      return cols
    }

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const s = stateRef.current
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      const W = canvas.width / dpr
      const H = canvas.height / dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, W, H)

      const cols = nodePos(W, H)
      const L = s.layers.length

      // Arestas (pesos)
      for (let l = 0; l < L - 1; l++) {
        const wl = s.weights[l]
        if (!wl) continue
        for (let i = 0; i < cols[l + 1].length; i++) {
          for (let j = 0; j < cols[l].length; j++) {
            const w = wl[i]?.[j] ?? 0
            const a = cols[l][j]
            const b = cols[l + 1][i]
            ctx.strokeStyle = w >= 0 ? POS : NEG
            ctx.globalAlpha = Math.min(0.9, 0.12 + Math.min(1.6, Math.abs(w)) * 0.5)
            ctx.lineWidth = 0.8 + Math.min(6, Math.abs(w) * 3)
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
          }
        }
      }
      ctx.globalAlpha = 1

      // Partículas do fluxo de sinal
      const P = particlesRef.current
      if (s.running && P.length < 26 && Math.random() < 0.5) {
        const l = Math.floor(Math.random() * (L - 1))
        P.push({
          layer: l,
          from: Math.floor(Math.random() * s.layers[l]),
          to: Math.floor(Math.random() * s.layers[l + 1]),
          t: 0,
          speed: 1.2 + Math.random() * 1.4,
        })
      }
      for (let k = P.length - 1; k >= 0; k--) {
        const p = P[k]
        if (!s.running) {
          P.splice(k, 1)
          continue
        }
        p.t += dt * p.speed
        if (p.t >= 1) {
          if (p.layer < L - 2) {
            P[k] = {
              layer: p.layer + 1,
              from: p.to,
              to: Math.floor(Math.random() * s.layers[p.layer + 2]),
              t: 0,
              speed: p.speed,
            }
          } else {
            P.splice(k, 1)
          }
          continue
        }
        const a = cols[p.layer]?.[p.from]
        const b = cols[p.layer + 1]?.[p.to]
        if (!a || !b) continue
        const x = a.x + (b.x - a.x) * p.t
        const y = a.y + (b.y - a.y) * p.t
        ctx.fillStyle = '#ffffff'
        ctx.shadowColor = '#ffffff'
        ctx.shadowBlur = 8
        ctx.beginPath()
        ctx.arc(x, y, 3, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
      }

      // Nós
      const labels = (l: number, i: number) => {
        if (l === 0) return `x${i + 1}`
        if (l === L - 1) return 'ŷ'
        return `h${l}.${i + 1}`
      }
      for (let l = 0; l < L; l++) {
        for (let i = 0; i < cols[l].length; i++) {
          const { x, y } = cols[l][i]
          const act = s.activations?.[l]?.[i]
          let fill = '#141414'
          let stroke = '#fafafa'
          if (act !== undefined) {
            // Monocromático: ativação positiva clareia em direção ao branco,
            // negativa fica nos cinzas escuros. Azul/laranja ficam reservados
            // para pesos e classes dos dados.
            const v = Math.max(-1, Math.min(1, act))
            if (v >= 0) {
              const c = Math.round(20 + 235 * v)
              fill = `rgb(${c},${c},${c})`
              stroke = '#fafafa'
            } else {
              const c = Math.round(20 + 90 * -v)
              fill = `rgb(${c},${c},${c})`
              stroke = '#a1a1aa'
            }
          }
          ctx.fillStyle = fill
          ctx.strokeStyle = stroke
          ctx.lineWidth = 1.6
          ctx.beginPath()
          ctx.arc(x, y, 13, 0, Math.PI * 2)
          ctx.fill()
          ctx.stroke()
          ctx.fillStyle = '#f4f4f5'
          ctx.font = '600 9px system-ui'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(labels(l, i), x, y)
        }
      }

      // Legenda
      ctx.textAlign = 'left'
      ctx.textBaseline = 'alphabetic'
      ctx.font = '11px system-ui'
      ctx.fillStyle = POS
      ctx.fillText('● peso +', 10, H - 22)
      ctx.fillStyle = NEG
      ctx.fillText('● peso −', 10, H - 8)

      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [])

  const totalParams =
    weights.reduce((acc, wl) => acc + wl.reduce((a, row) => a + row.length, 0), 0) +
    weights.reduce((acc, wl) => acc + wl.length, 0)

  return (
    <div className="relative">
      <canvas ref={canvasRef} className="h-[340px] w-full" />
      <div className="pointer-events-none absolute right-2 top-2 rounded-md bg-secondary/80 px-2 py-1 text-[11px] text-muted-foreground">
        {layers.join(' → ')} · {totalParams} parâmetros
      </div>
    </div>
  )
}
