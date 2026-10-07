import { Dices, Pause, Play, RotateCcw, StepForward } from 'lucide-react'
import type { ActivationName } from '../engine/network'
import { DATASETS, type DatasetId } from '../engine/datasets'
import { Button } from './ui/button'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Slider } from './ui/slider'
import { Term } from './Term'

export interface ControlsConfig {
  datasetId: DatasetId
  hidden: number[]
  activation: ActivationName
  lr: number
  noise: number
  speed: number
}

interface Props {
  config: ControlsConfig
  onChange: (patch: Partial<ControlsConfig>) => void
  running: boolean
  onPlayPause: () => void
  onStep: () => void
  onReset: () => void
  onNewData: () => void
}

const LR_OPTIONS = [0.001, 0.003, 0.01, 0.03, 0.1, 0.3, 0.6]

export function ControlPanel({
  config,
  onChange,
  running,
  onPlayPause,
  onStep,
  onReset,
  onNewData,
}: Props) {
  const lrIndex = LR_OPTIONS.indexOf(config.lr) === -1 ? 3 : LR_OPTIONS.indexOf(config.lr)

  const setHiddenCount = (count: number) => {
    const next = [...config.hidden]
    while (next.length < count) next.push(4)
    onChange({ hidden: next.slice(0, count) })
  }

  const setHiddenSize = (layer: number, size: number) => {
    const next = [...config.hidden]
    next[layer] = size
    onChange({ hidden: next })
  }

  return (
    <div className="space-y-6">
      {/* Transporte */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={onPlayPause} className="flex-1" variant={running ? 'secondary' : 'default'}>
          {running ? <Pause /> : <Play />}
          {running ? 'Pausar' : 'Treinar'}
        </Button>
        <Button onClick={onStep} variant="outline" size="icon" title="Avançar 10 épocas">
          <StepForward />
        </Button>
        <Button onClick={onReset} variant="outline" size="icon" title="Reiniciar pesos">
          <RotateCcw />
        </Button>
        <Button onClick={onNewData} variant="outline" size="icon" title="Gerar novos dados">
          <Dices />
        </Button>
      </div>

      {/* Dataset */}
      <div className="space-y-2">
        <Label>
          <Term id="fronteira">Dados de treino</Term>
        </Label>
        <div className="grid grid-cols-1 gap-1.5">
          {DATASETS.map((d) => (
            <button
              key={d.id}
              onClick={() => onChange({ datasetId: d.id })}
              className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                config.datasetId === d.id
                  ? 'border-primary bg-primary/10'
                  : 'border-input bg-background hover:border-primary/50'
              }`}
            >
              <span className="flex items-center justify-between">
                <span className="font-medium">{d.name}</span>
                <span className="text-[10px] tracking-widest text-muted-foreground">
                  {'●'.repeat(d.difficulty)}
                  {'○'.repeat(3 - d.difficulty)}
                </span>
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">{d.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Arquitetura */}
      <div className="space-y-3">
        <Label>
          <Term id="camada">Arquitetura da rede</Term>
        </Label>
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Camadas ocultas</span>
            <span className="font-mono">{config.hidden.length}</span>
          </div>
          <Slider
            value={[config.hidden.length]}
            min={0}
            max={3}
            step={1}
            onValueChange={([v]) => setHiddenCount(v)}
          />
        </div>
        {config.hidden.map((size, i) => (
          <div key={i} className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                <Term id="neuronio">Neurônios</Term> camada {i + 1}
              </span>
              <span className="font-mono">{size}</span>
            </div>
            <Slider
              value={[size]}
              min={1}
              max={8}
              step={1}
              onValueChange={([v]) => setHiddenSize(i, v)}
            />
          </div>
        ))}
        <p className="text-xs text-muted-foreground">
          Formato: 2 → {config.hidden.length > 0 ? config.hidden.join(' → ') + ' → ' : ''}1
          (2 entradas, 1 saída)
        </p>
      </div>

      {/* Ativação */}
      <div className="space-y-2">
        <Label>
          <Term id="ativacao">Função de ativação</Term>
        </Label>
        <Select
          value={config.activation}
          onValueChange={(v) => onChange({ activation: v as ActivationName })}
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

      {/* Hiperparâmetros */}
      <div className="space-y-3">
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <Label>
              <Term id="lr">Taxa de aprendizado</Term>
            </Label>
            <span className="font-mono text-muted-foreground">{config.lr}</span>
          </div>
          <Slider
            value={[lrIndex]}
            min={0}
            max={LR_OPTIONS.length - 1}
            step={1}
            onValueChange={([i]) => onChange({ lr: LR_OPTIONS[i] })}
          />
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <Label>Ruído dos dados</Label>
            <span className="font-mono text-muted-foreground">{config.noise.toFixed(2)}</span>
          </div>
          <Slider
            value={[Math.round((config.noise / 1.2) * 100)]}
            min={0}
            max={100}
            step={1}
            onValueChange={([v]) => onChange({ noise: (v / 100) * 1.2 })}
          />
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <Label>
              <Term id="epoca">Velocidade</Term>
            </Label>
            <span className="font-mono text-muted-foreground">{config.speed} ép./tick</span>
          </div>
          <Slider
            value={[config.speed]}
            min={1}
            max={30}
            step={1}
            onValueChange={([v]) => onChange({ speed: v })}
          />
        </div>
      </div>
    </div>
  )
}
