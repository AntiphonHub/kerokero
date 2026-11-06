# Especificação Técnica: Dashboard Principal do Lojista

**Data**: 2026-11-05  
**Status**: Aprovado  
**Módulo**: Painel Administrativo / Dashboard (`/dashboard`)

---

## 1. Visão Geral & Intenção (The Why)

O painel `/dashboard` é o ponto de entrada principal do lojista no KeroKero. O objetivo é fornecer ao gestor ou operador do caixa visibilidade imediata da performance operacional e financeira do estabelecimento, respondendo às seguintes perguntas de negócio:
1. Quanto vendemos no período selecionado (Hoje, Ontem ou Últimos 7 dias)?
2. Qual o ticket médio real por comanda/mesa atendida?
3. Como está a curva de vendas no tempo (picos de almoço/jantar ou evolução nos últimos dias)?
4. Quais pratos e produtos estão puxando a maior parte do faturamento da casa?
5. Qual a ocupação atual do salão e quais mesas estão chamando garçom ou conta neste exato momento?

Ao contrário da tela de Carteira/Financeiro (focada em conciliação líquida bancária, taxas do Asaas e saques), o Dashboard foca no **faturamento bruto da operação** registrado no cardápio digital e na gestão do salão.

---

## 2. Metas, Não-Metas e Anti-Metas

### Metas (Goals)
- **Seletor de Período Temporal**: Filtros intuitivos com botões de alternância: **Hoje** (padrão), **Ontem** e **Últimos 7 dias**.
- **Cards de Métricas Financeiras e Volume (Período Selecionado)**:
  - **Faturamento Bruto**: Soma total de `totalPrice` dos pedidos válidos do período.
  - **Ticket Médio por Comanda**: `Faturamento Total / Comandas Únicas (sessionId)`. Evita distorções de preço médio por item individual.
  - **Comandas Atendidas**: Quantidade total de comandas atendidas no período, acompanhada do volume total de itens produzidos.
- **Bloco Operacional Ao Vivo (Turno Atual)**:
  - **Ocupação do Salão**: Mesas ocupadas / total de mesas ativas no momento presente, com etiqueta indicando "Ao Vivo".
  - **Últimos Chamados de Mesa**: Lista de chamados recentes (`serviceCalls`), permitindo resolver chamados pendentes com um clique sem sair do dashboard.
- **Gráficos com Recharts (Design Minimalista & Responsivo)**:
  - **Evolução de Vendas**:
    - Se Hoje ou Ontem: Agrupamento em 24 faixas horárias (`00h` a `23h`).
    - Se Últimos 7 dias: Agrupamento em 7 barras diárias (`DD/MM`).
  - **Top 5 Produtos por Faturamento**: Ranking dos pratos/produtos que mais geraram receita no período, exibindo valor em R$ e unidades vendidas.

### Não-Metas (Non-Goals)
- Conciliação bancária líquida e split de taxas do gateway Asaas (responsabilidade da seção `/wallet`).
- Substituição do KDS de produção da cozinha ou editor de layout de mesas (atendidos por `/kds` e `/tables`).
- Exportação de planilhas Excel/CSV ou relatórios contábeis avançados (escopo de v2).

### Anti-Metas (Anti-Goals)
- **Zero AI Slop**: Sem badges coloridas excessivas, sem gradientes saturados, sem emojis em textos ou gráficos. Superfícies sólidas neutras (`#FFFFFF`, `#F4F4F5`, bordas `#E4E4E7`), tipografia nítida e destaque em âmbar (`#F59E0B`).
- **Zero Over-engineering**: Sem tabelas intermediárias de snapshot ou jobs crons no banco; agregação calculada de forma segura e rápida no backend.

---

## 3. Arquitetura Técnica & Decisões do Construtor

### 3.1. Abordagem de Renderização
- **Server Component com `searchParams`**:
  - A rota `app/(app)/dashboard/page.tsx` recebe `searchParams.range` (`today` | `yesterday` | `7d`).
  - Função no backend `getDashboardData(establishmentId, range)` busca os pedidos e dados de mesa com `createAdminClient`, realiza a agregação matemática no servidor e retorna dados serializados e estritamente tipados.
  - Gráficos isolados em Client Components (`'use client'`) com a biblioteca `recharts`.

### 3.2. Regras de Agregação Matemática
1. **Filtro de Pedidos no Appwrite**:
   - `Query.equal('establishmentId', establishmentId)`
   - `Query.greaterThanEqual('createdAt', startDateIso)`
   - `Query.lessThanEqual('createdAt', endDateIso)`
   - Desconsidera pedidos com `status === 'cancelled'`.
2. **Cálculo de Ticket Médio**:
   - `totalRevenue / uniqueSessionsCount`.
   - Se `uniqueSessionsCount === 0`, retorna `0`.
3. **Top 5 Produtos**:
   - Agrupamento por `productId` acumulando `totalPrice` e `quantity`.
   - Ordenação primária: **Faturamento decrescente** (`totalPrice DESC`). Em caso de empate, `quantity DESC`.
4. **Fuso Horário Operacional**:
   - As datas de corte utilizam o fuso de Brasília (`America/Sao_Paulo` / UTC-3) para cálculo preciso do início e fim do dia operacional.

### 3.3. Status do Salão Ao Vivo
- Mantido desacoplado do filtro histórico de faturamento:
  - Mesas ativas e ocupadas são consultadas na coleção `tables` no momento do carregamento da página.
  - Chamados de serviço são buscados na coleção `serviceCalls` (`Query.equal('establishmentId', establishmentId)`, ordenados por `$createdAt DESC`, limit 5).
  - Ação de resolver chamado utiliza a Server Action existente `resolveServiceCallAction`.

---

## 4. UI/UX & Componentes

1. `app/(app)/dashboard/page.tsx`: Server Component orquestrador da página.
2. `components/dashboard/period-selector.tsx`: Botões de alternância (`Hoje`, `Ontem`, `Últimos 7 dias`).
3. `components/dashboard/metrics-cards.tsx`: Grade de 4 cards com tipografia e contraste elevados.
4. `components/dashboard/sales-chart.tsx`: Gráfico de área/barras Recharts com tooltip limpo em moeda BRL.
5. `components/dashboard/top-products-chart.tsx`: Gráfico de barras horizontais Recharts com os 5 maiores faturamentos.
6. `components/dashboard/live-service-calls.tsx`: Tabela/feed dos últimos chamados com botão de ação rápida para concluir.

---

## 5. Plano de Testes Automatizados (TDD First)
- Testes unitários para `lib/appwrite/dashboard.ts`:
  - Agregação de faturamento bruto e soma correta de pedidos.
  - Cálculo de ticket médio por comanda única (`sessionId`) e tratamento de divisão por zero.
  - Ordenação correta do Top 5 por faturamento (`totalPrice`).
  - Agrupamento temporal por hora (Hoje/Ontem) e por dia (7d).
- Teste de renderização do Server Component ou componentes de apresentação.
