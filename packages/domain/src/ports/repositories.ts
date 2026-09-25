import type { Account, Card } from '../entities/account'
import type { NewTransaction, Transaction, TransactionInput } from '../entities/transaction'
import type { AuthenticatedUser, Credentials, NewUser } from '../entities/user'
import type { DashboardSettings } from '../entities/settings'

/**
 * PORTAS (interfaces) — o domínio define o contrato; a infraestrutura
 * implementa (HTTP, cookie cifrado, mock em teste). Inversão de dependência:
 * os casos de uso nunca sabem que existe fetch, Next.js ou NextAuth.
 */

export interface AccountOverview {
  account: Account
  cards: Card[]
  transactions: Transaction[]
}

export interface AccountRepository {
  getOverview(): Promise<AccountOverview>
}

export interface TransactionRepository {
  create(payload: NewTransaction): Promise<Transaction>
  update(id: string, payload: TransactionInput & { accountId: string }): Promise<Transaction>
  remove(id: string): Promise<void>
}

export interface AuthGateway {
  authenticate(credentials: Credentials): Promise<AuthenticatedUser | null>
  register(user: NewUser): Promise<void>
}

export interface DashboardSettingsRepository {
  load(): Promise<DashboardSettings | null>
  save(settings: DashboardSettings): Promise<void>
}
