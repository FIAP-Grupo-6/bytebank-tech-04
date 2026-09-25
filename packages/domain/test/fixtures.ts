import type { Transaction } from '../src'

let seq = 0
export function tx(partial: Partial<Transaction> & Pick<Transaction, 'type' | 'value'>): Transaction {
  seq += 1
  return {
    id: `t${seq}`,
    accountId: 'acc1',
    date: '2026-03-10T12:00:00.000Z',
    from: partial.type === 'Credit' ? 'Trabalho' : 'Alimentação',
    ...partial,
  }
}
