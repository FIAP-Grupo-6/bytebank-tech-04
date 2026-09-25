import 'server-only'
import type { TransactionInput } from '@bytebank/domain'

/**
 * Allowlist de campos (proteção contra mass assignment): qualquer campo
 * extra enviado pelo client — `accountId`, `id`, `date`... — é descartado.
 * A validação de regras fica no caso de uso do domínio.
 */
export function pickTransactionInput(body: Partial<TransactionInput> & Record<string, unknown>): Partial<TransactionInput> {
  const text = (v: unknown) => (typeof v === 'string' ? v.trim() : undefined)
  return {
    type: body.type,
    value: typeof body.value === 'number' ? body.value : Number.NaN,
    from: text(body.from),
    to: text(body.to) || undefined,
    // '' é intencional: na edição significa "remover o anexo"
    anexo: text(body.anexo),
  }
}
