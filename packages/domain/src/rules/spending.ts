import type { Transaction } from '../entities/transaction'
import type { SpendingAlertConfig } from '../entities/settings'
import { sumMoney } from './money'

export function currentMonthDebit(transactions: readonly Transaction[], now: Date = new Date()): number {
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  return sumMoney(
    transactions
      .filter((t) => t.type === 'Debit' && new Date(t.date) >= start)
      .map((t) => Math.abs(t.value))
  )
}

export type SpendingLevel = 'ok' | 'warning' | 'exceeded'

export interface SpendingStatus {
  spent: number
  percent: number
  level: SpendingLevel
  remaining: number
}

export function evaluateSpending(spent: number, config: SpendingAlertConfig): SpendingStatus {
  const percent = config.monthlyLimit > 0 ? (spent / config.monthlyLimit) * 100 : 0
  const level: SpendingLevel =
    percent >= 100 ? 'exceeded' : percent >= config.alertThreshold ? 'warning' : 'ok'
  return { spent, percent, level, remaining: config.monthlyLimit - spent }
}

export function savingsProgress(balance: number, targetAmount: number): number {
  if (targetAmount <= 0) return 0
  return Math.max(0, (balance / targetAmount) * 100)
}
