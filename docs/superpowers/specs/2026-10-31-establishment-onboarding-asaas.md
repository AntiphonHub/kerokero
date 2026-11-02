# Estabelecimento Onboarding & Integração Asaas — Especificação Técnica (Spec)

## 1. Visão Geral & Objetivo

Esta especificação define a arquitetura, regras de negócio, modelagem de dados no Appwrite, integração financeira com o Asaas e fluxos de tela para a **Configuração de Estabelecimento (Onboarding do Lojista)** no KeroKero, conforme as telas 01 a 04 desenhadas no canvas do Doop (`U6knl775AK`).

A funcionalidade cumpre dois papéis financeiros fundamentais no Asaas:
1. **Cobrança de Assinatura do SaaS**: O estabelecimento deve assinar um plano pago para ter direito de uso da plataforma (não há plano gratuito). O acesso ao painel administrativo (`/dashboard`, `/mesas`, `/cardapio`, `/kds`) é estritamente bloqueado para estabelecimentos sem assinatura ativa.
2. **Criação de Subconta de Recebimento**: Abertura de subconta (white-label / split) no Asaas para que o estabelecimento receba os valores pagos pelos clientes nas mesas (PIX dinâmico e comandas) diretamente em sua conta jurídica, com retenção automática de KYC (documentos).

---

## 2. Escopo

### 2.1. O que entra no escopo (In-Scope)
- **Telas de Onboarding (01 a 04 no Doop `U6knl775AK`)**:
  - **Passo 1 — Dados da Loja**: Nome fantasia, razão social, CNPJ (com validação de dígitos verificadores), categoria comercial, telefone comercial/WhatsApp, CEP e endereço completo.
  - **Passo 2 — Operação & Mesas**: Capacidade de salão (contador de mesas ativas), modo de envio de pedidos (`direct` [Modo Ágil - KDS direto com 30s de grace period] vs. `waiter_approval` [Aprovação do Garçom]), horários e dias de funcionamento.
  - **Passo 3 — Subconta & Documentos (KYC)**: Dados do representante legal (Nome completo, CPF válido, data de nascimento), dados bancários de liquidação (banco, agência, conta corrente PJ, chave PIX), upload de documentos obrigatórios (CNH/RG do sócio e Cartão CNPJ ou Contrato Social) para o Cloudflare R2 (Object Storage S3-compatible).
  - **Passo 4 — Conclusão & Ativação / Assinatura**: Resumo consolidado do estabelecimento, status da subconta bancária (Em análise), geração e cobrança da primeira assinatura do SaaS via Asaas (PIX / Link), verificação em tempo real de ativação da assinatura.
- **Modelagem no Appwrite**:
  - Coleção `establishments` no banco `kerokero`.
  - Script idempotente de inicialização/migração da coleção e atributos.
- **Armazenamento de Arquivos no Cloudflare R2**:
  - Bucket privado no Cloudflare R2 (`kerokero-documents` / `R2_BUCKET_NAME`) para armazenamento seguro e criptografado de documentos sensíveis de KYC (CNH/RG e Cartão CNPJ).
  - Acesso restrito com URLs assinadas temporárias (Pre-signed URLs) ou upload direto via servidor.
- **Integração com Asaas API v3**:
  - Criação de `Customer` no Asaas para o dono/estabelecimento.
  - Criação de `Subscription` mensal para uso da plataforma KeroKero.
  - Criação de `Account` (Subconta bancária) no Asaas vinculada à conta mãe.
  - Configuração e endpoint de Webhook (`/api/webhooks/asaas`) com validação de token `asaas-access-token` para confirmação automática de pagamentos de assinaturas (`PAYMENT_RECEIVED`, `PAYMENT_CONFIRMED`, `PAYMENT_OVERDUE`, `PAYMENT_DELETED`).
- **Segurança & Route Gate (No Free Tier)**:
  - Proteção server-side no layout `(app)` e no `proxy.ts`: Usuário sem estabelecimento configurado é redirecionado para `/onboarding`. Usuário com estabelecimento sem assinatura ativa é direcionado para a tela de pagamento da assinatura (`/onboarding/assinatura`). O acesso às ferramentas operacionais é vedado a não-assinantes.
- **Testes Automatizados (TDD First)**:
  - Vitest cobrindo validação de schemas Zod, serviços de integração Asaas, persistência Appwrite e regras de autorização/gate de assinatura.

### 2.2. O que fica de fora (Out-of-Scope)
- Geração física de PDFs de plaquinhas de QR Code para mesa (escopo do módulo de Mesas).
- Edição contínua de configurações avançadas após o onboarding (feita no módulo de Configurações da Loja `/configuracoes`).
- Gateway de pagamento alternativo (ex: Stripe ou Mercado Pago) — Asaas é a solução exclusiva para o mercado brasileiro.
- Módulo de KDS e Cardápio (desenvolvidos em specs subsequentes).

---

## 3. Arquitetura de Dados & Appwrite

### 3.1. Coleção `establishments`
Banco de dados: `kerokero` | Coleção: `establishments`

| Atributo | Tipo | Tamanho / Regra | Descrição |
|---|---|---|---|
| `userId` | string | 255 (Index / Required) | ID do usuário proprietário no Appwrite Auth |
| `name` | string | 255 (Required) | Nome fantasia do estabelecimento |
| `legalName` | string | 255 (Required) | Razão social oficial da empresa |
| `cnpj` | string | 14 (Index / Required) | CNPJ limpo (apenas 14 dígitos numéricos) |
| `category` | string | 64 (Required) | Ex: `hamburgueria`, `bar`, `restaurante`, `pizzaria`, `cafeteria` |
| `phone` | string | 32 (Required) | Telefone comercial com DDD (limpo) |
| `postalCode` | string | 8 (Required) | CEP limpo (8 dígitos) |
| `address` | string | 255 (Required) | Logradouro, número e complemento |
| `tablesCount` | integer | min: 1, max: 200 | Quantidade inicial de mesas configuradas |
| `orderMode` | string | 32 (Required) | `'direct'` (Modo Ágil) ou `'waiter_approval'` |
| `openingDays` | string | 128 (Required) | Array serializado em JSON (ex: `["ter","qua","qui","sex","sab","dom"]`) |
| `openingTime` | string | 5 (Required) | Horário de abertura (ex: `18:00`) |
| `closingTime` | string | 5 (Required) | Horário de fechamento (ex: `23:30`) |
| `repName` | string | 255 (Required) | Nome do sócio administrador |
| `repCpf` | string | 11 (Required) | CPF do sócio (11 dígitos limpos) |
| `repBirthDate` | string | 10 (Required) | Data de nascimento (`YYYY-MM-DD`) |
| `bankCode` | string | 10 (Required) | Código da instituição (ex: `341`, `237`) |
| `bankPixKey` | string | 255 (Required) | Chave PIX cadastrada para liquidação |
| `bankAgency` | string | 10 (Required) | Agência bancária |
| `bankAccount` | string | 20 (Required) | Conta corrente com dígito |
| `docIdKey` | string | 255 (Nullable) | Chave/Path do documento CNH/RG no Cloudflare R2 |
| `docCnpjKey` | string | 255 (Nullable) | Chave/Path do Cartão CNPJ no Cloudflare R2 |
| `asaasCustomerId` | string | 255 (Index / Nullable) | ID do Customer na conta mãe do Asaas |
| `asaasSubscriptionId` | string | 255 (Index / Nullable) | ID da Assinatura ativa no Asaas |
| `subscriptionStatus` | string | 32 (Default: `pending`) | `'pending'` \| `'active'` \| `'overdue'` \| `'canceled'` |
| `asaasSubaccountId` | string | 255 (Index / Nullable) | ID da conta filha (subconta) no Asaas (`act_xxx`) |
| `asaasWalletId` | string | 255 (Nullable) | Wallet ID da subconta para splits de comanda |
| `asaasSubaccountApiKey` | string | 255 (Nullable) | API Key gerada para a subconta (se aplicável) |
| `subaccountStatus` | string | 32 (Default: `under_analysis`) | `'pending_documents'` \| `'under_analysis'` \| `'approved'` \| `'rejected'` |
| `onboardingStep` | integer | min: 1, max: 4 | Etapa atual do onboarding do lojista |
| `onboardingCompleted` | boolean | Default: false | Indica se completou todos os passos |

### 3.2. Armazenamento de Arquivos no Cloudflare R2
- **Protocolo**: S3-Compatible via AWS SDK v3 (`@aws-sdk/client-s3`).
- **Endpoint**: `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`.
- **Bucket**: `R2_BUCKET_NAME` (ex: `kerokero-documents`).
- **Política de Acesso & Privacidade**:
  - O bucket é estritamente **privado**.
  - Documentos sensíveis de KYC (CNH, RG, Contrato Social) nunca ficam abertos para a internet.
  - O upload é realizado via Server Action / Backend seguro diretamente para o R2 ou via pre-signed URL temporária com expiração curta.
  - A leitura para envio ao KYC do Asaas ou visualização administrativa é feita por stream autenticado no servidor ou pre-signed GET URL temporária (15 min).
- **Convenção de Chaves (Keys)**:
  - Documento do Sócio: `establishments/{establishmentId}/kyc/doc-id-{timestamp}.{ext}`
  - Documento da Empresa: `establishments/{establishmentId}/kyc/doc-cnpj-{timestamp}.{ext}`
- **Tamanho Máximo por Arquivo**: 10 MB.
- **Extensões Permitidas**: `.pdf`, `.png`, `.jpg`, `.jpeg`.

---

## 4. Arquitetura da Integração Asaas

### 4.1. Configurações de Ambiente
```env
ASAAS_API_URL=https://sandbox.asaas.com/api/v3   # ou https://api.asaas.com/api/v3 em prod
ASAAS_API_KEY=$aact_...                        # Chave mestre KeroKero
ASAAS_WEBHOOK_TOKEN=kerokero_wh_secret_...     # Token configurado no webhook do Asaas
ASAAS_SUBSCRIPTION_VALUE=149.00                # Valor mensal da assinatura KeroKero
```

### 4.2. Módulo de Assinatura (SaaS Billing)
1. **Criação do Cliente (Customer)**:
   - Endpoint: `POST /api/v3/customers`
   - Payload: Razão social, CNPJ, telefone, e-mail do usuário, endereço.
   - Retorna: `cus_xxx`.
2. **Criação da Assinatura (Subscription)**:
   - Endpoint: `POST /api/v3/subscriptions`
   - Payload:
     ```json
     {
       "customer": "cus_xxx",
       "billingType": "PIX",
       "value": 149.00,
       "nextDueDate": "YYYY-MM-DD",
       "cycle": "MONTHLY",
       "description": "Assinatura KeroKero - Mensalidade de Acesso à Plataforma"
     }
     ```
   - Retorna: `sub_xxx`.
3. **Obtenção do PIX da Primeira Parcela**:
   - Asaas gera a cobrança da primeira parcela associada à assinatura.
   - Endpoint: `GET /api/v3/payments?subscription=sub_xxx` → `GET /api/v3/payments/{paymentId}/pixQrCode`
   - Retorna o `encodedImage` (Base64 do QR Code) e o `payload` (Chave Copia-e-Cola).

### 4.3. Módulo de Subcontas (Recebimento de Comandas)
1. **Criação da Subconta**:
   - Endpoint: `POST /api/v3/accounts`
   - Payload:
     ```json
     {
       "name": "Kero Burguer Alimentos LTDA",
       "email": "contato@keroburguer.com",
       "cpfCnpj": "48192837000192",
       "companyType": "LIMITED",
       "phone": "11987654321",
       "mobilePhone": "11987654321",
       "address": "Rua Bela Cintra",
       "addressNumber": "1240",
       "postalCode": "01414001"
     }
     ```
   - Retorna: `id` (`act_xxx`), `walletId`, `apiKey`.
2. **Configuração de Conta Bancária de Liquidação**:
   - Vinculação dos dados da conta corrente informada no Passo 3 (`/api/v3/bankAccounts` com o contexto da subconta).
3. **Upload de Documentos KYC**:
   - Envio de documento do sócio (CNH/RG) e contrato social para o endpoint de KYC do Asaas.

### 4.4. Webhook de Pagamento (`/api/webhooks/asaas`)
- **Segurança**:
  - Verifica cabeçalho HTTP `asaas-access-token` estritamente contra `ASAAS_WEBHOOK_TOKEN`.
  - Rejeita qualquer requisição sem token válido com HTTP `401 Unauthorized`.
- **Eventos Monitorados**:
  - `PAYMENT_CONFIRMED` ou `PAYMENT_RECEIVED`:
    - Localiza o estabelecimento pelo `asaasSubscriptionId` ou `asaasCustomerId`.
    - Atualiza `subscriptionStatus = 'active'`.
  - `PAYMENT_OVERDUE`:
    - Atualiza `subscriptionStatus = 'overdue'`.
  - `PAYMENT_DELETED`:
    - Atualiza `subscriptionStatus = 'canceled'`.
- **Idempotência**:
  - Registra o `id` da notificação processada para evitar reprocessamento ou conflito de concorrência.

---

## 5. Fluxo de Onboarding (Telas 01 a 04 - Doop `U6knl775AK`)

```mermaid
flowchart TD
    Login[Usuário autenticado no KeroKero] --> CheckEst{Possui Estabelecimento?}
    CheckEst -- Não --> Step1[Onboarding 01: Dados da Loja]
    CheckEst -- Sim --> StepCheck{onboardingCompleted?}
    
    Step1 -->|Salvar e Continuar| Step2[Onboarding 02: Operação & Mesas]
    Step2 -->|Salvar e Continuar| Step3[Onboarding 03: Subconta Bancária & KYC]
    Step3 -->|Enviar & Finalizar| CreateAsaas[Backend: Cria Subconta + Customer + Assinatura no Asaas]
    CreateAsaas --> Step4[Onboarding 04: Conclusão & Pagamento PIX]
    
    StepCheck -- Não --> Resume[Retoma no onboardingStep correto]
    StepCheck -- Sim --> SubActive{Assinatura Ativa?}
    
    SubActive -- Sim --> Dashboard[/dashboard do Lojista]
    SubActive -- Não --> PayScreen[Tela de Pagamento da Assinatura]
    
    Step4 --> PayPIX[Lojista realiza pagamento PIX da Assinatura]
    PayPIX --> AsaasWH[Webhook Asaas: PAYMENT_CONFIRMED]
    AsaasWH --> MarkActive[subscriptionStatus = active]
    MarkActive --> Dashboard
```

### Detalhamento das Etapas:
1. **Onboarding 01 - Dados da Loja**:
   - Validações Zod: CNPJ válido (14 dígitos com validação matemática), telefone válido, nome fantasia obrigatório, razão social obrigatória, CEP de 8 dígitos.
   - Salva documento preliminar no Appwrite com `onboardingStep = 2`.
2. **Onboarding 02 - Operação & Mesas**:
   - Salva quantidade de mesas (1 a 200), modo de pedido (`direct` / `waiter_approval`), dias da semana selecionados e horários de funcionamento.
   - Atualiza para `onboardingStep = 3`.
3. **Onboarding 03 - Subconta & Documentos**:
   - Validações Zod: CPF do sócio (validação matemática), data de nascimento válida, dados bancários (banco, agência, conta, chave PIX).
   - Upload de arquivos para o Appwrite Storage.
   - Chamada atômica de criação de subconta Asaas e Customer.
   - Atualiza para `onboardingStep = 4`.
4. **Onboarding 04 - Conclusão & Ativação (com Cobrança PIX)**:
   - Exibe resumo dos dados configurados.
   - Exibe status da subconta (Em análise).
   - Apresenta o QR Code PIX e chave Copia-e-Cola da mensalidade KeroKero.
   - Polling / Realtime aguardando a confirmação do pagamento.
   - Quando o status vira `active`, habilita o botão para acessar o painel (`/dashboard`).

---

## 6. Pontos Críticos & Casos de Borda

1. **CNPJ ou CPF Inválidos**:
   - Não confiar apenas no formato regex. Validação algorítmica real (módulo 11) no backend.
2. **Falha na Chamada da API do Asaas**:
   - Se a criação da subconta ou assinatura falhar no Asaas (ex: instabilidade ou timeout), o backend não deve corromper os dados no Appwrite; deve retornar erro amigável ao usuário permitindo reexecutar a ação de forma idempotente.
3. **Pagamento Duplicado ou Webhook Fora de Ordem**:
   - Validação rigorosa de idempotência no webhook. Um evento `PAYMENT_CREATED` não deve sobrescrever um `PAYMENT_CONFIRMED` anterior.
4. **Tentativa de Pular Etapas**:
   - O usuário não pode acessar diretamente `/onboarding/subconta` sem ter completado o Passo 1 e o Passo 2. O servidor valida `onboardingStep` e redireciona para a etapa correta.
5. **Tentativa de Acessar o Dashboard sem Pagar**:
   - Usuário autenticado que tente digitar `/dashboard` diretamente no navegador é interceptado pelo layout e pelo `proxy.ts`, sendo redirecionado para a tela de quitação da assinatura.

---

## 7. Impacto de Performance & Segurança

### 7.1. Performance
- **Queries Otimizadas**: Busca do estabelecimento por `userId` indexado.
- **Cache de Sessão**: Validação de sessão e estabelecimento em Server Components rápidos, sem overheads desnecessários.
- **Payloads Leves**: Armazenamento de arquivos no Storage e apenas IDs de arquivo no documento do banco de dados.

### 7.2. Segurança
- **Zero Confiança no Frontend**: Todas as regras de negócio, cálculos, chamadas ao Asaas e updates de status de pagamento são executados estritamente em Server Actions / Route Handlers no Next.js com chaves secretas nunca expostas no cliente.
- **Assinatura do Webhook**: Rejeição imediata de webhooks sem o token de acesso pré-compartilhado.
- **Isolamento de Tenant**: Um usuário autenticado só pode consultar e editar o estabelecimento cujo `userId` pertença estritamente à sua sessão de autenticação.

---

## 8. Estrutura de Arquivos Proposta

```
kerokero/
├── actions/
│   └── onboarding.ts           # Server Actions para passos 1, 2, 3 e verificação
├── app/
│   ├── (app)/
│   │   ├── layout.tsx          # Atualizado para validar subscriptionStatus === 'active'
│   │   └── dashboard/page.tsx
│   ├── (onboarding)/
│   │   ├── layout.tsx          # Layout limpo do onboarding com Brand e Stepper
│   │   ├── page.tsx            # Redireciona para o step atual
│   │   ├── loja/page.tsx       # Passo 1: Dados da Loja
│   │   ├── operacao/page.tsx   # Passo 2: Operação & Mesas
│   │   ├── subconta/page.tsx   # Passo 3: Subconta Bancária & KYC
│   │   └── conclusao/page.tsx  # Passo 4: Conclusão & Ativação / Pagamento PIX
│   └── api/
│       └── webhooks/
│           └── asaas/
│               └── route.ts    # Webhook seguro do Asaas com validação de token
├── components/
│   ├── onboarding/
│   │   ├── onboarding-stepper.tsx
│   │   ├── step-loja-form.tsx
│   │   ├── step-operacao-form.tsx
│   │   ├── step-subconta-form.tsx
│   │   └── step-conclusao-box.tsx
│   └── ui/
│       ├── counter-input.tsx
│       └── file-upload.tsx
├── lib/
│   ├── asaas/
│   │   ├── client.ts           # Cliente HTTP Asaas configurável
│   │   ├── customers.ts        # Criação e consulta de clientes
│   │   ├── subscriptions.ts    # Criação e consulta de assinaturas e PIX
│   │   ├── subaccounts.ts      # Criação de subcontas bancárias e KYC
│   │   └── webhook.ts          # Parser e validador de eventos de webhook
│   ├── appwrite/
│   │   └── establishments.ts   # Queries e updates do estabelecimento
│   ├── r2/
│   │   ├── client.ts           # Cliente S3/R2 com credenciais Cloudflare
│   │   └── storage.ts          # Upload e download de documentos KYC no R2
│   ├── schemas/
│   │   └── onboarding.ts       # Schemas Zod com validação rigorosa de CNPJ e CPF
│   └── validators/
│       ├── cnpj.ts             # Validador de dígitos verificadores de CNPJ
│       └── cpf.ts              # Validador de dígitos verificadores de CPF
├── scripts/
│   └── init-establishments.mjs # Script para criar coleção e atributos no Appwrite
└── tests/
    ├── unit/
    │   ├── validators.test.ts  # Testes de CPF e CNPJ
    │   ├── schemas.test.ts     # Testes de schemas Zod do onboarding
    │   ├── asaas.test.ts       # Testes do cliente e serviços Asaas
    │   ├── webhook.test.ts     # Testes de autenticação e parsing do webhook
    │   └── access-gate.test.ts # Testes de trava de acesso e sem plano gratuito
```
