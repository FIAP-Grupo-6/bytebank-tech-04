import type { Transaction } from '../entities/transaction'
import type { MonthlyPoint } from '../entities/dashboard'
import { fromCents, toCents } from './money'

export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

/**
 * Evolução mensal de entradas e saídas, em ordem cronológica,
 * limitada aos `months` meses mais recentes que possuem movimento.
 */
export function buildMonthlyEvolution(
  transactions: readonly Transaction[],
  months = 6
): MonthlyPoint[] {
  const buckets = new Map<string, { credit: number; debit: number }>()

  for (const t of transactions) {
    const key = monthKey(new Date(t.date))
    const bucket = buckets.get(key) ?? { credit: 0, debit: 0 }
    if (t.type === 'Credit') bucket.credit += toCents(t.value)
    else bucket.debit += toCents(Math.abs(t.value))
    buckets.set(key, bucket)
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-months)
    .map(([month, b]) => ({ month, credit: fromCents(b.credit), debit: fromCents(b.debit) }))
}
