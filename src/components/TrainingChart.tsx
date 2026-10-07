import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export interface LossPoint {
  epoch: number
  loss: number
}

export function TrainingChart({ history }: { history: LossPoint[] }) {
  const data = history.length > 300 ? history.slice(history.length - 300) : history
  if (data.length < 2) {
    return (
      <div className="flex h-[180px] items-center justify-center text-sm text-muted-foreground">
        A curva de perda aparece aqui quando o treino começar.
      </div>
    )
  }
  return (
    <div className="h-[180px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -18 }}>
          <XAxis
            dataKey="epoch"
            tick={{ fill: '#a1a1aa', fontSize: 10 }}
            tickLine={false}
            axisLine={{ stroke: '#27272a' }}
            tickFormatter={(v: number) => `${v}`}
            label={{ value: 'época', position: 'insideBottomRight', fill: '#71717a', fontSize: 10 }}
          />
          <YAxis
            tick={{ fill: '#a1a1aa', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            domain={['auto', 'auto']}
            tickFormatter={(v: number) => v.toFixed(2)}
          />
          <Tooltip
            contentStyle={{
              background: '#101012',
              border: '1px solid #27272a',
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(value) => [(value as number).toFixed(4), 'perda']}
            labelFormatter={(l) => `época ${l}`}
          />
          <Line
            type="monotone"
            dataKey="loss"
            stroke="#fafafa"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
