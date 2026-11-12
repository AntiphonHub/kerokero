# Spec Técnica: E-mail de Boas-Vindas no Primeiro Pagamento da Assinatura

**Data:** 2026-11-12  
**Escopo:** Ativação de assinatura Bempedi (onboarding e pós-trial gratuito de 7 dias)  
**Padrão:** `AGENTS.md` (Simplicidade Primeiro, Security First, Spec-First, TDD, Anti-AI Slop)

---

## 1. Objetivo & Escopo

### Objetivo
Enviar automaticamente um e-mail comemorativo, parabenizando o lojista e oferecendo canal completo de suporte, **exclusivamente no primeiro pagamento confirmado** da assinatura Bempedi (seja ainda durante o onboarding/trial ou após os 7 dias gratuitos). Pagamentos mensais subsequentes ou reativações após inadimplência de ciclos posteriores **não** devem disparar esse e-mail novamente.

### Dentro do Escopo
1. **Orquestração unificada de ativação** (`activateSubscriptionAndNotify` em `lib/subscriptions/activation.ts`), chamada nos três pontos onde a assinatura passa a `'active'`:
   - Webhook do Asaas (`app/api/webhooks/asaas/route.ts`) em `PAYMENT_CONFIRMED` e `PAYMENT_RECEIVED`;
   - Conciliação ativa em `checkSubscriptionStatusAction` (`actions/onboarding.ts`);
   - Conciliação SSR em `app/onboarding/conclusao/page.tsx`.
2. **Garantia de envio único (Primeiro Pagamento Apenas)**:
   - Ignora se `previousStatus === 'active'` (renovações normais e webhooks repetidos);
   - Verifica `user.prefs.firstSubscriptionEmailSentAt` no Appwrite Users (impede reenvio mesmo em caso de `overdue -> active` em ciclos futuros ou disputa entre webhook e polling);
   - Consulta pagamentos da assinatura no Asaas (`getAsaasSubscriptionPayments`): se houver `>= 2` pagamentos com status `RECEIVED` ou `CONFIRMED`, não trata como primeiro pagamento e não envia.
3. **Envio de E-mail via Resend sem Dependências Extras (`lib/email/send-email.ts`)**:
   - Usa a API REST do **Resend** (`POST https://api.resend.com/emails` via `fetch` nativo com `Idempotency-Key` e `tags`) quando `RESEND_API_KEY` estiver configurada;
   - Se `RESEND_API_KEY` não estiver configurada ou a API retornar erro, registra aviso em log e **nunca** bloqueia ou falha a ativação da assinatura ou o retorno HTTP `200` do webhook Asaas.
4. **Template HTML Temático (`lib/email/subscription-welcome-template.ts`)**:
   - Segue rigorosamente a identidade Bempedi (`#FFFFFF`, `#F4F4F5`, `#E4E4E7`, `#121212`, `#F59E0B`), logo `https://bempedi.com/images/logo.png`, sem emojis, sem gradientes saturados e sem `<script>`.
   - Escapa campos interpolados (`ownerName`, `establishmentName`) para prevenir HTML injection.

### Fora do Escopo
- E-mails recorrentes de cobrança, recibo mensal ou lembretes de vencimento do trial.
- Alteração obrigatória no schema da collection `establishments` no Appwrite (a marcação persistente usa `user.prefs`, já existente em `actions/auth.ts`).

---

## 2. Pontos Críticos & Casos de Borda

| Caso de Borda | Comportamento Esperado |
| :--- | :--- |
| Asaas envia `PAYMENT_CONFIRMED` e depois `PAYMENT_RECEIVED` para a mesma fatura | O primeiro evento atualiza `subscriptionStatus` para `'active'`, envia o e-mail e grava `firstSubscriptionEmailSentAt` em `user.prefs`. O segundo vê `previousStatus === 'active'` e ignora o envio. |
| Webhook Asaas e polling (`checkSubscriptionStatusAction`) rodam simultaneamente | Trava em memória (`inFlightSubscriptions`) por `subscriptionId` serializa/deduplica execuções concorrentes no mesmo processo, além da checagem em `user.prefs` e Resend `Idempotency-Key`. |
| Lojista fica inadimplente no mês 2 (`overdue`) e paga depois (`overdue -> active`) | `user.prefs.firstSubscriptionEmailSentAt` já está preenchido e a contagem de pagamentos pagos no Asaas é `>= 2`. Status volta para `'active'` sem reenviar o e-mail de boas-vindas. |
| `RESEND_API_KEY` ausente e Appwrite Messaging sem provider configurado | A assinatura é ativada normalmente como `'active'`; o envio retorna `{ sent: false }` com log explícito de aviso sem retornar erro `500` para o Asaas. |
| Nome do lojista ou restaurante contém `<`, `>`, `&` ou aspas | `escapeHtml` sanitiza os valores antes da interpolação no HTML. |
| Estabelecimento já estava `'active'` antes da implantação e renova no próximo mês | `previousStatus === 'active'` bloqueia imediatamente o envio sem sequer consultar o Asaas ou enviar e-mail. |

---

## 3. Impacto de Performance

- **Renovações mensais (`previousStatus === 'active'`)**: apenas 1 leitura e 1 atualização no Appwrite (`updateSubscriptionStatus` / lookup por `asaasSubscriptionId`), zero chamadas extras ao Asaas ou provedores de e-mail.
- **Conciliação no onboarding/conclusão**: recebe `preloadedPayments` já buscados pela tela/action para evitar uma segunda chamada HTTP ao Asaas.
- **Primeiro pagamento**: no máximo 1 leitura de usuário (`users.get`), 1 chamada condicional ao Asaas (quando não pré-carregada), 1 envio HTTP para Resend/Appwrite Messaging e 1 `users.updatePrefs`.
- **Zero impacto de bundle client-side**: todo o código reside exclusivamente em módulos server-only (`lib/email`, `lib/subscriptions`, `actions`, `app/api/webhooks`).

---

## 4. Segurança & Permissões

- **Server-only**: envio usa exclusivamente `createAdminClient()` (`APPWRITE_API_KEY`) ou `process.env.RESEND_API_KEY` no backend; nenhuma credencial é exposta ao client.
- **Webhook Asaas**: continua protegido por `verifyWebhookToken` (`asaas-access-token` === `ASAAS_WEBHOOK_TOKEN`).
- **Prevenção de HTML/XSS em E-mail**: sanitização HTML estrita em `ownerName` e `establishmentName`.
- **Integridade de Dados**: erro no envio de e-mail é isolado em `try/catch` para impedir que o Asaas considere o webhook falho e fique reenviando indefinidamente após a assinatura já estar `'active'`.
