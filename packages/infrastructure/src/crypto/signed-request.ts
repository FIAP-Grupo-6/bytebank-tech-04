import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * Assinatura HMAC-SHA256 com carimbo de tempo para chamadas internas
 * servidor→servidor (ex.: zona transactions pedindo ao host para invalidar
 * o cache). Janela curta contra replay e comparação em tempo constante.
 */
const MAX_SKEW_MS = 60_000

export function signMessage(message: string, secret: string, now = Date.now()): { signature: string; timestamp: string } {
  const timestamp = String(now)
  const signature = createHmac('sha256', secret).update(`${timestamp}.${message}`).digest('base64url')
  return { signature, timestamp }
}

export function verifyMessage(
  message: string,
  signature: string | null,
  timestamp: string | null,
  secret: string,
  now = Date.now()
): boolean {
  if (!signature || !timestamp || !secret) return false
  const ts = Number(timestamp)
  if (!Number.isFinite(ts) || Math.abs(now - ts) > MAX_SKEW_MS) return false
  const expected = createHmac('sha256', secret).update(`${timestamp}.${message}`).digest()
  const received = Buffer.from(signature, 'base64url')
  return received.length === expected.length && timingSafeEqual(received, expected)
}
