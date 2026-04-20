import * as XLSX from 'xlsx'

const EMPTY = '-'

const COLUMN_CONFIG = [
  ['Fecha', row => row.date || EMPTY],
  ['Turno', row => row.shift || EMPTY],
  ['Operador', row => row.operatorName || EMPTY],
  ['Equipo', row => row.equipment || EMPTY],
  ['Ubicacion', row => row.location || EMPTY],
  ['# Voladura', row => row.blastId || EMPTY],
  ['Patron', row => row.pattern || EMPTY],
  ['Diametro (mm)', row => formatNumber(row.diameter)],
  ['Cota (m)', row => formatNumber(row.elevation)],
  ['# Hoyo', row => row.holeNumber ?? EMPTY],
  ['Profundidad (m)', row => formatNumber(row.depth)],
  ['Techo (m)', row => formatNumber(row.ceiling)],
  ['Piso (m)', row => formatNumber(row.floor)],
  ['Hora registro', row => formatTime(row.createdAt)],
  ['Fecha registro', row => formatDateOnly(row.createdAt)],
  ['Actualizado en', row => formatDateTime(row.updatedAt)],
  ['Actualizado por', row => row.updatedBy || EMPTY],
  ['ID turno', row => row.shiftId || EMPTY],
  ['ID hoyo', row => row.holeId || EMPTY],
]

function formatNumber(value) {
  if (value === null || value === undefined || value === '') return EMPTY
  const numeric = Number(value)
  if (Number.isNaN(numeric)) return value
  return numeric
}

function formatTime(value) {
  if (!value) return EMPTY
  return new Date(value).toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function formatDateOnly(value) {
  if (!value) return EMPTY
  return new Date(value).toLocaleDateString('es-CO')
}

function formatDateTime(value) {
  if (!value) return EMPTY
  return new Date(value).toLocaleString('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export function exportRowsToXlsx(rows = [], selectedDate) {
  const exportRows = rows
    .filter(row => row.date === selectedDate)
    .sort((a, b) => {
      const shiftCompare = (a.shift || '').localeCompare(b.shift || '')
      if (shiftCompare !== 0) return shiftCompare

      const operatorCompare = (a.operatorName || '').localeCompare(b.operatorName || '')
      if (operatorCompare !== 0) return operatorCompare

      return (a.holeNumber || 0) - (b.holeNumber || 0)
    })

  if (!exportRows.length) return 0

  const data = exportRows.map(row =>
    Object.fromEntries(COLUMN_CONFIG.map(([label, getter]) => [label, getter(row)]))
  )

  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()

  worksheet['!cols'] = COLUMN_CONFIG.map(([label]) => ({
    wch: Math.max(label.length + 2, 14),
  }))

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Registros')
  XLSX.writeFile(workbook, `perforacion-${selectedDate}.xlsx`)

  return exportRows.length
}
