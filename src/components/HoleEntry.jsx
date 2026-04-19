import { useState, useRef, useEffect } from 'react'
import { createHole } from '../lib/firebase'
import { showToast } from './Toast'

export default function HoleEntry({ shiftId, nextHoleNumber, onSaved }) {
  const [form, setForm] = useState({ depth: '', ceiling: '', floor: '' })
  const [error, setError] = useState(false)
  const [saving, setSaving] = useState(false)
  const depthRef = useRef(null)
  const required = ['depth', 'ceiling', 'floor']

  useEffect(() => { depthRef.current?.focus() }, [])

  function setField(key, val) {
    setForm(f => ({ ...f, [key]: val }))
    if (key === 'depth') setError(false)
  }

  function validate() {
    const d = parseFloat(form.depth)
    const c = parseFloat(form.ceiling)
    const f = parseFloat(form.floor)

    if (!d || d <= 0) { setError(true); depthRef.current?.focus(); return false }
    if (form.ceiling === '' || Number.isNaN(c) || c < 0) return false
    if (form.floor === '' || Number.isNaN(f) || f < 0) return false
    return true
  }

  const isValid =
    required.every(key => form[key] !== '') &&
    parseFloat(form.depth) > 0 &&
    !Number.isNaN(parseFloat(form.ceiling)) &&
    parseFloat(form.ceiling) >= 0 &&
    !Number.isNaN(parseFloat(form.floor)) &&
    parseFloat(form.floor) >= 0

  async function handleSubmit() {
    if (!validate()) return

    const hole = {
      holeNumber: nextHoleNumber,
      depth: parseFloat(form.depth),
      ceiling: parseFloat(form.ceiling) || 0,
      floor: parseFloat(form.floor) || 0,
    }

    setSaving(true)
    try {
      const holeId = await createHole(shiftId, hole)
      onSaved({ holeId: holeId || 'local-' + Date.now(), ...hole })
      setForm({ depth: '', ceiling: '', floor: '' })
      showToast(`Barreno B-${String(nextHoleNumber).padStart(2, '0')} guardado`)
      setTimeout(() => depthRef.current?.focus(), 80)
    } catch (e) {
      console.error(e)
      showToast('Error al guardar, reintenta')
    } finally {
      setSaving(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleSubmit()
  }

  return (
    <div className="section-card">
      <div className="section-header">
        <div className="dot" style={{ background: 'var(--color-brand-cyan)' }} />
        <span className="section-title">Registro de barreno</span>
        <span style={{
          marginLeft: 'auto',
          fontFamily: 'var(--font-mono)',
          fontSize: '1.125rem',
          fontWeight: 600,
          color: 'var(--color-brand-cyan)',
        }}>
          B-{String(nextHoleNumber).padStart(2, '0')}
        </span>
      </div>

      <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div>
          <label className="field-label">Profundidad (m) *</label>
          <input
            ref={depthRef}
            className={`field-input${error ? ' field-input--error' : ''}`}
            style={{ fontSize: '1.5rem', fontFamily: 'var(--font-mono)', padding: '1rem 0.875rem' }}
            type="number"
            placeholder="0.0"
            inputMode="decimal"
            step="0.1"
            value={form.depth}
            onChange={e => setField('depth', e.target.value)}
            onKeyDown={handleKeyDown}
          />
          {error && (
            <p style={{ marginTop: '0.25rem', fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--color-danger)' }}>
              Profundidad requerida y mayor a 0
            </p>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div>
            <label className="field-label">Techo (m)</label>
            <input
              className="field-input"
              type="number"
              min="0"
              placeholder="0.0"
              inputMode="decimal"
              step="0.1"
              value={form.ceiling}
              onChange={e => setField('ceiling', e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <div>
            <label className="field-label">Piso (m)</label>
            <input
              className="field-input"
              type="number"
              min="0"
              placeholder="0.0"
              inputMode="decimal"
              step="0.1"
              value={form.floor}
              onChange={e => setField('floor', e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
        </div>

        <button className="btn-primary" onClick={handleSubmit} disabled={saving || !isValid}>
          {saving ? 'Guardando...' : 'Guardar barreno'}
        </button>
      </div>
    </div>
  )
}
