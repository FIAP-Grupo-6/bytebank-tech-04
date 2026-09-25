import type { Transaction } from '../entities/transaction'
import type { CreditDebitSplit, DashboardSummary } from '../entities/dashboard'
import { sumMoney } from './money'

export function calculateBalance(transactions: readonly Transaction[]): number {
  return sumMoney(transactions.map((t) => t.value))
}

export function calculateTotalCredit(transactions: readonly Transaction[]): number {
  return sumMoney(transactions.filter((t) => t.type === 'Credit').map((t) => t.value))
}

export function calculateTotalDebit(transactions: readonly Transaction[]): number {
  return sumMoney(transactions.filter((t) => t.type === 'Debit').map((t) => Math.abs(t.value)))
}

export function splitCreditDebit(transactions: readonly Transaction[]): CreditDebitSplit {
  return {
    credit: calculateTotalCredit(transactions),
    debit: calculateTotalDebit(transactions),
  }
}

/** Ordena da mais recente para a mais antiga sem mutar a entrada. */
export function sortByDateDesc(transactions: readonly Transaction[]): Transaction[] {
  return [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function summarize(transactions: readonly Transaction[], recentCount = 5): DashboardSummary {
  return {
    balance: calculateBalance(transactions),
    totalCredit: calculateTotalCredit(transactions),
    totalDebit: calculateTotalDebit(transactions),
    recentTransactions: sortByDateDesc(transactions).slice(0, recentCount),
  }
}
