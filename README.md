# ByteBank — Fase 4

Aplicação de gerenciamento financeiro em **microfrontends Next.js**, evoluída na Fase 4 com **Clean Architecture**, **segurança** (BFF, CSP, criptografia), **state management avançado com cache** e **otimizações de performance** com programação reativa.

> FIAP Pós-Tech · Front-End Engineering · Grupo 6

---

## Sumário

- [Como rodar localmente](#como-rodar-localmente)
- [Tecnologias utilizadas](#tecnologias-utilizadas)
- [Requisitos da Fase 4 → onde estão no código](#requisitos-da-fase-4--onde-estão-no-código)
- [Clean Architecture](#1-clean-architecture-e-arquitetura-modular)
- [State management e cache](#2-state-management-avançado-e-cache)
- [Segurança](#3-segurança-autenticação-segura-e-criptografia)
- [Performance e programação reativa](#4-performance-lazy-loading-pré-carregamento-e-programação-reativa)
- [Resultados medidos](#resultados-medidos)
- [Qualidade: testes, regras de arquitetura e CI](#qualidade-testes-regras-de-arquitetura-e-ci)
- [Microfrontends (Multi-Zones)](#microfrontends-multi-zones)
- [Docker e deploy](#docker-e-deploy)

---

## Como rodar localmente

### Pré-requisitos

- Node.js **20+** e npm 10+
- (opcional) Docker + Docker Compose

### Avaliação rápida — com a API mock (recomendado)

Um único comando sobe o mock da API (usuário e 15 transações já cadastrados) e as duas zonas:

```bash
git clone https://github.com/FIAP-Grupo-6/bytebank-tech-02.git
cd bytebank-tech-02
npm install
cp apps/host/.env.example apps/host/.env.local
cp apps/transactions/.env.example apps/transactions/.env.local
npm run dev:demo
```

Acesse **http://localhost:3002** e entre com:

```
E-mail: joao@bytebank.com
Senha:  senha123
```

> Os dados do mock ficam em memória — reiniciar o processo volta ao estado inicial.

### Com a API real (MongoDB)

```bash
git clone https://github.com/israelmeinert/tech-challenge-2.git api
cd api && npm install && cd ..
npm run dev:full        # API + host + transactions
```

### Variáveis de ambiente

| Variável | App | Descrição |
| --- | --- | --- |
| `API_URL` | host, transactions | URL da API REST. **Somente servidor** — desde a Fase 4 o browser não fala com a API. |
| `TRANSACTIONS_URL` | host | URL da zona transactions (rewrites). |
| `NEXTAUTH_SECRET` | host, transactions | **Mesmo valor nas duas zonas.** Abre o cookie de sessão, é a chave-mestra (HKDF) da criptografia das preferências e assina o webhook interno de cache. Em produção: `openssl rand -base64 32`. |
| `NEXTAUTH_URL` | host | URL pública do host. |
| `HOST_URL` | transactions | URL do host para invalidar o cache do dashboard após mutações (padrão em dev: `http://localhost:3002`). |

### Scripts

```bash
npm run dev:demo      # mock da API + as duas zonas (avaliação)
npm run dev:full      # API real (api/) + as duas zonas
npm run dev           # só as zonas (API já rodando)
npm run build         # build de produção das duas zonas
npm test              # testes (domínio, infraestrutura, reatividade)
npm run lint:arch     # regras de Clean Architecture (dependency-cruiser)
npm run typecheck     # TypeScript em todos os pacotes
npm run lint          # ESLint
npm run verify        # lint:arch + typecheck + test + build (o mesmo que o CI)
npm run storybook     # design system
```

---

## Tecnologias utilizadas

| Categoria | Tecnologia |
| --- | --- |
| Monorepo | Turborepo + npm workspaces |
| Framework | Next.js 14 (App Router) + React 18 + TypeScript |
| Microfrontends | Multi-Zones (oficial do Next.js, via rewrites) |
| Arquitetura | Clean Architecture — pacotes `@bytebank/domain` e `@bytebank/infrastructure` |
| Estado | Redux Toolkit + **RTK Query** (cache, invalidação por tags, updates otimistas) |
| Programação reativa | **RxJS** (busca com debounce, estado de conexão) |
| Autenticação | NextAuth.js v4 (Credentials + JWT cifrado em cookie httpOnly) |
| Segurança | BFF (Route Handlers), CSP e headers, AES-256-GCM + HKDF, HMAC-SHA256 |
| Formulários | react-hook-form + Zod (client) · validação de domínio (servidor) |
| UI | Tailwind CSS + design system `@bytebank/ui` + Storybook |
| Gráficos | Recharts (carregado sob demanda) |
| Testes | Vitest + RxJS TestScheduler (marble tests) |
| Qualidade | dependency-cruiser (regras de arquitetura), ESLint, GitHub Actions |
| Infra | Docker + Docker Compose, Vercel (front), Render (API), MongoDB Atlas |

---

## Requisitos da Fase 4 → onde estão no código

| Requisito do desafio | Implementação | Onde ver |
| --- | --- | --- |
| Arquitetura modular | Pacotes por camada + zonas independentes; regras de dependência verificadas no CI | `packages/*`, `tooling/.dependency-cruiser.cjs` |
| Separar apresentação, domínio e infraestrutura | `domain` (puro) ← `infrastructure` (adapters) ← apps (`server/` = composição, `components/store/presentation` = apresentação) | `packages/domain`, `packages/infrastructure`, `apps/*/src/server` |
| State Management Patterns avançados | RTK Query (estado de servidor) separado do estado de UI (slice de filtros); seletores memorizados; updates otimistas com rollback; hidratação SSR | `apps/transactions/src/store`, `apps/host/src/store` |
| Lazy loading e pré-carregamento | `next/dynamic` / `React.lazy` para gráficos, modais e calendário; preload por intenção e em idle; Speculation Rules entre zonas | `components/Charts`, `TransactionPage`, `packages/ui/src/DatePicker` |
| Cache para otimizar requisições | Cache do RTK Query · ETag/304 no BFF · `unstable_cache` por usuário no servidor com invalidação por evento entre zonas | `store/api/*`, `infrastructure/src/next/bff.ts`, `apps/host/src/server/cache.ts` |
| Programação reativa | Streams RxJS para busca e conectividade, testados com marble tests | `apps/transactions/src/presentation/reactive` |
| Autenticação segura | Token da API só no servidor; middleware na borda; BFF com CSRF e allowlist de campos | `apps/host/src/server/auth.ts`, `apps/host/src/middleware.ts`, `apps/transactions/src/app/api/bff` |
| Criptografia de dados sensíveis | Preferências financeiras cifradas com AES-256-GCM (chave por usuário via HKDF) em cookie httpOnly | `infrastructure/src/crypto/aead.ts`, `apps/host/src/server/settings-repository.ts` |

---

## 1. Clean Architecture e arquitetura modular

```
bytebank-tech-02/
├── packages/
│   ├── domain/            ← CAMADA DE DOMÍNIO (sem dependências externas)
│   │   ├── entities/        Transaction, Account, Card, DashboardSettings…
│   │   ├── rules/           saldo em centavos, evolução mensal, filtros,
│   │   │                    validação de transação, catálogo de categorias
│   │   ├── ports/           interfaces: AccountRepository, TransactionRepository,
│   │   │                    AuthGateway, DashboardSettingsRepository
│   │   └── use-cases/       GetDashboardView, ListStatement, CreateTransaction,
│   │                        UpdateTransaction, DeleteTransaction, RegisterUser…
│   │
│   ├── infrastructure/    ← CAMADA DE INFRAESTRUTURA (somente servidor)
│   │   ├── http/            cliente HTTP (timeout, erros tipados), DTOs, mappers
│   │   ├── repositories/    adapters HTTP que implementam as portas do domínio
│   │   ├── crypto/          AES-256-GCM (seal/open) e HMAC com timestamp
│   │   └── next/            sessão no servidor e utilitários do BFF
│   │
│   └── ui/                ← design system (apresentação pura)
│
└── apps/
    ├── host/              ← zona principal (dashboard, cartões, login, sobre)
    └── transactions/      ← zona de transações
        └── src/
            ├── app/           rotas, páginas (Server Components) e BFF
            ├── server/        COMPOSITION ROOT: liga portas → adapters
            ├── components/    APRESENTAÇÃO (client)
            ├── store/         estado (RTK Query + UI)
            └── presentation/  reatividade (RxJS)
```

**Regra de dependência:** as setas só apontam para dentro. O domínio não conhece React, Next.js, fetch ou NextAuth — o `tsconfig` dele nem inclui a lib `dom`. Casos de uso recebem as portas no construtor (inversão de dependência), por isso são testados com repositórios falsos, sem rede.

Exemplo — criar transação:

```
TransactionModal (client) ──POST──► BFF route handler ──► CreateTransaction (domínio)
                                     │  sessão/token        │  valida regras
                                     │  allowlist de campos │  resolve a conta
                                     ▼                      ▼
                             makeUseCases(session) ──► HttpTransactionRepository ──► API
```

Regras de negócio que antes estavam espalhadas (cálculo de saldo no `api-client`, filtros no seletor, categorias na UI, agregação dos gráficos no componente) agora vivem **uma vez** no domínio e são usadas tanto pelo servidor quanto pela interface.

**As regras de arquitetura são verificadas automaticamente** (`npm run lint:arch`, também no CI):

| Regra | O que impede |
| --- | --- |
| `domain-is-pure` | domínio importar qualquer coisa fora dele (framework, lib, infra) |
| `presentation-not-depend-on-infrastructure` | componentes/store importarem a infraestrutura (token, API, crypto) |
| `presentation-not-depend-on-server` | código de browser importar `src/server/*` |
| `infrastructure-not-depend-on-apps-or-ui` | adapters conhecerem apps ou o design system |
| `ui-is-presentational` | design system acessar domínio/infra |
| `zones-are-independent` | uma zona importar código da outra |
| `no-circular` | dependências circulares |

---

## 2. State management avançado e cache

**Estado de servidor ≠ estado de UI.** Dados da API ficam no **RTK Query**; filtros e paginação ficam num slice próprio. Na Fase 2 os thunks manuais guardavam até o token no Redux.

- **Cache por endpoint** com deduplicação de requisições concorrentes e `keepUnusedDataFor`.
- **Invalidação por tags** — create/update/delete invalidam a lista, sem `refresh` manual.
- **Updates otimistas com rollback**: a transação aparece/some na hora; se a API falhar, o patch é desfeito e um alerta explica o que aconteceu.
- **Hidratação a partir do SSR**: o Server Component busca o extrato e grava no cache com `upsertQueryEntries` (síncrono) antes do primeiro render — sem spinner e sem segunda requisição.
- **Refetch em foco/reconexão** (`setupListeners`).
- **Store por árvore (factory)**: no App Router um store singleton de módulo poderia vazar estado entre usuários no SSR.
- **Seletores memorizados** que reutilizam as funções puras do domínio (`filterTransactions`, `paginate`).

**Três níveis de cache:**

| Nível | Técnica | Efeito |
| --- | --- | --- |
| Browser (memória) | RTK Query | navegação e filtros sem novas requisições |
| HTTP | `ETag` + `Cache-Control: private, no-cache` no BFF | resposta `304` sem corpo quando nada mudou |
| Servidor | `unstable_cache` por usuário (tag `account:<id>`, TTL 60 s) | Dashboard e Cartões compartilham o mesmo `GET /account` |

Como as zonas são servidores diferentes, uma mutação na zona transactions não invalidaria o cache do host. Solução: o BFF chama `POST /api/internal/revalidate` no host, **assinado com HMAC-SHA256** e timestamp (anti-replay), e o host executa `revalidateTag`. O TTL de 60 s é a rede de segurança.

---

## 3. Segurança: autenticação segura e criptografia

**O token da API nunca chega ao browser.** Na Fase 2 ele era exposto em `useSession()`, passado como prop para componentes client e guardado no Redux — qualquer XSS o roubaria. Agora:

- O token vive **só dentro do JWT cifrado (JWE) do NextAuth**, num cookie `httpOnly` + `SameSite=Lax` + `Secure`. A sessão pública (`/api/auth/session`) só tem nome, e-mail e id.
- O browser chama apenas o **BFF** (Route Handlers na própria origem). O servidor abre a sessão, pega o token e executa o caso de uso.
- A expiração do token da API também é checada.

**BFF endurecido:**
- CSRF em profundidade: além do SameSite, mutações só são aceitas com `Sec-Fetch-Site: same-origin`.
- **Allowlist de campos** (proteção contra mass assignment): `accountId`, `id`, `date` enviados pelo client são descartados. A conta é resolvida no servidor — não é possível lançar em conta de terceiros.
- Validação de regras no domínio → `422` com erros por campo; limites de tamanho de body; ids validados; erros internos não vazam.
- Anexos: só PNG/JPEG/GIF/WebP em base64 até 5 MB. **SVG é recusado** (pode conter `<script>`) e anexos antigos só são renderizados se forem imagens raster.

**Proteção de rotas na borda:** `middleware.ts` com `withAuth` redireciona antes de renderizar; o layout revalida a sessão (defesa em profundidade).

**Cadastro via Server Action:** a URL da API não aparece no bundle. Senha agora exige 8+ caracteres com letras e números (validada no client e no domínio).

**Headers de segurança** nas duas zonas: `Content-Security-Policy` (scripts e conexões só da própria origem, sem iframes, sem `eval` em produção), `Strict-Transport-Security`, `X-Frame-Options: DENY`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`; sem `X-Powered-By`. A fonte passou a ser self-hosted, então nem fontes externas são necessárias.

> Trade-off documentado: a CSP usa `script-src 'unsafe-inline'` porque o Next injeta scripts inline de hidratação. A versão com nonce exigiria renderização dinâmica em todas as páginas, inclusive a `/sobre` estática.

**Criptografia de dados sensíveis.** Metas de economia e limite de gastos revelam a vida financeira do usuário e ficavam em texto puro no `localStorage`. Agora:

- são cifradas no **servidor** com **AES-256-GCM** (IV aleatório de 96 bits, tag de autenticação de 128 bits);
- a chave é derivada com **HKDF-SHA256** a partir do `NEXTAUTH_SECRET` + id do usuário — nunca vai para o browser, e o valor de um usuário não abre para outro;
- ficam num cookie `httpOnly` + `SameSite=Strict`, inacessível a JavaScript;
- adulteração é detectada (volta ao padrão); o dado legado do `localStorage` é migrado uma vez e **apagado**.

---

## 4. Performance: lazy loading, pré-carregamento e programação reativa

**Lazy loading** — fora do bundle inicial:

| Módulo | Técnica | Quando carrega |
| --- | --- | --- |
| Recharts (gráficos) | `next/dynamic`, `ssr: false`, skeleton com as mesmas dimensões (sem CLS) | após a hidratação |
| Modal de transação (RHF + Zod + combobox) | `next/dynamic` | hover/foco no botão ou em idle |
| Modal de personalização | `next/dynamic` | hover/foco no botão |
| Calendário (react-day-picker) | `React.lazy` no design system | hover/foco no campo de data |

**Pré-carregamento:**
- **Por intenção:** o `import()` começa no `mouseenter`/`focus`/`touchstart`; no clique o chunk já está em cache.
- **Em idle:** `requestIdleCallback` baixa o modal depois que a página fica interativa.
- **Entre zonas:** navegar entre microfrontends é navegação completa, então o prefetch do `<Link>` não ajuda. A **Speculation Rules API** (enviada por header HTTP, sem script inline) pré-renderiza a outra zona quando o usuário passa o mouse no link.
- **Dentro da zona:** rotas do host usam `next/link` (antes eram `<a>` e recarregavam a página inteira).
- **Dados:** o SSR entrega o extrato pronto e o dashboard recebe só agregados calculados no servidor (6 pontos do gráfico, 5 últimas transações) em vez do extrato completo.
- **Fonte self-hosted** com `next/font/local` (sem requisição a `fonts.googleapis.com`).

**Programação reativa (RxJS):**
- **Busca como stream:** `debounceTime(300)` → `map(trim)` → `distinctUntilChanged`. O input responde a cada tecla, mas o refiltro só acontece quando o usuário para de digitar, e dentro de `startTransition` (não bloqueia a digitação). O pipeline é uma função pura testada com **marble tests**.
- **Conectividade como stream:** `merge(online, offline)` com `shareReplay` alimenta um aviso de "você está offline — exibindo dados em cache".

---

## Resultados medidos

`next build` antes e depois (First Load JS, gzip):

| Rota | Fase 2 | Fase 4 | Diferença |
| --- | --- | --- | --- |
| `/dashboard` | 257 kB | 180 kB | **−30%** |
| `/transactions` | 193 kB | 180 kB | −7% |
| `/login` | 183 kB | 131 kB | **−28%** |
| `/cadastro` | 183 kB | 131 kB | **−28%** |

No `/transactions`, a remoção do modal, do calendário e do `next-auth/react` foi parcialmente consumida pela adição do RTK Query e do RxJS.

Durante a análise de bundle também foi encontrada uma dívida técnica: arquivos duplicados no design system (`DatePicker.tsx` ao lado de `DatePicker/`) faziam o calendário inteiro entrar até nas telas de login e cadastro.

Verificações de segurança feitas contra o build de produção:

- 0 requisições do browser para a API.
- Nenhum JWT no HTML nem em `/api/auth/session`.
- BFF: `304` com ETag, `401` sem sessão, `403` cross-site, `422` com erros por campo.
- Cookie de preferências cifrado e adulteração detectada; webhook sem assinatura → `401`.

---

## Qualidade: testes, regras de arquitetura e CI

```
@bytebank/domain          43 testes — regras (saldo, meses, filtros, validação) e casos de uso
@bytebank/infrastructure  15 testes — AES-GCM (roundtrip, adulteração, isolamento por usuário),
                                      HMAC (replay), cliente HTTP e repositórios
transactions               3 testes — pipeline RxJS com TestScheduler (marble tests)
```

O workflow `.github/workflows/ci.yml` roda, em todo push e pull request: `lint:arch` → `typecheck` → `test` → `lint` → `build`.

---

## Microfrontends (Multi-Zones)

```
    Browser (uma única origem)
              │
              ▼
┌──────────── HOST (porta 3002) ────────────┐
│  /login /cadastro /dashboard /cards /sobre │
│  BFF: /api/settings                         │
│  rewrites: /transactions/* ── proxy ──┐     │
└───────────────────────────────────────┼─────┘
                                        ▼
┌──────── ZONA TRANSACTIONS (porta 3001) ────┐
│  basePath '/transactions'                   │
│  página + BFF /transactions/api/bff/*       │
│  build e deploy 100% separados do host      │
└─────────────────────────────────────────────┘
```

- As zonas compartilham **pacotes versionados** (domínio, infraestrutura, UI) — dependência de build, não acoplamento de runtime.
- A sessão é compartilhada via cookie cifrado com o mesmo `NEXTAUTH_SECRET`; cada zona abre o cookie no próprio servidor.
- Navegação entre zonas usa `<a>` + Speculation Rules; dentro da zona, `next/link`.

> **Por que Multi-Zones e não Module Federation?** O `@module-federation/nextjs-mf` não suporta o App Router e será descontinuado. Multi-Zones é a abordagem oficial do Next.js.

---

## Docker e deploy

```bash
git clone https://github.com/israelmeinert/tech-challenge-2.git api
docker-compose up --build
```

| Serviço | URL |
| --- | --- |
| API | http://localhost:3000 |
| Transactions | http://localhost:3001 |
| Host | http://localhost:3002 |

**Vercel:** dois projetos (Root Directory `apps/transactions` e `apps/host`).

| Projeto | Variáveis |
| --- | --- |
| transactions (deploy primeiro) | `API_URL`, `NEXTAUTH_SECRET`, `HOST_URL` (URL do host) |
| host | `API_URL`, `TRANSACTIONS_URL`, `NEXTAUTH_SECRET` (o **mesmo**), `NEXTAUTH_URL` |

Produção: https://bytebank-tech-02-host.vercel.app

---

## Licença

MIT
