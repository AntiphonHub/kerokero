# Auth Layouts & Authentication — Design Spec

## Intent & Why

O KeroKero precisa de autenticação funcional para o painel do lojista. Atualmente existe um `auth-panel.tsx` de teste na raiz. Este trabalho substitui isso por layouts `(auth)` e `(app)` com route groups do Next.js, implementa as telas de login e cadastro fiéis ao design do Doop (canvas U6knl775AK), e integra com Appwrite para autenticação real com proteção de rotas.

## Goals

1. Layout `(auth)` com telas de login (`/login`) e cadastro (`/cadastro`) fiéis ao Doop
2. Layout `(app)` protegido — placeholder `/dashboard` para futura implementação
3. Middleware de proteção: autenticados → `/dashboard`, desautenticados → `/login`
4. Tabela `profiles` no Appwrite para CPF (dados extras ao user do Appwrite)
5. Máscaras de input em tempo real para telefone e CPF
6. Componentes reutilizáveis (inputs, brand, showcase)
7. Classes Tailwind facilitadoras no `globals.css`

## Non-Goals

- Onboarding do lojista (telas 01-04 do Doop) — escopo futuro
- Dashboard completo — apenas placeholder
- Recuperação de senha — link sem funcionalidade por agora
- Testes automatizados — TDD adiado a pedido implícito do escopo
- Dark mode

## Anti-Goals

- AI Slop: badges, gradientes, emojis, textos prolixos
- Over-engineering: abstrações prematuras, providers desnecessários

## Constraints

- Appwrite SSR com `@appwrite.io/react` + `node-appwrite` no server
- Next.js 16.4 App Router com `proxy.ts` (não `middleware.ts`)
- Tailwind CSS v4 com `@theme inline`
- Zod para validação de schemas
- Paleta: branco `#FFFFFF`, cinzas `#F4F4F5`/`#E4E4E7`, preto `#121212`, âmbar `#F59E0B`
- Font: Plus Jakarta Sans (design Doop) — adequar para se alinhar com Geist já instalada ou trocar
- Mobile first, responsive

## Approaches

### Approach A: Proxy-based route protection (escolhido)
Usa `proxy.ts` no root para redirect optimistic baseado em cookie de sessão do Appwrite. Layouts `(auth)` e `(app)` como route groups no App Router. Server Actions para login/signup.

**Tradeoffs**: Simples, alinhado com Next.js docs. Proteção optimistic (cookie-based) é rápida mas não 100% segura — complementar com verificação server-side nos layouts.

### Approach B: Layout-only protection
Cada layout verifica sessão server-side e redireciona. Sem proxy.

**Tradeoffs**: Mais seguro por request, mas mais lento (DB hit em todo request) e sem redirect antes do render.

**Decisão**: Approach A com verificação server-side adicional nos layouts como double-check.

## Design Details

### Estrutura de Arquivos
```
app/
├── (auth)/
│   ├── layout.tsx          — Auth layout (split: form + showcase)
│   ├── login/
│   │   └── page.tsx        — Login page
│   └── cadastro/
│       └── page.tsx        — Cadastro page
├── (app)/
│   ├── layout.tsx          — App layout (autenticado)
│   └── dashboard/
│       └── page.tsx        — Dashboard placeholder
├── layout.tsx              — Root layout (providers, fonts)
├── page.tsx                — Redirect → /login ou /dashboard
├── providers.tsx           — AppwriteProvider
├── globals.css
└── api/appwrite/[...appwrite]/route.ts

lib/
├── appwrite/
│   ├── config.ts           — Constantes do Appwrite
│   ├── server.ts           — Server client (node-appwrite)
│   └── session.ts          — Helpers de sessão server-side
├── schemas/
│   └── auth.ts             — Zod schemas para login/cadastro
└── masks.ts                — Funções de máscara CPF/telefone

components/
├── ui/
│   ├── button.tsx          — (existente)
│   ├── input.tsx           — Input estilizado com label e erro
│   └── masked-input.tsx    — Input com máscara (CPF, telefone)
├── brand.tsx               — Logo KeroKero
└── auth/
    ├── auth-showcase.tsx   — Box âmbar com comidas flutuantes
    ├── login-form.tsx      — Formulário de login
    └── signup-form.tsx     — Formulário de cadastro

actions/
└── auth.ts                 — Server Actions (login, signup, logout)

proxy.ts                    — Route protection middleware
```

### Tabela profiles (Appwrite Database)
- Collection: `profiles`
- Atributos:
  - `userId` (string, required) — referência ao user do Appwrite Auth
  - `cpf` (string, required) — CPF formatado
  - `phone` (string, optional) — telefone formatado
- Permissões: read/write apenas pelo próprio user

### Masks
- CPF: `000.000.000-00` (11 dígitos)
- Telefone: `(00) 00000-0000` (11 dígitos) ou `(00) 0000-0000` (10 dígitos)
