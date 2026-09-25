/**
 * ─── REGRAS DE ARQUITETURA (Clean Architecture) ────────────────────────────
 *
 * Verificadas automaticamente em `npm run lint:arch` e no CI.
 * A regra de dependência: as setas só apontam PARA DENTRO.
 *
 *   apresentação (components, store, presentation)  ─┐
 *   composição/servidor (app/, server/)             ─┼─► domínio
 *   infraestrutura (packages/infrastructure)        ─┘
 *
 * O domínio não conhece ninguém. A apresentação (código que roda no
 * browser) não conhece a infraestrutura — só conversa com o BFF.
 */
module.exports = {
  forbidden: [
    {
      name: 'domain-is-pure',
      severity: 'error',
      comment:
        'O domínio (entidades, regras, casos de uso) não pode depender de framework, biblioteca externa, infraestrutura ou apps.',
      from: { path: '^packages/domain/src' },
      to: { pathNot: ['^packages/domain/src'] },
    },
    {
      name: 'infrastructure-not-depend-on-apps-or-ui',
      severity: 'error',
      comment: 'Infraestrutura implementa portas do domínio; não conhece apps nem o design system.',
      from: { path: '^packages/infrastructure/src' },
      to: { path: ['^apps/', '^packages/ui/'] },
    },
    {
      name: 'ui-is-presentational',
      severity: 'error',
      comment: 'O design system é só apresentação: não acessa domínio nem infraestrutura.',
      from: { path: '^packages/ui/src' },
      to: { path: ['^packages/domain/', '^packages/infrastructure/'] },
    },
    {
      name: 'presentation-not-depend-on-infrastructure',
      severity: 'error',
      comment:
        'Componentes, store e hooks rodam no browser: nunca importam infraestrutura (token, fetch da API, crypto). Usam o BFF.',
      from: { path: '^apps/[^/]+/src/(components|store|presentation|lib)/' },
      to: { path: '^packages/infrastructure/' },
    },
    {
      name: 'presentation-not-depend-on-server',
      severity: 'error',
      comment: 'Código de browser não importa módulos de servidor (src/server/*).',
      from: { path: '^apps/[^/]+/src/(components|store|presentation|lib)/' },
      to: { path: '^apps/[^/]+/src/server/' },
    },
    {
      name: 'zones-are-independent',
      severity: 'error',
      comment: 'Microfrontends não importam código um do outro — só compartilham pacotes versionados.',
      from: { path: '^apps/host/' },
      to: { path: '^apps/transactions/' },
    },
    {
      name: 'zones-are-independent-reverse',
      severity: 'error',
      from: { path: '^apps/transactions/' },
      to: { path: '^apps/host/' },
    },
    {
      name: 'no-circular',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: { path: ['\\.test\\.ts$', '/test/', '\\.stories\\.tsx$', '\\.next/', '\\.storybook/'] },
    tsPreCompilationDeps: true,
    combinedDependencies: true,
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default', 'types'],
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.d.ts'],
    },
  },
}
