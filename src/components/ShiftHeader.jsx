import { useEffect, useState } from 'react'
import { createClientId } from '../lib/ids'
import { showToast } from './Toast'

const SHIFTS = ['DIA', 'NOCHE']
const LOCATIONS = ['HATILLO NORTE', 'HATILLO SUR']

function today() {
  return new Date().toISOString().slice(0, 10)
}

function emptyForm() {
  return {
    operatorName: '',
    equipment: '',
    location: '',
    date: today(),
    shift: 'DIA',
    blastId: '',
    diameter: '',
    elevation: '',
    pattern: '',
  }
}

function FrozenField({ label, value }) {
  return (
    <div>
      <span className="field-label">{label}</span>
      <div className="frozen-chip">{value || '—'}</div>
    </div>
  )
}

function normalizeShift(shift) {
  if (!shift) return emptyForm()
  return {
    operatorName: shift.operatorName || '',
    equipment: shift.equipment || '',
    location: shift.location || '',
    date: shift.date || today(),
    shift: shift.shift || 'DIA',
    blastId: shift.blastId || '',
    diameter: shift.diameter ?? '',
    elevation: shift.elevation ?? '',
    pattern: shift.pattern || '',
  }
}

export default function ShiftHeader({ onFrozen, initialShift = null }) {
  const [frozen, setFrozen] = useState(Boolean(initialShift))
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(() => normalizeShift(initialShift))
  const [errors, setErrors] = useState({})

  const active = 'border-orange-500 bg-orange-100 text-orange-600'
  const idle = 'border-gray-300 bg-gray-100 text-gray-500 hover:bg-gray-200'

  useEffect(() => {
    if (initialShift) {
      setForm(normalizeShift(initialShift))
      setFrozen(true)
      setErrors({})
      return
    }

    setForm(emptyForm())
    setFrozen(false)
    setErrors({})
  }, [initialShift])

  function set(key, val) {
    setForm(f => ({ ...f, [key]: val }))
    setErrors(e => ({ ...e, [key]: false }))
  }

  const required = ['operatorName', 'equipment', 'location', 'blastId']
  const isValid = required.every(k => form[k]?.trim())

  function validate() {
    const errs = {}
    required.forEach(k => {
      if (!form[k].trim()) errs[k] = true
    })
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleConfirm() {
    if (!validate()) return

    setSaving(true)
    try {
      const shiftPayload = {
        shiftId: createClientId('shift'),
        operatorName: form.operatorName.trim(),
        equipment: form.equipment.trim(),
        location: form.location.trim(),
        date: form.date,
        shift: form.shift,
        blastId: form.blastId.trim(),
        diameter: form.diameter === '' ? null : parseFloat(form.diameter),
        elevation: form.elevation === '' ? null : parseFloat(form.elevation),
        pattern: form.pattern.trim() || null,
        synced: false,
      }

      setForm(normalizeShift(shiftPayload))
      setFrozen(true)
      showToast('Turno iniciado')
      await onFrozen(shiftPayload)
    } catch (e) {
      console.error(e)
      showToast('Error al iniciar turno')
    } finally {
      setSaving(false)
    }
  }

  if (frozen) {
    return (
      <div className="section-card">
        <div className="section-header">
          <div className="dot animate-pulse" style={{ background: 'var(--color-brand-emerald)' }} />
          <span className="section-title">Turno activo</span>
          <span style={{
            marginLeft: 'auto',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.625rem',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: 'var(--color-brand-emerald)',
          }}>
            BLOQUEADO
          </span>
        </div>
        <div style={{ padding: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <FrozenField label="Operador" value={form.operatorName} />
          <FrozenField label="Equipo" value={form.equipment} />
          <FrozenField label="Ubicación" value={form.location} />
          <FrozenField label="Fecha" value={form.date} />
          <FrozenField label="Turno" value={form.shift} />
          <FrozenField label="# Voladura" value={form.blastId} />
          <FrozenField label="Diámetro" value={form.diameter !== '' ? form.diameter + ' mm' : ''} />
          <FrozenField label="Cota" value={form.elevation !== '' ? form.elevation + ' m' : ''} />
          <FrozenField label="Patrón" value={form.pattern} />
        </div>
      </div>
    )
  }

  return (
    <div className="section-card">
      <div className="section-header">
        <div className="dot" style={{ background: 'var(--color-brand-amber)' }} />
        <span className="section-title">Datos del turno</span>
        <span style={{
          marginLeft: 'auto',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.625rem',
          color: 'var(--color-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
        }}>
          Se congela al iniciar
        </span>
      </div>

      <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <button className="btn-primary" style={{ marginTop: '0.25rem' }} onClick={handleConfirm} disabled={saving || !isValid}>
          {saving ? 'Iniciando...' : 'Iniciar turno'}
        </button>

        <div>
          <label className="field-label">Nombre operador *</label>
          <input
            className={`field-input${errors.operatorName ? ' field-input--error' : ''}`}
            type="text"
            placeholder="Ej. Juan Rodríguez"
            value={form.operatorName}
            onChange={e => set('operatorName', e.target.value)}
            autoComplete="name"
          />
          {errors.operatorName && <p style={{ marginTop: '0.25rem', fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--color-danger)' }}>Requerido</p>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div>
            <label className="field-label">Equipo *</label>
            <input
              className={`field-input${errors.equipment ? ' field-input--error' : ''}`}
              type="text"
              placeholder="EQ-03"
              value={form.equipment}
              onChange={e => set('equipment', e.target.value)}
            />
            {errors.equipment && <p style={{ marginTop: '0.25rem', fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--color-danger)' }}>Requerido</p>}
          </div>
          <div>
            <label className="field-label">Ubicación *</label>
            <select
              className={`field-input${errors.location ? ' field-input--error' : ''}`}
              value={form.location}
              onChange={e => set('location', e.target.value)}
            >
              <option value="">Selecciona una ubicación</option>
              {LOCATIONS.map(location => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
            {errors.location && <p style={{ marginTop: '0.25rem', fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--color-danger)' }}>Requerido</p>}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div>
            <label className="field-label"># Voladura *</label>
            <input
              className={`field-input${errors.blastId ? ' field-input--error' : ''}`}
              type="text"
              placeholder="V-12"
              value={form.blastId}
              onChange={e => set('blastId', e.target.value)}
            />
            {errors.blastId && <p style={{ marginTop: '0.25rem', fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--color-danger)' }}>Requerido</p>}
          </div>
          <div>
            <label className="field-label">Fecha</label>
            <input className="field-input" type="date" value={form.date} onChange={e => set('date', e.target.value)} />
          </div>
        </div>

        <div>
          <label className="field-label">Turno</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {SHIFTS.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => set('shift', s)}
                className={`flex-1 px-3 py-3 text-xs uppercase tracking-wide rounded border transition-all font-mono ${form.shift === s ? active : idle}`}
              >
                {s === 'DIA' ? 'Día' : 'Noche'}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
          <div>
            <label className="field-label">Diámetro (mm)</label>
            <input className="field-input" type="number" placeholder="89" inputMode="decimal" value={form.diameter} onChange={e => set('diameter', e.target.value)} />
          </div>
          <div>
            <label className="field-label">Cota (m)</label>
            <input className="field-input" type="number" placeholder="1250" inputMode="decimal" value={form.elevation} onChange={e => set('elevation', e.target.value)} />
          </div>
          <div>
            <label className="field-label">Patrón</label>
            <input className="field-input" type="text" placeholder="3x3" value={form.pattern} onChange={e => set('pattern', e.target.value)} />
          </div>
        </div>
      </div>
    </div>
  )
}
