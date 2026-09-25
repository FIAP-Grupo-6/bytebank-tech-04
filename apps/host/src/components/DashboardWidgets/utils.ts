import type { SpendingLevel } from '@bytebank/domain'

/** Mapeamento visual (apresentação) do nível calculado pelo domínio. */
export function spendingColor(level: SpendingLevel): string {
  if (level === 'exceeded') return 'hsl(var(--destructive))'
  if (level === 'warning') return 'hsl(38, 92%, 50%)'
  return 'hsl(var(--success))'
}
