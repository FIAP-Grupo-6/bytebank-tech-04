import type { AccountRepository, TransactionRepository } from '../ports/repositories'
import type { Transaction, TransactionInput } from '../entities/transaction'
import { assertValidTransactionInput } from '../rules/transaction-validation'
import { sortByDateDesc } from '../rules/balance'
import { AccountNotFoundError } from '../errors/domain-error'

async function resolveAccountId(accounts: AccountRepository): Promise<string> {
  const { account } = await accounts.getOverview()
  if (!account?.id) throw new AccountNotFoundError()
  return account.id
}

/** Extrato da conta principal do usuário, do mais recente para o mais antigo. */
export class ListStatement {
  constructor(private readonly accounts: AccountRepository) {}

  async execute(): Promise<Transaction[]> {
    const { transactions } = await this.accounts.getOverview()
    return sortByDateDesc(transactions)
  }
}

/**
 * A conta de destino é resolvida no servidor a partir da sessão — o client
 * não informa `accountId`, então não consegue lançar em conta de terceiros.
 */
export class CreateTransaction {
  constructor(private readonly accounts: AccountRepository, private readonly transactions: TransactionRepository) {}

  async execute(input: Partial<TransactionInput>): Promise<Transaction> {
    assertValidTransactionInput(input)
    const accountId = await resolveAccountId(this.accounts)
    return this.transactions.create({ ...input, accountId })
  }
}

export class UpdateTransaction {
  constructor(private readonly accounts: AccountRepository, private readonly transactions: TransactionRepository) {}

  async execute(id: string, input: Partial<TransactionInput>): Promise<Transaction> {
    assertValidTransactionInput(input)
    const accountId = await resolveAccountId(this.accounts)
    return this.transactions.update(id, { ...input, accountId })
  }
}

export class DeleteTransaction {
  constructor(private readonly transactions: TransactionRepository) {}

  execute(id: string): Promise<void> {
    return this.transactions.remove(id)
  }
}
