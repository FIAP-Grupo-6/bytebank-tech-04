export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message)
    this.name = 'ApiError'
  }
}

export interface ApiClientOptions {
  baseUrl?: string
  token?: string
  /** Timeout por requisição em ms (padrão 10s) — evita SSR travado se a API cair. */
  timeoutMs?: number
  fetchImpl?: typeof fetch
}

/**
 * A URL da API é lida de `API_URL` (somente servidor). `NEXT_PUBLIC_API_URL`
 * fica apenas como fallback de compatibilidade: desde a Fase 4 o browser
 * não conversa mais com a API — tudo passa pelo BFF.
 */
export const resolveApiBaseUrl = () =>
  process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

export class ApiHttpClient {
  private readonly baseUrl: string
  private readonly timeoutMs: number
  private readonly fetchImpl: typeof fetch

  constructor(private readonly options: ApiClientOptions = {}) {
    this.baseUrl = (options.baseUrl ?? resolveApiBaseUrl()).replace(/\/$/, '')
    this.timeoutMs = options.timeoutMs ?? 10_000
    this.fetchImpl = options.fetchImpl ?? fetch
  }

  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers)
    headers.set('Accept', 'application/json')
    if (init.body !== undefined) headers.set('Content-Type', 'application/json')
    if (this.options.token) headers.set('Authorization', `Bearer ${this.options.token}`)

    let res: Response
    try {
      res = await this.fetchImpl(`${this.baseUrl}${path}`, {
        ...init,
        headers,
        cache: 'no-store',
        signal: init.signal ?? AbortSignal.timeout(this.timeoutMs),
      })
    } catch (err) {
      const timedOut = err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError')
      throw new ApiError(timedOut ? 'A API demorou para responder' : 'API indisponível', timedOut ? 504 : 502)
    }

    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { message?: string } | null
      throw new ApiError(body?.message || `HTTP ${res.status}`, res.status)
    }

    if (res.status === 204 || res.headers.get('content-length') === '0') return undefined as T
    return (await res.json()) as T
  }
}
