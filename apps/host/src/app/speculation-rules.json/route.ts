/**
 * ─── PRÉ-CARREGAMENTO ENTRE ZONAS (Speculation Rules API) ──────────────────
 *
 * Navegar do host para a zona de transações é uma navegação "dura" (outro
 * app Next.js), então o prefetch do <Link> não se aplica. Estas regras
 * mandam o browser PRÉ-RENDERIZAR /transactions quando o usuário demonstra
 * intenção (hover ~200 ms ou pointerdown no link — `eagerness: moderate`).
 * No clique, a troca de zona é praticamente instantânea.
 *
 * Entregue via header HTTP `Speculation-Rules` (next.config.js), sem script
 * inline — não depende de 'unsafe-inline' na CSP. Browsers sem suporte
 * simplesmente ignoram (progressive enhancement).
 */
export const dynamic = 'force-static'

export function GET() {
  const rules = {
    prerender: [{ source: 'document', where: { href_matches: '/transactions' }, eagerness: 'moderate' }],
  }
  return new Response(JSON.stringify(rules), {
    headers: { 'Content-Type': 'application/speculationrules+json', 'Cache-Control': 'public, max-age=3600' },
  })
}
