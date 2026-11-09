# Especificação Técnica: Período de Testes de 7 Dias (Free Trial) & Paywall Operacional

**Data**: 2026-11-08  
**Status**: Aprovado para Implementação  
**Módulo**: Onboarding, Controle de Acesso (`access-gate`), Assinatura & Carteira (`/wallet`)

---

## 1. Visão Geral & Justificativa de Negócio
Atualmente, o onboarding exige que o estabelecimento pague a primeira mensalidade de R$ 149,00 via PIX imediatamente na tela de conclusão (`/onboarding/conclusao`), antes mesmo de cadastrar produtos, configurar mesas ou testar a operação. Isso cria uma barreira de entrada alta e atrito de conversão.

A presente especificação define a transição para um modelo **Free Trial de 7 Dias Sem Cartão**:
1. O lojista conclui o onboarding (dados da loja, operação e criação da subconta Asaas para receber vendas) e é liberado imediatamente para o Dashboard no status `'trialing'`.
2. Durante 7 dias, tem acesso irrestrito a todas as funcionalidades do sistema (cardápio, mesas, KDS, garçom, vendas via PIX na mesa).
3. Um aviso sutil no topo da interface informa os dias restantes de teste com um atalho para ativar a assinatura definitiva.
4. Ao final dos 7 dias, caso não tenha efetuado o pagamento da mensalidade, o sistema ativa um **Paywall Cirúrgico**:
   - As funcionalidades operacionais (novos pedidos, mesas, KDS, cardápio) são bloqueadas.
   - A rota de **Carteira & Saques (`/wallet`) permanece 100% acessível**, garantindo que o lojista possa transferir qualquer saldo de vendas remanescente para sua conta bancária sem qualquer retenção ou congelamento de valores.

---

## 2. Objetivo & Escopo

### 2.1. O que entra no escopo
1. **Atributos de Trial no Estabelecimento (`establishments`)**:
   - `subscriptionStatus`: passa a suportar `'trialing'` além de `'active'`, `'pending'`, `'canceled'`, `'past_due'`.
   - `trialStartDate`: timestamp ISO da ativação do onboarding.
   - `trialEndsAt`: timestamp ISO do término do período de 7 dias (`now + 7 dias`).
2. **Onboarding Descomplicado**:
   - Ao finalizar o Passo 3 (subconta e documentação), o status da assinatura é definido como `'trialing'`, calculando `trialStartDate` e `trialEndsAt`.
   - Redirecionamento direto para o `/dashboard` (ou `/onboarding/conclusao` simplificada como boas-vindas com botão de entrar no app).
3. **Controle de Acesso Centralizado (`lib/auth/access-gate.ts`)**:
   - Validação em memória de expiração do trial: se `subscriptionStatus === 'trialing'` e `Date.now() <= Date.parse(trialEndsAt)`, acesso total permitido.
   - Se o trial expirou (`Date.now() > Date.parse(trialEndsAt)`):
     - Bloqueio de rotas operacionais (`/dashboard`, `/menu`, `/tables`, `/kds`, `/orders`, etc.) redirecionando para a tela de regularização / paywall (`/onboarding/conclusao` ou `/assinatura`).
     - **Liberação irrestrita** da rota `/wallet` e da Server Action de saque (`/actions/wallet`), permitindo a consulta de saldo e transferências bancárias via PIX.
4. **Proteção da Experiência do Cliente na Mesa (`/mesa/[token]`)**:
   - Caso o trial do estabelecimento esteja expirado e o cliente tente abrir comanda ou enviar pedido, exibe aviso limpo: *"Atendimento temporariamente indisponível no momento"*, impedindo pedidos fantasmas.
5. **Banner Discreto de Trial no Painel (`(app)` Layout)**:
   - Banner não obstrusivo com os dias restantes de teste e link rápido para regularizar a assinatura.
6. **Tela de Paywall / Conclusão**:
   - Exibição do QR Code e chave Copia e Cola do PIX gerado via Asaas.
   - Link secundário explícito: *"Precisa resgatar saldo de vendas? Acessar Carteira & Saques"*.
   - Ao confirmar o pagamento via webhook do Asaas, o status é alterado para `'active'`, liberando o painel em tempo real.

### 2.2. O que fica de fora
- Cobrança em cartão de crédito ou débito automático (o sistema opera via PIX dinâmico com webhook).
- Qualquer mecanismo de retenção forçada ou taxa sobre o saldo da subconta no cancelamento/expiração do trial.

---

## 3. Pontos Críticos & Casos de Borda

1. **Manipulação de Relógio pelo Cliente**:
   - A verificação de `trialEndsAt` é feita exclusivamente no servidor Next.js em Server Components e Server Actions com base no relógio do backend, impedindo que alterações no relógio local do navegador burlem o prazo.
2. **Lojista com Saldo Acumulado no 8º Dia**:
   - Mesmo com o trial vencido, o lojista consegue autenticar, acessar a rota `/wallet`, visualizar seu saldo e disparar a transferência PIX para a chave bancária cadastrada.
3. **Transição Instantânea no Pagamento do PIX**:
   - Quando o lojista paga a mensalidade via PIX, o webhook Asaas (`PAYMENT_RECEIVED`) atualiza `subscriptionStatus = 'active'`. O polling ou evento de revalidação desbloqueia o sistema imediatamente sem requerer recadastro.
4. **Estabelecimento Criado Antes da Mudança**:
   - Se um estabelecimento antigo não tiver `trialEndsAt` mas estiver `'active'`, o acesso continua garantido sem interrupções.

---

## 4. Impacto de Performance & Segurança

- **Zero Sobrecarga de Rede**: A validação da data do trial não realiza novas consultas ao banco de dados; ela utiliza os campos já presentes no documento `establishment` retornado na sessão do Next.js.
- **Segurança de Permissões**: Nenhuma rota de manipulação de pedidos ou mesas é acessível se o trial estiver vencido.
- **Compliance Bancário**: Total conformidade com as diretrizes do Banco Central para arranjos de pagamento — os fundos transacionados nas mesas pertencem à subconta do estabelecimento e permanecem sacáveis.

