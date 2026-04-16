import { useState, useRef, useEffect } from 'react'
import { createHole } from '../lib/firebase'
import { showToast } from './Toast'

export default function HoleEntry({ shiftId, nextHoleNumber, onSaved }) {
  const [form, setForm] = useState({ depth: '', ceiling: '', floor: '' })
  const [error, setError] = useState(false)
  const [saving, setSaving] = useState(false)
  const depthRef = useRef(null)

  // Auto-focus depth on mount and after save
  useEffect(() => { depthRef.current?.focus() }, [])

  function setField(key, val) {
    setForm(f => ({ ...f, [key]: val }))
    if (key === 'depth') setError(false)
  }

  async function handleSave() {
    const depth = parseFloat(form.depth)
    if (!depth || depth <= 0) { setError(true); depthRef.current?.focus(); return }

    const hole = {
      holeNumber: nextHoleNumber,
      depth,
      ceiling: parseFloat(form.ceiling) || 0,
      floor: parseFloat(form.floor) || 0,
    }

    setSaving(true)
    try {
      const holeId = await createHole(shiftId, hole)
      onSaved({ holeId: holeId || 'local-' + Date.now(), ...hole })
      setForm({ depth: '', ceiling: '', floor: '' })
      showToast(`Barreno B-${String(nextHoleNumber).padStart(2, '0')} guardado ✓`)
      setTimeout(() => depthRef.current?.focus(), 80)
    } catch (e) {
      console.error(e)
      showToast('Error al guardar — reintenta')
    } finally {
      setSaving(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleSave()
  }

  return (
    <div className="section-card">
      <div className="section-header">
        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
        <span className="section-title">Registro de barreno</span>
        {/* Current hole badge */}
        <span className="ml-auto font-mono text-lg font-semibold text-cyan-400">
          B-{String(nextHoleNumber).padStart(2, '0')}
        </span>
      </div>

      <div className="p-4 flex flex-col gap-3">
        {/* Depth — main field, larger */}
        <div>
          <label className="field-label">Profundidad (m) *</label>
          <input
            ref={depthRef}
            className={`field-input text-2xl font-mono py-4 ${error ? 'field-input-error' : ''}`}
            type="number"
            placeholder="0.0"
            inputMode="decimal"
            step="0.1"
            value={form.depth}
            onChange={e => setField('depth', e.target.value)}
            onKeyDown={handleKeyDown}
          />
          {error && <p className="mt-1 font-mono text-[10px] text-red-400">Profundidad requerida y mayor a 0</p>}
        </div>

        {/* Ceiling + Floor side by side */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label">Techo (m)</label>
            <input
              className="field-input"
              type="number"
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
              placeholder="0.0"
              inputMode="decimal"
              step="0.1"
              value={form.floor}
              onChange={e => setField('floor', e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
        </div>

        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar barreno'}
        </button>
      </div>
    </div>
  )
}