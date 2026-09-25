/**
 * ─── ZONA "TRANSACTIONS" (Multi-Zones) ─────────────────────────────────────
 *
 * Aplicação Next.js 100% independente: build, deploy e versionamento
 * próprios. O host faz proxy de /transactions/* para cá via rewrites.
 *
 * basePath garante que TODAS as rotas e assets deste app vivam sob
 * /transactions — assim um único rewrite no host cobre páginas E assets,
 * sem conflito com o /_next/ do host. Isso inclui o BFF:
 * /transactions/api/bff/*.
 */
const { buildSecurityHeaders } = require('@bytebank/infrastructure/security-headers')

/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/transactions',

  // Necessário para o Dockerfile (copia .next/standalone)
  output: 'standalone',

  // Não anuncia a tecnologia do servidor (X-Powered-By)
  poweredByHeader: false,

  // Os packages do monorepo são TypeScript puro — o Next precisa transpilá-los
  transpilePackages: ['@bytebank/domain', '@bytebank/infrastructure', '@bytebank/ui'],

  async headers() {
    const headers = buildSecurityHeaders({ isDev: process.env.NODE_ENV !== 'production' })
    return [
      // Com basePath, a raiz da zona (/transactions) não casa com /:path* — por isso as duas regras
      { source: '/', headers },
      { source: '/:path*', headers },
      // Pré-renderização das páginas do host (ver src/app/speculation-rules.json)
      { source: '/', headers: [{ key: 'Speculation-Rules', value: '"/transactions/speculation-rules.json"' }] },
    ]
  },
}

module.exports = nextConfig
