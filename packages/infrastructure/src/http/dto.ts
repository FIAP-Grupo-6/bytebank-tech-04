/**
 * DTOs — contrato da API REST externa (formato "de fio").
 * Ficam isolados aqui: se a API mudar, só os mappers mudam; o domínio não.
 */
export interface ApiEnvelope<T> {
  message: string
  result: T
}

export interface AccountDto {
  id: string
  type: string
  userId: string
}

export interface CardDto {
  id: string
  accountId: string
  type: string
  is_blocked: boolean
  number: string
  dueDate: string
  functions: string
  cvc: string
  paymentDate: string | null
  name: string
}

export interface TransactionDto {
  id: string
  accountId: string
  type: string
  value: number | string
  from?: string
  to?: string
  anexo?: string
  date: string
}

export interface AccountOverviewDto {
  account: AccountDto[]
  transactions: TransactionDto[]
  cards: CardDto[]
}

export interface AuthResultDto {
  token: string
}
