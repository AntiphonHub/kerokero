# Implementação: Mesas, Comandas Digitais e Impressão de Cartões QR Code

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar o sistema completo de Mesas e Comandas Digitais no KeroKero (`/tables`), incluindo provisionamento automático de mesas pós-onboarding, segurança indoor estrita por geofencing, customizador e impressor de cartões A4 econômicos com QR Code vetorial, visualização dupla em tempo real (Grade e Tabela) e drawer de detalhes da mesa.

**Architecture:** Modelagem em Appwrite com coleções `tables`, `table_sessions` e `service_calls`. QR Codes gerados com tokens criptográficos únicos e validação obrigatória de presença indoor (raio de 250m com bloqueio total de pedidos externos). Interface Server/Client Component no Next.js App Router com assinatura WebSocket via Appwrite Realtime e renderização de cartões em grid A4 para corte e refilamento.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Appwrite (`node-appwrite` e Web SDK), Zod, Tailwind CSS v4, Lucide Animated, Vitest.

**Spec:** [`docs/superpowers/specs/2026-11-02-tables-and-tabs-realtime.md`](file:///c:/Users/games/Documents/projetos/kerokero/docs/superpowers/specs/2026-11-02-tables-and-tabs-realtime.md)

## Global Constraints
- Sem Badges Desnecessárias ou Gradientes Saturados (Anti-AI Slop conforme `AGENTS.md`).
- Sem Emojis em textos de interface, labels de botões ou documentação técnica. Usar ícones SVG padronizados.
- Paleta de Cores: Fundo Branco (`#FFFFFF`), Cinzas Neutros (`#F4F4F5`, `#E4E4E7`), Preto Profundo (`#121212`) e Amarelo Âmbar (`#F59E0B`).
- Sistema 100% Indoor: Bloqueio estrito de qualquer pedido/chamado fora do raio de 250m do estabelecimento. Sem opção de pagamento remoto.
- Test-First (TDD): Escrever testes antes do código de implementação de cada módulo.

## Review Focus
1. Geração de mesas idempotente: Executar `ensureEstablishmentTables` múltiplas vezes não deve duplicar registros nem alterar tokens de mesas já existentes.
2. Bloqueio geográfico: Coordenadas distantes > 250m ou ausência de coordenadas devem rejeitar pedidos e chamados incondicionalmente.
3. Transição de status em tempo real: Evento do Appwrite Realtime em `tables` deve atualizar o estado do componente sem recarregar a página e sem perder seleções ativas.
4. Impressão A4 multi-card: Layout deve quebrar páginas corretamente sem cortar cartões ao meio (`page-break-inside: avoid`) com guias pontilhadas.
5. Deduplicação de chamados: Múltiplos chamados do mesmo tipo para a mesma mesa não devem criar entradas redundantes no painel.

---

### Task 1: Schemas, Tokens Criptográficos e Geofencing Indoor

**Files:**
- Create: `lib/schemas/table.ts`
- Create: `lib/security/table-token.ts`
- Create: `lib/security/geofence.ts`
- Test: `tests/unit/table-security.test.ts`

- [x] **Passo 1: Escrever teste unitário para segurança de tokens e geofencing**
  - Testar geração de token criptográfico aleatório (entropia mínima de 48 caracteres hex).
  - Testar cálculo da fórmula de Haversine (`isWithinIndoorRadius`): verificar distâncias dentro de 250m (válido) e além de 250m (inválido).
  - Testar validação Zod para status de mesa, customização de cartões e criação de chamados.
  - Executar: `npx vitest run tests/unit/table-security.test.ts` (deve falhar).

- [x] **Passo 2: Implementar schemas Zod em `lib/schemas/table.ts`**
  - Schemas: `tableStatusEnum`, `tableDocumentSchema`, `createTableSchema`, `serviceCallSchema`, `printConfigSchema`.

- [x] **Passo 3: Implementar gerador de tokens em `lib/security/table-token.ts`**
  - Utilizar `crypto.randomBytes(24).toString('hex')` para tokens estritamente aleatórios e não sequenciais.

- [x] **Passo 4: Implementar cálculo de geofence em `lib/security/geofence.ts`**
  - Função `calculateDistanceMeters(coord1, coord2)` usando Haversine.
  - Função `isWithinIndoorRadius(clientCoords, establishmentCoords, maxMeters = 250)`.

- [x] **Passo 5: Rodar testes e verificar aprovação**
  - Executar: `npx vitest run tests/unit/table-security.test.ts`.

---

### Task 2: Serviço Appwrite Backend para Mesas e Chamados

**Files:**
- Modify: `lib/appwrite/config.ts` (adicionar coleções `tables`, `tableSessions`, `serviceCalls`)
- Create: `lib/appwrite/tables.ts`
- Test: `tests/unit/tables-service.test.ts`

- [x] **Passo 1: Escrever testes unitários para o serviço de mesas**
  - Testar `ensureEstablishmentTables` criando de 1 a N mesas com idempotência (sem duplicar as já existentes).
  - Testar `listEstablishmentTables` ordenado por número de mesa.
  - Testar `updateTableStatus` com transição correta e timestamp.
  - Testar `resolveServiceCall` marcando status como `completed`.
  - Executar: `npx vitest run tests/unit/tables-service.test.ts` (deve falhar).

- [x] **Passo 2: Atualizar `lib/appwrite/config.ts`**
  - Adicionar as coleções `tables`, `table_sessions` e `service_calls` no objeto `appwriteConfig.collections`.

- [x] **Passo 3: Implementar `lib/appwrite/tables.ts`**
  - Tipagem `TableDocument` e `ServiceCallDocument`.
  - Métodos: `ensureEstablishmentTables`, `listEstablishmentTables`, `getTableById`, `getTableByToken`, `updateTableStatus`, `createServiceCall`, `listTableServiceCalls`, `resolveServiceCall`, `resetTableSession`.

- [x] **Passo 4: Rodar testes e verificar aprovação**
  - Executar: `npx vitest run tests/unit/tables-service.test.ts`.

---

### Task 3: Server Actions de Mesas e Atendimento

**Files:**
- Create: `actions/tables.ts`
- Test: `tests/unit/tables-actions.test.ts`

- [x] **Passo 1: Escrever testes unitários para as Server Actions**
  - Testar `syncTablesAction`: autenticação do usuário, busca do estabelecimento e sincronização.
  - Testar `resolveServiceCallAction`: resolução do chamado e atualização do status da mesa.
  - Testar `resetTableAction`: liberação da mesa para `idle`.
  - Executar: `npx vitest run tests/unit/tables-actions.test.ts` (deve falhar).

- [x] **Passo 2: Implementar `actions/tables.ts`**
  - `syncTablesAction`: garante todas as mesas do lojista.
  - `addManualTableAction`: adiciona uma nova mesa avulsa.
  - `resolveServiceCallAction`: conclui chamado pendente.
  - `resetTableAction`: limpa e libera a mesa para novos clientes.

- [x] **Passo 3: Rodar testes e verificar aprovação**
  - Executar: `npx vitest run tests/unit/tables-actions.test.ts`.

---

### Task 4: Gerador de QR Code Vetorial e Impressor A4 Multi-Card

**Files:**
- Create: `lib/utils/qrcode-svg.ts` (gerador vetorial SVG leve sem dependências externas)
- Create: `components/tables/table-card-item.tsx` (anatomia do cartão individual)
- Create: `components/tables/table-card-print-dialog.tsx` (diálogo de customização e impressão A4)
- Test: `tests/unit/qrcode-svg.test.ts`

- [x] **Passo 1: Escrever teste para o gerador de QR Code SVG**
  - Testar se a função gera uma string SVG válida com `<path>` ou `<rect>` e viewBox correto.
  - Executar: `npx vitest run tests/unit/qrcode-svg.test.ts` (deve falhar).

- [x] **Passo 2: Implementar `lib/utils/qrcode-svg.ts`**
  - Utilizar matriz QR pura ou renderização SVG com precisão vetorial sem dependência de imagem externa ou canvas pesado.

- [x] **Passo 3: Implementar `components/tables/table-card-item.tsx`**
  - Anatomia: Logo do Estabelecimento -> powered by Bempedi -> QR Code Vetorial -> Mesa XX -> Instrução ("Aponte a câmera para pedir e pagar").
  - Estilos de impressão com guias de corte pontilhadas finas.

- [x] **Passo 4: Implementar `components/tables/table-card-print-dialog.tsx`**
  - Controles: seletor de layout (6 por folha 2x3 ou 9 por folha 3x3), cor de fundo, cor de texto/acento, texto de apoio customizável.
  - Pré-visualização instantânea na tela.
  - Estilos CSS `@media print` com `@page { size: A4 portrait; margin: 8mm; }` e `page-break-inside: avoid`.
  - Botão de acionamento de impressão nativa (`window.print()`).

- [x] **Passo 5: Rodar testes e verificar aprovação**
  - Executar: `npx vitest run tests/unit/qrcode-svg.test.ts`.

---

### Task 5: Componentes da Interface de Mesas & Comandas (`/tables`)

**Files:**
- Create: `components/tables/table-card.tsx` (card individual no grid)
- Create: `components/tables/table-grid.tsx` (grade de mesas)
- Create: `components/tables/table-list.tsx` (visualização em tabela minimalista)
- Create: `components/tables/table-details-drawer.tsx` (painel lateral com chamados, pedidos e conta)
- Create: `components/tables/tables-view.tsx` (orquestrador com filtros, busca e alternância de visualização)
- Create: `app/(app)/tables/page.tsx` (Server Component com dados iniciais)

- [x] **Passo 1: Implementar `components/tables/table-card.tsx`**
  - Indicador de número da mesa e badge de status sem saturação (`idle`, `occupied`, `order_placed`, `waiter_called`, `bill_requested`, `paid_pix`).
  - Total em aberto formatado em R$.
  - Alerta de chamado pendente com motivo ("Garçom", "Maquininha").
  - Indicador de presença indoor confirmada.

- [x] **Passo 2: Implementar `components/tables/table-grid.tsx` e `components/tables/table-list.tsx`**
  - Layout responsivo em grid com animações suaves de transição.
  - Tabela densa com colunas: Mesa, Status, Chamado, Total, Ação de Atendimento e Detalhes.

- [x] **Passo 3: Implementar `components/tables/table-details-drawer.tsx`**
  - Drawer lateral (Sheet) com detalhes da mesa selecionada.
  - Lista de chamados pendentes com botão "Atender".
  - Lista de pedidos ativos da mesa.
  - Ação "Liberar Mesa".

- [x] **Passo 4: Implementar `components/tables/tables-view.tsx`**
  - Barra superior de ferramentas: barra de pesquisa, filtros rápidos por status, alternador Grade/Tabela, botão "Imprimir Cartões QR Code" e botão "Sincronizar Mesas".
  - Hook do Appwrite Realtime para escutar eventos na coleção `tables` e atualizar o estado local instantaneamente.

- [x] **Passo 5: Implementar Server Component `app/(app)/tables/page.tsx`**
  - Autenticação e busca do estabelecimento do lojista.
  - Sincronização automática inicial das mesas (`ensureEstablishmentTables`).
  - Passagem dos dados hidratados para `TablesView`.

---

### Task 6: Hook de Provisionamento Automático no Onboarding

**Files:**
- Modify: `app/onboarding/conclusao/page.tsx`
- Modify: `actions/onboarding.ts`

- [x] **Passo 1: Chamar `ensureEstablishmentTables` ao concluir o onboarding**
  - Integrar a criação em lote das mesas assim que a subconta e a assinatura forem ativadas, garantindo que o lojista já encontre todas as mesas criadas ao acessar o dashboard ou `/tables`.

- [x] **Passo 2: Rodar suíte completa de testes do projeto**
  - Executar: `npm test` para garantir que nenhuma regressão foi introduzida.

- [x] **Passo 3: Validação de Build**
  - Executar: `npm run build` para garantir integridade de compilação Next.js e TypeScript.
