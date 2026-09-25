'use server'

import { DomainValidationError } from '@bytebank/domain'
import { ApiError } from '@bytebank/infrastructure'
import { publicUseCases } from '@/server/container'

export type RegisterResult = { ok: true } | { ok: false; message: string }

/**
 * Server Action: o cadastro roda no servidor. O browser não precisa
 * conhecer a URL da API (e a CSP `connect-src 'self'` nem permitiria).
 * As regras de senha/e-mail são revalidadas pelo caso de uso do domínio.
 */
export async function registerAction(input: { username: string; email: string; password: string }): Promise<RegisterResult> {
  try {
    await publicUseCases().registerUser.execute(input)
    return { ok: true }
  } catch (err) {
    if (err instanceof DomainValidationError) return { ok: false, message: err.message }
    if (err instanceof ApiError && err.status < 500) return { ok: false, message: err.message }
    return { ok: false, message: 'Não foi possível criar a conta agora. Tente novamente.' }
  }
}
