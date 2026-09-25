import type { Transaction } from './transaction'

export interface DashboardSummary {
  balance: number
  totalCredit: number
  totalDebit: number
  recentTransactions: Transaction[]
}

export interface MonthlyPoint {
  /** Chave ordenável `YYYY-MM` */
  month: string
  credit: number
  debit: number
}

export interface CreditDebitSplit {
  credit: number
  debit: number
}
