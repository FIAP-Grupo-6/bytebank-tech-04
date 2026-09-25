import type { AuthGateway } from '../ports/repositories'
import type { AuthenticatedUser, Credentials, NewUser } from '../entities/user'
import { DomainValidationError, type FieldError } from '../errors/domain-error'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export class AuthenticateUser {
  constructor(private readonly gateway: AuthGateway) {}

  async execute(credentials: Partial<Credentials>): Promise<AuthenticatedUser | null> {
    const email = credentials.email?.trim().toLowerCase()
    const password = credentials.password
    if (!email || !EMAIL.test(email) || !password) return null
    return this.gateway.authenticate({ email, password })
  }
}

export class RegisterUser {
  constructor(private readonly gateway: AuthGateway) {}

  async execute(input: Partial<NewUser>): Promise<void> {
    const errors: FieldError[] = []
    const username = input.username?.trim() ?? ''
    const email = input.email?.trim().toLowerCase() ?? ''
    const password = input.password ?? ''

    if (username.length < 2) errors.push({ field: 'username', message: 'Nome deve ter ao menos 2 caracteres' })
    if (!EMAIL.test(email)) errors.push({ field: 'email', message: 'Email inválido' })
    if (password.length < 8) errors.push({ field: 'password', message: 'Senha deve ter ao menos 8 caracteres' })
    else if (!/[A-Za-z]/.test(password) || !/\d/.test(password))
      errors.push({ field: 'password', message: 'Senha deve conter letras e números' })

    if (errors.length) throw new DomainValidationError(errors)
    await this.gateway.register({ username, email, password })
  }
}
