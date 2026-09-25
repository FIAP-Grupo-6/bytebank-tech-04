/**
 * Aritmética monetária em centavos inteiros para evitar erros de ponto
 * flutuante (0.1 + 0.2 !== 0.3). Toda soma do domínio passa por aqui.
 */
export const toCents = (value: number): number => Math.round(value * 100)
export const fromCents = (cents: number): number => cents / 100

export function sumMoney(values: Iterable<number>): number {
  let cents = 0
  for (const v of values) cents += toCents(v)
  return fromCents(cents)
}
