import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import { Providers } from './providers'

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
  title: 'ByteBank',
  description: 'Gerenciamento financeiro inteligente',
  icons: {
    icon: '/favicon.svg'
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={`${plusJakartaSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
