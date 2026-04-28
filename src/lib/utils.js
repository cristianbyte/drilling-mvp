export function mergeMaps(maps = []) {
  return maps.reduce((acc, current) => {
    if (!current) return acc
    return { ...acc, ...current }
  }, {})
}
