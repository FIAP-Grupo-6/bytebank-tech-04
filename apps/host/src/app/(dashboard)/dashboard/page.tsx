import { requireSession } from '@/server/session'
import { makeUseCases } from '@/server/container'
import { DashboardCards } from '@/components/DashboardCards'
import { Charts } from '@/components/Charts'
import { DashboardWidgets } from '@/components/DashboardWidgets'
import { RecentTransactions } from './RecentTransactions'
import { DEFAULT_DASHBOARD_SETTINGS, type DashboardView } from '@bytebank/domain'

export const dynamic = 'force-dynamic'

const EMPTY_VIEW: DashboardView = {
  summary: { balance: 0, totalCredit: 0, totalDebit: 0, recentTransactions: [] },
  monthly: [],
  split: { credit: 0, debit: 0 },
  currentMonthDebit: 0,
}

export default async function DashboardPage() {
  const session = await requireSession()
  const useCases = makeUseCases(session)

  // Casos de uso executados em paralelo, no servidor. O client recebe só agregados.
  const [viewResult, settings] = await Promise.all([
    useCases.getDashboardView.execute().then(
      (view) => ({ ok: true as const, view }),
      () => ({ ok: false as const, view: EMPTY_VIEW })
    ),
    useCases.getDashboardSettings.execute().catch(() => DEFAULT_DASHBOARD_SETTINGS),
  ])
  const { view } = viewResult

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <header>
        <h1 className="text-xl font-semibold text-foreground">
          Olá, {session.username.split(' ')[0] || 'visitante'}
        </h1>
        <p className="text-sm text-muted-foreground">Aqui está um resumo da sua conta</p>
      </header>

      {!viewResult.ok && (
        <div role="alert" className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-sm text-red-400">
          Não foi possível carregar os dados da conta. Verifique se a API está rodando e tente novamente.
        </div>
      )}

      <section aria-label="Resumo financeiro">
        <DashboardCards summary={view.summary} />
      </section>

      <section aria-label="Gráficos de movimentação financeira">
        <Charts monthly={view.monthly} split={view.split} />
      </section>

      <section aria-label="Widgets personalizados" className="space-y-4">
        <DashboardWidgets
          balance={view.summary.balance}
          currentMonthDebit={view.currentMonthDebit}
          initialSettings={settings}
        />
      </section>

      <section aria-label="Últimas transações">
        <RecentTransactions transactions={view.summary.recentTransactions} />
      </section>
    </div>
  )
}
