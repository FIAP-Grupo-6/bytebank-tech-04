import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import { Providers } from './providers'
import { Sidebar } from '@/components/Sidebar'
import { getSessionFromCookie } from '@/lib/session'

// Fonte self-hosted (variável, subset latin): elimina a requisição a
// fonts.googleapis.com, permite CSP font-src 'self' e é pré-carregada pelo Next.
const plusJakartaSans = localFont({
  src: './fonts/PlusJakartaSans-latin-var.woff2',
  variable: '--font-plus-jakarta-sans',
  weight: '200 800',
  display: 'swap',
  preload: true,
})

export const metadata: Metadata = {
  title: 'ByteBank – Transações',
  description: 'Gerenciamento de transações financeiras',
  icons: {
    icon: '/favicon.svg'
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSessionFromCookie()

  if (session === null) {
    return (
      <html lang="pt-BR" className={`${plusJakartaSans.variable} h-full antialiased`}>
        <body className="min-h-full flex items-center justify-center bg-background">
          <div className="text-center space-y-4 max-w-sm p-6">
            <div className="w-12 h-12 bg-brand-green rounded-xl flex items-center justify-center mx-auto">
              <span className="text-white font-bold">B</span>
            </div>
            <h1 className="text-lg font-semibold text-foreground">
              Sessão não encontrada
            </h1>
            <p className="text-sm text-muted-foreground">
              Faça login para acessar suas transações. 
            </p>
            <a
              href="/login"
              className="inline-block bg-brand-green text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-green-dark transition-colors"
            >
              Ir para o login
            </a>
          </div>
        </body>
      </html>
    )
  }

  return (
    <html lang="pt-BR" className={`${plusJakartaSans.variable} h-full antialiased`}>
      <body className="min-h-full">
        <Providers>
          <div className="flex flex-col md:flex-row h-screen bg-background overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-y-auto min-h-0">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  )
}
