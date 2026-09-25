import type { Transaction } from '@bytebank/domain'
import { getServerSessionData } from '@bytebank/infrastructure/next'
import { makeUseCases } from '@/server/container'
import { TransactionPage } from '@/components/TransactionPage'

export const dynamic = 'force-dynamic'

/**
 * Server Component: busca o extrato no servidor (com o token da sessão, que
 * nunca sai daqui) e entrega ao client APENAS os dados — que hidratam o
 * cache do RTK Query. Sem spinner no primeiro paint e sem waterfall
 * "baixa JS → depois busca dados".
 */
export default async function TransactionsZonePage() {
  const session = await getServerSessionData()

  let initialTransactions: Transaction[] = []
  let apiError = false
  if (session) {
    try {
      initialTransactions = await makeUseCases(session).listStatement.execute()
    } catch {
      apiError = true
    }
  }

  if (apiError) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div role="alert" className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-sm text-red-400">
          Não foi possível carregar os dados da conta. Verifique se a API está rodando e recarregue a página.
        </div>
      </div>
    )
  }

  return <TransactionPage initialTransactions={initialTransactions} />
}
