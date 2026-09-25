import { withAuth } from 'next-auth/middleware'

/**
 * Proteção de rotas na borda (Edge Middleware): a requisição sem sessão
 * válida é redirecionada ANTES de renderizar qualquer Server Component
 * ou chamar a API. O layout ainda revalida a sessão (defesa em profundidade).
 */
export default withAuth({ pages: { signIn: '/login' } })

export const config = {
  matcher: ['/dashboard/:path*', '/cards/:path*'],
}
