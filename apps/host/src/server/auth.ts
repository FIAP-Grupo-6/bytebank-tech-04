import 'server-only'
import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { decodeJwtPayload } from '@bytebank/infrastructure'
import { publicUseCases } from '@/server/container'

const SESSION_MAX_AGE = 12 * 60 * 60 // 12h (alinhado ao token da API)

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        const result = await publicUseCases().authenticateUser.execute({
          email: credentials?.email,
          password: credentials?.password,
        })
        if (!result) return null
        return {
          id: result.user.id,
          name: result.user.username,
          email: result.user.email,
          accessToken: result.accessToken,
        }
      },
    }),
  ],
  callbacks: {
    /**
     * O token da API fica SOMENTE no JWT da sessão — um JWE cifrado dentro
     * do cookie httpOnly. Nenhum código de browser consegue lê-lo.
     */
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.accessToken = user.accessToken
        const exp = user.accessToken ? decodeJwtPayload<{ exp?: number }>(user.accessToken)?.exp : undefined
        token.apiTokenExp = typeof exp === 'number' ? exp : undefined
      }
      return token
    },
    /**
     * O que sai daqui é público (GET /api/auth/session, useSession). Na
     * Fase 2 o accessToken era exposto aqui; agora só dados de exibição.
     */
    async session({ session, token }) {
      session.user = { name: session.user?.name, email: session.user?.email, id: token.id as string }
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: { strategy: 'jwt', maxAge: SESSION_MAX_AGE },
  jwt: { maxAge: SESSION_MAX_AGE },
  secret: process.env.NEXTAUTH_SECRET,
}
