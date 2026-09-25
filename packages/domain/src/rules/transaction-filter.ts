import type { Transaction, TransactionFilters } from '../entities/transaction'

const startOfDay = (value: string) => new Date(`${value}T00:00:00`)
const endOfDay = (value: string) => new Date(`${value}T23:59:59.999`)

export function matchesFilters(t: Transaction, filters: TransactionFilters): boolean {
  if (filters.type && filters.type !== 'all' && t.type !== filters.type) return false

  const date = new Date(t.date)
  if (filters.dateFrom && date < startOfDay(filters.dateFrom)) return false
  if (filters.dateTo && date > endOfDay(filters.dateTo)) return false

  if (filters.category && t.from !== filters.category) return false

  const q = filters.search?.trim().toLowerCase()
  if (q) {
    const haystack = [t.type, String(Math.abs(t.value)), t.from ?? '', t.to ?? '']
      .join(' ')
      .toLowerCase()
    if (!haystack.includes(q)) return false
  }

  return true
}

export function filterTransactions(
  items: readonly Transaction[],
  filters: TransactionFilters
): Transaction[] {
  return items.filter((t) => matchesFilters(t, filters))
}

export function paginate<T>(items: readonly T[], page: number, pageSize: number): T[] {
  const start = (Math.max(1, page) - 1) * pageSize
  return items.slice(start, start + pageSize)
}

export function totalPages(count: number, pageSize: number): number {
  return Math.max(1, Math.ceil(count / pageSize))
}

export function collectContacts(items: readonly Transaction[]): string[] {
  const contacts = new Set<string>()
  for (const t of items) {
    if (t.from) contacts.add(t.from)
    if (t.to) contacts.add(t.to)
  }
  return [...contacts]
}
