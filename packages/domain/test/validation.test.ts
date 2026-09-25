import { describe, expect, it } from 'vitest'
import { DomainValidationError, assertValidTransactionInput, normalizeTransactionType, validateTransactionInput } from '../src'

const valid = { type: 'Debit' as const, value: 42.5, from: 'Alimentação', to: 'Restaurante' }
const PNG_1PX =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='

describe('validateTransactionInput', () => {
  it('aceita uma transação válida', () => {
    expect(validateTransactionInput(valid)).toEqual([])
    expect(validateTransactionInput({ ...valid, anexo: PNG_1PX })).toEqual([])
  })

  it.each([
    [{ value: 0 }, 'value'],
    [{ value: -10 }, 'value'],
    [{ value: Number.NaN }, 'value'],
    [{ value: 10.555 }, 'value'],
    [{ value: 2_000_000_000 }, 'value'],
    [{ type: 'Pix' }, 'type'],
    [{ from: 'Trabalho' }, 'from'], // categoria de crédito num débito
    [{ to: 'Salário' }, 'to'],
  ])('rejeita %o no campo %s', (patch, field) => {
    const errors = validateTransactionInput({ ...valid, ...(patch as object) })
    expect(errors.map((e) => e.field)).toContain(field)
  })

  it('recusa SVG (pode conter script) e conteúdo que não é imagem', () => {
    const svg = 'data:image/svg+xml;base64,PHN2Zz48c2NyaXB0PmFsZXJ0KDEpPC9zY3JpcHQ+PC9zdmc+'
    expect(validateTransactionInput({ ...valid, anexo: svg })[0]?.field).toBe('anexo')
    expect(validateTransactionInput({ ...valid, anexo: 'javascript:alert(1)' })[0]?.field).toBe('anexo')
  })

  it('recusa anexo acima de 5 MB', () => {
    const big = `data:image/png;base64,${'A'.repeat(7_000_000)}`
    expect(validateTransactionInput({ ...valid, anexo: big })[0]?.message).toMatch(/5 MB/)
  })

  it('assert lança DomainValidationError com a lista de campos', () => {
    try {
      assertValidTransactionInput({ ...valid, value: -1 })
      expect.unreachable()
    } catch (err) {
      expect(err).toBeInstanceOf(DomainValidationError)
      expect((err as DomainValidationError).errors[0]?.field).toBe('value')
    }
  })
})

describe('normalizeTransactionType', () => {
  it.each([
    ['Credit', 'Credit'],
    ['crédito', 'Credit'],
    [' Entrada ', 'Credit'],
    ['Debit', 'Debit'],
    [undefined, 'Debit'],
  ])('%s → %s', (input, expected) => {
    expect(normalizeTransactionType(input)).toBe(expected)
  })
})
