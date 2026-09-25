import type { TransactionInput } from '@bytebank/domain'
import {
  getServerSessionData,
  json,
  jsonWithEtag,
  readJsonBody,
  rejectCrossSite,
  toErrorResponse,
  unauthorized,
} from '@bytebank/infrastructure/next'
import { makeUseCases } from '@/server/container'
import { notifyHostDataChanged } from '@/server/notify-host'
import { pickTransactionInput } from '@/server/input'

export const dynamic = 'force-dynamic'

/**
 * ─── BFF: /transactions/api/bff/transactions ───────────────────────────────
 * O browser chama esta rota (mesma origem, cookie httpOnly). Aqui o servidor
 * abre a sessão, pega o token da API e executa o caso de uso. O token nunca
 * trafega para o client.
 */
export async function GET(req: Request) {
  const session = await getServerSessionData()
  if (!session) return unauthorized()
  try {
    const items = await makeUseCases(session).listStatement.execute()
    return jsonWithEtag(req, { items })
  } catch (err) {
    return toErrorResponse(err)
  }
}

export async function POST(req: Request) {
  const blocked = rejectCrossSite(req)
  if (blocked) return blocked
  const session = await getServerSessionData()
  if (!session) return unauthorized()

  const body = await readJsonBody<Partial<TransactionInput>>(req)
  if (!body) return json({ message: 'Corpo da requisição inválido ou muito grande' }, 400)

  try {
    const created = await makeUseCases(session).createTransaction.execute(pickTransactionInput(body))
    await notifyHostDataChanged(session.userId)
    return json(created, 201)
  } catch (err) {
    return toErrorResponse(err)
  }
}
