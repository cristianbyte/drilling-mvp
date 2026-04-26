import crypto from "crypto";

export function createClientId(prefix = "rec") {
  return `${prefix}-${window.crypto.randomUUID()}`;
}
