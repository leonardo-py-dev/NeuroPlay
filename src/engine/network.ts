export type ActivationName = 'tanh' | 'relu' | 'sigmoid'

export interface ForwardCache {
  /** activations[0] = input layer, activations[L-1] = output */
  activations: number[][]
  /** zs[l] = pré-ativação da camada l (sem a camada de entrada) */
  zs: number[][]
}

function activate(name: ActivationName, z: number): number {
  switch (name) {
    case 'tanh':
      return Math.tanh(z)
    case 'relu':
      return z > 0 ? z : 0
    case 'sigmoid':
      return 1 / (1 + Math.exp(-z))
  }
}

function activateDerivative(name: ActivationName, z: number, a: number): number {
  switch (name) {
    case 'tanh':
      return 1 - a * a
    case 'relu':
      return z > 0 ? 1 : 0
    case 'sigmoid':
      return a * (1 - a)
  }
}

function randUniform(limit: number): number {
  return (Math.random() * 2 - 1) * limit
}

/**
 * Rede neural feedforward pequena para classificação binária.
 * Camada de saída sempre usa sigmoide (probabilidade classe 1).
 * Treinamento via SGD online (atualiza a cada amostra embaralhada).
 */
export class NeuralNetwork {
  layers: number[]
  /** weights[l][i][j] — camada l (1..L-1), neurônio i, vindo do neurônio j */
  weights: number[][][]
  /** biases[l][i] — camada l (1..L-1), neurônio i */
  biases: number[][]
  activation: ActivationName

  constructor(layers: number[], activation: ActivationName = 'tanh') {
    this.layers = [...layers]
    this.activation = activation
    this.weights = []
    this.biases = []
    this.reset()
  }

  reset(): void {
    this.weights = []
    this.biases = []
    for (let l = 1; l < this.layers.length; l++) {
      const fanIn = this.layers[l - 1]
      const fanOut = this.layers[l]
      const limit = Math.sqrt(6 / (fanIn + fanOut))
      const w: number[][] = []
      const b: number[] = []
      for (let i = 0; i < fanOut; i++) {
        const row: number[] = []
        for (let j = 0; j < fanIn; j++) row.push(randUniform(limit))
        w.push(row)
        b.push(0)
      }
      this.weights.push(w)
      this.biases.push(b)
    }
  }

  setActivation(name: ActivationName): void {
    this.activation = name
  }

  forward(input: number[]): ForwardCache {
    const activations: number[][] = [ [...input] ]
    const zs: number[][] = []
    let a = [...input]
    for (let l = 1; l < this.layers.length; l++) {
      const isOutput = l === this.layers.length - 1
      const fn = isOutput ? 'sigmoid' : this.activation
      const z: number[] = []
      const next: number[] = []
      for (let i = 0; i < this.layers[l]; i++) {
        let s = this.biases[l - 1][i]
        for (let j = 0; j < this.layers[l - 1]; j++) {
          s += this.weights[l - 1][i][j] * a[j]
        }
        z.push(s)
        next.push(activate(fn as ActivationName, s))
      }
      zs.push(z)
      activations.push(next)
      a = next
    }
    return { activations, zs }
  }

  /** Probabilidade da classe 1 para uma entrada [x, y] */
  predict(input: number[]): number {
    const { activations } = this.forward(input)
    return activations[activations.length - 1][0]
  }

  /**
   * Uma época de SGD com mini-batches. Retorna a perda média (BCE).
   * Mini-batches (padrão 10) dão um gradiente mais estável que o
   * SGD puro por amostra, sem perder velocidade de convergência.
   */
  trainEpoch(
    points: { x: number; y: number; label: 0 | 1 }[],
    lr: number,
    batchSize = 10,
  ): number {
    const order = points.map((_, i) => i)
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[order[i], order[j]] = [order[j], order[i]]
    }

    // Acumuladores de gradiente (mesmo formato dos pesos/vieses)
    const accW = this.weights.map((wl) => wl.map((row) => row.map(() => 0)))
    const accB = this.biases.map((b) => b.map(() => 0))

    let totalLoss = 0
    let inBatch = 0

    const applyBatch = () => {
      const scale = lr / inBatch
      for (let l = 0; l < this.weights.length; l++) {
        for (let i = 0; i < this.weights[l].length; i++) {
          for (let j = 0; j < this.weights[l][i].length; j++) {
            this.weights[l][i][j] -= scale * accW[l][i][j]
            accW[l][i][j] = 0
          }
          this.biases[l][i] -= scale * accB[l][i]
          accB[l][i] = 0
        }
      }
      inBatch = 0
    }

    for (const idx of order) {
      totalLoss += this.accumulateGradients(points[idx], accW, accB)
      inBatch++
      if (inBatch >= batchSize) applyBatch()
    }
    if (inBatch > 0) applyBatch()

    return totalLoss / Math.max(1, order.length)
  }

  /**
   * Forward + backprop de uma amostra, somando os gradientes nos
   * acumuladores. Retorna a perda (BCE) da amostra.
   */
  private accumulateGradients(
    p: { x: number; y: number; label: 0 | 1 },
    accW: number[][][],
    accB: number[][],
  ): number {
    const input = [p.x, p.y]
    const { activations, zs } = this.forward(input)
    const L = this.layers.length

    const eps = 1e-9
    const out = Math.min(1 - eps, Math.max(eps, activations[L - 1][0]))
    const loss = -(p.label * Math.log(out) + (1 - p.label) * Math.log(1 - out))

    // delta[l] = dL/dz da camada (l+1) porque delta indexa a partir da 1ª oculta
    const deltas: number[][] = new Array(L - 1)

    // Camada de saída (BCE + sigmoide => delta = a - y)
    deltas[L - 2] = [activations[L - 1][0] - p.label]

    // Backprop nas ocultas
    for (let l = L - 2; l >= 1; l--) {
      const deltaNext = deltas[l] // delta da camada (l+1)
      const current: number[] = []
      for (let j = 0; j < this.layers[l]; j++) {
        let s = 0
        for (let i = 0; i < this.layers[l + 1]; i++) {
          s += this.weights[l][i][j] * deltaNext[i]
        }
        const d = activateDerivative(this.activation, zs[l - 1][j], activations[l][j])
        current.push(s * d)
      }
      deltas[l - 1] = current
    }

    // Soma os gradientes nos acumuladores (a atualização acontece por batch)
    for (let l = 1; l < L; l++) {
      const delta = deltas[l - 1]
      for (let i = 0; i < this.layers[l]; i++) {
        for (let j = 0; j < this.layers[l - 1]; j++) {
          accW[l - 1][i][j] += delta[i] * activations[l - 1][j]
        }
        accB[l - 1][i] += delta[i]
      }
    }

    return loss
  }

  computeLoss(points: { x: number; y: number; label: 0 | 1 }[]): number {
    const eps = 1e-9
    let total = 0
    for (const p of points) {
      const o = Math.min(1 - eps, Math.max(eps, this.predict([p.x, p.y])))
      total += -(p.label * Math.log(o) + (1 - p.label) * Math.log(1 - o))
    }
    return total / Math.max(1, points.length)
  }

  accuracy(points: { x: number; y: number; label: 0 | 1 }[]): number {
    if (points.length === 0) return 0
    let ok = 0
    for (const p of points) {
      if ((this.predict([p.x, p.y]) >= 0.5 ? 1 : 0) === p.label) ok++
    }
    return ok / points.length
  }
}
