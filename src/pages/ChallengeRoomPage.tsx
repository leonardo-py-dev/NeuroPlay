import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import {
  CHALLENGES,
  challengeData,
  checkConstraints,
  getCompleted,
  markCompleted,
} from '../content/challenges'
import { GraphNetwork, type GEdge, type GNode } from '../engine/graph'
import type { ActivationName } from '../engine/network'
import type { DataPoint } from '../engine/datasets'
import { ChallengeCanvas } from '../components/ChallengeCanvas'
import { ChallengePanel } from '../components/ChallengePanel'
import { DataCanvas } from '../components/DataCanvas'
import { SiteHeader } from '../components/SiteHeader'
import { TrainingChart, type LossPoint } from '../components/TrainingChart'
import { Term } from '../components/Term'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v))
}

export function ChallengeRoomPage() {
  const { id } = useParams()
  const challenge = CHALLENGES.find((c) => c.id === id)
  if (!challenge) return <Navigate to="/desafios" replace />

  return <Room key={challenge.id} challengeId={challenge.id} />
}

function Room({ challengeId }: { challengeId: string }) {
  const challenge = CHALLENGES.find((c) => c.id === challengeId)!

  const [nodes, setNodes] = useState<GNode[]>(() => clone(challenge.starter.nodes))
  const [edges, setEdges] = useState<GEdge[]>(() => clone(challenge.starter.edges))
  const [points] = useState<DataPoint[]>(() => challengeData(challenge))
  const [running, setRunning] = useState(false)
  const [epoch, setEpoch] = useState(0)
  const [loss, setLoss] = useState(0)
  const [acc, setAcc] = useState(0)
  const [history, setHistory] = useState<LossPoint[]>([])
  const [boundaryVersion, setBoundaryVersion] = useState(0)
  const [acts, setActs] = useState<Record<string, number>>({})
  const [lr, setLr] = useState(0.1)
  const [speed, setSpeed] = useState(8)
  const [activation, setActivation] = useState<ActivationName>('tanh')
  const [completed, setCompleted] = useState(() => getCompleted().includes(challenge.id))

  const netRef = useRef<GraphNetwork | null>(null)
  if (!netRef.current) {
    netRef.current = new GraphNetwork()
    netRef.current.setActivation(activation)
  }
  const net = netRef.current

  const refresh = useCallback(() => {
    const probe = points[0] ?? { x: 0, y: 0 }
    const { act } = net.forward([probe.x, probe.y])
    setActs(Object.fromEntries(act))
    setLoss(net.computeLoss(points))
    setAcc(net.accuracy(points))
    setBoundaryVersion((v) => v + 1)
  }, [net, points])

  // Sincroniza o motor com o grafo do canvas (preserva pesos aprendidos).
  useEffect(() => {
    net.sync(nodes, edges)
    net.setActivation(activation)
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges])

  useEffect(() => {
    net.setActivation(activation)
  }, [net, activation])

  // Loop de treinamento.
  useEffect(() => {
    if (!running) return
    const timer = setInterval(() => {
      let l = 0
      for (let i = 0; i < speed; i++) l = net.trainEpoch(points, lr)
      setEpoch((e) => e + speed)
      setHistory((h) => {
        const last = h.length > 0 ? h[h.length - 1].epoch : 0
        return [...h.slice(-600), { epoch: last + speed, loss: l }]
      })
      const probe = points[0] ?? { x: 0, y: 0 }
      setActs(Object.fromEntries(net.forward([probe.x, probe.y]).act))
      setLoss(net.computeLoss(points))
      setAcc(net.accuracy(points))
      setBoundaryVersion((v) => v + 1)
    }, 120)
    return () => clearInterval(timer)
  }, [running, speed, lr, net, points])

  // Vitória: meta de acurácia + restrições arquiteturais.
  useEffect(() => {
    if (completed || epoch === 0) return
    const okConstraints = checkConstraints(challenge, nodes).ok
    if (acc >= challenge.goal.accuracy && okConstraints) {
      markCompleted(challenge.id)
      setCompleted(true)
      setRunning(false)
    }
  }, [acc, nodes, completed, epoch, challenge])

  const predict = useCallback((x: number, y: number) => net.predict([x, y]), [net])

  const handleStep = useCallback(() => {
    let l = 0
    for (let i = 0; i < 50; i++) l = net.trainEpoch(points, lr)
    setEpoch((e) => e + 50)
    setHistory((h) => {
      const last = h.length > 0 ? h[h.length - 1].epoch : 0
      return [...h.slice(-600), { epoch: last + 50, loss: l }]
    })
    refresh()
  }, [net, points, lr, refresh])

  const handleResetWeights = useCallback(() => {
    net.reset()
    setEpoch(0)
    setHistory([])
    refresh()
  }, [net, refresh])

  const handleResetStage = useCallback(() => {
    setRunning(false)
    setNodes(clone(challenge.starter.nodes))
    setEdges(clone(challenge.starter.edges))
    setEpoch(0)
    setHistory([])
  }, [challenge])

  const hyper = useMemo(
    () => ({
      lr,
      speed,
      activation,
      onHyper: (p: { lr?: number; speed?: number; activation?: ActivationName }) => {
        if (p.lr !== undefined) setLr(p.lr)
        if (p.speed !== undefined) setSpeed(p.speed)
        if (p.activation !== undefined) setActivation(p.activation)
      },
    }),
    [lr, speed, activation],
  )

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="container py-6">
        <Link
          to="/desafios"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Todas as fases
        </Link>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="grid min-w-0 content-start gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  Monte sua rede <span className="font-normal text-muted-foreground">(arraste e conecte)</span>
                </CardTitle>
                <CardDescription>
                  <span className="font-mono">x₁ x₂</span> são as entradas fixas,{' '}
                  <span className="font-mono">ŷ</span> a saída. O{' '}
                  <Term id="forward">sinal flui da esquerda para a direita</Term>.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChallengeCanvas
                  nodes={nodes}
                  edges={edges}
                  activations={acts}
                  onNodesChange={setNodes}
                  onEdgesChange={setEdges}
                />
              </CardContent>
            </Card>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    O caso <span className="font-normal text-muted-foreground">(dados + sua fronteira)</span>
                  </CardTitle>
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
                </CardHeader>
                <CardContent>
                  <TrainingChart history={history} />
                </CardContent>
              </Card>
            </div>
          </div>

          <Card className="h-fit">
            <CardContent className="pt-5">
              <ChallengePanel
                challenge={challenge}
                nodes={nodes}
                running={running}
                epoch={epoch}
                loss={loss}
                acc={acc}
                lr={hyper.lr}
                speed={hyper.speed}
                activation={hyper.activation}
                completed={completed}
                onHyper={hyper.onHyper}
                onPlayPause={() => setRunning((r) => !r)}
                onStep={handleStep}
                onResetWeights={handleResetWeights}
                onResetStage={handleResetStage}
              />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
