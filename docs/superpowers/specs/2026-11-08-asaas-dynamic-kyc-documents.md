# Especificação Técnica: Verificação Dinâmica de Documentos Asaas (KYC) & Onboarding Ágil

**Data**: 2026-11-08  
**Status**: Aprovado para Implementação  
**Módulo**: Onboarding, Asaas Integration, Carteira & Saques (`/wallet`)

---

## 1. Visão Geral & Problema Identificado

### 1.1. Cenário Anterior
No Passo 3 do Onboarding (`/onboarding/subconta`), o sistema exigia o envio obrigatório de dois arquivos genéricos (CNH/RG e Cartão CNPJ) armazenados apenas em bucket S3/R2 interno. No entanto:
1. A API v3 do Asaas **não recebe documentos no endpoint `POST /v3/accounts`**.
2. Cada tipo de empresa (MEI, LTDA, Individual) tem requisitos de KYC distintos determinados dinamicamente pelo Asaas após consulta automática à Receita Federal.
3. Para conformidade com o Banco Central e proteção antifraude, o Asaas exige validação biométrica (selfie com prova de vida) e envio de documentos através de uma URL dedicada de onboarding (`onboardingUrl`) retornada por `GET /v3/myAccount/documents`.
4. Exigir o upload prévio e cego de arquivos estáticos no onboarding aumentava o atrito de entrada do lojista sem cumprir a validação real exigida pela instituição bancária.

### 1.2. Nova Abordagem (Onboarding Ágil + KYC Dinâmico Asaas)
1. **Onboarding Ágil (Passo 3)**:
   - Coleta apenas os dados essenciais para abertura da subconta no Asaas: Responsável legal (Nome, CPF, Data de Nascimento) e Dados Bancários (Chave PIX, Banco, Agência, Conta).
   - Remoção da obrigatoriedade de upload de arquivos estáticos no passo inicial.
   - Criação da subconta no Asaas (`POST /v3/accounts`) e ativação imediata do período de 7 dias de teste gratuito (`trialing`).
2. **Consulta Dinâmica de Documentos Asaas (`GET /v3/myAccount/documents`)**:
   - Criação do serviço `lib/asaas/documents.ts` para consultar a lista oficial de pendências da subconta diretamente na API do Asaas.
   - Obtenção da `onboardingUrl` oficial do Asaas (fluxo de selfie e documentos hospedado com segurança pelo Asaas).
3. **Módulo de Carteira & Saques (`/wallet`) com Status Real**:
   - Quando a subconta estiver com pendências ou em análise, exibe um card de conformidade com o botão: *"Completar Verificação de Identidade no Asaas"*, abrindo a `onboardingUrl`.
   - Histórico e status claro do processo de validação da subconta (`approved`, `under_analysis`, `pending_documents`).

---

## 2. Objetivo & Escopo

### 2.1. O que entra no escopo
1. **Atualização do Schema de Onboarding (`lib/schemas/onboarding.ts`)**:
   - Tornar `docIdKey` e `docCnpjKey` opcionais na submissão de subconta.
2. **Atualização do Formulário de Onboarding (`components/onboarding/step-subconta-form.tsx`)**:
   - Remover os campos de upload forçado de arquivo do Passo 3.
   - Adicionar aviso informativo claro: *"A verificação de identidade (selfie e documentos) poderá ser realizada no painel da Carteira para liberação de saques."*
3. **Novo Módulo Asaas: `lib/asaas/documents.ts`**:
   - `getMyAccountDocuments(subaccountApiKey: string)`: `GET /v3/myAccount/documents`.
   - `getMyAccountOnboardingUrl(subaccountApiKey: string)`: recupera a URL do fluxo de onboarding oficial retornado pelo Asaas.
4. **Action de Carteira (`actions/wallet.ts`)**:
   - Adicionar `onboardingUrl?: string | null` e lista de pendências no retorno de `getWalletDataAction()`.
5. **Card de KYC na Carteira (`components/wallet/wallet-view.tsx`)**:
   - Exibir alerta informativo com botão para acessar a `onboardingUrl` do Asaas quando a conta estiver pendente de validação.
6. **Webhook Asaas (`app/api/webhooks/asaas/route.ts`)**:
   - Suporte ao evento de atualização de status da subconta para atualizar `subaccountStatus` no Appwrite.

### 2.2. O que fica de fora
- Criação de interface própria de captura de biometria facial com câmera (utiliza o fluxo oficial regulamentado pelo Asaas via `onboardingUrl`).

---

## 3. Pontos Críticos & Casos de Borda

1. **Tempo de Resposta da Receita Federal no Asaas**:
   - O Asaas pode levar alguns segundos após a criação da conta para disponibilizar os documentos ou a `onboardingUrl`. O backend deve tratar gracefully caso a lista retorne vazia temporariamente.
2. **Segurança da Chave da Subconta**:
   - A chamada para `GET /v3/myAccount/documents` deve ser executada exclusivamente no servidor utilizando a chave de subconta decifrada em memória efêmera.
3. **Operação das Mesas vs Saques**:
   - As vendas via PIX na mesa funcionam assim que a subconta é criada (o cliente consegue pagar). A verificação de documentos/selfie é exigida para a **transferência/saque externo** dos fundos para a conta bancária do lojista.

---

## 4. Impacto de Performance & Segurança

- **Zero Uploads Desnecessários**: Elimina tráfego inútil de buffers de PDF de 10 MB no servidor para arquivos que o Asaas não consome diretamente no onboarding.
- **Auditoria & Compliance**: O lojista é autenticado biometricamente pelo motor oficial antifraude do Asaas, garantindo conformidade com a regulamentação do Bacen.

