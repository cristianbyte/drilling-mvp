import Card from './Card'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

const TICK_STYLE = { fontFamily: 'var(--font-mono)', fontSize: 11, fill: 'var(--color-text-muted)' }

export default function SupervisorStats({ chartOpsData, chartTimeData }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
      <Card title="Metros por operador (24 h)">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartOpsData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" />
            <XAxis dataKey="op" tick={TICK_STYLE} />
            <YAxis tick={TICK_STYLE} />
            <Tooltip contentStyle={{ fontFamily: 'var(--font-mono)', fontSize: 12 }} />
            <Bar dataKey="metros" radius={[4, 4, 0, 0]} fill="var(--color-brand-amber)" fillOpacity={0.85} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card title="Acumulado en el tiempo (24 h)">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartTimeData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" />
            <XAxis dataKey="hora" tick={TICK_STYLE} interval="preserveStartEnd" />
            <YAxis tick={TICK_STYLE} />
            <Tooltip contentStyle={{ fontFamily: 'var(--font-mono)', fontSize: 12 }} />
            <Line
              type="monotone" dataKey="acum"
              stroke="var(--color-brand-emerald)" strokeWidth={2}
              dot={{ r: 3, fill: 'var(--color-brand-emerald)' }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  )
}
