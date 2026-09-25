import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from 'node:crypto'

/**
 * Criptografia autenticada (AEAD) de dados sensíveis com AES-256-GCM.
 *
 * - Chave derivada via HKDF-SHA256 a partir de um segredo do servidor
 *   (NEXTAUTH_SECRET) + `context` (ex.: id do usuário) → cada usuário tem
 *   uma chave diferente; um valor cifrado de um usuário não abre para outro.
 * - IV aleatório de 96 bits por operação (nunca reutilizado).
 * - Tag de autenticação de 128 bits: qualquer adulteração é detectada.
 * - `context` também entra como AAD (dados associados autenticados).
 *
 * Formato: v1.<iv>.<tag>.<ciphertext> (base64url)
 */

const VERSION = 'v1'
const ALGORITHM = 'aes-256-gcm'

function deriveKey(secret: string, purpose: string, context: string): Buffer {
  if (!secret || secret.length < 16) {
    throw new Error('Segredo de criptografia ausente ou fraco (mínimo 16 caracteres)')
  }
  return Buffer.from(hkdfSync('sha256', secret, `bytebank:${purpose}`, context, 32))
}

export interface SealOptions {
  secret: string
  /** Finalidade da chave (separação de domínio), ex.: "dashboard-settings" */
  purpose: string
  /** Contexto do dono do dado, ex.: id do usuário */
  context: string
}

export function seal(plaintext: string, { secret, purpose, context }: SealOptions): string {
  const key = deriveKey(secret, purpose, context)
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  cipher.setAAD(Buffer.from(context, 'utf8'))
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return [VERSION, iv, tag, ciphertext].map((p) => (typeof p === 'string' ? p : p.toString('base64url'))).join('.')
}

/** Retorna `null` se o valor estiver adulterado, for de outro contexto ou em formato inválido. */
export function open(sealed: string, { secret, purpose, context }: SealOptions): string | null {
  const [version, iv, tag, ciphertext] = sealed.split('.')
  if (version !== VERSION || !iv || !tag || ciphertext === undefined) return null
  try {
    const decipher = createDecipheriv(ALGORITHM, deriveKey(secret, purpose, context), Buffer.from(iv, 'base64url'))
    decipher.setAAD(Buffer.from(context, 'utf8'))
    decipher.setAuthTag(Buffer.from(tag, 'base64url'))
    return Buffer.concat([decipher.update(Buffer.from(ciphertext, 'base64url')), decipher.final()]).toString('utf8')
  } catch {
    return null
  }
}

export const sealJson = (value: unknown, options: SealOptions) => seal(JSON.stringify(value), options)

export function openJson<T>(sealed: string, options: SealOptions): T | null {
  const plain = open(sealed, options)
  if (plain === null) return null
  try {
    return JSON.parse(plain) as T
  } catch {
    return null
  }
}
