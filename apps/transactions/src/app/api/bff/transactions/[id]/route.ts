import type { TransactionInput } from '@bytebank/domain'
import {
  getServerSessionData,
  json,
  readJsonBody,
  rejectCrossSite,
  toErrorResponse,
  unauthorized,
} from '@bytebank/infrastructure/next'
import { makeUseCases } from '@/server/container'
import { notifyHostDataChanged } from '@/server/notify-host'
import { pickTransactionInput } from '@/server/input'

export const dynamic = 'force-dynamic'

type Ctx = { params: { id: string } }

const isValidId = (id: string) => /^[\w-]{1,64}$/.test(id)

export async function PUT(req: Request, { params }: Ctx) {
  const blocked = rejectCrossSite(req)
  if (blocked) return blocked
  const session = await getServerSessionData()
  if (!session) return unauthorized()
  if (!isValidId(params.id)) return json({ message: 'Identificador inválido' }, 400)

  const body = await readJsonBody<Partial<TransactionInput>>(req)
  if (!body) return json({ message: 'Corpo da requisição inválido ou muito grande' }, 400)

  try {
    const updated = await makeUseCases(session).updateTransaction.execute(params.id, pickTransactionInput(body))
    await notifyHostDataChanged(session.userId)
    return json(updated)
  } catch (err) {
    return toErrorResponse(err)
  }
}

export async function DELETE(req: Request, { params }: Ctx) {
  const blocked = rejectCrossSite(req)
  if (blocked) return blocked
  const session = await getServerSessionData()
  if (!session) return unauthorized()
  if (!isValidId(params.id)) return json({ message: 'Identificador inválido' }, 400)

  try {
    await makeUseCases(session).deleteTransaction.execute(params.id)
    await notifyHostDataChanged(session.userId)
    return new Response(null, { status: 204, headers: { 'Cache-Control': 'private, no-store' } })
  } catch (err) {
    return toErrorResponse(err)
  }
}
