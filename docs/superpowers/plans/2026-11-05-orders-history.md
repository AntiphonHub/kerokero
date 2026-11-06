# Histórico de Pedidos & Conciliação (`/orders`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar a central de histórico de pedidos e conciliação de caixa (`/orders`) focada em comandas finalizadas e pagas, com visão dupla (Comandas & Contas e Itens Produzidos), separação contábil rigorosa entre PIX Asaas e Maquininha física, filtros e drawer de detalhes da mesa.

**Architecture:** Server Component orquestrador em `app/(app)/orders/page.tsx` recebendo filtros via `searchParams`. O serviço backend `lib/appwrite/orders-history.ts` consulta sessões finalizadas (`status: 'closed'`) filtradas por `closedAt`, segrega os valores de `pixPaidAmount` e `posPaidAmount` e busca os itens associados. Componentes clientes interativos gerenciam a alternância de abas, busca e o drawer lateral.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Lucide React, Appwrite (`node-appwrite`), Vitest.

**Spec:** `docs/superpowers/specs/2026-11-05-orders-history-design.md`

## Global Constraints

- Apenas comandas e pedidos de mesas já finalizadas (`status: 'closed'`) são consultados e exibidos.
- Anti-AI Slop: sem badges coloridas excessivas, sem gradientes saturados, zero emojis em labels ou tabelas.
- Paleta: superfícies neutras (`#FFFFFF`, `#F4F4F5`, bordas `#E4E4E7`), textos e ações em `#121212`, destaque em âmbar (`#F59E0B`).
- Integridade Contábil: `pixAsaasRevenue + posMachineRevenue === totalRevenue` garantido pela segregação de valores na liquidação.
- Fuso horário de Brasília (UTC-3) respeitado em todos os cortes de data de fechamento (`closedAt`).

## Review Focus

- Faturamento zero ou período sem nenhuma comanda fechada: estado vazio limpo e cards exibindo R$ 0,00.
- Pagamentos híbridos (parte PIX, parte Maquininha): valores segregados corretamente nos cards e comanda classificada como mista.
- Busca por mesa ou cliente: filtros insensíveis a maiúsculas/minúsculas tratando caracteres especiais sem lançar exceções.
- Responsividade: tabelas com rolagem horizontal suave e drawer legível em mobile e desktop.
- Desempenho: ordenação descendente por `closedAt` limitando consultas para manter carregamento instantâneo.

---

### Task 1: Rastreabilidade de Liquidação e Serviço de Consulta do Histórico (TDD)

**Files:**
- Modify: `lib/appwrite/client-sessions.ts`
- Modify: `actions/tables.ts`
- Create: `lib/appwrite/orders-history.ts`
- Test: `tests/unit/orders-history.test.ts`

- [x] **Step 1.1**: Atualizar `lib/appwrite/client-sessions.ts` e `actions/tables.ts` para que o encerramento e liquidação (`closeAndSettleEntireTableSession`, `settleParticipantPayment`) persistam os valores segregados de `pixPaidAmount` e `posPaidAmount` e o rótulo de método.
- [x] **Step 1.2**: Escrever os testes unitários em `tests/unit/orders-history.test.ts` cobrindo:
  - Filtro por data de fechamento (`closedAt`) em Hoje, Ontem, 7d e 30d em UTC-3.
  - Agregação dos subtotais com garantia matemática (`total === pix + pos`).
  - Filtragem por método de pagamento (`all`, `pix_asaas`, `pos_card`, `cash`).
  - Filtragem por termo de busca (número de mesa e participante).
- [x] **Step 1.3**: Executar os testes com `npm test tests/unit/orders-history.test.ts` e confirmar falha (Red).
- [x] **Step 1.4**: Implementar as funções em `lib/appwrite/orders-history.ts`:
  - `getOrdersHistoryData(establishmentId, filters)`
  - `getHistoryDateRangeBoundaries(range)`
  - `aggregateHistoryTotals(sessions)`
- [x] **Step 1.5**: Re-executar os testes com `npm test tests/unit/orders-history.test.ts` e validar sucesso (Green).

---

### Task 2: Componentes de Resumo Financeiro, Filtros e Drawer

**Files:**
- Create: `components/orders/history-summary-cards.tsx`
- Create: `components/orders/history-filters.tsx`
- Create: `components/orders/session-details-drawer.tsx`

- [x] **Step 2.1**: Implementar `components/orders/history-summary-cards.tsx` exibindo:
  - Total Faturado (com barra superior âmbar e valor em BRL).
  - Recebido via PIX Asaas (com badge sutil e percentual sobre o total).
  - Recebido na Maquininha / Loja (com badge e percentual sobre o total).
  - Comandas Finalizadas (total de mesas fechadas).
- [x] **Step 2.2**: Implementar `components/orders/history-filters.tsx` (`'use client'`):
  - Alternador de abas (`Comandas & Contas` vs `Itens Produzidos`).
  - Seletor de período (`Hoje`, `Ontem`, `Últimos 7 dias`, `Últimos 30 dias`).
  - Seletor de meio de pagamento (`Todos`, `PIX Asaas`, `Maquininha`, `Dinheiro`).
  - Campo de busca textual por mesa ou participante com debounce sutil.
- [x] **Step 2.3**: Implementar `components/orders/session-details-drawer.tsx` (`'use client'`):
  - Painel lateral deslizando com cabeçalho da mesa, data/horário de abertura e fechamento.
  - Lista de participantes e itens consumidos por cada um (nome, adicionais, observações, quantidade e valor).
  - Resumo de liquidação (valor total e forma de pagamento utilizada).

---

### Task 3: Tabelas de Visualização (Comandas & Itens) e Container Coordenador

**Files:**
- Create: `components/orders/sessions-table.tsx`
- Create: `components/orders/items-table.tsx`
- Create: `components/orders/orders-history-view.tsx`

- [x] **Step 3.1**: Implementar `components/orders/sessions-table.tsx`:
  - Tabela com número da mesa, data/hora de fechamento, participantes, total de itens, valor total e badge do meio de pagamento.
  - Linhas com cursor pointer para abrir o drawer ao clicar.
  - Estado vazio estilizado quando não houver comandas no filtro.
- [x] **Step 3.2**: Implementar `components/orders/items-table.tsx`:
  - Tabela detalhada de itens com data/hora, número da mesa, cliente, nome do item, adicionais, quantidade, valor unitário, valor total e meio de pagamento.
  - Estado vazio estilizado quando não houver itens no filtro.
- [x] **Step 3.3**: Implementar `components/orders/orders-history-view.tsx` (`'use client'`):
  - Orquestra os filtros, cards de resumo, alternância de abas e abertura do Drawer de comanda selecionada.

---

### Task 4: Integração na Rota `/orders` e Verificação Completa

**Files:**
- Create: `app/(app)/orders/page.tsx`
- Test: `tests/unit/orders-history.test.ts`

- [x] **Step 4.1**: Implementar a rota `app/(app)/orders/page.tsx`:
  - Server Component lendo `searchParams` (`tab`, `range`, `payment`, `search`).
  - Busca os dados via `getOrdersHistoryData(establishment.$id, params)`.
  - Renderiza o `OrdersHistoryView`.
- [x] **Step 4.2**: Executar toda a suíte de testes automatizados com `npm test`.
- [x] **Step 4.3**: Executar build de produção (`npm run build`) para verificar integridade total do Next.js e TypeScript.
