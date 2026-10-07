import { useMemo } from 'react'
import { challengeData, type Challenge } from '../content/challenges'

/** Miniatura dos dados do desafio para os cards da lista. */
export function ChallengePreview({ challenge }: { challenge: Challenge }) {
  const points = useMemo(() => challengeData(challenge), [challenge])
  const toPx = (v: number, size: number) => ((v + 6) / 12) * size
  return (
    <svg viewBox="0 0 120 90" className="h-24 w-full rounded-md bg-black/40">
      {points.map((p, i) => (
        <circle
          key={i}
          cx={toPx(p.x, 120)}
          cy={((6 - p.y) / 12) * 90}
          r={2.2}
          fill={p.label === 1 ? '#fb9233' : '#3b82f6'}
          opacity={0.9}
        />
      ))}
    </svg>
  )
}
