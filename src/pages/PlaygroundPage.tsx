import { useCallback, useEffect, useMemo, useState } from 'react'
import { NeuralNetwork } from '../engine/network'
import { generateDataset, type DataPoint } from '../engine/datasets'
import { ControlPanel, type ControlsConfig } from '../components/ControlPanel'
import { DataCanvas } from '../components/DataCanvas'
import { EducationPanel } from '../components/EducationPanel'
import { NetworkCanvas } from '../components/NetworkCanvas'
import { SiteHeader } from '../components/SiteHeader'
import { TrainingChart, type LossPoint } from '../components/TrainingChart'
import { Term } from '../components/Term'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'

const N_POINTS = 140

export function PlaygroundPage() {
  const [config, setConfig] = useState<ControlsConfig>({
    datasetId: 'circulo',
    hidden: [4, 3],
    activation: 'tanh',
    lr: 0.03,
    noise: 0.5,
    speed: 5,
  })
  const patch = useCallback(
    (p: Partial<ControlsConfig>) => setConfig((c) => ({ ...c, ...p })),
    [],
  )

  const [points, setPoints] = useState<DataPoint[]>(() =>
    generateDataset('circulo', N_POINTS, 0.5),
  )
  const [running, setRunning] = useState(false)
  const [epoch, setEpoch] = useState(0)
  const [loss, setLoss] = useState(0)
  const [acc, setAcc] = useState(0)
  const [history, setHistory] = useState<LossPoint[]>([])
  const [boundaryVersion, setBoundaryVersion] = useState(0)
  const [activations, setActivations] = useState<number[][] | null>(null)

  const layers = useMemo(() => [2, ...config.hidden, 1], [config.hidden])
  const layersKey = layers.join(',')

  // Rede recriada quando a arquitetura muda; ativação só reconfigurada.
  const net = useMemo(
    () => new NeuralNetwork(layers, config.activation),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [layersKey],
  )
  useEffect(() => {
    net.setActivation(config.activation)
  }, [net, config.activation])

  const refreshStats = useCallback(
    (network: NeuralNetwork, pts: DataPoint[]) => {
      setLoss(network.computeLoss(pts))
      setAcc(network.accuracy(pts))
      const probe = pts[0] ?? { x: 0, y: 0 }
      setActivations(network.forward([probe.x, probe.y]).activations)
      setBoundaryVersion((v) => v + 1)
    },
    [],
  )

  // Gera novos dados quando dataset/ruído mudam (com debounce p/ o slider).
  useEffect(() => {
    const t = setTimeout(() => {
      const pts = generateDataset(config.datasetId, N_POINTS, config.noise)
      setPoints(pts)
    }, 350)
    return () => clearTimeout(t)
  }, [config.datasetId, config.noise])

  // Reseta estatísticas quando a rede ou os dados mudam.
  useEffect(() => {
    setEpoch(0)
    setHistory([])
    refreshStats(net, points)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [net, points])

  // Loop de treinamento.
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      const n = config.speed
      let l = 0
      for (let i = 0; i < n; i++) l = net.trainEpoch(points, config.lr)
      setEpoch((e) => e + n)
      setHistory((h) => {
        const last = h.length > 0 ? h[h.length - 1].epoch : 0
        return [...h.slice(-600), { epoch: last + n, loss: l }]
      })
      refreshStats(net, points)
    }, 120)
    return () => clearInterval(id)
  }, [running, config.speed, config.lr, net, points, refreshStats])

  const predict = useCallback((x: number, y: number) => net.predict([x, y]), [net])

  const handleStep = useCallback(() => {
    let l = 0
    for (let i = 0; i < 10; i++) l = net.trainEpoch(points, config.lr)
    setEpoch((e) => e + 10)
    setHistory((h) => {
      const last = h.length > 0 ? h[h.length - 1].epoch : 0
      return [...h.slice(-600), { epoch: last + 10, loss: l }]
    })
    refreshStats(net, points)
  }, [net, points, config.lr, refreshStats])

  const handleReset = useCallback(() => {
    net.reset()
    setEpoch(0)
    setHistory([])
    refreshStats(net, points)
  }, [net, points, refreshStats])

  const handleNewData = useCallback(() => {
    setPoints(generateDataset(config.datasetId, N_POINTS, config.noise))
  }, [config.datasetId, config.noise])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader
        right={
          <>
            <Stat label="Época" value={`${epoch}`} />
            <Stat label="Perda" value={epoch === 0 && history.length === 0 ? '—' : loss.toFixed(4)} />
            <Stat
              label="Acurácia"
              value={`${(acc * 100).toFixed(1)}%`}
              tone={acc >= 0.9 ? 'good' : acc >= 0.7 ? 'warn' : undefined}
            />
          </>
        }
      />

      <main className="container grid gap-4 py-6 xl:grid-cols-[300px_minmax(0,1fr)_370px]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">Controles</CardTitle>
            <CardDescription>
              Configure a <Term id="camada">arquitetura</Term> e os{' '}
              <Term id="lr">hiperparâmetros</Term>, depois aperte Treinar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ControlPanel
              config={config}
              onChange={patch}
              running={running}
              onPlayPause={() => setRunning((r) => !r)}
              onStep={handleStep}
              onReset={handleReset}
              onNewData={handleNewData}
            />
          </CardContent>
        </Card>

        <div className="grid min-w-0 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                Dados e <Term id="fronteira">fronteira de decisão</Term>
              </CardTitle>
              <CardDescription>
                Fundo = o que a rede prevê em cada região ·{' '}
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#3b82f6]" /> classe 0
                · <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#fb9233]" /> classe
                1 · anel branco = <Term id="loss">erro</Term>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataCanvas points={points} predict={predict} version={boundaryVersion} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                Curva de <Term id="loss">perda</Term>
              </CardTitle>
              <CardDescription>
                Acompanhe o <Term id="gradiente">aprendizado</Term> época após época. Queda
                suave = treino saudável; oscilações = taxa alta demais.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TrainingChart history={history} />
            </CardContent>
          </Card>
        </div>

        <div className="grid min-w-0 content-start gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                A rede por dentro <span className="font-normal text-muted-foreground">(ao vivo)</span>
              </CardTitle>
              <CardDescription>
                <Term id="peso">Pesos</Term> azuis (+) e laranjas (−) · brilho ={' '}
                <Term id="ativacao">ativação</Term> · partículas ={' '}
                <Term id="forward">forward pass</Term>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NetworkCanvas
                layers={layers}
                weights={net.weights}
                activations={activations}
                running={running}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Aprenda</CardTitle>
            </CardHeader>
            <CardContent>
              <EducationPanel />
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="border-t border-border py-4">
        <p className="container text-xs text-muted-foreground">
          NeuroPlay · rede neural real em TypeScript (SGD +{' '}
          <Term id="backprop">backpropagation</Term>) rodando 100% no seu navegador. Sem
          servidor, sem tracking.
        </p>
      </footer>
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'good' | 'warn' }) {
  return (
    <div className="min-w-[92px] rounded-lg border border-border bg-card px-3 py-1.5 text-center">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div
        className={`font-mono text-sm font-semibold ${
          tone === 'good' ? 'text-foreground' : tone === 'warn' ? 'text-muted-foreground' : ''
        }`}
      >
        {value}
      </div>
    </div>
  )
}
