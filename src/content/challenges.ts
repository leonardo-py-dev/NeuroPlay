import { generateDataset, type DataPoint, type DatasetId } from '../engine/datasets'
import type { GEdge, GNode } from '../engine/graph'

export interface ChallengeGoal {
  /** Acurácia mínima (0..1) para vencer. */
  accuracy: number
  /** Nº máximo de neurônios ocultos (undefined = livre). */
  maxHidden?: number
  /** Nº mínimo de neurônios ocultos (undefined = livre). */
  minHidden?: number
}

export interface Challenge {
  id: string
  title: string
  emoji: string
  difficulty: 1 | 2 | 3
  story: string
  briefing: string
  datasetId: DatasetId | 'cofre'
  nPoints: number
  noise: number
  goal: ChallengeGoal
  hints: string[]
  reward: string
  /** Grafo inicial do canvas. */
  starter: { nodes: GNode[]; edges: GEdge[] }
}

let hid = 0
function hidden(x: number, y: number): GNode {
  return { id: `h${hid++}`, kind: 'hidden', x, y, bias: 0 }
}

function baseNodes(): GNode[] {
  hid = 0
  return [
    { id: 'in-x1', kind: 'input', x: 70, y: 180, bias: 0 },
    { id: 'in-x2', kind: 'input', x: 70, y: 340, bias: 0 },
    { id: 'out', kind: 'output', x: 730, y: 260, bias: 0 },
  ]
}

/** Gera os pontos de cada desafio (o "cofre" é a tabela AND). */
export function challengeData(c: Challenge): DataPoint[] {
  if (c.datasetId === 'cofre') {
    const pts: DataPoint[] = []
    const corners: [number, number, 0 | 1][] = [
      [-3.5, -3.5, 0],
      [-3.5, 3.5, 0],
      [3.5, -3.5, 0],
      [3.5, 3.5, 1],
    ]
    for (const [cx, cy, label] of corners) {
      for (let i = 0; i < 25; i++) {
        const jx = (Math.random() - 0.5) * 2 * c.noise
        const jy = (Math.random() - 0.5) * 2 * c.noise
        pts.push({
          x: Math.max(-6, Math.min(6, cx + jx)),
          y: Math.max(-6, Math.min(6, cy + jy)),
          label,
        })
      }
    }
    return pts
  }
  return generateDataset(c.datasetId, c.nPoints, c.noise)
}

export const CHALLENGES: Challenge[] = [
  {
    id: 'porteiro',
    title: 'O Porteiro da Balada Neon',
    emoji: '🪩',
    difficulty: 1,
    story:
      'A balada mais famosa da cidade contratou um porteiro-robô: convidados VIP (laranja) entram, penetras (azuis) ficam de fora. Cada ponto é uma pessoa chegando à porta.',
    briefing:
      'Monte uma rede que aprenda a separar os dois grupos. Vale qualquer arquitetura — o porteiro só quer acertar.',
    datasetId: 'gaussianas',
    nPoints: 120,
    noise: 0.5,
    goal: { accuracy: 0.95 },
    hints: [
      'Dois grupos bem separados pedem uma fronteira quase reta.',
      'Tente ZERO neurônios ocultos: ligue as entradas direto na saída.',
      'Se travar, adicione 1 neurônio oculto e reconecte.',
    ],
    reward: 'Crachá de Porteiro Lendário',
    starter: { nodes: [...baseNodes(), hidden(400, 260)], edges: [] },
  },
  {
    id: 'cofre',
    title: 'A Fechadura do Cofre Pirata',
    emoji: '🏴‍☠️',
    difficulty: 1,
    story:
      'O Capitão Barba-Cinza guarda o tesouro num cofre com duas alavancas (x₁ e x₂). O cofre SÓ abre quando as DUAS estão puxadas — a lógica AND dos piratas.',
    briefing:
      'Sem neurônios ocultos! Conecte as entradas direto na saída e treine até o cofre abrir 100% das vezes.',
    datasetId: 'cofre',
    nPoints: 100,
    noise: 0.8,
    goal: { accuracy: 1, maxHidden: 0 },
    hints: [
      'O AND é linearmente separável: uma linha reta resolve.',
      'Ligue x₁ → saída e x₂ → saída. Só isso.',
      'O viés da saída aprende o "limiar" de abertura do cofre.',
    ],
    reward: 'Mapa do Tesouro',
    starter: { nodes: baseNodes(), edges: [] },
  },
  {
    id: 'mago',
    title: 'O XOR do Mago',
    emoji: '🧙',
    difficulty: 2,
    story:
      'O mago Merlin enfeitiçou quatro pedras: cantos opostos brilham da mesma cor. Nenhuma linha reta separa as cores — é o famoso feitiço XOR.',
    briefing:
      'Prove que uma camada oculta quebra o feitiço. Acurácia de 95% para vencer.',
    datasetId: 'xor',
    nPoints: 140,
    noise: 0.5,
    goal: { accuracy: 0.95, minHidden: 1 },
    hints: [
      'Com 0 neurônios ocultos a rede fica presa nos ~50%. Por quê?',
      '2 neurônios ocultos conectados a tudo costumam bastar.',
      'Cada neurônio oculto aprende uma "linha"; a saída combina as linhas.',
    ],
    reward: 'Varinha de Backprop',
    starter: {
      nodes: [...baseNodes(), hidden(330, 180), hidden(330, 340)],
      edges: [],
    },
  },
  {
    id: 'dragao',
    title: 'A Erupção do Dragão',
    emoji: '🐉',
    difficulty: 2,
    story:
      'O dragão Fumaça cospe anéis de fogo: quem está DENTRO do anel (azul) se protege, quem está FORA (laranja) vira churrasco. O oráculo precisa prever a zona segura.',
    briefing:
      'Desenhe uma fronteira curva com no máximo 4 neurônios ocultos e acerte 90% das previsões.',
    datasetId: 'circulo',
    nPoints: 140,
    noise: 0.5,
    goal: { accuracy: 0.9, maxHidden: 4 },
    hints: [
      'Fronteira circular = combinação de curvas, não de retas.',
      '3 a 4 neurônios ocultos dão conta; 8 seria desperdício (overfitting!).',
      'Taxa de aprendizado 0.1 costuma funcionar bem aqui.',
    ],
    reward: 'Escama de Dragão Dourada',
    starter: {
      nodes: [...baseNodes(), hidden(300, 140), hidden(300, 260), hidden(300, 380)],
      edges: [],
    },
  },
  {
    id: 'redemoinho',
    title: 'O Redemoinho Final',
    emoji: '🌪️',
    difficulty: 3,
    story:
      'Duas correntes mágicas se enrolam no redemoinho do fim do mundo. Só um arquiteto de redes de verdade consegue separar as águas. Sem limite de neurônios — use tudo que aprendeu.',
    briefing:
      'Desafio final: 85% de acurácia na espiral dupla. Arquitetura livre.',
    datasetId: 'espiral',
    nPoints: 160,
    noise: 0.25,
    goal: { accuracy: 0.85 },
    hints: [
      'Espirais exigem fronteiras bem dobradas: pense em 6–8 neurônios.',
      'Duas camadas de ocultos (uma coluna à esquerda, outra à direita) ajudam.',
      'Paciência: aqui o treino leva alguns milhares de épocas.',
    ],
    reward: 'Coroa do Arquiteto Neural',
    starter: {
      nodes: [
        ...baseNodes(),
        hidden(280, 130),
        hidden(280, 260),
        hidden(280, 390),
        hidden(480, 180),
        hidden(480, 340),
      ],
      edges: [],
    },
  },
]

const KEY = 'neuroplay:completed'

export function getCompleted(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]')
  } catch {
    return []
  }
}

export function markCompleted(id: string): void {
  const done = getCompleted()
  if (!done.includes(id)) {
    localStorage.setItem(KEY, JSON.stringify([...done, id]))
  }
}

/** Verifica se o grafo cumpre as restrições arquiteturais do desafio. */
export function checkConstraints(
  c: Challenge,
  nodes: GNode[],
): { ok: boolean; messages: string[] } {
  const hiddenCount = nodes.filter((n) => n.kind === 'hidden').length
  const messages: string[] = []
  let ok = true
  if (c.goal.maxHidden !== undefined && hiddenCount > c.goal.maxHidden) {
    ok = false
    messages.push(
      `Use no máximo ${c.goal.maxHidden} neurônio(s) oculto(s) — você tem ${hiddenCount}.`,
    )
  }
  if (c.goal.minHidden !== undefined && hiddenCount < c.goal.minHidden) {
    ok = false
    messages.push(
      `Use pelo menos ${c.goal.minHidden} neurônio(s) oculto(s) — você tem ${hiddenCount}.`,
    )
  }
  return { ok, messages }
}
