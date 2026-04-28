import crypto from "crypto";

export function createClientId() {
  return `${window.crypto.randomUUID()}`;
}
