import 'server-only'
import { signMessage } from '@bytebank/infrastructure'

/**
 * Avisa o host (outra zona, outro servidor) que os dados do usuário mudaram,
 * para ele invalidar o cache do dashboard/cartões (revalidateTag).
 * Assinado com HMAC; falhas não quebram a operação do usuário — o TTL do
 * cache do host é a rede de segurança.
 */
export async function notifyHostDataChanged(userId: string): Promise<void> {
  const hostUrl = process.env.HOST_URL || (process.env.NODE_ENV !== 'production' ? 'http://localhost:3002' : '')
  const secret = process.env.NEXTAUTH_SECRET ?? ''
  if (!hostUrl || !secret || !userId) return

  const { signature, timestamp } = signMessage(userId, secret)
  try {
    await fetch(`${hostUrl.replace(/\/$/, '')}/api/internal/revalidate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-bytebank-signature': signature,
        'x-bytebank-timestamp': timestamp,
      },
      body: JSON.stringify({ userId }),
      cache: 'no-store',
      signal: AbortSignal.timeout(2_000),
    })
  } catch {
    /* best effort */
  }
}
