import { describe, expect, it, vi } from 'vitest'
import {
  AccountNotFoundError,
  AuthenticateUser,
  CreateTransaction,
  DomainValidationError,
  GetDashboardSettings,
  GetDashboardView,
  ListStatement,
  RegisterUser,
  SaveDashboardSettings,
  type AccountRepository,
  type AuthGateway,
  type DashboardSettingsRepository,
  type TransactionRepository,
} from '../src'
import { tx } from './fixtures'

const transactions = [
  tx({ type: 'Credit', value: 1000, date: '2026-09-01T12:00:00Z' }),
  tx({ type: 'Debit', value: -300, date: '2026-09-10T12:00:00Z' }),
]

const accounts: AccountRepository = {
  getOverview: vi.fn(async () => ({ account: { id: 'acc1', type: 'Debit' as const, userId: 'u1' }, cards: [], transactions })),
}

function fakeTransactions(): TransactionRepository {
  return {
    create: vi.fn(async (p) => ({ ...p, id: 'new', value: -p.value, date: new Date().toISOString() })),
    update: vi.fn(async (id, p) => ({ ...p, id, date: new Date().toISOString() })),
    remove: vi.fn(async () => undefined),
  }
}

describe('GetDashboardView', () => {
  it('entrega só agregados prontos para a UI', async () => {
    const view = await new GetDashboardView(accounts, () => new Date('2026-09-24T12:00:00Z')).execute()
    expect(view.summary.balance).toBe(700)
    expect(view.split).toEqual({ credit: 1000, debit: 300 })
    expect(view.monthly).toEqual([{ month: '2026-09', credit: 1000, debit: 300 }])
    expect(view.currentMonthDebit).toBe(300)
  })
})

describe('ListStatement', () => {
  it('ordena do mais recente para o mais antigo', async () => {
    const list = await new ListStatement(accounts).execute()
    expect(list[0]?.value).toBe(-300)
  })
})

describe('CreateTransaction', () => {
  it('resolve a conta no servidor e ignora accountId vindo do client', async () => {
    const repo = fakeTransactions()
    await new CreateTransaction(accounts, repo).execute({
      type: 'Debit',
      value: 10,
      from: 'Alimentação',
      // tentativa de lançar em outra conta
      ...({ accountId: 'conta-de-outra-pessoa' } as object),
    })
    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ accountId: 'acc1' }))
  })

  it('não chama o repositório quando a regra é violada', async () => {
    const repo = fakeTransactions()
    await expect(new CreateTransaction(accounts, repo).execute({ type: 'Debit', value: -1, from: 'x' })).rejects.toBeInstanceOf(
      DomainValidationError
    )
    expect(repo.create).not.toHaveBeenCalled()
  })

  it('falha com AccountNotFoundError quando o usuário não tem conta', async () => {
    const noAccount: AccountRepository = {
      getOverview: async () => ({ account: undefined as never, cards: [], transactions: [] }),
    }
    await expect(
      new CreateTransaction(noAccount, fakeTransactions()).execute({ type: 'Credit', value: 1, from: 'Trabalho' })
    ).rejects.toBeInstanceOf(AccountNotFoundError)
  })
})

describe('Auth', () => {
  const gateway: AuthGateway = { authenticate: vi.fn(async () => null), register: vi.fn(async () => undefined) }

  it('normaliza o e-mail e não chama a API com credenciais vazias', async () => {
    await new AuthenticateUser(gateway).execute({ email: '', password: '' })
    expect(gateway.authenticate).not.toHaveBeenCalled()
    await new AuthenticateUser(gateway).execute({ email: ' Joao@ByteBank.com ', password: 'x' })
    expect(gateway.authenticate).toHaveBeenCalledWith({ email: 'joao@bytebank.com', password: 'x' })
  })

  it('exige senha com 8+ caracteres, letras e números', async () => {
    const register = new RegisterUser(gateway)
    await expect(register.execute({ username: 'Ana', email: 'ana@x.com', password: '1234' })).rejects.toBeInstanceOf(
      DomainValidationError
    )
    await expect(register.execute({ username: 'Ana', email: 'ana@x.com', password: 'abcdefgh' })).rejects.toBeInstanceOf(
      DomainValidationError
    )
    await register.execute({ username: 'Ana', email: 'ana@x.com', password: 'senha123' })
    expect(gateway.register).toHaveBeenCalledOnce()
  })
})

describe('Dashboard settings', () => {
  it('sem nada salvo retorna o padrão; ao salvar normaliza antes de persistir', async () => {
    const store: { value: unknown } = { value: null }
    const repo: DashboardSettingsRepository = {
      load: async () => store.value as never,
      save: async (s) => {
        store.value = s
      },
    }
    expect((await new GetDashboardSettings(repo).execute()).savingsGoal.enabled).toBe(false)
    await new SaveDashboardSettings(repo).execute({ spendingAlert: { enabled: true, alertThreshold: 999 } })
    expect((await new GetDashboardSettings(repo).execute()).spendingAlert).toMatchObject({ enabled: true, alertThreshold: 100 })
  })
})
