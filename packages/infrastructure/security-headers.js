/**
 * Cabeçalhos de segurança aplicados às duas zonas (consumido pelos next.config.js).
 *
 * CSP: `script-src 'unsafe-inline'` é necessário porque o Next injeta scripts
 * inline de hidratação; a alternativa estrita (nonce por request) obrigaria
 * renderização dinâmica em TODAS as páginas, inclusive a /sobre estática.
 * Mesmo assim a política bloqueia: scripts de outras origens, eval em
 * produção, iframes (clickjacking), plugins, <base> injetado, envio de
 * formulários para fora e qualquer conexão do browser que não seja com a
 * própria origem — o browser só fala com o BFF.
 */
function buildSecurityHeaders({ isDev }) {
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    `connect-src 'self'${isDev ? ' ws: wss:' : ''}`,
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    ...(isDev ? [] : ['upgrade-insecure-requests']),
  ].join('; ')

  return [
    { key: 'Content-Security-Policy', value: csp },
    { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' },
    { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  ]
}

module.exports = { buildSecurityHeaders }
