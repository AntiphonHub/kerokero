# Dashboard Principal do Lojista Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar o dashboard operacional principal do lojista com métricas financeiras brutas, ticket médio por comanda, gráficos Recharts (vendas no tempo e top 5 produtos por receita) e monitor ao vivo de mesas e chamados com seletor de período (Hoje, Ontem e 7 dias).

**Architecture:** Server Component orquestrador em `app/(app)/dashboard/page.tsx` lendo `searchParams.range`. As agregações matemáticas rodam no backend em `lib/appwrite/dashboard.ts` com dados de `orders`, `tables` e `serviceCalls`. Gráficos interativos em componentes clientes Recharts (`'use client'`).

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Recharts, Tailwind CSS v4, Lucide React, Appwrite (`node-appwrite`), Vitest.

**Spec:** `docs/superpowers/specs/2026-11-05-merchant-dashboard-design.md`

## Global Constraints

- Anti-AI Slop: sem badges coloridas desnecessárias, sem gradientes saturados, zero emojis em labels ou tooltips.
- Paleta: superfícies neutras (`#FFFFFF`, `#F4F4F5`, bordas `#E4E4E7`), textos e ações em `#121212`, destaque em âmbar (`#F59E0B`).
- Faturamento bruto baseado nos pedidos internos da loja (sem descontar taxas Asaas).
- Ticket Médio calculado por comandas únicas (`sessionId`), nunca por itens individuais.
- Separação clara entre período histórico selecionado (Hoje, Ontem, 7d) e métricas de salão ao vivo (ocupação e chamados).

## Review Focus

- Faturamento zero ou período sem nenhum pedido: divisão por zero no Ticket Médio prevenida (`R$ 0,00`) e gráficos exibem fallback elegante.
- Fusos horários: cortes de início e fim de dia calculados estritamente em horário de Brasília (UTC-3).
- Pedidos cancelados: ignorados das somas financeiras e contagens de pedidos.
- Top 5 produtos: ordenados primariamente por faturamento acumulado decrescente, com quantidade vendida de desempate.
- Compatibilidade Recharts + Next.js Server Components: gráficos devidamente isolados com `'use client'` e `ResponsiveContainer` sem erros de SSR/hidratação.

---

### Task 1: Instalação de Dependência & Utilitário de Métricas do Dashboard (TDD)

**Files:**
- Create: `lib/appwrite/dashboard.ts`
- Test: `tests/dashboard-metrics.test.ts`
- Modify: `package.json`

- [x] **Step 1.1**: Instalar a dependência `recharts` no projeto via npm.
- [x] **Step 1.2**: Escrever os testes unitários em `tests/dashboard-metrics.test.ts` cobrindo:
  - Cálculo de início e fim de intervalo (`today`, `yesterday`, `7d`) no fuso correto.
  - Agregação de faturamento bruto e total de pedidos desconsiderando `status === 'cancelled'`.
  - Cálculo de ticket médio por comanda única (`sessionId`) e tratamento de divisão por zero.
  - Ordenação correta do Top 5 por faturamento (`totalPrice DESC`).
  - Agrupamento temporal (24h para Hoje/Ontem e 7 dias para 7d).
- [x] **Step 1.3**: Executar os testes com `npm test tests/dashboard-metrics.test.ts` e confirmar que falham (Red).
- [x] **Step 1.4**: Implementar as funções em `lib/appwrite/dashboard.ts`:
  - `getDateRangeBoundaries(range: 'today' | 'yesterday' | '7d')`
  - `aggregateOrdersMetrics(orders: OrderDocument[])`
  - `getDashboardData(establishmentId: string, range?: string)`
- [x] **Step 1.5**: Re-executar os testes com `npm test tests/dashboard-metrics.test.ts` e validar sucesso (Green).

---

### Task 2: Componentes Visuais do Dashboard (Seletor, Cards e Chamados Ao Vivo)

**Files:**
- Create: `components/dashboard/period-selector.tsx`
- Create: `components/dashboard/metrics-cards.tsx`
- Create: `components/dashboard/live-service-calls.tsx`

- [x] **Step 2.1**: Implementar `components/dashboard/period-selector.tsx` com botões alternadores (Hoje, Ontem, Últimos 7 dias) atualizando a query string `?range=...` com transição suave.
- [x] **Step 2.2**: Implementar `components/dashboard/metrics-cards.tsx` exibindo:
  - Faturamento Bruto (R$)
  - Ticket Médio por Comanda (R$)
  - Comandas Atendidas (e volume de itens)
  - Ocupação de Mesas (badge "Ao Vivo", mesas ocupadas / total ativas).
- [x] **Step 2.3**: Implementar `components/dashboard/live-service-calls.tsx` exibindo a lista recente de chamados com tipo, mesa, tempo decorrido e botão com ação direta para concluir chamado pendente.

---

### Task 3: Gráficos Interativos Recharts (Vendas no Tempo & Top Produtos)

**Files:**
- Create: `components/dashboard/sales-chart.tsx`
- Create: `components/dashboard/top-products-chart.tsx`

- [x] **Step 3.1**: Implementar `components/dashboard/sales-chart.tsx` (`'use client'`):
  - Gráfico de área/linha limpo com Recharts (`ResponsiveContainer`, `AreaChart`, `XAxis`, `YAxis`, `Tooltip`).
  - Tooltip customizado com estilo monocromático e valores em formato monetário BRL.
  - Estado vazio estilizado quando não houver vendas no período.
- [x] **Step 3.2**: Implementar `components/dashboard/top-products-chart.tsx` (`'use client'`):
  - Gráfico de barras horizontais limpo (`BarChart`, `layout="vertical"`) exibindo os top 5 produtos por receita acumulada e unidades vendidas.
  - Estado vazio estilizado quando não houver itens vendidos.

---

### Task 4: Integração na Página Principal & Verificação Completa

**Files:**
- Modify: `app/(app)/dashboard/page.tsx`
- Test: `tests/dashboard-metrics.test.ts`

- [x] **Step 4.1**: Atualizar `app/(app)/dashboard/page.tsx` para carregar `searchParams.range`, buscar os dados via `getDashboardData` e compor o layout completo:
  - Cabeçalho com saudação e Seletor de Período.
  - Grade de Cards de Métricas.
  - Seção de Gráficos em duas colunas.
  - Seção de Status do Salão Ao Vivo (chamados e atalhos rápidos).
- [x] **Step 4.2**: Executar todos os testes com `npm test`.
- [x] **Step 4.3**: Executar build de produção (`npm run build`) para verificar integridade de compilação do Next.js e TypeScript.
