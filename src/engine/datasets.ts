export interface DataPoint {
  /** coordenada x normalizada em [-6, 6] */
  x: number
  /** coordenada y normalizada em [-6, 6] */
  y: number
  label: 0 | 1
}

export type DatasetId = 'circulo' | 'xor' | 'espiral' | 'gaussianas' | 'linha'

export interface DatasetMeta {
  id: DatasetId
  name: string
  description: string
  difficulty: 1 | 2 | 3
}

export const DATASETS: DatasetMeta[] = [
  {
    id: 'gaussianas',
    name: 'Duas gaussianas',
    description: 'Dois grupos separados. Uma linha reta resolve — ótimo ponto de partida.',
    difficulty: 1,
  },
  {
    id: 'circulo',
    name: 'Círculo',
    description: 'Uma classe dentro de um anel e outra fora. Exige fronteira curva.',
    difficulty: 2,
  },
  {
    id: 'xor',
    name: 'XOR',
    description: 'O clássico problema não-linear: cantos opostos pertencem à mesma classe.',
    difficulty: 2,
  },
  {
    id: 'espiral',
    name: 'Espiral dupla',
    description: 'Duas espirais entrelaçadas. O desafio final — exige rede maior.',
    difficulty: 3,
  },
  {
    id: 'linha',
    name: 'Meias-luas',
    description: 'Duas luas entrelaçadas, como o dataset "moons" do scikit-learn.',
    difficulty: 3,
  },
]

function randn(): number {
  // Box-Muller
  let u = 0
  let v = 0
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

/** Gera pontos com coordenadas em [-6, 6] */
export function generateDataset(id: DatasetId, n = 140, noise = 0.5): DataPoint[] {
  const pts: DataPoint[] = []
  const nz = () => randn() * noise
  const half = Math.floor(n / 2)

  switch (id) {
    case 'gaussianas': {
      for (let i = 0; i < half; i++) {
        pts.push({ x: -2.5 + nz(), y: 1.5 + nz(), label: 0 })
      }
      for (let i = 0; i < n - half; i++) {
        pts.push({ x: 2.5 + nz(), y: -1.5 + nz(), label: 1 })
      }
      break
    }
    case 'circulo': {
      for (let i = 0; i < n; i++) {
        const r = i < half ? 1.6 + randn() * 0.35 * (1 + noise) : 4 + randn() * 0.45 * (1 + noise)
        const a = Math.random() * Math.PI * 2
        pts.push({
          x: Math.cos(a) * r + nz() * 0.3,
          y: Math.sin(a) * r + nz() * 0.3,
          label: i < half ? 0 : 1,
        })
      }
      break
    }
    case 'xor': {
      for (let i = 0; i < n; i++) {
        const sx = Math.random() < 0.5 ? -1 : 1
        const sy = Math.random() < 0.5 ? -1 : 1
        pts.push({
          x: sx * 2.4 + nz(),
          y: sy * 2.4 + nz(),
          label: sx * sy > 0 ? 0 : 1,
        })
      }
      break
    }
    case 'espiral': {
      for (let i = 0; i < n; i++) {
        const k = Math.floor((i / n) * 2) // 0 ou 1
        const t = (i % Math.ceil(n / 2)) / Math.ceil(n / 2)
        const angle = t * Math.PI * 3.2 + k * Math.PI
        const r = 0.8 + t * 4
        pts.push({
          x: Math.cos(angle) * r + nz(),
          y: Math.sin(angle) * r + nz(),
          label: k as 0 | 1,
        })
      }
      break
    }
    case 'linha': {
      for (let i = 0; i < half; i++) {
        const t = (i / half) * Math.PI
        pts.push({ x: Math.cos(t) * 3.5 + nz(), y: Math.sin(t) * 2.6 - 1 + nz() * 0.7, label: 0 })
      }
      for (let i = 0; i < n - half; i++) {
        const t = (i / (n - half)) * Math.PI
        pts.push({ x: Math.cos(t) * -3.5 + 1.5 + nz(), y: -Math.sin(t) * 2.6 + 1.5 + nz() * 0.7, label: 1 })
      }
      break
    }
  }

  // Embaralha e limita ao domínio
  for (let i = pts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pts[i], pts[j]] = [pts[j], pts[i]]
  }
  for (const p of pts) {
    p.x = Math.max(-6, Math.min(6, p.x))
    p.y = Math.max(-6, Math.min(6, p.y))
  }
  return pts
}
