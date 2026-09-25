export type TransactionType = 'Credit' | 'Debit'

/**
 * Transação da conta.
 * Convenção de sinal: créditos são positivos e débitos negativos (`value`).
 */
export interface Transaction {
  id: string
  accountId: string
  type: TransactionType
  value: number
  /** Categoria */
  from?: string
  /** Subcategoria */
  to?: string
  /** Anexo (data URI de imagem) */
  anexo?: string
  date: string
}

/** Dados informados pelo usuário para criar/editar uma transação. `value` é sempre o valor absoluto. */
export interface TransactionInput {
  type: TransactionType
  value: number
  from: string
  to?: string
  anexo?: string
}

/** Payload completo enviado ao repositório (inclui a conta). */
export interface NewTransaction extends TransactionInput {
  accountId: string
}

export interface TransactionFilters {
  type?: TransactionType | 'all'
  category?: string
  dateFrom?: string
  dateTo?: string
  search?: string
}
