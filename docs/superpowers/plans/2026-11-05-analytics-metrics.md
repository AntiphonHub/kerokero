# Central de Métricas & Vendas (`/analytics`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar a central executiva de métricas e inteligência de vendas (`/analytics`) com KPIs estratégicos (faturamento bruto, segregação PIX Asaas vs Maquininha física, ticket médio por mesa e por cliente, tempo médio de permanência), gráficos Recharts por canal e categoria, e ranking dos itens mais rentáveis com seletor de período (Hoje, Ontem, 7d, 30d e Este Mês).

**Architecture:** Server Component orquestrador em `app/(app)/analytics/page.tsx` recebendo `searchParams.range`. O serviço backend `lib/appwrite/analytics.ts` consulta as sessões fechadas e pedidos no período, calcula os agregados matemáticos e temporais e repassa para componentes clientes Recharts (`'use client'`).

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Recharts, Tailwind CSS v4, Lucide React, Appwrite (`node-appwrite`), Vitest.

**Spec:** `docs/superpowers/specs/2026-11-05-analytics-metrics-design.md`

## Global Constraints

- Regime de faturamento realizado: apenas comandas já finalizadas e pagas (`status == 'closed'`) são consultadas e contabilizadas.
- Anti-AI Slop: sem badges desnecessárias, sem gradientes saturados, zero emojis em labels ou gráficos.
- Paleta: superfícies neutras (`#FFFFFF`, `#F4F4F5`, bordas `#E4E4E7`), textos em `#121212`, destaque em âmbar (`#F59E0B`). Botões ativos com fundo âmbar e texto branco (`bg-amber-500 text-white`).
- Integridade Contábil: `pixAsaasRevenue + posMachineRevenue === totalRevenue` garantido pela segregação de liquidação.
- Fuso horário de Brasília (UTC-3) respeitado em todos os cortes de data de fechamento (`closedAt`).

## Review Focus

- Período sem vendas: divisão por zero prevenida em ticket médio por mesa, ticket médio por cliente e tempo de permanência (`0 min`), com fallbacks visuais limpos nos gráficos.
- Período "Este Mês": inicia no dia 01 do mês corrente às 00:00:00.000-03:00 até hoje às 23:59:59.999-03:00.
- Permanência na mesa: durações calculadas em minutos a partir de `closedAt - openedAt`, ignorando eventuais valores negativos ou registros com datas inválidas.
- Compatibilidade Recharts: gráficos devidamente isolados com `'use client'`, `ResponsiveContainer` e tooltips acessíveis e limpos.

---

### Task 1: Serviço de Inteligência Analítica Backend (TDD)

**Files:**
- Create: `lib/appwrite/analytics.ts`
- Test: `tests/unit/analytics-service.test.ts`

- [x] **Step 1.1**: Escrever os testes unitários em `tests/unit/analytics-service.test.ts` cobrindo:
  - Cálculo de início e fim de intervalo (`today`, `yesterday`, `7d`, `30d`, `this_month`) no fuso correto (UTC-3).
  - Agregação de faturamento e garantia de consistência de canais (`total === pix + pos`).
  - Cálculo de ticket médio por comanda e por cliente/participante.
  - Cálculo de tempo médio de permanência em minutos/horas com descarte de durações inválidas.
  - Agrupamento temporal com séries segregadas (PIX vs Maquininha).
  - Agrupamento de receita por categoria de cardápio e top produtos.
- [x] **Step 1.2**: Executar os testes com `npm test tests/unit/analytics-service.test.ts` e confirmar que falham (Red).
- [x] **Step 1.3**: Implementar as funções em `lib/appwrite/analytics.ts`:
  - `getAnalyticsDateRangeBoundaries(range)`
  - `aggregateAnalyticsMetrics(sessions, orders, range)`
  - `getAnalyticsData(establishmentId, range)`
- [x] **Step 1.4**: Re-executar os testes com `npm test tests/unit/analytics-service.test.ts` e validar sucesso (Green).

---

### Task 2: Componentes de KPIs, Filtros e Gráficos Recharts

**Files:**
- Create: `components/analytics/analytics-filters.tsx`
- Create: `components/analytics/analytics-kpis.tsx`
- Create: `components/analytics/channel-sales-chart.tsx`
- Create: `components/analytics/category-sales-chart.tsx`
- Create: `components/analytics/top-items-ranking.tsx`

- [x] **Step 2.1**: Implementar `components/analytics/analytics-filters.tsx` (`'use client'`):
  - Botões de período (`Hoje`, `Ontem`, `Últimos 7 dias`, `Últimos 30 dias`, `Este Mês`), com o botão ativo estilizado em **fundo âmbar e texto branco**.
- [x] **Step 2.2**: Implementar `components/analytics/analytics-kpis.tsx`:
  - Card 1: Faturamento Bruto (barra superior âmbar, valor BRL e comandas fechadas).
  - Card 2: Mix de Canais de Pagamento (valores e percentuais em PIX Asaas e Maquininha/Loja).
  - Card 3: Ticket Médio Duplo (por mesa e por cliente com valores e contagem de participantes).
  - Card 4: Tempo Médio de Permanência (duração média em mesa com indicador visual de giro).
- [x] **Step 2.3**: Implementar `components/analytics/channel-sales-chart.tsx` (`'use client'`):
  - Gráfico de barras empilhadas Recharts (`BarChart`) exibindo PIX Asaas (âmbar `#F59E0B`) e Maquininha (`#27272A`), com legenda e tooltip formatado.
- [x] **Step 2.4**: Implementar `components/analytics/category-sales-chart.tsx` (`'use client'`):
  - Gráfico de barras horizontais / progresso com distribuição de receita por categoria e percentual.
- [x] **Step 2.5**: Implementar `components/analytics/top-items-ranking.tsx`:
  - Ranking dos produtos mais vendidos no período com receita gerada, quantidade de unidades e posição #1 em destaque âmbar.

---

### Task 3: Integração na Rota `/analytics` e Verificação Completa

**Files:**
- Create: `app/(app)/analytics/page.tsx`
- Test: `tests/unit/analytics-service.test.ts`

- [x] **Step 3.1**: Criar `app/(app)/analytics/page.tsx`:
  - Server Component lendo `searchParams.range`.
  - Busca os dados via `getAnalyticsData(establishment.$id, range)`.
  - Renderiza o layout unificado com cabeçalho, filtros, KPIs, gráficos e ranking de cardápio.
- [x] **Step 3.2**: Executar toda a suíte de testes com `npm test`.
- [x] **Step 3.3**: Executar build de produção (`npm run build`) para verificar compilação e tipagem da nova rota.
