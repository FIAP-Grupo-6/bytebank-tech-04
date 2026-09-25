import 'server-only'
import { redirect } from 'next/navigation'
import { getServerSessionData, type ServerSession } from '@bytebank/infrastructure/next'

export { getServerSessionData }

/** Para páginas protegidas: garante sessão válida ou redireciona para o login. */
export async function requireSession(): Promise<ServerSession> {
  const session = await getServerSessionData()
  if (!session) redirect('/login')
  return session
}
