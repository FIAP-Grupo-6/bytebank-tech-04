import type {
  AccountOverview,
  AccountRepository,
  AuthenticatedUser,
  AuthGateway,
  Credentials,
  NewTransaction,
  NewUser,
  Transaction,
  TransactionInput,
  TransactionRepository,
} from '@bytebank/domain'
import { ApiError, ApiHttpClient } from '../http/api-client'
import type { AccountOverviewDto, ApiEnvelope, AuthResultDto, TransactionDto } from '../http/dto'
import { decodeJwtPayload, toAccount, toCard, toTransaction } from '../http/mappers'

export class HttpAccountRepository implements AccountRepository {
  constructor(private readonly http: ApiHttpClient) {}

  async getOverview(): Promise<AccountOverview> {
    const { result } = await this.http.request<ApiEnvelope<AccountOverviewDto>>('/account')
    const [account] = result.account
    return {
      account: account ? toAccount(account) : (undefined as never),
      cards: (result.cards ?? []).map(toCard),
      transactions: (result.transactions ?? []).map(toTransaction),
    }
  }
}

/**
 * A API recebe sempre o valor absoluto e aplica o sinal pelo `type`
 * (mesmo contrato da Fase 2). Na leitura, o mapper normaliza o sinal.
 */
const toApiValue = (input: TransactionInput) => Math.abs(input.value)

export class HttpTransactionRepository implements TransactionRepository {
  constructor(private readonly http: ApiHttpClient) {}

  async create(payload: NewTransaction): Promise<Transaction> {
    const dto = await this.http.request<TransactionDto>('/account/transaction', {
      method: 'POST',
      body: JSON.stringify({ ...payload, value: toApiValue(payload) }),
    })
    return toTransaction(dto)
  }

  async update(id: string, payload: TransactionInput & { accountId: string }): Promise<Transaction> {
    const dto = await this.http.request<TransactionDto>(`/account/transaction/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify({ ...payload, value: toApiValue(payload) }),
    })
    return toTransaction(dto)
  }

  async remove(id: string): Promise<void> {
    await this.http.request<void>(`/account/transaction/${encodeURIComponent(id)}`, { method: 'DELETE' })
  }
}

export class HttpAuthGateway implements AuthGateway {
  constructor(private readonly http: ApiHttpClient) {}

  async authenticate(credentials: Credentials): Promise<AuthenticatedUser | null> {
    try {
      const { result } = await this.http.request<ApiEnvelope<AuthResultDto>>('/user/auth', {
        method: 'POST',
        body: JSON.stringify(credentials),
      })
      const payload = decodeJwtPayload<{ id: string; username: string; email: string }>(result.token)
      if (!payload?.id) return null
      return {
        accessToken: result.token,
        user: { id: String(payload.id), username: payload.username, email: payload.email },
      }
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 400 || err.status === 404)) return null
      throw err
    }
  }

  async register(user: NewUser): Promise<void> {
    await this.http.request('/user', { method: 'POST', body: JSON.stringify(user) })
  }
}

/** Composition helper: um conjunto de repositórios autenticados com o token do usuário. */
export function createApiRepositories(token: string) {
  const http = new ApiHttpClient({ token })
  return {
    accounts: new HttpAccountRepository(http),
    transactions: new HttpTransactionRepository(http),
  }
}

export function createAuthGateway() {
  return new HttpAuthGateway(new ApiHttpClient())
}
