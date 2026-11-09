# Plano de Implementação: Período de Testes de 7 Dias (Free Trial) & Paywall Operacional

**Data**: 2026-11-08  
**Spec de Referência**: `docs/superpowers/specs/2026-11-08-free-trial-7-days-paywall.md`

---

## Tarefa 1: Tipagem & Modelagem de Dados
- **Arquivo**: `lib/appwrite/establishments.ts`
- **Modificações**:
  - Adicionar campos opcionais `trialStartDate?: string` e `trialEndsAt?: string` na interface `EstablishmentDocument`.
  - Atualizar a função `saveSubaccountAndActivate` para aceitar `trialStartDate`, `trialEndsAt` e status `'trialing'`.

---

## Tarefa 2: Atualização do `access-gate.ts` & Testes TDD
- **Arquivos**:
  - `lib/auth/access-gate.ts`
  - `tests/unit/access-gate.test.ts`
- **Modificações**:
  - Permitir a passagem de `now?: number` (ou usar `Date.now()`) no `evaluateUserAccess` para facilitar testes determinísticos de tempo.
  - Se `establishment.subscriptionStatus === 'trialing'`:
    - Se `trialEndsAt` for válido e `currentTime <= Date.parse(trialEndsAt)`: acesso liberado (`allowed: true`).
    - Se `currentTime > Date.parse(trialEndsAt)`:
      - Se a rota for `/wallet` (ou iniciar com `/wallet`): permitir acesso (`allowed: true, redirectTo: null`).
      - Caso contrário: redirecionar para `/onboarding/conclusao`.
  - Se `establishment.subscriptionStatus === 'past_due'` ou `'canceled'`:
    - Se a rota for `/wallet`: permitir acesso (`allowed: true`).
  - Escrever suíte de testes unitários em `tests/unit/access-gate.test.ts` validando todos os cenários de trial ativo, trial expirado e liberação de `/wallet`.

---

## Tarefa 3: Onboarding com Ativação Automática do Trial
- **Arquivo**: `actions/onboarding.ts`
- **Modificações**:
  - Na conclusão do Passo 3 (`submitSubaccountAction`), gravar:
    - `subscriptionStatus: 'trialing'`
    - `trialStartDate: new Date().toISOString()`
    - `trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()`
  - O próximo passo redireciona o lojista diretamente para `/dashboard` (com boas-vindas do trial).

---

## Tarefa 4: Layout `(app)` & Banner de Trial
- **Arquivos**:
  - `app/(app)/layout.tsx`
  - `components/trial-banner.tsx`
- **Modificações**:
  - Passar o `pathname` dinâmico ou rota correspondente no `evaluateUserAccess`.
  - Adicionar o componente `TrialBanner` no topo do layout do painel quando `subscriptionStatus === 'trialing'`.
  - Calcular os dias restantes: `Math.max(1, Math.ceil((trialEndsAt - now) / (1000 * 60 * 60 * 24)))`.
  - Exibir texto conciso e elegante: "Período de teste gratuito: restam X dias. [Ativar Assinatura]".

---

## Tarefa 5: Tela de Paywall / Conclusão com Acesso a Saque
- **Arquivos**:
  - `components/onboarding/step-conclusao-box.tsx`
  - `app/onboarding/conclusao/page.tsx`
- **Modificações**:
  - Adicionar link visível para `/wallet`: "Precisa resgatar seu saldo de vendas das mesas? Acessar Carteira & Saques".
  - Mensagem contextual se o trial estiver expirado.

---

## Tarefa 6: Verificação & Testes de Regressão
- Rodar `npm run test` e garantir 100% de aprovação.

