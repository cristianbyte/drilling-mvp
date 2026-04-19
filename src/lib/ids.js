export function createClientId(prefix = 'rec') {
  const random = Math.random().toString(36).slice(2, 10)
  return `${prefix}-${Date.now()}-${random}`
}
