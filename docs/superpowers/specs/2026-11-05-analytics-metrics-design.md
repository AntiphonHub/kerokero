# Especificação Técnica: Central de Métricas & Vendas (`/analytics`)

**Data**: 2026-11-05  
**Status**: Aprovado  
**Módulo**: Inteligência de Negócio / Métricas & Vendas (`/analytics`)

---

## 1. Visão Geral & Intenção (The Why)

A rota `/analytics` é a central estratégica de inteligência de vendas e performance operacional do restaurante no KeroKero. Enquanto o `/dashboard` atende ao ritmo imediato do turno operacional e o `/orders` cuida da conferência de caixa mesa a mesa, o `/analytics` responde às perguntas estratégicas do lojista:
1. Qual a evolução do faturamento bruto no período e qual a proporção real entre recebimentos no **PIX Asaas (digital)** e na **Maquininha/Loja (físico)**?
2. Qual o ticket médio real por comanda/mesa e por cliente/consumidor individual?
3. Quanto tempo, em média, os clientes permanecem na mesa consumindo (indicador crítico de giro de salão)?
4. Quais categorias de cardápio e pratos específicos puxam a maior receita e volume de vendas?

---

## 2. Metas, Não-Metas e Anti-Metas

### Metas (Goals)
- **Regime de Faturamento Realizado**: Opera estritamente sobre as **comandas finalizadas e pagas** (`status == 'closed'`), garantindo precisão absoluta entre receita realizada, saldo PIX Asaas e maquininha física.
- **Seletor de Período Temporal**: `Hoje`, `Ontem`, `Últimos 7 dias`, `Últimos 30 dias` e `Este Mês` (mês corrente desde o dia 1 às 00:00 até hoje).
- **Cards de KPIs Estratégicos de Topo**:
  - **Faturamento Bruto Total**: Com barra superior em destaque âmbar (`#F59E0B`), valor formatado em BRL e contagem de comandas atendidas.
  - **Mix de Canais de Pagamento**: Divisão clara entre `PIX Asaas` e `Maquininha / Loja`, exibindo o montante em R$ de cada canal e o percentual de participação de cada um sobre a receita total.
  - **Ticket Médio Duplo**:
    - Ticket médio por comanda/mesa (`totalRevenue / totalSessions`).
    - Ticket médio por cliente/participante (`totalRevenue / totalParticipants`).
  - **Tempo Médio de Permanência**: Duração média das mesas (`closedAt - openedAt`) em minutos/horas, com indicação de giro do salão.
- **Gráficos Interativos Recharts**:
  - **Evolução de Vendas por Canal no Tempo**: Gráfico de barras empilhadas com duas séries: PIX Asaas (âmbar) e Maquininha (chumbo/preto), agrupado pela data/hora de fechamento (`closedAt`).
  - **Distribuição de Faturamento por Categoria**: Gráfico de barras horizontais limpo mostrando a participação das categorias de cardápio (ex: Hambúrgueres, Bebidas, Porções, Sobremesas).
  - **Top Desempenho do Cardápio**: Tabela/ranking destacando os produtos campeões por receita acumulada e unidades vendidas.

### Não-Metas (Non-Goals)
- Não realiza saques bancários ou transferências (exclusivo de `/wallet`).
- Não inclui comandas abertas ainda sem liquidação financeira.
- Não faz projeções de vendas com IA/machine learning neste ciclo (foco em métricas reais consolidadas).

### Anti-Metas (Anti-Goals)
- **Zero AI Slop**: Sem badges coloridas excessivas, sem gradientes saturados, zero emojis em labels ou gráficos. Superfícies sólidas neutras (`#FFFFFF`, `#F4F4F5`, bordas `#E4E4E7`), tipografia nítida e destaque em âmbar (`#F59E0B`).
- **Zero Discrepância Contábil**: `pixAsaasRevenue + posMachineRevenue === totalRevenue` em qualquer período ou seleção. A soma das categorias bate 100% com o total consolidado.

---

## 3. Arquitetura Técnica & Especificação de Dados

### 3.1. Serviço Backend (`lib/appwrite/analytics.ts`)
- Filtros no Appwrite:
  - Busca `tableSessions` com `establishmentId == establishmentId`, `status == 'closed'`, `closedAt >= startIso && closedAt <= endIso`, limite de 500 ordenado decrescente por `closedAt`.
  - Busca `orders` vinculadas às sessões fechadas no período para cálculo de categorias e itens.
- Cálculos Analíticos:
  1. **Faturamento Total**: `sum(session.totalAmount)`.
  2. **Canais de Pagamento**:
     - `pixAsaasRevenue = sum(session.pixPaidAmount)`.
     - `posMachineRevenue = sum(session.posPaidAmount)`.
     - `pixPercentage = (pixAsaasRevenue / totalRevenue) * 100`.
     - `posPercentage = (posMachineRevenue / totalRevenue) * 100`.
  3. **Ticket Médio**:
     - Por Mesa: `totalRevenue / totalSessions` (ou 0 se 0 sessões).
     - Por Cliente: soma de todos os participantes únicos das sessões. `totalRevenue / totalParticipants` (ou 0 se 0 participantes).
  4. **Tempo Médio de Permanência**:
     - Para cada sessão fechada que tenha `openedAt` e `closedAt` válidos: `durationMs = new Date(closedAt).getTime() - new Date(openedAt).getTime()`.
     - Média em minutos: `sum(durationMs) / validSessions.length / (1000 * 60)`.
     - Formatado como "1h 25min" ou "45 min".
  5. **Série Temporal por Canal de Pagamento**:
     - Agrupado por `closedAt`: 24 intervalos para Hoje/Ontem, ou dias para 7d/30d/este mês, com `{ label, pixRevenue, posRevenue, totalRevenue }`.
  6. **Vendas por Categoria**:
     - Agrupamento das ordens válidas por categoria, somando faturamento e quantidade.

### 3.2. Fusos Horários
- Todas as datas de corte seguem o fuso horário oficial de Brasília (UTC-3).
- O período `this_month` inicia no dia 1 do mês corrente às 00:00:00.000-03:00 até hoje às 23:59:59.999-03:00.

---

## 4. UI/UX & Componentes

1. `app/(app)/analytics/page.tsx`: Server Component orquestrador com leitura de `searchParams.range`.
2. `components/analytics/analytics-filters.tsx`: Botões de alternância de período (`Hoje`, `Ontem`, `7 dias`, `30 dias`, `Este Mês`), com o item ativo em **fundo âmbar e texto branco**.
3. `components/analytics/analytics-kpis.tsx`: Grade de 4 cards analíticos com contraste, tipografia forte e percentuais.
4. `components/analytics/channel-sales-chart.tsx`: Gráfico Recharts de barras empilhadas com faturamento PIX Asaas (âmbar) e Maquininha (chumbo/preto) com tooltip customizado.
5. `components/analytics/category-sales-chart.tsx`: Gráfico de barras horizontais limpo de vendas por categoria de cardápio.
6. `components/analytics/top-items-ranking.tsx`: Ranking limpo dos itens que mais geraram faturamento e volume no período.

---

## 5. Plano de Testes Automatizados (TDD First)
- Testes unitários para `lib/appwrite/analytics.ts`:
  - Cálculo de início e fim para `this_month` e demais períodos em UTC-3.
  - Agregação de KPIs: faturamento total, segregação de canais (PIX vs POS), ticket médio por mesa e por cliente.
  - Cálculo de tempo médio de permanência em minutos/horas e tratamento de datas ausentes/inválidas.
  - Agrupamento temporal por canal de pagamento para os gráficos Recharts.
  - Agrupamento por categoria e top produtos.
