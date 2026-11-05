# Especificação Técnica: Cozinha & KDS (Kitchen Display System)

**Data**: 2026-11-04  
**Status**: Aprovado para Planejamento  
**Módulo**: Cozinha & KDS (`/kds`)

---

## 1. Objetivo & Escopo

### 1.1. Objetivo Geral
Implementar o **Kitchen Display System (KDS)** do KeroKero no painel do estabelecimento (`/kds`), substituindo impressoras térmicas físicas por uma central 100% digital, reativa e em tempo real. O sistema organiza a fila de produção da cozinha em formato **Kanban** dinâmico (Recebidos → Em Preparo → Prontos para Servir), permitindo visualização ágil dos pedidos com tempo de espera, customizações, observações críticas e sumarização de itens a produzir.

### 1.2. O que entra no escopo
1. **Quadro Kanban de 3 Colunas de Produção**:
   - **Recebidos (Novos)**: Pedidos recém-enviados pelos clientes na mesa (`status: 'pending'`).
   - **Em Preparo**: Pratos em produção ativa pela equipe da cozinha (`status: 'preparing'`).
   - **Prontos para Servir**: Pratos finalizados aguardando retirada pelo garçom/atendente (`status: 'ready'`).
   - **Despacho / Finalização**: Botão "Entregar" que avança o status para `delivered` (concluído), removendo o item da esteira de preparo ativa.
2. **Cards de Produção Detalhados**:
   - Identificação destacada da Mesa (ex: `Mesa 04`) e do Cliente solicitante (`Carlos`).
   - Quantidade e nome do item com alta legibilidade (ex: `2x Smash Burger`).
   - Destaque especial para Observações do cliente (ex: `Sem cebola, alergia a pimenta`) com badge de aviso visual para prevenção de erros.
   - Detalhamento de Adicionais/Opções selecionadas (`selectedOptions`).
   - Timestamp de criação e cronômetro dinâmico de tempo decorrido com alerta cromático sutil:
     - < 15 min: Padrão neutro (Cinza / Zinc).
     - 15 a 30 min: Atenção (Âmbar `#F59E0B`).
     - > 30 min: Crítico / Atrasado (Vermelho suave / Rose).
3. **Controle e Ações Rápidas de Produção**:
   - Avanço de status com um clique (`Iniciar Preparo`, `Marcar Pronto`, `Entregar`).
   - Ação de retrocesso caso o cozinheiro tenha avançado por engano.
   - Ação de avanço em lote por mesa: opção de avançar todos os itens da mesma mesa simultaneamente para agilizar o fluxo.
4. **Sumarizador Acumulado de Produção ("Totais a Preparar")**:
   - Barra superior colapsável que consolida a quantidade total de cada item atualmente pendente e em preparo (ex: `5x Smash Burger`, `3x Batata Frita`). Essencial para a chapa e montagem anteciparem a demanda em lote.
5. **Modos de Exibição & Filtros**:
   - **Visualização por Itens** (cards individuais de pedidos).
   - **Visualização Agrupada por Mesa** (comanda da mesa agrupando seus pratos).
   - Filtro rápido por número de mesa e busca por nome de produto.
6. **Alertas e Sincronização em Tempo Real (Appwrite Realtime)**:
   - Inscrição via WebSocket na coleção `orders` do estabelecimento.
   - Sincronização instantânea quando um novo pedido é feito no PWA do cliente ou quando outro terminal atualiza um status.
   - Sinal sonoro discreto e sintetizado via Web Audio API (sem dependência de assets MP3 externos) acionado ao receber novos pedidos, com toggle de ativar/desativar som (Mute).
7. **Modo Tela Cheia (Fullscreen)**:
   - Botão para expandir para tela cheia nativa, ideal para monitores fixos e tablets na cozinha.

### 1.3. O que fica de fora
- Impressão térmica ESC/POS direta em porta serial/rede (KDS é 100% digital no MVP).
- Roteamento de pedidos por estações físicas de produção separadas (ex: separar bar da chapa em telas independentes - previsto para v2 enterprise).

---

## 2. Pontos Críticos & Casos de Borda

1. **Concorrência de Cliques em Múltiplas Telas de Cozinha**:
   - Se dois operadores clicarem para avançar o mesmo pedido ao mesmo tempo, a atualização no banco é idempotente com validação de status no Appwrite.
2. **Persistência de Áudio em Navegadores (Autoplay Policy)**:
   - Navegadores modernos bloqueiam reprodução automática de áudio sem interação prévia do usuário.
   - Solução: O botão de ativar som inicia o `AudioContext` após o primeiro clique do usuário, mantendo-o ativo para disparos subsequentes via WebSocket.
3. **Pedidos Antigos Esquecidos ou Finalizados**:
   - Apenas pedidos com status `pending`, `preparing` ou `ready` são exibidos nas colunas principais, limitando o payload e prevenindo degradação de performance.
4. **Queda de Conexão WebSocket**:
   - Implementação de fallback resiliente com botão de recarregamento manual e verificação periódica caso o canal realtime desconecte.
5. **Formatação de `selectedOptions`**:
   - `selectedOptions` pode ser string bruta, JSON serializado ou objeto vazio. O parser deve tratar todos os formatos sem lançar exceções.

---

## 3. Impacto de Performance

- **Payload Leve**: Busca restrita aos pedidos não concluídos (`pending`, `preparing`, `ready`) filtrados por `establishmentId`, ordenados por data de criação (`$createdAt` ASC).
- **Sem Polling Agressivo**: Uso primário de WebSockets com canal direto `databases.[db].collections.orders.documents`.
- **Renderização Eficiente**: Memoização de cartões e cálculo de contadores acumulados via `useMemo`.
- **Web Audio API**: Geração de som em memória com oscilador seno/harmônico (< 500 bytes de código), zero I/O de rede.

---

## 4. Segurança & Permissões

- **Multi-Tenant Estrito**: O lojista logado só pode visualizar e modificar pedidos vinculados exclusivamente ao seu próprio `establishmentId`.
- **Validação de Sessão Server-Side**: Todas as Server Actions validam a sessão com `getLoggedInUser()` e verificam a titularidade do estabelecimento antes de qualquer mutação.
- **Validação de Entrada Zod**: Validação estrita do `orderId` e do enum de `OrderStatus` (`pending`, `preparing`, `ready`, `delivered`, `cancelled`).

---

## 5. Estrutura de Arquivos Planejada

- `lib/appwrite/orders.ts`: Adicionar funções `listKitchenOrders(establishmentId)` e `batchUpdateOrdersStatus(orderIds, status)`.
- `lib/schemas/kds.ts`: Schemas Zod de validação para status e ações do KDS.
- `lib/utils/kds.ts`: Funções utilitárias (cálculo de atraso/urgência, formatação de opções, agrupamento de pedidos por mesa e sumarização acumulada de itens).
- `actions/kds.ts`: Server Actions (`getKitchenOrdersAction`, `updateOrderStatusAction`, `batchUpdateOrdersStatusAction`).
- `components/kds/`:
  - `kds-view.tsx`: Componente principal do KDS com filtros, realtime, contadores e Kanban.
  - `kds-column.tsx`: Coluna Kanban com cabeçalho, contador e cards.
  - `kds-card.tsx`: Card individual ou agrupado de pedido com timers, ações e notas.
  - `kds-summary-bar.tsx`: Barra de resumo acumulado de produção.
  - `kds-sound.ts`: Utilitário de áudio sintetizado Web Audio API.
- `app/(app)/kds/page.tsx`: Página Server Component Next.js protegida por autenticação.
- `tests/unit/kds-utils.test.ts`: Testes unitários para utilitários, cálculo de tempo e agrupamentos.
- `tests/unit/kds-actions.test.ts`: Testes unitários para as Server Actions do KDS.
