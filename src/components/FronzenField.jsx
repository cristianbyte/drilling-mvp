import { getTodayDateKey } from "../lib/datetime";

export default function FrozenField({ label, value }) {
  const displayValue =
    value === null || value === undefined || value === ''
      ? '—'
      : value

  const today = getTodayDateKey()
  const hasDateWarning = label === 'Fecha' && value && value !== today

  return (
    <div>
      <span className="field-label">{label}</span>
      <div className={`frozen-chip${hasDateWarning ? ' frozen-chip--warning' : ''}`}>
        {displayValue}
      </div>
    </div>
  )
}
