import type { AccountRepository } from '../ports/repositories'
import type { Card } from '../entities/account'
import type { CreditDebitSplit, DashboardSummary, MonthlyPoint } from '../entities/dashboard'
import { splitCreditDebit, summarize } from '../rules/balance'
import { buildMonthlyEvolution } from '../rules/monthly'
import { currentMonthDebit } from '../rules/spending'

export interface DashboardView {
  summary: DashboardSummary
  monthly: MonthlyPoint[]
  split: CreditDebitSplit
  currentMonthDebit: number
}

/**
 * Monta tudo que o dashboard precisa NO SERVIDOR. O client recebe só os
 * agregados (6 pontos do gráfico, 5 últimas transações) em vez do extrato
 * inteiro — menos payload serializado e nenhuma regra de negócio no browser.
 */
export class GetDashboardView {
  constructor(private readonly accounts: AccountRepository, private readonly now: () => Date = () => new Date()) {}

  async execute(): Promise<DashboardView> {
    const { transactions } = await this.accounts.getOverview()
    return {
      summary: summarize(transactions),
      monthly: buildMonthlyEvolution(transactions),
      split: splitCreditDebit(transactions),
      currentMonthDebit: currentMonthDebit(transactions, this.now()),
    }
  }
}

export class ListCards {
  constructor(private readonly accounts: AccountRepository) {}

  async execute(): Promise<Card[]> {
    const { cards } = await this.accounts.getOverview()
    return cards
  }
}
