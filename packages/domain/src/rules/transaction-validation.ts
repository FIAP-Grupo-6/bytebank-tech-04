import type { TransactionInput, TransactionType } from '../entities/transaction'
import { DomainValidationError, type FieldError } from '../errors/domain-error'
import { getCategoriesByType, getSubcategories } from './categories'

export const MAX_TRANSACTION_VALUE = 1_000_000_000
export const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024

/**
 * Apenas imagens raster em base64. SVG é recusado de propósito: é um
 * documento XML que pode carregar <script> (vetor de XSS armazenado).
 */
const ATTACHMENT_PATTERN = /^data:image\/(png|jpeg|gif|webp);base64,[A-Za-z0-9+/]+={0,2}$/

export function normalizeTransactionType(type: unknown): TransactionType {
  const normalized = String(type ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
  return normalized === 'credit' || normalized === 'credito' || normalized === 'entrada'
    ? 'Credit'
    : 'Debit'
}

/** Tamanho real (bytes) do conteúdo de um data URI base64. */
export function base64PayloadBytes(dataUri: string): number {
  const base64 = dataUri.slice(dataUri.indexOf(',') + 1)
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0
  return Math.floor((base64.length * 3) / 4) - padding
}

export function validateTransactionInput(input: Partial<TransactionInput>): FieldError[] {
  const errors: FieldError[] = []

  if (input.type !== 'Credit' && input.type !== 'Debit') {
    errors.push({ field: 'type', message: 'Tipo de transação inválido' })
  }

  if (typeof input.value !== 'number' || !Number.isFinite(input.value) || input.value <= 0) {
    errors.push({ field: 'value', message: 'O valor deve ser um número positivo' })
  } else if (input.value > MAX_TRANSACTION_VALUE) {
    errors.push({ field: 'value', message: 'Valor acima do limite permitido' })
  } else if (Math.abs(input.value * 100 - Math.round(input.value * 100)) > 1e-6) {
    errors.push({ field: 'value', message: 'O valor deve ter no máximo 2 casas decimais' })
  }

  if (input.type === 'Credit' || input.type === 'Debit') {
    const categories = getCategoriesByType(input.type)
    if (!input.from || !categories.some((c) => c.value === input.from)) {
      errors.push({ field: 'from', message: 'Categoria inválida para o tipo selecionado' })
    } else if (input.to && !getSubcategories(input.type, input.from).includes(input.to)) {
      errors.push({ field: 'to', message: 'Subcategoria inválida para a categoria' })
    }
  }

  if (input.anexo) {
    if (!ATTACHMENT_PATTERN.test(input.anexo)) {
      errors.push({ field: 'anexo', message: 'Anexo deve ser uma imagem PNG, JPEG, GIF ou WebP' })
    } else if (base64PayloadBytes(input.anexo) > MAX_ATTACHMENT_BYTES) {
      errors.push({ field: 'anexo', message: 'Imagem muito grande (máx. 5 MB)' })
    }
  }

  return errors
}

export function assertValidTransactionInput(input: Partial<TransactionInput>): asserts input is TransactionInput {
  const errors = validateTransactionInput(input)
  if (errors.length > 0) throw new DomainValidationError(errors)
}
