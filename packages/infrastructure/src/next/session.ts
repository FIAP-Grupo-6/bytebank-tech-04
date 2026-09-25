import { cache } from 'react'
import { cookies } from 'next/headers'
import { decode } from 'next-auth/jwt'

/**
 * ─── SESSÃO NO SERVIDOR (compartilhada entre as zonas) ─────────────────────
 *
 * O cookie do NextAuth é um JWE (JWT cifrado com NEXTAUTH_SECRET), httpOnly,
 * SameSite=Lax e Secure em produção. Só o SERVIDOR consegue abri-lo.
 *
 * Fase 4: o `accessToken` da API vive SOMENTE aqui dentro. Ele não é mais
 * exposto em `session` (useSession), em props de componentes nem no Redux.
 * Todo acesso à API a partir do browser passa pelo BFF (route handlers).
 */

export const SESSION_COOKIE_NAMES = ['__Secure-next-auth.session-token', 'next-auth.session-token'] as const

export interface ServerSession {
  accessToken: string
  userId: string
  username: string
  email: string
}

export const getServerSessionData = cache(async (): Promise<ServerSession | null> => {
  const store = cookies()
  const raw = SESSION_COOKIE_NAMES.map((n) => store.get(n)?.value).find(Boolean)
  if (!raw) return null

  try {
    const decoded = await decode({ token: raw, secret: process.env.NEXTAUTH_SECRET ?? '' })
    if (!decoded?.accessToken) return null
    // Expiração do JWT da sessão já é validada pelo decode; aqui checamos a do token da API.
    if (typeof decoded.apiTokenExp === 'number' && decoded.apiTokenExp * 1000 < Date.now()) return null
    return {
      accessToken: decoded.accessToken as string,
      userId: (decoded.id as string) ?? '',
      username: (decoded.name as string) ?? '',
      email: (decoded.email as string) ?? '',
    }
  } catch {
    // Cookie adulterado/expirado ou NEXTAUTH_SECRET divergente entre as zonas
    return null
  }
})
