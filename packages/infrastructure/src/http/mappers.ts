import { normalizeTransactionType, type Account, type Card, type Transaction } from '@bytebank/domain'
import type { AccountDto, CardDto, TransactionDto } from './dto'

/** DTO → entidade. Normaliza tipos e garante a convenção de sinal do domínio. */
export function toTransaction(dto: TransactionDto): Transaction {
  const type = normalizeTransactionType(dto.type)
  const raw = Number(dto.value)
  const abs = Number.isFinite(raw) ? Math.abs(raw) : 0
  return {
    id: String(dto.id),
    accountId: String(dto.accountId),
    type,
    value: type === 'Debit' ? -abs : abs,
    from: dto.from || undefined,
    to: dto.to || undefined,
    anexo: dto.anexo || undefined,
    date: dto.date,
  }
}

export function toAccount(dto: AccountDto): Account {
  return { id: String(dto.id), userId: String(dto.userId), type: normalizeTransactionType(dto.type) }
}

export function toCard(dto: CardDto): Card {
  return { ...dto, type: normalizeTransactionType(dto.type) }
}

/** Lê o payload de um JWT SEM validar assinatura — uso apenas para exibir dados; quem valida é a API. */
export function decodeJwtPayload<T = Record<string, unknown>>(token: string): T | null {
  const part = token.split('.')[1]
  if (!part) return null
  try {
    return JSON.parse(Buffer.from(part, 'base64url').toString('utf8')) as T
  } catch {
    return null
  }
}
