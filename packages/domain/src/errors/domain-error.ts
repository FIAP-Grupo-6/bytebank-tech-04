export class DomainError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DomainError'
  }
}

export interface FieldError {
  field: string
  message: string
}

/** Violação de regra de negócio — a camada de apresentação/BFF traduz para HTTP 422. */
export class DomainValidationError extends DomainError {
  constructor(public readonly errors: FieldError[]) {
    super(errors.map((e) => e.message).join('; '))
    this.name = 'DomainValidationError'
  }
}

export class AccountNotFoundError extends DomainError {
  constructor() {
    super('Nenhuma conta encontrada para o usuário')
    this.name = 'AccountNotFoundError'
  }
}
