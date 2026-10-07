import { useCallback, useEffect, useRef, useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { canConnect, MIN_DX, type GEdge, type GNode } from '../engine/graph'
import { Button } from './ui/button'

interface Props {
  nodes: GNode[]
  edges: GEdge[]
  activations: Record<string, number>
  onNodesChange: (nodes: GNode[]) => void
  onEdgesChange: (edges: GEdge[]) => void
}

interface Selection {
  type: 'node' | 'edge'
  id: string
}

const W = 800
const H = 520
const R = 22
const MAX_HIDDEN = 12

const POS = '#3b82f6'
const NEG = '#fb9233'

function nodeLabel(n: GNode): string {
  if (n.id === 'in-x1') return 'x₁'
  if (n.id === 'in-x2') return 'x₂'
  if (n.kind === 'output') return 'ŷ'
  return 'h'
}

/** Editor de rede: arraste neurônios, conecte arrastando da alça (anel). */
export function ChallengeCanvas({ nodes, edges, activations, onNodesChange, onEdgesChange }: Props) {
  const [selected, setSelected] = useState<Selection | null>(null)
  const [connecting, setConnecting] = useState<string | null>(null)
  const [ghost, setGhost] = useState<{ x: number; y: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const dragRef = useRef<{ id: string; dx: number; dy: number; moved: boolean } | null>(null)
  const idRef = useRef(0)

  const flashError = useCallback((msg: string) => {
    setError(msg)
    setTimeout(() => setError((e) => (e === msg ? null : e)), 2600)
  }, [])

  const toLocal = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }
    const rect = svg.getBoundingClientRect()
    return {
      x: ((clientX - rect.left) / rect.width) * W,
      y: ((clientY - rect.top) / rect.height) * H,
    }
  }, [])

  const nodeById = useCallback((id: string) => nodes.find((n) => n.id === id), [nodes])

  // --- arrastar neurônio ---
  const onNodePointerDown = (e: React.PointerEvent<SVGCircleElement>, node: GNode) => {
    if (connecting) return
    if (node.kind !== 'hidden') return
    e.currentTarget.setPointerCapture(e.pointerId)
    const p = toLocal(e.clientX, e.clientY)
    dragRef.current = { id: node.id, dx: node.x - p.x, dy: node.y - p.y, moved: false }
  }

  const onNodePointerMove = (e: React.PointerEvent<SVGCircleElement>, node: GNode) => {
    const drag = dragRef.current
    if (!drag || drag.id !== node.id) return
    const p = toLocal(e.clientX, e.clientY)
    drag.moved = drag.moved || Math.hypot(p.x + drag.dx - node.x, p.y + drag.dy - node.y) > 4

    // Limites do canvas + preservação da ordem esquerda→direita nas arestas.
    let minX = 150
    let maxX = 650
    for (const ed of edges) {
      if (ed.to === node.id) {
        const from = nodeById(ed.from)
        if (from) minX = Math.max(minX, from.x + MIN_DX)
      }
      if (ed.from === node.id) {
        const to = nodeById(ed.to)
        if (to) maxX = Math.min(maxX, to.x - MIN_DX)
      }
    }
    const nx = Math.max(minX, Math.min(maxX, p.x + drag.dx))
    const ny = Math.max(30, Math.min(H - 30, p.y + drag.dy))
    onNodesChange(nodes.map((n) => (n.id === node.id ? { ...n, x: nx, y: ny } : n)))
  }

  const onNodePointerUp = (_e: React.PointerEvent<SVGCircleElement>, node: GNode) => {
    const drag = dragRef.current
    dragRef.current = null
    if (connecting) {
      // Soltou sobre um neurônio enquanto conectava => tenta criar aresta.
      const from = nodeById(connecting)
      if (from) {
        const reason = canConnect(from, node, edges)
        if (reason) {
          flashError(reason)
        } else {
          onEdgesChange([
            ...edges,
            { id: `e${idRef.current++}`, from: from.id, to: node.id, weight: 0 },
          ])
        }
      }
      setConnecting(null)
      setGhost(null)
      return
    }
    if (drag && !drag.moved) {
      setSelected({ type: 'node', id: node.id })
    }
  }

  // --- conectar via alça (sem capture: o pointerup precisa cair no neurônio destino) ---
  const onHandlePointerDown = (e: React.PointerEvent<SVGCircleElement>, node: GNode) => {
    e.stopPropagation()
    if (node.kind === 'output') {
      flashError('A saída não tem conexões de saída.')
      return
    }
    setConnecting(node.id)
    setSelected(null)
    const p = toLocal(e.clientX, e.clientY)
    setGhost(p)
  }

  const onSvgPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (connecting) setGhost(toLocal(e.clientX, e.clientY))
  }

  const onSvgPointerUp = () => {
    if (connecting) {
      setConnecting(null)
      setGhost(null)
    }
  }

  const cancelConnecting = useCallback(() => {
    setConnecting(null)
    setGhost(null)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cancelConnecting()
      if ((e.key === 'Delete' || e.key === 'Backspace') && selected) {
        const target = e.target as HTMLElement
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
        if (selected.type === 'edge') {
          onEdgesChange(edges.filter((x) => x.id !== selected.id))
          setSelected(null)
        } else {
          const n = nodeById(selected.id)
          if (n && n.kind === 'hidden') {
            onNodesChange(nodes.filter((x) => x.id !== selected.id))
            onEdgesChange(edges.filter((x) => x.from !== selected.id && x.to !== selected.id))
            setSelected(null)
          }
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selected, edges, nodes, onEdgesChange, onNodesChange, nodeById, cancelConnecting])

  const addNeuron = () => {
    const hiddenCount = nodes.filter((n) => n.kind === 'hidden').length
    if (hiddenCount >= MAX_HIDDEN) {
      flashError(`Limite de ${MAX_HIDDEN} neurônios ocultos neste canvas.`)
      return
    }
    const n: GNode = {
      id: `h${Date.now().toString(36)}`,
      kind: 'hidden',
      x: 340 + Math.random() * 120,
      y: 150 + Math.random() * 220,
      bias: 0,
    }
    onNodesChange([...nodes, n])
    setSelected({ type: 'node', id: n.id })
  }

  const removeSelected = () => {
    if (!selected) return
    if (selected.type === 'edge') {
      onEdgesChange(edges.filter((x) => x.id !== selected.id))
    } else {
      const n = nodeById(selected.id)
      if (!n || n.kind !== 'hidden') {
        flashError('Entrada e saída são fixas — só neurônios ocultos podem sair.')
        return
      }
      onNodesChange(nodes.filter((x) => x.id !== selected.id))
      onEdgesChange(edges.filter((x) => x.from !== selected.id && x.to !== selected.id))
    }
    setSelected(null)
  }

  const fillFor = (n: GNode): { fill: string; stroke: string } => {
    const a = activations[n.id]
    if (a === undefined) return { fill: '#141414', stroke: '#fafafa' }
    const v = Math.max(-1, Math.min(1, a))
    if (v >= 0) {
      const c = Math.round(20 + 235 * v)
      return { fill: `rgb(${c},${c},${c})`, stroke: '#fafafa' }
    }
    const c = Math.round(20 + 90 * -v)
    return { fill: `rgb(${c},${c},${c})`, stroke: '#a1a1aa' }
  }

  const connectingFrom = connecting ? nodeById(connecting) : null

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Button size="sm" variant="secondary" onClick={addNeuron}>
          <Plus /> Neurônio
        </Button>
        <Button size="sm" variant="outline" onClick={removeSelected} disabled={!selected}>
          <Minus /> Remover selecionado
        </Button>
        <span className="ml-auto text-[11px] text-muted-foreground">
          Arraste o corpo para mover · arraste o <span className="text-foreground">anel</span> para
          conectar · Delete remove
        </span>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="h-[380px] w-full touch-none select-none rounded-lg border border-border bg-black/40"
        onPointerMove={onSvgPointerMove}
        onPointerUp={onSvgPointerUp}
        onPointerLeave={onSvgPointerUp}
      >
        <defs>
          <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 1 L 9 5 L 0 9 z" fill="#71717a" />
          </marker>
        </defs>

        {/* arestas */}
        {edges.map((e) => {
          const a = nodeById(e.from)
          const b = nodeById(e.to)
          if (!a || !b) return null
          const sel = selected?.type === 'edge' && selected.id === e.id
          return (
            <g key={e.id}>
              <line
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="transparent"
                strokeWidth={14}
                className="cursor-pointer"
                onPointerUp={() => !connecting && setSelected({ type: 'edge', id: e.id })}
              />
              <line
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={e.weight >= 0 ? POS : NEG}
                strokeOpacity={sel ? 1 : Math.min(0.95, 0.2 + Math.min(1.6, Math.abs(e.weight)) * 0.5)}
                strokeWidth={(sel ? 5 : 1.2) + Math.min(5, Math.abs(e.weight) * 3)}
                markerEnd="url(#arr)"
                className="pointer-events-none"
                strokeDasharray={sel ? '6 3' : undefined}
              />
            </g>
          );
        })}

        {/* linha fantasma da conexão em andamento */}
        {connectingFrom && ghost && (
          <line
            x1={connectingFrom.x}
            y1={connectingFrom.y}
            x2={ghost.x}
            y2={ghost.y}
            stroke="#fafafa"
            strokeWidth={2}
            strokeDasharray="6 4"
            className="pointer-events-none"
          />
        )}

        {/* nós */}
        {nodes.map((n) => {
          const { fill, stroke } = fillFor(n)
          const sel = selected?.type === 'node' && selected.id === n.id
          const active = connecting === n.id
          return (
            <g key={n.id}>
              {sel && (
                <circle cx={n.x} cy={n.y} r={R + 5} fill="none" stroke="#fafafa" strokeWidth={1.5} strokeDasharray="5 3" className="pointer-events-none" />
              )}
              <circle
                cx={n.x}
                cy={n.y}
                r={R}
                fill={fill}
                stroke={active ? '#fafafa' : stroke}
                strokeWidth={active ? 3 : 1.8}
                className={n.kind === 'hidden' && !connecting ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}
                onPointerDown={(e) => onNodePointerDown(e, n)}
                onPointerMove={(e) => onNodePointerMove(e, n)}
                onPointerUp={(e) => onNodePointerUp(e, n)}
              />
              <text
                x={n.x}
                y={n.y + 0.5}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={13}
                fontWeight={700}
                fill="#f4f4f5"
                className="pointer-events-none"
              >
                {nodeLabel(n)}
              </text>
              {/* alça de conexão */}
              {n.kind !== 'output' && (
                <circle
                  cx={n.x + R + 8}
                  cy={n.y}
                  r={7}
                  fill={active ? '#fafafa' : '#0a0a0a'}
                  stroke="#fafafa"
                  strokeWidth={1.6}
                  className="cursor-crosshair"
                  onPointerDown={(e) => onHandlePointerDown(e, n)}
                />
              )}
              {n.kind === 'input' && (
                <text x={n.x} y={n.y - R - 8} textAnchor="middle" fontSize={10} fill="#a1a1aa" className="pointer-events-none">
                  fixa
                </text>
              )}
              {n.kind === 'output' && (
                <text x={n.x} y={n.y - R - 8} textAnchor="middle" fontSize={10} fill="#a1a1aa" className="pointer-events-none">
                  fixa
                </text>
              )}
            </g>
          );
        })}
      </svg>

      <div className="mt-2 flex min-h-[20px] items-center justify-between text-[11px]">
        <span className="text-muted-foreground">
          <span style={{ color: POS }}>● peso +</span>
          {'  '}
          <span style={{ color: NEG }}>● peso −</span>
          {'  '}· brilho do nó = ativação
        </span>
        {error && <span className="text-foreground">⚠ {error}</span>}
      </div>
    </div>
  )
}
