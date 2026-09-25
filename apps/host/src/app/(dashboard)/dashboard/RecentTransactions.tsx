import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ArrowDownLeft, ArrowUpRight, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@bytebank/ui'
import type { Transaction } from '@bytebank/domain'
import { formatBRL } from '@/lib/format'

export function RecentTransactions({ transactions }: { transactions: Transaction[] }) {
  return (
    <Card>
      <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
        <p className="text-xs font-medium tracking-wider uppercase text-muted-foreground">
          Últimas transações
        </p>
        <a
          href="/transactions"
          className="flex items-center gap-1 text-xs text-primary hover:underline"
        >
          Ver todas <ArrowRight className="w-3 h-3" aria-hidden="true" />
        </a>
      </CardHeader>

      <CardContent className="p-0">
        {transactions.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8 px-6">
            Nenhuma transação ainda.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {transactions.map((t) => {
              const isCredit = t.type === 'Credit'
              return (
                <div
                  key={t.id}
                  className="flex items-center justify-between px-6 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isCredit
                          ? 'bg-success/20 text-success'
                          : 'bg-destructive/20 text-destructive'
                      }`}
                    >
                      {isCredit ? (
                        <ArrowDownLeft className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {isCredit ? 'Crédito' : 'Débito'}
                        {t.from && (
                          <span className="text-muted-foreground font-normal">
                            {' · '}{t.from}{t.to && ` › ${t.to}`}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(t.date), 'dd MMM yyyy', { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-sm font-semibold ${
                      isCredit ? 'text-success' : 'text-destructive'
                    }`}
                  >
                    {formatBRL(t.value)}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
