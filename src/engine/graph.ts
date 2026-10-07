import { activate, activateDerivative, type ActivationName } from './network'
import type { DataPoint } from './datasets'

export type NodeKind = 'input' | 'hidden' | 'output'

export interface GNode {
  id: string
  kind: NodeKind
  x: number
  y: number
  bias: number
}

export interface GEdge {
  id: string
  from: string
  to: string
  weight: number
}

/** Distância horizontal mínima para permitir uma conexão (garante aciclicidade). */
export const MIN_DX = 30

/**
 * Rede neural de topologia livre (grafo dirigido acíclico).
 * O sinal flui da esquerda para a direita: a ordem topológica é a
 * posição x dos neurônios. Conexões só existem de um nó à esquerda
 * para um nó à direita, então ciclos são impossíveis por construção.
 */
export class GraphNetwork {
  nodes = new Map<string, GNode>()
  edges = new Map<string, GEdge>()
  activation: ActivationName = 'tanh'

  /** Ordem fixa das entradas (índice 0 = x, 1 = y). */
  inputOrder: string[] = []
  outputId: string | null = null

  setActivation(name: ActivationName): void {
    this.activation = name
  }

  /**
   * Sincroniza o motor com o grafo do canvas, preservando pesos e
   * vieses já aprendidos de nós/arestas que continuam existindo.
   */
  sync(nodes: GNode[], edges: GEdge[]): void {
    const nodeIds = new Set(nodes.map((n) => n.id))
    for (const id of [...this.nodes.keys()]) {
      if (!nodeIds.has(id)) this.nodes.delete(id)
    }
    for (const n of nodes) {
      const existing = this.nodes.get(n.id)
      if (existing) {
        existing.x = n.x
        existing.y = n.y
      } else {
        this.nodes.set(n.id, { ...n, bias: 0 })
      }
    }

    const edgeIds = new Set(edges.map((e) => e.id))
    for (const id of [...this.edges.keys()]) {
      if (!edgeIds.has(id)) this.edges.delete(id)
    }
    const incoming = new Map<string, number>()
    for (const e of edges) incoming.set(e.to, (incoming.get(e.to) ?? 0) + 1)
    for (const e of edges) {
      if (!this.edges.has(e.id)) {
        const fanIn = Math.max(1, incoming.get(e.to) ?? 1)
        const limit = Math.sqrt(1 / fanIn)
        this.edges.set(e.id, { ...e, weight: (Math.random() * 2 - 1) * limit })
      }
    }

    this.inputOrder = nodes
      .filter((n) => n.kind === 'input')
      .sort((a, b) => a.y - b.y)
      .map((n) => n.id)
    const out = nodes.find((n) => n.kind === 'output')
    this.outputId = out ? out.id : null
  }

  reset(): void {
    for (const n of this.nodes.values()) n.bias = 0
    for (const e of this.edges.values()) {
      const fanIn = Math.max(
        1,
        [...this.edges.values()].filter((o) => o.to === e.to).length,
      )
      const limit = Math.sqrt(1 / fanIn)
      e.weight = (Math.random() * 2 - 1) * limit
    }
  }

  /** Nós computáveis (ocultos + saída) em ordem de propagação (x crescente). */
  private topoOrder(): GNode[] {
    return [...this.nodes.values()]
      .filter((n) => n.kind !== 'input')
      .sort((a, b) => a.x - b.x || a.y - b.y)
  }

  private incoming(nodeId: string): GEdge[] {
    return [...this.edges.values()].filter((e) => e.to === nodeId)
  }

  forward(input: number[]): { act: Map<string, number>; z: Map<string, number> } {
    const act = new Map<string, number>()
    const z = new Map<string, number>()
    this.inputOrder.forEach((id, i) => act.set(id, input[i] ?? 0))
    for (const node of this.topoOrder()) {
      let s = node.bias
      for (const e of this.incoming(node.id)) {
        s += e.weight * (act.get(e.from) ?? 0)
      }
      z.set(node.id, s)
      const fn = node.kind === 'output' ? 'sigmoid' : this.activation
      act.set(node.id, activate(fn, s))
    }
    return { act, z }
  }

  predict(input: number[]): number {
    if (!this.outputId) return 0.5
    return this.forward(input).act.get(this.outputId) ?? 0.5
  }

  trainEpoch(points: DataPoint[], lr: number, batchSize = 10): number {
    const order = points.map((_, i) => i)
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[order[i], order[j]] = [order[j], order[i]]
    }

    const accW = new Map<string, number>()
    const accB = new Map<string, number>()
    let totalLoss = 0
    let inBatch = 0

    const applyBatch = () => {
      const scale = lr / inBatch
      for (const [id, g] of accW) {
        const e = this.edges.get(id)
        if (e) e.weight -= scale * g
      }
      for (const [id, g] of accB) {
        const n = this.nodes.get(id)
        if (n) n.bias -= scale * g
      }
      accW.clear()
      accB.clear()
      inBatch = 0
    }

    for (const idx of order) {
      totalLoss += this.accumulate(points[idx], accW, accB)
      inBatch++
      if (inBatch >= batchSize) applyBatch()
    }
    if (inBatch > 0) applyBatch()
    return totalLoss / Math.max(1, order.length)
  }

  private accumulate(
    p: DataPoint,
    accW: Map<string, number>,
    accB: Map<string, number>,
  ): number {
    const { act, z } = this.forward([p.x, p.y])
    if (!this.outputId) return 0.693

    const eps = 1e-9
    const out = Math.min(1 - eps, Math.max(eps, act.get(this.outputId) ?? 0.5))
    const loss = -(p.label * Math.log(out) + (1 - p.label) * Math.log(1 - out))

    const deltas = new Map<string, number>()
    deltas.set(this.outputId, (act.get(this.outputId) ?? 0) - p.label)

    const compute = this.topoOrder().reverse()
    for (const node of compute) {
      if (node.kind === 'output') continue
      let s = 0
      for (const e of this.edges.values()) {
        if (e.from === node.id && deltas.has(e.to)) {
          s += e.weight * (deltas.get(e.to) ?? 0)
        }
      }
      const d = activateDerivative(this.activation, z.get(node.id) ?? 0, act.get(node.id) ?? 0)
      deltas.set(node.id, s * d)
    }

    for (const [nodeId, delta] of deltas) {
      accB.set(nodeId, (accB.get(nodeId) ?? 0) + delta)
      for (const e of this.incoming(nodeId)) {
        accW.set(e.id, (accW.get(e.id) ?? 0) + delta * (act.get(e.from) ?? 0))
      }
    }
    return loss
  }

  computeLoss(points: DataPoint[]): number {
    const eps = 1e-9
    let total = 0
    for (const p of points) {
      const o = Math.min(1 - eps, Math.max(eps, this.predict([p.x, p.y])))
      total += -(p.label * Math.log(o) + (1 - p.label) * Math.log(1 - o))
    }
    return total / Math.max(1, points.length)
  }

  accuracy(points: DataPoint[]): number {
    if (points.length === 0) return 0
    let ok = 0
    for (const p of points) {
      if ((this.predict([p.x, p.y]) >= 0.5 ? 1 : 0) === p.label) ok++
    }
    return ok / points.length
  }
}

/**
 * Valida uma conexão. Retorna null se válida, ou o motivo da recusa.
 * Regras: sem self-loop, sem duplicata, nada entra em input,
 * nada sai de output, e sempre da esquerda para a direita.
 */
export function canConnect(
  from: GNode,
  to: GNode,
  edges: GEdge[],
): string | null {
  if (from.id === to.id) return 'Um neurônio não pode se conectar a si mesmo.'
  if (from.kind === 'output') return 'A saída não tem conexões de saída.'
  if (to.kind === 'input') return 'A entrada não recebe conexões.'
  if (edges.some((e) => e.from === from.id && e.to === to.id)) {
    return 'Essa conexão já existe.'
  }
  if (from.x > to.x - MIN_DX) {
    return 'Conecte da esquerda para a direita — o sinal flui nesse sentido.'
  }
  return null
}

/** Constrói o grafo em camadas totalmente conectado (ponte com o playground). */
export function layeredGraph(
  layers: number[],
  box = { x0: 70, x1: 730, y0: 60, y1: 460 },
): { nodes: GNode[]; edges: GEdge[] } {
  const nodes: GNode[] = []
  const edges: GEdge[] = []
  const byLayer: string[][] = []
  layers.forEach((n, l) => {
    const x = layers.length === 1 ? (box.x0 + box.x1) / 2 : box.x0 + ((box.x1 - box.x0) * l) / (layers.length - 1)
    const ids: string[] = []
    for (let i = 0; i < n; i++) {
      const y = n === 1 ? (box.y0 + box.y1) / 2 : box.y0 + ((box.y1 - box.y0) * i) / (n - 1)
      const kind: NodeKind = l === 0 ? 'input' : l === layers.length - 1 ? 'output' : 'hidden'
      const id = `L${l}N${i}`
      nodes.push({ id, kind, x, y, bias: 0 })
      ids.push(id)
    }
    byLayer.push(ids)
  })
  let k = 0
  for (let l = 0; l < byLayer.length - 1; l++) {
    for (const a of byLayer[l]) {
      for (const b of byLayer[l + 1]) {
        edges.push({ id: `e${k++}`, from: a, to: b, weight: 0 })
      }
    }
  }
  return { nodes, edges }
}
