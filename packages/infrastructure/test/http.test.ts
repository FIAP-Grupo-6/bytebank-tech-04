import { describe, expect, it, vi } from 'vitest'
import { ApiError, ApiHttpClient, HttpAccountRepository, HttpAuthGateway, HttpTransactionRepository, toTransaction } from '../src'

function fakeFetch(status: number, body?: unknown) {
  return vi.fn(async (_url: string, _init?: RequestInit) =>
    new Response(body === undefined ? null : JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json' },
    })
  )
}

describe('mappers', () => {
  it('normaliza tipo e aplica a convenção de sinal do domínio', () => {
    expect(toTransaction({ id: '1', accountId: 'a', type: 'Débito', value: '120.5', date: 'x' }).value).toBe(-120.5)
    expect(toTransaction({ id: '1', accountId: 'a', type: 'Credit', value: -10, date: 'x' }).value).toBe(10)
  })
})

describe('ApiHttpClient', () => {
  it('envia o Bearer token e converte erros HTTP em ApiError com status', async () => {
    const fetchImpl = fakeFetch(401, { message: 'Não autorizado' })
    const http = new ApiHttpClient({ baseUrl: 'http://api', token: 'tkn', fetchImpl })
    await expect(http.request('/account')).rejects.toMatchObject({ status: 401, message: 'Não autorizado' })
    const headers = new Headers(fetchImpl.mock.calls[0]![1]!.headers)
    expect(headers.get('authorization')).toBe('Bearer tkn')
  })

  it('falha de rede vira ApiError 502 (sem vazar detalhes)', async () => {
    const http = new ApiHttpClient({ baseUrl: 'http://api', fetchImpl: vi.fn(async () => { throw new TypeError('ECONNREFUSED') }) })
    await expect(http.request('/x')).rejects.toBeInstanceOf(ApiError)
    await expect(http.request('/x')).rejects.toMatchObject({ status: 502 })
  })
})

describe('repositórios HTTP', () => {
  it('HttpAccountRepository mapeia o envelope da API para entidades', async () => {
    const http = new ApiHttpClient({
      baseUrl: 'http://api',
      fetchImpl: fakeFetch(200, {
        message: 'ok',
        result: {
          account: [{ id: 'acc1', type: 'Debit', userId: 'u1' }],
          cards: [],
          transactions: [{ id: 't1', accountId: 'acc1', type: 'Debit', value: 50, date: '2026-01-01' }],
        },
      }),
    })
    const overview = await new HttpAccountRepository(http).getOverview()
    expect(overview.account.id).toBe('acc1')
    expect(overview.transactions[0]?.value).toBe(-50)
  })

  it('HttpTransactionRepository envia valor absoluto e codifica o id na URL', async () => {
    const fetchImpl = fakeFetch(200, { id: 'a/b', accountId: 'acc1', type: 'Debit', value: -10, date: 'x' })
    const repo = new HttpTransactionRepository(new ApiHttpClient({ baseUrl: 'http://api', fetchImpl }))
    await repo.update('a/b', { accountId: 'acc1', type: 'Debit', value: 10, from: 'Alimentação' })
    const [url, init] = fetchImpl.mock.calls[0]!
    expect(url).toBe('http://api/account/transaction/a%2Fb')
    expect(JSON.parse(String(init!.body)).value).toBe(10)
  })

  it('HttpAuthGateway retorna null para credenciais inválidas', async () => {
    const gw = new HttpAuthGateway(new ApiHttpClient({ baseUrl: 'http://api', fetchImpl: fakeFetch(401, { message: 'x' }) }))
    expect(await gw.authenticate({ email: 'a@b.com', password: 'x' })).toBeNull()
  })

  it('HttpAuthGateway decodifica o payload do JWT', async () => {
    const payload = Buffer.from(JSON.stringify({ id: 'u1', username: 'João', email: 'j@b.com' })).toString('base64url')
    const gw = new HttpAuthGateway(
      new ApiHttpClient({ baseUrl: 'http://api', fetchImpl: fakeFetch(200, { message: 'ok', result: { token: `h.${payload}.s` } }) })
    )
    expect(await gw.authenticate({ email: 'j@b.com', password: 'x' })).toMatchObject({ user: { id: 'u1', username: 'João' } })
  })
})
