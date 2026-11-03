# PWA do Cliente: Mesa, Pedidos Individuais e Pagamento PIX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir o Progressive Web App (PWA) mobile-first do consumidor final (`/m/[token]`), permitindo validação estrita de presença por geolocalização indoor (<= 250m), abertura de comanda guest por apelido, múltiplos participantes na mesma mesa com carrinhos individuais, acompanhamento consolidado em tempo real e fechamento flexível via PIX dinâmico (Asaas) creditado 100% na subconta do restaurante.

**Architecture:** Next.js App Router com Server Actions e Cookies HttpOnly assinados para sessão segura de participantes sem expor permissões de escrita pública; Appwrite Database (coleções `tables`, `table_sessions`, `orders`, `service_calls`) com Appwrite Realtime para sincronização instantânea; Gateway Asaas para geração de cobranças PIX dinâmicas diretas na subconta do estabelecimento com validação de CPF no checkout e conciliação por polling/webhook.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Appwrite (`node-appwrite` + Web SDK Realtime), Asaas API v3, Zod, Vitest.

**Spec:** [`docs/superpowers/specs/2026-11-03-client-pwa-orders-pix.md`](file:///c:/Users/games/Documents/projetos/kerokero/docs/superpowers/specs/2026-11-03-client-pwa-orders-pix.md)

## Global Constraints
- Clean, minimalista e sem AI slop: sem emojis em botões/títulos, sem badges cosméticas, paleta neutra com destaque âmbar (`#F59E0B`).
- 100% Mobile First: projetado e otimizado para telas verticais de smartphones com botões confortáveis ao toque (min 44px) e navegação por abas.
- Segurança e Geofencing estrito: rejeição no backend de qualquer solicitação fora do raio indoor de 250m em produção.
- Zero comissão: pagamentos PIX direcionados 100% para a subconta do estabelecimento.
- TDD Rigoroso: testes unitários escritos e falhando antes da implementação de cada módulo.

## Review Focus
1. **Recusa ou indisponibilidade de GPS**: cliente deve ser contido no Gate de geolocalização com orientações passo a passo claras sem poder acessar cardápio ou enviar pedidos.
2. **Dois participantes com o mesmo apelido na mesma mesa**: segundo participante recebe automaticamente sufixo identificador (ex: "Carlos (2)").
3. **Tentativa de pagar valor superior ao saldo restante**: o modal de pagamento recalcula e trava no saldo restante real da mesa se outro participante tiver acabado de pagar parte da conta.
4. **Envio concorrente de pedidos por múltiplos participantes**: persistência em documentos individuais na coleção `orders` para garantir que nenhum pedido seja sobrescrito.
5. **Recarregar a página (F5) no PWA**: sessão do participante é restaurada via cookie seguro, mantendo-o conectado diretamente à mesa e ao seu histórico.

---

### Task 1: Client Session Token & Participant Security
**Files:**
- Create: `lib/security/client-session.ts`
- Create: `lib/schemas/client-session.ts`
- Test: `tests/unit/client-session.test.ts`

**Interfaces:**
- Produces:
  - `generateParticipantToken(payload: ParticipantSessionPayload): Promise<string>`
  - `verifyParticipantToken(token: string): Promise<ParticipantSessionPayload | null>`
  - `clientSessionSchema: z.ZodSchema<ParticipantSessionPayload>`

- [ ] **Step 1: Write the failing test**
Cria teste unitário em `tests/unit/client-session.test.ts` cobrindo geração de token, validação com payload íntegro, rejeição de token adulterado ou expirado, e schema Zod.

- [ ] **Step 2: Run test to verify it fails**
Run: `npx vitest run tests/unit/client-session.test.ts`
Expected: FAIL (módulo não encontrado)

- [ ] **Step 3: Implement `lib/schemas/client-session.ts` and `lib/security/client-session.ts`**
Implementa assinatura criptográfica baseada em HMAC-SHA256 utilizando chave de sessão do servidor, encapsulando `participantId`, `participantName`, `sessionId`, `tableId`, `establishmentId`.

- [ ] **Step 4: Run test to verify it passes**
Run: `npx vitest run tests/unit/client-session.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add lib/security/client-session.ts lib/schemas/client-session.ts tests/unit/client-session.test.ts
git commit -m "feat(security): add signed participant session token and schemas"
```

---

### Task 2: Client Session Service & Appwrite Data Layer
**Files:**
- Create: `lib/appwrite/client-sessions.ts`
- Create: `lib/appwrite/orders.ts`
- Test: `tests/unit/client-sessions-service.test.ts`
- Test: `tests/unit/orders-service.test.ts`

**Interfaces:**
- Consumes: `lib/security/client-session.ts`, `lib/appwrite/tables.ts`
- Produces:
  - `joinTableSession(establishmentId: string, tableId: string, tableNumber: number, nickname: string): Promise<{ session: TableSessionDocument, participantId: string, participantName: string }>`
  - `createOrder(orderData: CreateOrderInput): Promise<OrderDocument>`
  - `listSessionOrders(sessionId: string): Promise<OrderDocument[]>`
  - `settleParticipantPayment(sessionId: string, participantId: string, amountCents: number): Promise<TableSessionDocument>`

- [ ] **Step 1: Write the failing tests**
Cria testes unitários mockando Appwrite Databases para criação/ingresso de participantes com deduplicação de apelido ("Carlos" -> "Carlos (2)"), criação de pedidos isolados e liquidação de participantes.

- [ ] **Step 2: Run test to verify it fails**
Run: `npx vitest run tests/unit/client-sessions-service.test.ts tests/unit/orders-service.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement `lib/appwrite/client-sessions.ts` and `lib/appwrite/orders.ts`**
Implementa criação e atualização de sessões de mesa com participantes, atomicidade na inserção de pedidos individuais na coleção `orders`, e recálculo do total da comanda da mesa.

- [ ] **Step 4: Run test to verify it passes**
Run: `npx vitest run tests/unit/client-sessions-service.test.ts tests/unit/orders-service.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add lib/appwrite/client-sessions.ts lib/appwrite/orders.ts tests/unit/client-sessions-service.test.ts tests/unit/orders-service.test.ts
git commit -m "feat(db): implement client table sessions and individual orders service"
```

---

### Task 3: Asaas PIX Payment Service on Merchant Subaccount
**Files:**
- Create: `lib/asaas/pix.ts`
- Test: `tests/unit/asaas-pix.test.ts`

**Interfaces:**
- Consumes: `lib/asaas/client.ts`, `lib/asaas/types.ts`
- Produces:
  - `createPixPaymentOnSubaccount(subaccountApiKey: string, data: { customerName: string, customerCpf: string, value: number, description: string }): Promise<{ paymentId: string, pixQrCodeBase64: string, pixCopyPaste: string, expirationDate: string }>`
  - `checkSubaccountPaymentStatus(subaccountApiKey: string, paymentId: string): Promise<{ status: string, isPaid: boolean }>`

- [ ] **Step 1: Write the failing test**
Cria testes unitários para geração de cobrança PIX na subconta, decodificação do QR Code Asaas, e verificação de status `RECEIVED` / `CONFIRMED`.

- [ ] **Step 2: Run test to verify it fails**
Run: `npx vitest run tests/unit/asaas-pix.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement `lib/asaas/pix.ts`**
Implementa chamada direta à API do Asaas usando a API Key da subconta do restaurante para criar cliente nominal com CPF, emitir cobrança PIX com 15 minutos de validade e obter o payload do QR Code.

- [ ] **Step 4: Run test to verify it passes**
Run: `npx vitest run tests/unit/asaas-pix.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add lib/asaas/pix.ts tests/unit/asaas-pix.test.ts
git commit -m "feat(asaas): add direct subaccount pix payments and status polling"
```

---

### Task 4: Client Server Actions (Gate, Order & Checkout)
**Files:**
- Create: `actions/client.ts`
- Test: `tests/unit/client-actions.test.ts`

**Interfaces:**
- Consumes: `lib/security/geofence.ts`, `lib/security/client-session.ts`, `lib/appwrite/client-sessions.ts`, `lib/appwrite/orders.ts`, `lib/asaas/pix.ts`
- Produces:
  - `validateClientLocation(token: string, clientCoords: Coordinates): Promise<ActionResult>`
  - `joinTable(token: string, nickname: string, clientCoords?: Coordinates): Promise<ActionResult>`
  - `submitOrderAction(items: CartItemInput[]): Promise<ActionResult>`
  - `callWaiterAction(reason: string): Promise<ActionResult>`
  - `requestPixCheckoutAction(mode: 'my_items' | 'split' | 'total', payerCpf: string): Promise<ActionResult>`
  - `pollPixStatusAction(paymentId: string): Promise<ActionResult>`

- [ ] **Step 1: Write the failing test**
Cria testes unitários mockando cookies de request/response e testando rejeição fora do raio indoor, registro de apelido, envio de pedidos associados ao participante e emissão de PIX com CPF válido.

- [ ] **Step 2: Run test to verify it fails**
Run: `npx vitest run tests/unit/client-actions.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement `actions/client.ts`**
Implementa Server Actions com tratamento de cookies HttpOnly (`kerokero_participant`), validações Zod e retorno com padrão `ActionResult<{ ... }>`.

- [ ] **Step 4: Run test to verify it passes**
Run: `npx vitest run tests/unit/client-actions.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add actions/client.ts tests/unit/client-actions.test.ts
git commit -m "feat(actions): implement client pwa server actions for geofence, orders and pix"
```

---

### Task 5: Client Cart Store (Mobile Reativo)
**Files:**
- Create: `lib/store/cart-store.ts`
- Test: `tests/unit/cart-store.test.ts`

**Interfaces:**
- Produces:
  - `useCartStore`: Hook com `items`, `addItem`, `removeItem`, `updateQuantity`, `clearCart`, `cartTotalCents`

- [ ] **Step 1: Write the failing test**
Testa adição de item com opções/observações, soma correta de preços em centavos, incremento de quantidade e limpeza de carrinho.

- [ ] **Step 2: Run test to verify it fails**
Run: `npx vitest run tests/unit/cart-store.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement `lib/store/cart-store.ts`**
Implementa store reativo com persistência em `sessionStorage` isolado por mesa.

- [ ] **Step 4: Run test to verify it passes**
Run: `npx vitest run tests/unit/cart-store.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add lib/store/cart-store.ts tests/unit/cart-store.test.ts
git commit -m "feat(cart): implement reactive client cart store"
```

---

### Task 6: PWA Route & Gate Screens (Location & Nickname)
**Files:**
- Create: `app/m/[token]/page.tsx`
- Create: `app/m/[token]/layout.tsx`
- Create: `components/client/gate-location.tsx`
- Create: `components/client/gate-nickname.tsx`
- Create: `components/client/pwa-shell.tsx`

**Interfaces:**
- Consumes: `actions/client.ts`

- [ ] **Step 1: Implement PWA shell with standalone mobile meta tags**
Cria layout otimizado para mobile com viewport anti-zoom, sem AI slop, suporte a PWA manifest e cores neutras.

- [ ] **Step 2: Implement Gate de Geolocalização (`components/client/gate-location.tsx`)**
Exibe tela de solicitação de permissão de GPS com feedback claro de erro, estado de carregamento e botão para autorizar.

- [ ] **Step 3: Implement Gate de Apelido (`components/client/gate-nickname.tsx`)**
Exibe campo simples para o cliente digitar o apelido ("Como podemos te chamar na mesa?"), validando comprimento e disparando a Server Action de ingresso.

- [ ] **Step 4: Test gate components rendering and validation**
Verifica no teste unitário o comportamento dos gates diante de coordenadas válidas e inválidas.

- [ ] **Step 5: Commit**
```bash
git add app/m/[token]/ components/client/gate-location.tsx components/client/gate-nickname.tsx components/client/pwa-shell.tsx
git commit -m "feat(client-pwa): build mobile gates for indoor geolocation and guest nickname"
```

---

### Task 7: Digital Menu & Product Ordering UI
**Files:**
- Create: `components/client/menu-view.tsx`
- Create: `components/client/product-modal.tsx`
- Create: `components/client/cart-bottom-bar.tsx`
- Create: `components/client/cart-sheet.tsx`

**Interfaces:**
- Consumes: `lib/store/cart-store.ts`, `actions/client.ts`

- [ ] **Step 1: Implement `components/client/menu-view.tsx`**
Exibe categorias e lista de produtos com layout responsivo mobile-first, preços formatados e busca rápida.

- [ ] **Step 2: Implement `components/client/product-modal.tsx`**
Sheet deslizante inferior para selecionar adicionais, quantidade e campo de observações ("sem cebola").

- [ ] **Step 3: Implement `components/client/cart-bottom-bar.tsx` & `cart-sheet.tsx`**
Barra fixa inferior indicando quantidade de itens e subtotal, abrindo a comanda prévia do carrinho com botão "Enviar Pedido para a Cozinha".

- [ ] **Step 4: Verification**
Executa os testes unitários da aplicação para validar ausência de regressões.
Run: `npm test`

- [ ] **Step 5: Commit**
```bash
git add components/client/menu-view.tsx components/client/product-modal.tsx components/client/cart-bottom-bar.tsx components/client/cart-sheet.tsx
git commit -m "feat(client-menu): build digital menu, product customization modal and cart sheet"
```

---

### Task 8: Shared Table Tab, Quick Services & Realtime Sync
**Files:**
- Create: `components/client/tab-view.tsx`
- Create: `components/client/service-buttons.tsx`
- Create: `components/client/realtime-listener.tsx`

**Interfaces:**
- Consumes: `actions/client.ts`, Appwrite Web SDK client para Realtime

- [ ] **Step 1: Implement `components/client/tab-view.tsx`**
Cria abas alternáveis "Meus Itens" e "Mesa Completa", destacando o status de preparo dos pedidos e o subtotal por participante e geral.

- [ ] **Step 2: Implement `components/client/service-buttons.tsx`**
Botões de serviço flutuantes discretos para "Chamar Garçom" (seleção de motivo rápido) e "Pedir Maquininha".

- [ ] **Step 3: Implement `components/client/realtime-listener.tsx`**
Subscrição em tempo real aos eventos da mesa e pedidos no Appwrite para atualizar a comanda automaticamente quando outros clientes pedem itens.

- [ ] **Step 4: Verification**
Run: `npm test`

- [ ] **Step 5: Commit**
```bash
git add components/client/tab-view.tsx components/client/service-buttons.tsx components/client/realtime-listener.tsx
git commit -m "feat(client-tab): build shared table view, quick services and realtime updates"
```

---

### Task 9: PIX Checkout Modal, Polling & Settled Receipt Screen
**Files:**
- Create: `components/client/pix-modal.tsx`
- Create: `components/client/receipt-view.tsx`

**Interfaces:**
- Consumes: `actions/client.ts`

- [ ] **Step 1: Implement `components/client/pix-modal.tsx`**
Modal de fechamento com seleção da modalidade ("Meus Itens", "Dividir", "Total"), campo de CPF com validação, geração e exibição do QR Code PIX com botão de copiar chave e timer de 15 minutos.

- [ ] **Step 2: Implement polling de liquidação no PWA**
Loop de polling a cada 3 segundos via Server Action enquanto o modal estiver aberto, disparando transição automática assim que o Asaas acusar quitação.

- [ ] **Step 3: Implement `components/client/receipt-view.tsx`**
Tela de confirmação com comprovante, agradecimento, limpeza do cookie do participante e indicação de como entrar novamente se desejar.

- [ ] **Step 4: Verification**
Run: `npm test`

- [ ] **Step 5: Commit**
```bash
git add components/client/pix-modal.tsx components/client/receipt-view.tsx
git commit -m "feat(client-pix): build pix checkout modal, polling reconciler and receipt screen"
```

---

### Task 10: End-to-End Integration Verification & Smoke Test
**Files:**
- Create: `tests/unit/client-pwa-flow.test.ts`

- [ ] **Step 1: Write integration flow test**
Testa a sequência completa em teste automatizado:
1. Validação de token e geolocalização.
2. Ingresso do participante "Carlos".
3. Envio de pedido na coleção `orders`.
4. Ingresso do segundo participante "Ana".
5. Geração e polling do pagamento PIX nominal com CPF.
6. Liquidação e encerramento de sessão.

- [ ] **Step 2: Run test to verify it passes**
Run: `npx vitest run tests/unit/client-pwa-flow.test.ts`
Expected: PASS

- [ ] **Step 3: Run full test suite**
Run: `npm test`
Expected: 100% PASS

- [ ] **Step 4: Commit**
```bash
git add tests/unit/client-pwa-flow.test.ts
git commit -m "test(client-pwa): verify end-to-end client pwa order and payment lifecycle"
```
