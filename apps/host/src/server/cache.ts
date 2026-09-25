import 'server-only'
import { unstable_cache } from 'next/cache'
import type { AccountRepository } from '@bytebank/domain'
import { createApiRepositories } from '@bytebank/infrastructure'
import type { ServerSession } from '@bytebank/infrastructure/next'

/**
 * ─── CACHE DE DADOS NO SERVIDOR ─────────────────────────────────────────────
 *
 * Decorator sobre a porta AccountRepository (o domínio não sabe que existe
 * cache). A visão geral da conta (GET /account) alimenta Dashboard e
 * Cartões; com o cache, navegar entre as duas páginas não bate na API.
 *
 * - Chave e tag POR USUÁRIO (`account:<userId>`): dado privado nunca é
 *   compartilhado entre sessões.
 * - Invalidação por evento: após criar/editar/excluir na zona
 *   transactions, o BFF chama POST /api/internal/revalidate (HMAC) e o host
 *   executa revalidateTag — o dashboard reflete a mudança na hora.
 * - TTL de 60s como rede de segurança caso o evento se perca.
 */
export const ACCOUNT_CACHE_TTL_SECONDS = 60
export const accountTag = (userId: string) => `account:${userId}`

export function cachedAccountRepository(session: ServerSession): AccountRepository {
  const { accounts } = createApiRepositories(session.accessToken)

  // Sem userId estável não há chave segura de cache → vai direto à API.
  if (!session.userId) return accounts

  return {
    getOverview: unstable_cache(() => accounts.getOverview(), ['account-overview', session.userId], {
      tags: [accountTag(session.userId)],
      revalidate: ACCOUNT_CACHE_TTL_SECONDS,
    }),
  }
}
