import { getServerSessionData } from '@/server/session'
import { makeUseCases } from '@/server/container'
import { json, jsonWithEtag, readJsonBody, rejectCrossSite, toErrorResponse, unauthorized } from '@bytebank/infrastructure/next'

export const dynamic = 'force-dynamic'

/** BFF — preferências do dashboard (cifradas em cookie httpOnly). */
export async function GET(req: Request) {
  const session = await getServerSessionData()
  if (!session) return unauthorized()
  try {
    return jsonWithEtag(req, await makeUseCases(session).getDashboardSettings.execute())
  } catch (err) {
    return toErrorResponse(err)
  }
}

export async function PUT(req: Request) {
  const blocked = rejectCrossSite(req)
  if (blocked) return blocked
  const session = await getServerSessionData()
  if (!session) return unauthorized()

  const body = await readJsonBody<unknown>(req, 16 * 1024)
  if (body === null) return json({ message: 'Corpo da requisição inválido' }, 400)

  try {
    return json(await makeUseCases(session).saveDashboardSettings.execute(body))
  } catch (err) {
    return toErrorResponse(err)
  }
}
