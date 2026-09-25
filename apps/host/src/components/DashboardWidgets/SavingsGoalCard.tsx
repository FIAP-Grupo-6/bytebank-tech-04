'use client'

import { Check, Target, Settings } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@bytebank/ui'
import { cn } from '@bytebank/ui'
import { savingsProgress, type SavingsGoalConfig } from '@bytebank/domain'
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

interface SavingsGoalCardProps {
  balance: number
  config: SavingsGoalConfig
  onEdit: () => void
}

export function SavingsGoalCard({ balance, config, onEdit }: SavingsGoalCardProps) {
  const pct = savingsProgress(balance, config.targetAmount)
  const color = pct >= 100 ? 'hsl(var(--success))' : 'hsl(var(--primary))'
  const reached = pct >= 100

  return (
    <Card className={cn('relative', reached && 'border-success/40 bg-success/5')}>
      <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${color}22` }}
          >
            <Target className="w-3.5 h-3.5" style={{ color }} />
          </div>
          <div>
            <p className="text-xs font-medium tracking-wider uppercase text-muted-foreground">
              Meta de economia
            </p>
            <p className="text-sm font-medium text-foreground truncate max-w-[200px]">
              {config.description}
            </p>
          </div>
        </div>
        <button
          onClick={onEdit}
          aria-label="Editar meta de economia"
          title="Editar"
          className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Settings className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-xs text-muted-foreground">Saldo atual</p>
            <p className="text-lg font-bold tabular-nums" style={{ color }}>
              {formatBRL(balance)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Objetivo</p>
            <p className="text-sm font-semibold text-foreground tabular-nums">
              {formatBRL(config.targetAmount)}
            </p>
          </div>
        </div>

        <ProgressBar pct={pct} color={color} />

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {Math.min(pct, 100).toFixed(1)}% alcançado
          </span>
          {reached ? (
            <span className="flex items-center gap-1 text-xs font-semibold text-success">
              <Check className="w-3 h-3" />
              Meta atingida!
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">
              Faltam {formatBRL(Math.max(config.targetAmount - balance, 0))}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
