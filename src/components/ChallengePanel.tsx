import { Lightbulb, Pause, Play, RotateCcw, StepForward, Trophy } from 'lucide-react'
import { checkConstraints, type Challenge } from '../content/challenges'
import type { ActivationName } from '../engine/network'
import type { GNode } from '../engine/graph'
import { Button } from './ui/button'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Slider } from './ui/slider'
import { Term } from './Term'

const LR_OPTIONS = [0.01, 0.03, 0.1, 0.3]

interface Props {
  challenge: Challenge
  nodes: GNode[]
  running: boolean
  epoch: number
  loss: number
  acc: number
  lr: number
  speed: number
  activation: ActivationName
  completed: boolean
  onHyper: (p: { lr?: number; speed?: number; activation?: ActivationName }) => void
  onPlayPause: () => void
  onStep: () => void
  onResetWeights: () => void
  onResetStage: () => void
}

export function ChallengePanel(props: Props) {
  const { challenge, nodes, acc, completed } = props
  const constraints = checkConstraints(challenge, nodes)
  const hiddenCount = nodes.filter((n) => n.kind === 'hidden').length
  const accOk = acc >= challenge.goal.accuracy
  const won = accOk && constraints.ok

  return (
    <div className="space-y-5">
      <div>
        <p className="text-2xl">{challenge.emoji}</p>
        <h2 className="mt-1 text-lg font-bold leading-tight">{challenge.title}</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{challenge.story}</p>
        <p className="mt-2 text-[13px] leading-relaxed">{challenge.briefing}</p>
      </div>

      {/* Objetivos */}
      <div className="space-y-1.5 rounded-lg border border-border bg-background p-3 text-[13px]">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Objetivo
        </p>
        <GoalRow ok={accOk} text={`Acurácia ≥ ${(challenge.goal.accuracy * 100).toFixed(0)}% (atual: ${(acc * 100).toFixed(1)}%)`} />
        {challenge.goal.maxHidden !== undefined && (
          <GoalRow
            ok={hiddenCount <= challenge.goal.maxHidden}
            text={
              challenge.goal.maxHidden === 0
                ? 'Sem neurônios ocultos'
                : `No máximo ${challenge.goal.maxHidden} neurônios ocultos (atual: ${hiddenCount})`
            }
          />
        )}
        {challenge.goal.minHidden !== undefined && (
          <GoalRow
            ok={hiddenCount >= challenge.goal.minHidden}
            text={`Pelo menos ${challenge.goal.minHidden} neurônio(s) oculto(s) (atual: ${hiddenCount})`}
          />
        )}
        {!constraints.ok &&
          constraints.messages.map((m) => (
            <p key={m} className="text-xs text-muted-foreground">
              ⚠ {m}
            </p>
          ))}
      </div>

      {completed && (
        <div className="flex items-start gap-2 rounded-lg border border-primary/50 bg-primary/10 p-3 text-[13px]">
          <Trophy className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">Desafio concluído!</p>
            <p className="text-muted-foreground">Recompensa: {challenge.reward}</p>
          </div>
        </div>
      )}
      {won && !completed && (
        <p className="text-[13px] text-muted-foreground">Meta batida! Finalizando…</p>
      )}

      {/* Transporte */}
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={props.onPlayPause}
          className="flex-1"
          variant={props.running ? 'secondary' : 'default'}
        >
          {props.running ? <Pause /> : <Play />}
          {props.running ? 'Pausar' : 'Treinar'}
        </Button>
        <Button onClick={props.onStep} variant="outline" size="icon" title="Avançar 50 épocas">
          <StepForward />
        </Button>
        <Button onClick={props.onResetWeights} variant="outline" size="icon" title="Reiniciar pesos">
          <RotateCcw />
        </Button>
      </div>
      <Button onClick={props.onResetStage} variant="ghost" size="sm" className="w-full">
        Recomeçar fase (grafo inicial)
      </Button>

      {/* Hiperparâmetros */}
      <div className="space-y-3">
        <div className="space-y-2">
          <Label>
            <Term id="ativacao">Ativação dos ocultos</Term>
          </Label>
          <Select
            value={props.activation}
            onValueChange={(v) => props.onHyper({ activation: v as ActivationName })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tanh">tanh</SelectItem>
              <SelectItem value="relu">ReLU</SelectItem>
              <SelectItem value="sigmoid">sigmoide</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <Label>
              <Term id="lr">Taxa de aprendizado</Term>
            </Label>
            <span className="font-mono text-muted-foreground">{props.lr}</span>
          </div>
          <Slider
            value={[Math.max(0, LR_OPTIONS.indexOf(props.lr))]}
            min={0}
            max={LR_OPTIONS.length - 1}
            step={1}
            onValueChange={([i]) => props.onHyper({ lr: LR_OPTIONS[i] })}
          />
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <Label>
              <Term id="epoca">Velocidade</Term>
            </Label>
            <span className="font-mono text-muted-foreground">{props.speed} ép./tick</span>
          </div>
          <Slider
            value={[props.speed]}
            min={1}
            max={30}
            step={1}
            onValueChange={([v]) => props.onHyper({ speed: v })}
          />
        </div>
        <p className="font-mono text-xs text-muted-foreground">
          época {props.epoch} · perda {props.epoch === 0 ? '—' : props.loss.toFixed(4)} · acurácia{' '}
          {(props.acc * 100).toFixed(1)}%
        </p>
      </div>

      {/* Dicas */}
      <details className="group rounded-lg border border-border bg-background p-3">
        <summary className="flex cursor-pointer items-center gap-2 text-[13px] font-medium">
          <Lightbulb className="h-4 w-4" /> Dicas do oráculo
        </summary>
        <ul className="mt-2 space-y-1.5 text-[13px] text-muted-foreground">
          {challenge.hints.map((h) => (
            <li key={h} className="leading-relaxed">
              • {h}
            </li>
          ))}
        </ul>
      </details>
    </div>
  )
}

function GoalRow({ ok, text }: { ok: boolean; text: string }) {
  return (
    <p className="flex items-start gap-2">
      <span className={ok ? 'text-foreground' : 'text-muted-foreground'}>{ok ? '☑' : '☐'}</span>
      <span className={ok ? '' : 'text-muted-foreground'}>{text}</span>
    </p>
  )
}
