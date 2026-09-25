import { TrendingUp, TrendingDown, Wallet } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@bytebank/ui'
import type { DashboardSummary } from '@bytebank/domain'
import { formatBRL } from '@/lib/format'

export function DashboardCards({ summary }: { summary: DashboardSummary }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Saldo atual */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="pb-3">
          <p className="text-xs font-medium tracking-wider uppercase text-muted-foreground">
            Saldo atual
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-2 overflow-hidden">
            <p
              className="text-xl lg:text-2xl font-bold text-foreground tabular-nums truncate min-w-0"
              title={formatBRL(summary.balance)}
            >
              {formatBRL(summary.balance)}
            </p>
            <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
              <Wallet className="w-5 h-5 text-primary" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Atualizado agora</p>
        </CardContent>
      </Card>

      {/* Total de entradas */}
      <Card>
        <CardHeader className="pb-3">
          <p className="text-xs font-medium tracking-wider uppercase text-muted-foreground">
            Total de entradas
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-2 overflow-hidden">
            <p
              className="text-xl lg:text-2xl font-bold text-success tabular-nums truncate min-w-0"
              title={formatBRL(summary.totalCredit)}
            >
              {formatBRL(summary.totalCredit)}
            </p>
            <div className="w-10 h-10 rounded-full bg-success/15 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-success" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total de saídas */}
      <Card>
        <CardHeader className="pb-3">
          <p className="text-xs font-medium tracking-wider uppercase text-muted-foreground">
            Total de saídas
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-2 overflow-hidden">
            <p
              className="text-xl lg:text-2xl font-bold text-destructive tabular-nums truncate min-w-0"
              title={formatBRL(summary.totalDebit)}
            >
              {formatBRL(summary.totalDebit)}
            </p>
            <div className="w-10 h-10 rounded-full bg-destructive/15 flex items-center justify-center flex-shrink-0">
              <TrendingDown className="w-5 h-5 text-destructive" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
