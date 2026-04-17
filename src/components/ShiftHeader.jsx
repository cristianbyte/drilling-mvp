import { useState } from 'react'
import { createShift } from '../lib/firebase'
import { showToast } from './Toast'
import ConfirmModal from './ConfirmModal'

const SHIFTS = ['DIA', 'NOCHE']

function today() {
  return new Date().toISOString().slice(0, 10)
}

function FrozenField({ label, value }) {
  return (
    <div>
      <span className="field-label">{label}</span>
      <div className="frozen-chip">{value || '—'}</div>
    </div>
  )
}

export default function ShiftHeader({ onFrozen }) {
  const [frozen,    setFrozen]    = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [showModal, setShowModal] = useState(false)

  const [form, setForm] = useState({
    operatorName: '',
    equipment:    '',
    date:         today(),
    shift:        'DIA',
    blastId:      '',
    diameter:     '',
    elevation:    '',
    pattern:      '',
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

  // Step 1: validate → open modal
  function handleSubmitIntent() {
    if (validate()) setShowModal(true)
  }

  // Step 2: confirmed — actually save
  async function handleConfirm() {
    setShowModal(false)
    setSaving(true)
    try {
      const shiftId = await createShift({
        operatorName: form.operatorName.trim(),
        equipment:    form.equipment.trim(),
        date:         form.date,
        shift:        form.shift,
        blastId:      form.blastId.trim(),
        diameter:     parseFloat(form.diameter) || null,
        elevation:    parseFloat(form.elevation) || null,
        pattern:      form.pattern.trim() || null,
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

  // Summary rows for modal
  const modalRows = [
    { key: 'Operador',      val: form.operatorName || '—' },
    { key: 'Equipo',        val: form.equipment    || '—' },
    { key: 'Fecha',         val: form.date },
    { key: 'Turno',         val: form.shift },
    { key: '# Voladura',    val: form.blastId      || '—', accent: true },
    { key: 'Ø Perf.',       val: form.diameter ? form.diameter + ' mm' : '—' },
    { key: 'Cota',          val: form.elevation ? form.elevation + ' m' : '—' },
    { key: 'Patrón',        val: form.pattern      || '—' },
  ]

  /* ── Frozen view ── */
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
          <FrozenField label="Operador"     value={form.operatorName} />
          <FrozenField label="Equipo"       value={form.equipment} />
          <FrozenField label="Fecha"        value={form.date} />
          <FrozenField label="Turno"        value={form.shift} />
          <FrozenField label="# Voladura"   value={form.blastId} />
          <FrozenField label="Ø Perf."      value={form.diameter ? form.diameter + ' mm' : ''} />
          <FrozenField label="Cota"         value={form.elevation ? form.elevation + ' m' : ''} />
          <FrozenField label="Patrón"       value={form.pattern} />
        </div>
      </div>
    )
  }

  /* ── Editable form ── */
  return (
    <>
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
          {/* Operator */}
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

          {/* Equipment + Blast ID */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="field-label">Equipo *</label>
              <input
                className={`field-input${errors.equipment ? ' field-input--error' : ''}`}
                type="text" placeholder="EQ-03"
                value={form.equipment}
                onChange={e => set('equipment', e.target.value)}
              />
              {errors.equipment && <p style={{ marginTop: '0.25rem', fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--color-danger)' }}>Requerido</p>}
            </div>
            <div>
              <label className="field-label"># Voladura *</label>
              <input
                className={`field-input${errors.blastId ? ' field-input--error' : ''}`}
                type="text" placeholder="V-12"
                value={form.blastId}
                onChange={e => set('blastId', e.target.value)}
              />
              {errors.blastId && <p style={{ marginTop: '0.25rem', fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--color-danger)' }}>Requerido</p>}
            </div>
          </div>

          {/* Date + Shift */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="field-label">Fecha</label>
              <input className="field-input" type="date" value={form.date} onChange={e => set('date', e.target.value)} />
            </div>
            <div>
              <label className="field-label">Turno</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {SHIFTS.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => set('shift', s)}
                    style={{
                      flex: 1,
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-input)',
                      border: `1px solid ${form.shift === s ? 'var(--color-brand-amber)' : 'var(--color-border-default)'}`,
                      background: form.shift === s ? 'var(--color-brand-amber-dim)' : 'var(--color-surface-2)',
                      color: form.shift === s ? 'var(--color-brand-amber)' : 'var(--color-text-muted)',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {s === 'DIA' ? '☀ Día' : '☾ Noche'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Diameter + Elevation + Pattern */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="field-label">Ø (mm)</label>
              <input className="field-input" type="number" placeholder="89" inputMode="decimal" value={form.diameter} onChange={e => set('diameter', e.target.value)} />
            </div>
            <div>
              <label className="field-label">Cota (m)</label>
              <input className="field-input" type="number" placeholder="1250" inputMode="decimal" value={form.elevation} onChange={e => set('elevation', e.target.value)} />
            </div>
            <div>
              <label className="field-label">Patrón</label>
              <input className="field-input" type="text" placeholder="3×3" value={form.pattern} onChange={e => set('pattern', e.target.value)} />
            </div>
          </div>

          <button className="btn-primary" style={{ marginTop: '0.25rem' }} onClick={handleSubmitIntent} disabled={saving}>
            {saving ? 'Iniciando...' : 'Iniciar turno →'}
          </button>
        </div>
      </div>

      {/* Confirm modal */}
      {showModal && (
        <ConfirmModal
          title="Confirmar datos del turno"
          rows={modalRows}
          onConfirm={handleConfirm}
          onCorrect={() => setShowModal(false)}
          confirmLabel="Iniciar turno"
          correctLabel="Corregir"
        />
      )}
    </>
  )
}