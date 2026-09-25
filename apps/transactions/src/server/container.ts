import 'server-only'
import { CreateTransaction, DeleteTransaction, ListStatement, UpdateTransaction } from '@bytebank/domain'
import { createApiRepositories } from '@bytebank/infrastructure'
import type { ServerSession } from '@bytebank/infrastructure/next'

/**
 * ─── COMPOSITION ROOT da zona transactions ─────────────────────────────────
 * Liga as portas do domínio aos adapters HTTP usando o token da sessão.
 * O token só existe aqui, no servidor.
 */
export function makeUseCases(session: ServerSession) {
  const { accounts, transactions } = createApiRepositories(session.accessToken)
  return {
    listStatement: new ListStatement(accounts),
    createTransaction: new CreateTransaction(accounts, transactions),
    updateTransaction: new UpdateTransaction(accounts, transactions),
    deleteTransaction: new DeleteTransaction(transactions),
  }
}
