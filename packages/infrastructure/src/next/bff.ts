import { createHash } from 'node:crypto'
import { NextResponse } from 'next/server'
import { AccountNotFoundError, DomainValidationError } from '@bytebank/domain'
import { ApiError } from '../http/api-client'

/**
 * Utilitários do BFF (Backend for Frontend) — route handlers do Next que
 * ficam entre o browser e a API. O browser só fala com a própria origem.
 */

const NO_STORE = 'private, no-store'

/**
 * Proteção CSRF em profundidade (além do SameSite=Lax do cookie):
 * browsers modernos enviam `Sec-Fetch-Site`. Mutações só são aceitas quando
 * a requisição nasce da mesma origem. Funciona mesmo atrás do proxy do host,
 * porque o header é gerado pelo browser, não pelo servidor.
 */
export function rejectCrossSite(req: Request): NextResponse | null {
  const site = req.headers.get('sec-fetch-site')
  if (site && site !== 'same-origin' && site !== 'none') {
    return NextResponse.json({ message: 'Origem não permitida' }, { status: 403, headers: { 'Cache-Control': NO_STORE } })
  }
  return null
}

export const unauthorized = () =>
  NextResponse.json({ message: 'Sessão expirada. Faça login novamente.' }, { status: 401, headers: { 'Cache-Control': NO_STORE } })

/**
 * Resposta JSON com ETag. `Cache-Control: private, no-cache` faz o browser
 * sempre revalidar; se nada mudou, o BFF responde 304 sem corpo — o cache
 * HTTP do navegador reaproveita o payload e economiza banda.
 */
export function jsonWithEtag(req: Request, data: unknown, init: { status?: number } = {}): NextResponse {
  const body = JSON.stringify(data)
  const etag = `W/"${createHash('sha1').update(body).digest('base64url')}"`
  const headers = { ETag: etag, 'Cache-Control': 'private, no-cache', Vary: 'Cookie' }

  if (req.headers.get('if-none-match') === etag) {
    return new NextResponse(null, { status: 304, headers })
  }
  return new NextResponse(body, { status: init.status ?? 200, headers: { ...headers, 'Content-Type': 'application/json' } })
}

export const json = (data: unknown, status = 200) =>
  NextResponse.json(data, { status, headers: { 'Cache-Control': NO_STORE } })

/** Traduz erros de domínio/infra para HTTP sem vazar detalhes internos. */
export function toErrorResponse(err: unknown): NextResponse {
  if (err instanceof DomainValidationError) {
    return NextResponse.json({ message: err.message, errors: err.errors }, { status: 422, headers: { 'Cache-Control': NO_STORE } })
  }
  if (err instanceof AccountNotFoundError) return json({ message: err.message }, 404)
  if (err instanceof ApiError) {
    if (err.status === 401 || err.status === 403) return unauthorized()
    if (err.status === 404) return json({ message: 'Registro não encontrado' }, 404)
    if (err.status === 504) return json({ message: err.message }, 504)
    return json({ message: 'Não foi possível concluir a operação. Tente novamente.' }, 502)
  }
  console.error('[bff] erro inesperado', err)
  return json({ message: 'Erro interno' }, 500)
}

/** Lê o body com limite de tamanho (anexos são imagens base64 de até 5 MB). */
export async function readJsonBody<T>(req: Request, maxBytes = 8 * 1024 * 1024): Promise<T | null> {
  const length = Number(req.headers.get('content-length') ?? 0)
  if (length > maxBytes) return null
  try {
    const text = await req.text()
    if (text.length > maxBytes) return null
    return JSON.parse(text) as T
  } catch {
    return null
  }
}
