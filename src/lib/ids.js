export function createClientId() {
  return `${window.crypto.randomUUID()}`;
}
