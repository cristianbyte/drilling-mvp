export function toThreeDecimals(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return value ?? null;
  }

  return Math.round(value * 1000) / 1000;
}

export function parseDbNumber(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numeric = Number(value);
  return Number.isNaN(numeric) ? null : toThreeDecimals(numeric);
}
