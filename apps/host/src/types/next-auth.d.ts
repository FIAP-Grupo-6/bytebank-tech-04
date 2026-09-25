import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  /** Sessão PÚBLICA (exposta ao browser) — propositalmente sem accessToken. */
  interface Session {
    user: {
      id?: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }

  interface User {
    id: string
    accessToken?: string
  }
}

declare module 'next-auth/jwt' {
  /** Conteúdo do cookie cifrado — só o servidor lê. */
  interface JWT {
    accessToken?: string
    apiTokenExp?: number
    id?: string
  }
}
