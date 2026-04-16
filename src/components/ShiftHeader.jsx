import { useState } from 'react'
import { createShift } from '../lib/firebase'
import { showToast } from './Toast'

const SHIFTS = ['DIA', 'NOCHE']

function today() {
  return new Date().toISOString().slice(0, 10)
}

/** Renders a read-only chip for frozen header fields */
function FrozenField({ label, value }) {
  return (
    <div>
      <span className="field-label">{label}</span>
      <div className="font-mono text-sm text-amber-400 bg-slate-800 border border-slate-700 rounded-md px-3 py-2.5 truncate">
        {value || '—'}
      </div>
    </div>
  )
}

export default function ShiftHeader({ onFrozen }) {
  const [frozen, setFrozen] = useState(false)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    operatorName: '',
    equipment: '',
    date: today(),
    shift: 'DIA',
    blastId: '',
    diameter: '',
    elevation: '',
    pattern: '',
  })

  const [errors, setErrors] = useState({})

  function set(key, val) {
    setForm(f => ({ ...f, [key]: val }))
    setErrors(e => ({ ...e, [key]: false }))
  }

  function validate() {
    const required = ['operatorName', 'equipment', 'blastId']
    const errs = {}
    required.forEach(k => { if (!form[k].trim()) errs[k] = true })
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleFreeze() {
    if (!validate()) return
    setSaving(true)
    try {
      const shiftId = await createShift({
        operatorName: form.operatorName.trim(),
        equipment: form.equipment.trim(),
        date: form.date,
        shift: form.shift,
        blastId: form.blastId.trim(),
        diameter: parseFloat(form.diameter) || null,
        elevation: parseFloat(form.elevation) || null,
        pattern: form.pattern.trim() || null,
      })
      setFrozen(true)
      showToast('Turno iniciado ✓')
      onFrozen({ shiftId: shiftId || 'offline-' + Date.now(), ...form })
    } catch (e) {
      console.error(e)
      showToast('Error al guardar — reintenta')
    } finally {
      setSaving(false)
    }
  }

  if (frozen) {
    return (
      <div className="section-card">
        <div className="section-header">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="section-title">Turno activo</span>
          <span className="ml-auto font-mono text-[10px] text-emerald-400 uppercase tracking-wider">BLOQUEADO</span>
        </div>
        <div className="p-4 grid grid-cols-2 gap-3">
          <FrozenField label="Operador" value={form.operatorName} />
          <FrozenField label="Equipo" value={form.equipment} />
          <FrozenField label="Fecha" value={form.date} />
          <FrozenField label="Turno" value={form.shift} />
          <FrozenField label="# Voladura" value={form.blastId} />
          <FrozenField label="Ø Perforación" value={form.diameter ? form.diameter + ' mm' : ''} />
          <FrozenField label="Cota" value={form.elevation ? form.elevation + ' m' : ''} />
          <FrozenField label="Patrón" value={form.pattern} />
        </div>
      </div>
    )
  }

  return (
    <div className="section-card">
      <div className="section-header">
        <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
        <span className="section-title">Datos del turno</span>
        <span className="ml-auto font-mono text-[10px] text-slate-500 uppercase tracking-wider">
          Se congela al iniciar
        </span>
      </div>

      <div className="p-4 flex flex-col gap-3">
        {/* Operator name — full width */}
        <div>
          <label className="field-label">Nombre operador *</label>
          <input
            className={`field-input ${errors.operatorName ? 'field-input-error' : ''}`}
            type="text"
            placeholder="Ej. Juan Rodríguez"
            value={form.operatorName}
            onChange={e => set('operatorName', e.target.value)}
            autoComplete="name"
          />
          {errors.operatorName && <p className="mt-1 font-mono text-[10px] text-red-400">Requerido</p>}
        </div>

        {/* Equipment + Blast ID */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label">Equipo *</label>
            <input
              className={`field-input ${errors.equipment ? 'field-input-error' : ''}`}
              type="text"
              placeholder="EQ-03"
              value={form.equipment}
              onChange={e => set('equipment', e.target.value)}
            />
            {errors.equipment && <p className="mt-1 font-mono text-[10px] text-red-400">Requerido</p>}
          </div>
          <div>
            <label className="field-label"># Voladura *</label>
            <input
              className={`field-input ${errors.blastId ? 'field-input-error' : ''}`}
              type="text"
              placeholder="V-12"
              value={form.blastId}
              onChange={e => set('blastId', e.target.value)}
            />
            {errors.blastId && <p className="mt-1 font-mono text-[10px] text-red-400">Requerido</p>}
          </div>
        </div>

        {/* Date + Shift */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label">Fecha</label>
            <input
              className="field-input"
              type="date"
              value={form.date}
              onChange={e => set('date', e.target.value)}
            />
          </div>
          <div>
            <label className="field-label">Turno</label>
            <div className="flex gap-2">
              {SHIFTS.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => set('shift', s)}
                  className={`
                    flex-1 font-mono text-xs uppercase tracking-wider py-3 rounded-md border transition-all duration-150
                    ${form.shift === s
                      ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                    }
                  `}
                >
                  {s === 'DIA' ? '☀ Día' : '☾ Noche'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Diameter + Elevation + Pattern */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="field-label">Ø (mm)</label>
            <input
              className="field-input"
              type="number"
              placeholder="89"
              inputMode="decimal"
              value={form.diameter}
              onChange={e => set('diameter', e.target.value)}
            />
          </div>
          <div>
            <label className="field-label">Cota (m)</label>
            <input
              className="field-input"
              type="number"
              placeholder="1250"
              inputMode="decimal"
              value={form.elevation}
              onChange={e => set('elevation', e.target.value)}
            />
          </div>
          <div>
            <label className="field-label">Patrón</label>
            <input
              className="field-input"
              type="text"
              placeholder="3×3"
              value={form.pattern}
              onChange={e => set('pattern', e.target.value)}
            />
          </div>
        </div>

        <button
          className="btn-primary mt-1"
          onClick={handleFreeze}
          disabled={saving}
        >
          {saving ? 'Iniciando...' : 'Iniciar turno →'}
        </button>
      </div>
    </div>
  )
}