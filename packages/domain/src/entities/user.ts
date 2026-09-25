export interface User {
  id: string
  username: string
  email: string
}

export interface Credentials {
  email: string
  password: string
}

export interface NewUser {
  username: string
  email: string
  password: string
}

/** Resultado de uma autenticação bem-sucedida. O token é opaco para o domínio. */
export interface AuthenticatedUser {
  user: User
  accessToken: string
}
