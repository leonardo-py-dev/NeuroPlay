import { Link } from 'react-router-dom'
import { CheckCircle2, Lock } from 'lucide-react'
import { CHALLENGES, getCompleted } from '../content/challenges'
import { ChallengePreview } from '../components/ChallengePreview'
import { SiteHeader } from '../components/SiteHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'

export function ChallengesPage() {
  const done = getCompleted()
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader
        right={
          <div className="rounded-lg border border-border bg-card px-3 py-1.5 text-center">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Concluídos
            </div>
            <div className="font-mono text-sm font-semibold">
              {done.length}/{CHALLENGES.length}
            </div>
          </div>
        }
      />
      <main className="container max-w-5xl py-8">
        <h2 className="text-2xl font-bold">Modo Desafios</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Cada fase é um caso fictício: posicione os neurônios no canvas, conecte-os arrastando
          do anel e treine até bater a meta. O progresso fica salvo neste navegador.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CHALLENGES.map((c, i) => {
            const isDone = done.includes(c.id)
            const locked = i > 0 && !done.includes(CHALLENGES[i - 1].id)
            const card = (
              <Card
                className={`flex h-full flex-col transition-colors ${
                  locked ? 'opacity-60' : 'hover:border-primary/60'
                }`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-3xl">{c.emoji}</span>
                    {isDone ? (
                      <span className="flex items-center gap-1 text-xs text-foreground">
                        <CheckCircle2 className="h-4 w-4" /> Feito
                      </span>
                    ) : locked ? (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Lock className="h-4 w-4" /> Complete a anterior
                      </span>
                    ) : (
                      <span className="text-[10px] tracking-widest text-muted-foreground">
                        {'●'.repeat(c.difficulty)}
                        {'○'.repeat(3 - c.difficulty)}
                      </span>
                    )}
                  </div>
                  <CardTitle className="text-base leading-snug">
                    {i + 1}. {c.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">{c.briefing}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto space-y-2">
                  <ChallengePreview challenge={c} />
                  <p className="text-xs text-muted-foreground">
                    Meta: {(c.goal.accuracy * 100).toFixed(0)}% de acurácia
                    {c.goal.maxHidden !== undefined &&
                      (c.goal.maxHidden === 0
                        ? ' · sem ocultos'
                        : ` · máx. ${c.goal.maxHidden} ocultos`)}
                  </p>
                </CardContent>
              </Card>
            )
            return locked ? (
              <div key={c.id}>{card}</div>
            ) : (
              <Link key={c.id} to={`/desafios/${c.id}`}>
                {card}
              </Link>
            )
          })}
        </div>
      </main>
    </div>
  )
}
