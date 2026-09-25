// ─── Entidades ───────────────────────────────────────────────────────────────
export * from './entities/user'
export * from './entities/account'
export * from './entities/transaction'
export * from './entities/dashboard'
export * from './entities/settings'

// ─── Erros ───────────────────────────────────────────────────────────────────
export * from './errors/domain-error'

// ─── Regras de negócio (funções puras) ───────────────────────────────────────
export * from './rules/money'
export * from './rules/balance'
export * from './rules/monthly'
export * from './rules/spending'
export * from './rules/categories'
export * from './rules/transaction-validation'
export * from './rules/transaction-filter'
export * from './rules/settings'

// ─── Portas ──────────────────────────────────────────────────────────────────
export * from './ports/repositories'

// ─── Casos de uso ────────────────────────────────────────────────────────────
export * from './use-cases/dashboard'
export * from './use-cases/transactions'
export * from './use-cases/auth'
export * from './use-cases/settings'
