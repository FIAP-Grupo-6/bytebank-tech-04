export type AccountType = 'Debit' | 'Credit'

export interface Account {
  id: string
  type: AccountType
  userId: string
}

export interface Card {
  id: string
  accountId: string
  type: AccountType
  is_blocked: boolean
  number: string
  dueDate: string
  functions: string
  cvc: string
  paymentDate: string | null
  name: string
}
