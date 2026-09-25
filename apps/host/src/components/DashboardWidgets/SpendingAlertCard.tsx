'use client'

import { TrendingDown, Settings } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@bytebank/ui'
import { cn } from '@bytebank/ui'
import { evaluateSpending, type SpendingAlertConfig } from '@bytebank/domain'
import { spendingColor } from './utils'
import { formatBRL } from '@/lib/format'

interface ProgressBarProps {
  pct: number
  color: string
}

function ProgressBar({ pct, color }: ProgressBarProps) {
  return (
    <div className="h-2 bg-muted rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }}
      />
    </div>
  )
}

interface SpendingAlertCardProps {
  /** Gasto do mês corrente — calculado pelo domínio no servidor */
  spent: number
  config: SpendingAlertConfig
  onEdit: () => void
}

export function SpendingAlertCard({ spent, config, onEdit }: SpendingAlertCardProps) {
  const { percent: pct, level } = evaluateSpending(spent, config)
  const color = spendingColor(level)
  const isAlert = level !== 'ok'
  const isOver = level === 'exceeded'

  return (
    <Card className={cn('relative', isOver && 'border-destructive/40 bg-destructive/5')}>
      <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${color}22` }}
          >
            <TrendingDown className="w-3.5 h-3.5" style={{ color }} />
          </div>
          <div>
            <p className="text-xs font-medium tracking-wider uppercase text-muted-foreground">
              Alerta de gastos
            </p>
            <p className="text-sm font-medium text-foreground">
              {isOver
                ? 'Limite ultrapassado!'
                : isAlert
                ? 'Atenção — próximo do limite'
                : 'Gastos do mês'}
            </p>
          </div>
        </div>
        <button
          onClick={onEdit}
          aria-label="Editar alerta de gastos"
          title="Editar"
          className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Settings className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-xs text-muted-foreground">
              Gasto em{' '}
              {new Date().toLocaleDateString('pt-BR', { month: 'long' })}
            </p>
            <p className="text-lg font-bold tabular-nums" style={{ color }}>
              {formatBRL(spent)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Limite mensal</p>
            <p className="text-sm font-semibold text-foreground tabular-nums">
              {formatBRL(config.monthlyLimit)}
            </p>
          </div>
        </div>

        <ProgressBar pct={pct} color={color} />

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{pct.toFixed(1)}% do limite</span>
          {isOver ? (
            <span className="text-xs font-semibold" style={{ color: 'hsl(var(--destructive))' }}>
              {formatBRL(spent - config.monthlyLimit)} acima do limite
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">
              Restam {formatBRL(config.monthlyLimit - spent)}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
