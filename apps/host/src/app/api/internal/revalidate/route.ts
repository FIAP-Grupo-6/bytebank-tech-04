import { revalidateTag } from 'next/cache'
import { verifyMessage } from '@bytebank/infrastructure'
import { json, readJsonBody } from '@bytebank/infrastructure/next'
import { accountTag } from '@/server/cache'

export const dynamic = 'force-dynamic'

/**
 * Webhook interno servidor→servidor: a zona transactions avisa que os dados
 * de um usuário mudaram. Autenticado por HMAC-SHA256 (NEXTAUTH_SECRET, que
 * as duas zonas já compartilham) com timestamp contra replay.
 */
export async function POST(req: Request) {
  const body = await readJsonBody<{ userId?: unknown }>(req, 1024)
  const userId = typeof body?.userId === 'string' ? body.userId : ''

  const valid = verifyMessage(
    userId,
    req.headers.get('x-bytebank-signature'),
    req.headers.get('x-bytebank-timestamp'),
    process.env.NEXTAUTH_SECRET ?? ''
  )
  if (!userId || !valid) return json({ message: 'Assinatura inválida' }, 401)

  revalidateTag(accountTag(userId))
  return json({ revalidated: true })
}
