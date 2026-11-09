# Plano de Implementação: Verificação Dinâmica de Documentos Asaas (KYC) & Onboarding Ágil

**Data**: 2026-11-08  
**Spec de Referência**: `docs/superpowers/specs/2026-11-08-asaas-dynamic-kyc-documents.md`

---

## Tarefa 1: Tipagem & Módulo de Documentos Asaas
- **Arquivos**:
  - `lib/asaas/types.ts`
  - `lib/asaas/documents.ts`
  - `tests/unit/asaas-documents.test.ts`
- **Ações**:
  - Definir interfaces `AsaasDocumentGroup`, `AsaasDocumentFile`.
  - Implementar `getMyAccountDocuments(subaccountApiKey: string): Promise<AsaasDocumentGroup[]>`.
  - Implementar `getMyAccountOnboardingUrl(subaccountApiKey: string): Promise<string | null>`.
  - Criar testes unitários mockando o endpoint `GET /v3/myAccount/documents`.

---

## Tarefa 2: Simplificação do Schema & Action de Onboarding
- **Arquivos**:
  - `lib/schemas/onboarding.ts`
  - `actions/onboarding.ts`
  - `tests/unit/onboarding-actions.test.ts`
- **Ações**:
  - Atualizar `subaccountSchema` tornando `docIdKey` e `docCnpjKey` opcionais.
  - Atualizar `submitSubaccountAction` para não exigir o envio obrigatório de arquivos binários no Passo 3.
  - Adaptar os testes de `onboarding-actions.test.ts` para refletir o schema atualizado.

---

## Tarefa 3: Atualização do Formulário do Passo 3
- **Arquivo**: `components/onboarding/step-subconta-form.tsx`
- **Ações**:
  - Remover inputs de arquivo estático (`docId`, `docCnpj`).
  - Adicionar card discreto informando que a verificação de identidade e biometria será realizada pelo link oficial do Asaas na Carteira para liberação de saques.
  - Manter coleta de dados do responsável e dados bancários para abertura da subconta.

---

## Tarefa 4: Integração de KYC no Módulo de Carteira (`/wallet`)
- **Arquivos**:
  - `actions/wallet.ts`
  - `components/wallet/wallet-view.tsx`
- **Ações**:
  - Adicionar `onboardingUrl?: string | null` em `WalletData` retornado por `getWalletDataAction()`.
  - Na Server Action `getWalletDataAction`, chamar `getMyAccountOnboardingUrl(subaccountApiKey)` se `subaccountStatus !== 'approved'`.
  - No `WalletView`, exibir um card limpo de KYC quando `subaccountStatus !== 'approved'`:
    - Explicação: *"Validação de Identidade Pendente: complete o processo de biometria e envio de documentos no Asaas para liberar saques e transferências."*
    - Botão em destaque com link externo seguro (`onboardingUrl`).

---

## Tarefa 5: Verificação & Testes de Regressão
- Rodar `npm run test` e verificar 100% de aprovação.
- Rodar `npx tsc --noEmit` para validação de tipos.

