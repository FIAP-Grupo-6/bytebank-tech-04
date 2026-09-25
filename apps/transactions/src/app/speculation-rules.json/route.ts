/**
 * Speculation Rules da zona transactions: pré-renderiza as páginas do host
 * (outra zona) quando o usuário demonstra intenção de navegar.
 * Ver apps/host/src/app/speculation-rules.json/route.ts.
 */
export const dynamic = 'force-static'

export function GET() {
  const rules = {
    prerender: [
      { source: 'document', where: { or: [{ href_matches: '/dashboard' }, { href_matches: '/cards' }] }, eagerness: 'moderate' },
    ],
  }
  return new Response(JSON.stringify(rules), {
    headers: { 'Content-Type': 'application/speculationrules+json', 'Cache-Control': 'public, max-age=3600' },
  })
}
