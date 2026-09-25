import { describe, expect, it } from 'vitest'
import {
  buildMonthlyEvolution,
  calculateBalance,
  calculateTotalCredit,
  calculateTotalDebit,
  collectContacts,
  currentMonthDebit,
  evaluateSpending,
  filterTransactions,
  normalizeDashboardSettings,
  paginate,
  sumMoney,
  summarize,
  totalPages,
} from '../src'
import { tx } from './fixtures'

describe('money', () => {
  it('soma em centavos, sem erro de ponto flutuante', () => {
    expect(0.1 + 0.2).not.toBe(0.3)
    expect(sumMoney([0.1, 0.2])).toBe(0.3)
  })
})

describe('balance', () => {
  const items = [tx({ type: 'Credit', value: 1000 }), tx({ type: 'Debit', value: -250.5 }), tx({ type: 'Debit', value: -49.5 })]

  it('saldo considera o sinal das transações', () => {
    expect(calculateBalance(items)).toBe(700)
  })

  it('totais de entrada e saída são positivos', () => {
    expect(calculateTotalCredit(items)).toBe(1000)
    expect(calculateTotalDebit(items)).toBe(300)
  })

  it('summarize retorna as 5 mais recentes em ordem decrescente', () => {
    const many = Array.from({ length: 8 }, (_, i) =>
      tx({ type: 'Credit', value: 1, date: `2026-01-0${i + 1}T00:00:00.000Z` })
    )
    const { recentTransactions } = summarize(many)
    expect(recentTransactions).toHaveLength(5)
    expect(recentTransactions[0]?.date).toBe('2026-01-08T00:00:00.000Z')
  })

  it('lista vazia resulta em zeros', () => {
    expect(summarize([])).toEqual({ balance: 0, totalCredit: 0, totalDebit: 0, recentTransactions: [] })
  })
})

describe('buildMonthlyEvolution', () => {
  it('agrupa por mês em ordem cronológica e mantém só os últimos N meses', () => {
    const items = [
      tx({ type: 'Credit', value: 100, date: '2026-05-15T12:00:00Z' }),
      tx({ type: 'Debit', value: -40, date: '2026-05-20T12:00:00Z' }),
      tx({ type: 'Credit', value: 10, date: '2025-12-15T12:00:00Z' }),
      tx({ type: 'Credit', value: 5, date: '2026-02-15T12:00:00Z' }),
    ]
    const result = buildMonthlyEvolution(items, 2)
    expect(result).toEqual([
      { month: '2026-02', credit: 5, debit: 0 },
      { month: '2026-05', credit: 100, debit: 40 },
    ])
  })
})

describe('spending', () => {
  const now = new Date(2026, 8, 24)
  it('soma apenas débitos do mês corrente', () => {
    const items = [
      tx({ type: 'Debit', value: -100, date: new Date(2026, 8, 2).toISOString() }),
      tx({ type: 'Debit', value: -50, date: new Date(2026, 7, 30).toISOString() }),
      tx({ type: 'Credit', value: 999, date: new Date(2026, 8, 3).toISOString() }),
    ]
    expect(currentMonthDebit(items, now)).toBe(100)
  })

  it.each([
    [500, 'ok'],
    [800, 'warning'],
    [1000, 'exceeded'],
  ] as const)('gasto %d com limite 1000 e alerta 80%% → %s', (spent, level) => {
    expect(evaluateSpending(spent, { enabled: true, monthlyLimit: 1000, alertThreshold: 80 }).level).toBe(level)
  })

  it('limite zero não gera divisão por zero', () => {
    expect(evaluateSpending(100, { enabled: true, monthlyLimit: 0, alertThreshold: 80 }).percent).toBe(0)
  })
})

describe('filterTransactions', () => {
  const items = [
    tx({ type: 'Credit', value: 1500, from: 'Trabalho', to: 'Salário', date: '2026-03-01T10:00:00' }),
    tx({ type: 'Debit', value: -80, from: 'Alimentação', to: 'Restaurante', date: '2026-03-15T10:00:00' }),
    tx({ type: 'Debit', value: -200, from: 'Transporte', to: 'Combustível', date: '2026-04-02T10:00:00' }),
  ]

  it('sem filtros retorna tudo', () => {
    expect(filterTransactions(items, {})).toHaveLength(3)
  })

  it('filtra por tipo, categoria e período (datas inclusivas)', () => {
    expect(filterTransactions(items, { type: 'Debit' })).toHaveLength(2)
    expect(filterTransactions(items, { category: 'Transporte' })).toHaveLength(1)
    expect(filterTransactions(items, { dateFrom: '2026-03-15', dateTo: '2026-03-15' })).toHaveLength(1)
  })

  it('busca textual ignora caixa e espaços e procura em categoria, subcategoria e valor', () => {
    expect(filterTransactions(items, { search: '  SALÁRIO ' })).toHaveLength(1)
    expect(filterTransactions(items, { search: '200' })).toHaveLength(1)
    expect(filterTransactions(items, { search: 'inexistente' })).toHaveLength(0)
  })

  it('paginação e total de páginas', () => {
    const list = Array.from({ length: 23 }, (_, i) => i)
    expect(paginate(list, 3, 10)).toEqual([20, 21, 22])
    expect(totalPages(23, 10)).toBe(3)
    expect(totalPages(0, 10)).toBe(1)
  })

  it('coleta contatos únicos', () => {
    expect(collectContacts(items)).toContain('Salário')
  })
})

describe('normalizeDashboardSettings', () => {
  it('entrada inválida vira configuração padrão', () => {
    expect(normalizeDashboardSettings('lixo').spendingAlert.alertThreshold).toBe(80)
  })

  it('aplica limites e mantém valores válidos', () => {
    const s = normalizeDashboardSettings({
      savingsGoal: { enabled: true, description: 'x'.repeat(200), targetAmount: -5 },
      spendingAlert: { enabled: true, monthlyLimit: 2000, alertThreshold: 150 },
    })
    expect(s.savingsGoal.description).toHaveLength(60)
    expect(s.savingsGoal.targetAmount).toBe(0)
    expect(s.spendingAlert.alertThreshold).toBe(100)
    expect(s.spendingAlert.monthlyLimit).toBe(2000)
  })
})
