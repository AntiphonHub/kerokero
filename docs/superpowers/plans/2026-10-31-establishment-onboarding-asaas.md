# Onboarding de Estabelecimento & Integração Asaas — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar o fluxo completo de onboarding de estabelecimento (telas 01 a 04 do Doop), modelagem no Appwrite, criação de subconta bancária e cobrança de assinatura via Asaas, com trava de acesso ao painel exclusiva para assinantes ativos (sem planos gratuitos).

**Architecture:** Next.js App Router (Server Actions e Route Handlers), Appwrite Databases para persistência de dados de estabelecimento, Cloudflare R2 (S3-compatible Object Storage privado) para armazenamento de documentos KYC, integração direta com Asaas v3 (Subscriptions e Subaccounts), e validação de permissões no layout do App Router para garantir barreira de assinatura ativa.

**Tech Stack:** Next.js 16.4, React 19, TypeScript, Zod, Vitest, Appwrite (`node-appwrite`), Cloudflare R2 (`@aws-sdk/client-s3`), Asaas API v3, Tailwind CSS v4.

**Spec:** `docs/superpowers/specs/2026-10-31-establishment-onboarding-asaas.md`

## Global Constraints
- Sem AI Slop: Sem badges desnecessárias, sem gradientes saturados, sem emojis, textos objetivos.
- Paleta: Branco (`#FFFFFF`), Cinzas (`#F4F4F5`, `#E4E4E7`), Preto (`#121212`), Âmbar (`#F59E0B`).
- TDD Rigoroso: Nenhum código de produção deve ser escrito antes de um teste unitário falhar.
- Zero confiança no frontend: Validação completa no backend com Zod e chamadas restritas ao servidor.
- Gate de assinatura: Estabelecimentos só acessam `/dashboard` se `subscriptionStatus === 'active'` e `onboardingCompleted === true`.

## Review Focus
1. Validação de CNPJ e CPF falsos ou com dígitos verificadores incorretos deve falhar estritamente no backend.
2. Webhooks do Asaas sem o token secreto `asaas-access-token` ou com token divergente devem retornar 401 imediatamente.
3. Tentativa de acessar `/dashboard` ou pular passos sem ter finalizado o onboarding ou sem assinatura ativa deve redirecionar forçadamente para a etapa devida.
4. Falha na API do Asaas durante o cadastro da subconta ou assinatura não deve corromper o banco nem travar o fluxo em estado inconsistente.
5. Idempotência em eventos de webhook duplicados para evitar processamento redundante.

---

### Task 1: Configuração do Vitest e Validadores Algorítmicos (CNPJ e CPF)

**Files:**
- Create: `vitest.config.ts`
- Create: `lib/validators/cnpj.ts`
- Create: `lib/validators/cpf.ts`
- Test: `tests/unit/validators.test.ts`
- Modify: `package.json`

- [ ] **Step 1.1**: Adicionar dependência do Vitest no `package.json` e criar `vitest.config.ts`.
- [ ] **Step 1.2**: Escrever teste unitário `tests/unit/validators.test.ts` testando validação de CNPJ e CPF (válidos, dígitos verificadores inválidos, tamanhos incorretos, sequências repetidas como 111.111.111-11).
- [ ] **Step 1.3**: Executar os testes e confirmar que falham (RED).
- [ ] **Step 1.4**: Implementar funções em `lib/validators/cnpj.ts` e `lib/validators/cpf.ts` com validação matemática dos dígitos verificadores (Módulo 11).
- [ ] **Step 1.5**: Executar os testes e confirmar que passam (GREEN).

---

### Task 2: Schemas Zod de Onboarding (Passos 1, 2 e 3)

**Files:**
- Create: `lib/schemas/onboarding.ts`
- Test: `tests/unit/schemas.test.ts`

- [ ] **Step 2.1**: Escrever testes unitários em `tests/unit/schemas.test.ts` para os schemas:
  - `storeDataSchema` (Passo 1: nome fantasia, razão social, CNPJ com validador, categoria, telefone, CEP, endereço).
  - `operationSchema` (Passo 2: tablesCount [1..200], orderMode ['direct', 'waiter_approval'], openingDays, openingTime, closingTime).
  - `subaccountSchema` (Passo 3: repName, repCpf com validador, repBirthDate, bankCode, bankPixKey, bankAgency, bankAccount).
- [ ] **Step 2.2**: Executar os testes e verificar falha (RED).
- [ ] **Step 2.3**: Implementar os schemas em `lib/schemas/onboarding.ts` usando Zod integrado aos validadores de CNPJ e CPF.
- [ ] **Step 2.4**: Executar os testes e verificar que passam com 100% de cobertura dos casos de sucesso e erro (GREEN).

---

### Task 3: Cliente e Serviços Asaas (Customer, Assinaturas, Subcontas e Webhook)

**Files:**
- Create: `lib/asaas/types.ts`
- Create: `lib/asaas/client.ts`
- Create: `lib/asaas/customers.ts`
- Create: `lib/asaas/subscriptions.ts`
- Create: `lib/asaas/subaccounts.ts`
- Create: `lib/asaas/webhook.ts`
- Test: `tests/unit/asaas.test.ts`
- Test: `tests/unit/webhook.test.ts`

- [ ] **Step 3.1**: Escrever testes para os módulos Asaas em `tests/unit/asaas.test.ts` e `tests/unit/webhook.test.ts` mockando requisições HTTP:
  - Criação de cliente (`createAsaasCustomer`).
  - Criação de assinatura mensal e obtenção do PIX da primeira fatura (`createAsaasSubscription`, `getAsaasSubscriptionPix`).
  - Criação de subconta bancária (`createAsaasSubaccount`).
  - Validação de token de segurança do webhook e parsing de eventos (`verifyWebhookToken`, `parseWebhookEvent`).
- [ ] **Step 3.2**: Executar os testes e confirmar falha (RED).
- [ ] **Step 3.3**: Implementar os tipos e o cliente HTTP base em `lib/asaas/types.ts` e `lib/asaas/client.ts`.
- [ ] **Step 3.4**: Implementar `lib/asaas/customers.ts`, `lib/asaas/subscriptions.ts`, `lib/asaas/subaccounts.ts` e `lib/asaas/webhook.ts`.
- [ ] **Step 3.5**: Executar os testes e verificar que passam (GREEN).

---

### Task 4: Persistência no Appwrite e Armazenamento no Cloudflare R2

**Files:**
- Create: `lib/r2/client.ts`
- Create: `lib/r2/storage.ts`
- Create: `scripts/init-establishments.mjs`
- Create: `lib/appwrite/establishments.ts`
- Modify: `lib/appwrite/config.ts`
- Test: `tests/unit/establishments-service.test.ts`
- Test: `tests/unit/r2-storage.test.ts`

- [ ] **Step 4.1**: Escrever testes unitários em `tests/unit/r2-storage.test.ts` para upload e geração de chaves/paths seguros no Cloudflare R2 (`uploadKycDocument`, `generateKycKey`).
- [ ] **Step 4.2**: Escrever testes unitários em `tests/unit/establishments-service.test.ts` testando as operações do repositório:
  - `getEstablishmentByUserId`
  - `saveStoreDataStep` (criação/atualização do Passo 1)
  - `saveOperationStep` (atualização do Passo 2)
  - `saveSubaccountAndActivate` (atualização do Passo 3, dados bancários, chaves do R2 `docIdKey`/`docCnpjKey` e status Asaas)
  - `updateSubscriptionStatus` (ativar/desativar com base no webhook)
- [ ] **Step 4.3**: Executar os testes e verificar falha (RED).
- [ ] **Step 4.4**: Implementar cliente R2 em `lib/r2/client.ts` e serviço de upload em `lib/r2/storage.ts` usando `@aws-sdk/client-s3`.
- [ ] **Step 4.5**: Atualizar `lib/appwrite/config.ts` com a nova referência de coleção `establishments`.
- [ ] **Step 4.6**: Implementar `lib/appwrite/establishments.ts` com queries e updates usando `node-appwrite`.
- [ ] **Step 4.7**: Implementar o script `scripts/init-establishments.mjs` para criar a coleção e atributos `docIdKey`, `docCnpjKey` no Appwrite.
- [ ] **Step 4.8**: Executar os testes e verificar que passam (GREEN).

---

### Task 5: Webhook Endpoint do Asaas e Trava de Acesso ao Painel (No Free Tier)

**Files:**
- Create: `app/api/webhooks/asaas/route.ts`
- Modify: `app/(app)/layout.tsx`
- Modify: `proxy.ts`
- Test: `tests/unit/access-gate.test.ts`

- [ ] **Step 5.1**: Escrever testes para a regra de acesso (Access Gate) em `tests/unit/access-gate.test.ts`:
  - Usuário sem estabelecimento é redirecionado para `/onboarding`.
  - Usuário em onboarding incompleto é redirecionado para seu `onboardingStep`.
  - Usuário com onboarding concluído mas `subscriptionStatus !== 'active'` é redirecionado para a tela de quitação da assinatura.
  - Usuário com `subscriptionStatus === 'active'` tem acesso liberado ao painel.
- [ ] **Step 5.2**: Executar os testes e verificar falha (RED).
- [ ] **Step 5.3**: Implementar o endpoint de Webhook em `app/api/webhooks/asaas/route.ts` validando o token e atualizando o status do estabelecimento.
- [ ] **Step 5.4**: Implementar a verificação rigorosa no layout `app/(app)/layout.tsx` e `proxy.ts`.
- [ ] **Step 5.5**: Executar os testes e garantir que passam (GREEN).

---

### Task 6: Server Actions de Onboarding

**Files:**
- Create: `actions/onboarding.ts`
- Test: `tests/unit/onboarding-actions.test.ts`

- [ ] **Step 6.1**: Escrever testes unitários para as Server Actions:
  - `submitStoreDataAction` (valida dados do Passo 1 e persiste).
  - `submitOperationAction` (valida dados do Passo 2 e persiste).
  - `submitSubaccountAction` (valida dados do Passo 3, chama Asaas para criar subconta e assinatura, persiste no Appwrite).
  - `checkSubscriptionStatusAction` (consulta status atualizado da assinatura).
- [ ] **Step 6.2**: Executar os testes e verificar falha (RED).
- [ ] **Step 6.3**: Implementar `actions/onboarding.ts`.
- [ ] **Step 6.4**: Executar os testes e verificar que passam (GREEN).

---

### Task 7: Telas e Componentes de Onboarding (Doop `U6knl775AK`)

**Files:**
- Create: `app/(onboarding)/layout.tsx`
- Create: `app/(onboarding)/page.tsx`
- Create: `app/(onboarding)/loja/page.tsx`
- Create: `app/(onboarding)/operacao/page.tsx`
- Create: `app/(onboarding)/subconta/page.tsx`
- Create: `app/(onboarding)/conclusao/page.tsx`
- Create: `components/onboarding/onboarding-stepper.tsx`
- Create: `components/onboarding/step-loja-form.tsx`
- Create: `components/onboarding/step-operacao-form.tsx`
- Create: `components/onboarding/step-subconta-form.tsx`
- Create: `components/onboarding/step-conclusao-box.tsx`
- Create: `components/ui/counter-input.tsx`

- [ ] **Step 7.1**: Criar layout compartilhado do Onboarding (`app/(onboarding)/layout.tsx`) com navegação superior, logo KeroKero e container centralizado fiel ao Doop.
- [ ] **Step 7.2**: Criar componente `OnboardingStepper` com os passos 1 (Dados da Loja), 2 (Operação & Mesas) e 3 (Subconta Bancária), com estado ativo e completado.
- [ ] **Step 7.3**: Implementar tela e formulário do **Passo 1 (Dados da Loja)** (`app/(onboarding)/loja/page.tsx` e `step-loja-form.tsx`) com campos e máscaras fiéis ao Doop frame `u8q2UX8Uoe`.
- [ ] **Step 7.4**: Implementar tela e formulário do **Passo 2 (Operação & Mesas)** (`app/(onboarding)/operacao/page.tsx` e `step-operacao-form.tsx`) com contador de mesas, cards de seleção de modo (`Envio Direto` vs `Aprovação do Garçom`) e grade de dias e horários fiéis ao Doop frame `D6ASuNyY0n`.
- [ ] **Step 7.5**: Implementar tela e formulário do **Passo 3 (Subconta & Documentos)** (`app/(onboarding)/subconta/page.tsx` e `step-subconta-form.tsx`) com dados bancários, representante legal e upload de arquivos KYC fiéis ao Doop frame `lxaGRptgUb`.
- [ ] **Step 7.6**: Implementar tela do **Passo 4 (Conclusão & Ativação / Pagamento)** (`app/(onboarding)/conclusao/page.tsx` e `step-conclusao-box.tsx`) exibindo o resumo cadastral, status da subconta e cobrança PIX da assinatura KeroKero com verificação em tempo real fiéis ao Doop frame `Sr8w-BN-fG`.
- [ ] **Step 7.7**: Implementar redirecionamento automático na rota raiz de onboarding (`app/(onboarding)/page.tsx`) com base no `onboardingStep` atual do usuário.

---

### Task 8: Execução da Migração no Appwrite e Verificação Ponta a Ponta

- [ ] **Step 8.1**: Rodar o script de migração do Appwrite (`node scripts/init-establishments.mjs`) para criar a coleção `establishments` e seus atributos.
- [ ] **Step 8.2**: Rodar a suíte completa de testes unitários com Vitest (`npm test` ou `npx vitest run`) garantindo 100% de sucesso.
- [ ] **Step 8.3**: Testar build do Next.js (`npm run build`) para assegurar conformidade total de tipos TypeScript e integridade do App Router.
