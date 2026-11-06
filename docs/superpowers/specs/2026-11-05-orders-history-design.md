# Especificação Técnica: Histórico de Pedidos & Conciliação (`/orders`)

**Data**: 2026-11-05  
**Status**: Aprovado  
**Módulo**: Financeiro & Operação / Histórico de Pedidos (`/orders`)

---

## 1. Visão Geral & Intenção (The Why)

O módulo `/orders` é a central de auditoria, conferência de caixa e histórico operacional do lojista no KeroKero. Ele opera exclusivamente sobre **comandas e mesas finalizadas e já pagas**, atendendo a duas necessidades essenciais do restaurante:
1. **Conferência Financeira e Meios de Pagamento**: Permitir ao gerente ou operador de caixa bater o fechamento de caixa do turno distinguindo rigorosamente quanto foi recebido via **PIX Dinâmico na Mesa (Asaas)** e quanto foi recebido na **Maquininha Física / Balcão (presencial)**, com totalizador segregado e soma exata.
2. **Auditoria de Itens e Produção**: Permitir consultar a lista individual de pratos e bebidas produzidos das comandas pagas, identificando mesa, cliente solicitante, adicionais, observações e horário.

---

## 2. Metas, Não-Metas e Anti-Metas

### Metas (Goals)
- **Foco Estrito em Mesas Finalizadas**: Apenas comandas quitadas (`status: 'closed'`) são exibidas e contabilizadas. Mesas em aberto permanecem geridas na tela `/tables`.
- **Visão Dupla com Abas Alternáveis**:
  - **Aba 1: Comandas & Contas (Visão por Mesa/Sessão)**:
    - Lista de comandas finalizadas com: Número da Mesa, Data/Horário de Fechamento, Quantidade de Participantes, Total de Itens, Valor Total da Conta e **Meio de Pagamento** (`PIX Asaas`, `Maquininha`, `Dinheiro` ou `Misto`).
    - Gaveta lateral (*Drawer*) interativa que abre ao clicar na comanda, exibindo a comanda completa com todos os itens consumidos agrupados por participante.
  - **Aba 2: Itens Produzidos (Visão Item-Level)**:
    - Lista contínua de todos os itens das comandas encerradas.
    - Exibe: Horário, Mesa, Cliente solicitante, Nome do Produto, Quantidade, Valor Unitário, Total, Observações/Adicionais e Meio de Pagamento da comanda vinculada.
- **Cards de Resumo no Topo (Subtotais do Período Filtrado)**:
  - **Total Geral Faturado**: Soma exata de todas as comandas finalizadas no período.
  - **Recebido via PIX Asaas**: Valor total liquidado digitalmente na subconta.
  - **Recebido na Maquininha / Balcão**: Valor total recebido fisicamente na loja.
  - **Comandas Finalizadas**: Quantidade de mesas encerradas e pagas.
- **Filtros Unificados**:
  - Período: `Hoje` (padrão), `Ontem`, `Últimos 7 dias`, `Últimos 30 dias`.
  - Meio de Pagamento: `Todos`, `PIX Asaas`, `Maquininha (Cartão)`, `Dinheiro`.
  - Busca rápida por número de mesa ou nome de cliente.
- **Integridade Contábil & Pagamentos Híbridos**:
  - Armazenamento segregado de `pixPaidAmount` e `posPaidAmount` na comanda fechada. Se uma mesa de R$ 300 pagar R$ 100 via PIX e R$ 200 na máquina, os dois subtotais somam exatamente os R$ 300 sem distorções.

### Não-Metas (Non-Goals)
- Não realiza saques bancários ou transferências (isso permanece exclusivo de `/wallet`).
- Não reabre ou edita itens de comandas já encerradas (imutabilidade contábil).
- Não inclui mesas em aberto nesta tela (evita distorções de faturamento não realizado).

### Anti-Metas (Anti-Goals)
- **Zero AI Slop**: Sem badges coloridas excessivas, sem gradientes saturados, sem emojis em textos ou tabelas. Superfícies sólidas neutras (`#FFFFFF`, `#F4F4F5`, bordas `#E4E4E7`), tipografia nítida e destaque em âmbar (`#F59E0B`).
- **Zero Inconsistência**: `pixAsaasRevenue + posMachineRevenue === totalRevenue` em qualquer período ou seleção.

---

## 3. Arquitetura Técnica & Especificação de Dados

### 3.1. Armazenamento de Meio de Pagamento (`tableSessions`)
- Quando a comanda é encerrada:
  - Em `settleAndCloseTableAction`:
    - Permite passar o método presencial (`'pos_card'` ou `'cash'`).
    - Define `posPaidAmount = totalAmount - pixPaidAmount`.
  - Em `settleParticipantPayment` (PIX no PWA):
    - Incrementa `pixPaidAmount = (pixPaidAmount || 0) + amountCents`.
  - Determinação do rótulo principal (`paymentMethod`):
    - Se `pixPaidAmount > 0 && posPaidAmount === 0` -> `'pix_asaas'`.
    - Se `posPaidAmount > 0 && pixPaidAmount === 0` -> `'pos_card'` (ou `'cash'`).
    - Se ambos `> 0` -> `'mixed'`.
- Fallback para dados legados:
  - Se a comanda estiver fechada e não tiver os campos explícitos, considera o total como `'pos_card'`.

### 3.2. Data de Referência
- A query filtra no Appwrite estritamente por `closedAt >= startIso && closedAt <= endIso` e `status == 'closed'`.
- Os cortes temporais seguem o fuso oficial de Brasília (`America/Sao_Paulo` / UTC-3).

### 3.3. Rastreabilidade de Itens (Aba 2)
- Como as ordens pertencem a `sessionId`, para a visualização por itens:
  - Consulta os itens vinculados às sessões do período filtrado, associando o método de pagamento da sessão correspondente.

---

## 4. UI/UX & Componentes

1. `app/(app)/orders/page.tsx`: Server Component orquestrador com suporte a `searchParams` (`tab`, `range`, `payment`, `search`).
2. `components/orders/history-summary-cards.tsx`: 4 cards limpos com valores monetários em BRL, percentuais de canal e barra superior em âmbar no Total Geral.
3. `components/orders/history-filters.tsx`:
   - Alternador de abas (`Comandas Finalizadas` vs `Itens Produzidos`).
   - Seletor de período (`Hoje`, `Ontem`, `7 dias`, `30 dias`).
   - Seletor de meio de pagamento (`Todos`, `PIX Asaas`, `Maquininha`, `Dinheiro`).
   - Campo de busca instantâneo por mesa ou participante.
4. `components/orders/sessions-table.tsx`: Tabela de comandas com linhas clicáveis para abrir o Drawer.
5. `components/orders/items-table.tsx`: Tabela corrida de pratos/bebidas produzidos com badges discretas de meio de pagamento.
6. `components/orders/session-details-drawer.tsx`: Drawer lateral deslizando suavemente para auditar a comanda completa com todos os itens e divisões por cliente.

---

## 5. Plano de Testes Automatizados (TDD First)
- Testes unitários para `lib/appwrite/orders-history.ts`:
  - Agregação contábil exata (`total === pix + pos`).
  - Filtro por data de fechamento (`closedAt`) no fuso correto.
  - Classificação correta de métodos de pagamento (`pix_asaas`, `pos_card`, `mixed`).
  - Tratamento de busca por texto (número da mesa e nome de participante).
