# Especificação Técnica: Central de Configurações do Lojista (`/settings`)

**Data**: 2026-11-05  
**Status**: Aprovado  
**Módulo**: Painel Administrativo / Configurações (`/settings`)

---

## 1. Visão Geral & Intenção (The Why)

A rota `/settings` é a central administrativa de governança e controle do restaurante no KeroKero. Ela concentra as configurações operacionais, capacidade física do salão, segurança de acesso, gestão da assinatura SaaS e ações críticas de encerramento da conta.

A interface adota o modelo modular de **Abas Temáticas**, permitindo que o lojista altere parâmetros específicos com clareza e foco, sem risco de acionar comandos sensíveis por engano.

---

## 2. Metas, Não-Metas e Anti-Metas

### Metas (Goals)
- **Navegação por Abas**:
  1. **Geral da Loja (`store`)**: Dados cadastrais (nome, telefone/WhatsApp de contato, endereço/cidade) e horários de funcionamento semanais (dias de abertura, horário de funcionamento e Happy Hour).
  2. **Mesas & Salão (`tables`)**: Ajuste dinâmico de capacidade de mesas (aumento e redução seguros com validação de comandas em andamento).
  3. **Segurança & Perfil (`security`)**: Troca de senha do titular com verificação da senha atual e confirmação.
  4. **Plano & Assinatura (`subscription`)**: Status da assinatura no Asaas, periodicidade, próximo vencimento e cancelamento do plano recorrente.
  5. **Zona de Perigo (`danger`)**: Exclusão de conta e estabelecimento com cancelamento automático do Asaas e confirmação digitando o nome exato da loja.
- **Validação Rigorosa (Security First)**:
  - Validação Zod estrita em todos os formulários.
  - Verificação de sessão e permissão via `getLoggedInUser` e `getEstablishmentByUserId`.
  - Trava de segurança no salão: impedimento de redução de mesas com comandas em andamento (`status !== 'idle'`).
- **Identidade Visual KeroKero**:
  - Abas ativas com fundo âmbar e texto branco (`bg-amber-500 text-white`).
  - Sem badges desnecessárias ou emojis.

### Não-Metas (Non-Goals)
- Não altera taxas do Asaas (configuradas na conta de pagamentos).
- Não permite alterar o CPF/CNPJ raiz do titular após o credenciamento bancário concluído (exige re-onboarding).

### Anti-Metas (Anti-Goals)
- **Zero AI Slop**: Sem badges excessivas, sem gradientes saturados, zero emojis em labels ou mensagens.
- **Zero Inconsistência Contábil ou Cobrança Fantasma**: Ao excluir a conta, a assinatura no Asaas é obrigatoriamente cancelada na API externa para evitar cobranças futuras.

---

## 3. Decisões do Construtor (Builder's Calls)

1. **Cancelamento de Assinatura & Acesso**:
   - Ao cancelar no Asaas (`DELETE /subscriptions/{id}`), as cobranças futuras são canceladas. O status passa para `canceled`, mas o `access-gate.ts` permite acesso normal a `/settings` e à consulta dos dados até o término do ciclo já pago.
2. **Exclusão de Conta (Zona de Perigo)**:
   - Trava de segurança: bloqueia a exclusão se houver mesas com comandas ativas no salão.
   - Orquestração: cancela a assinatura recorrente no Asaas, marca `establishment.isActive: false`, encerra as sessões no Appwrite e desloga o usuário.
3. **Ciclo de Mesas (Aumento & Redução)**:
   - Na redução (ex: 15 para 12): verifica se as mesas 13..15 estão `idle`. Se sim, marca `isActive: false` e atualiza `tablesCount: 12`.
   - No aumento (ex: 12 para 15): se a mesa já existir inativa, reativa com `isActive: true`. Se não existir, cria com token seguro. A listagem de `/tables` exibe as mesas ativas (`isActive !== false`).
4. **Horários da Loja (Aba `store`)**:
   - Reutiliza o modelo testado e consolidado do onboarding e utilitário `lib/utils/operating-hours.ts` (`openingDays`, `openingTime`, `closingTime`, `happyHourEnabled`, `happyHourStart`, `happyHourEnd`, `happyHourDays`).

---

## 4. Arquitetura Técnica & Especificação de Módulos

### 4.1. Server Actions (`actions/settings.ts`)
- `updateStoreSettingsAction(input)`: atualiza dados cadastrais e horários na coleção `establishments`.
- `updateTablesCapacityAction(newCount)`: valida se mesas excedentes estão livres, atualiza status `isActive` e ajusta `tablesCount`.
- `updatePasswordAction(currentPassword, newPassword, confirmPassword)`: valida senha atual e atualiza a senha no Appwrite.
- `cancelSubscriptionAction()`: cancela subscrição no Asaas via API e atualiza status no banco.
- `deleteAccountAction(confirmationName)`: valida nome digitado, cancela Asaas, desativa estabelecimento e remove sessão.

### 4.2. Componentes UI (`components/settings/`)
1. `settings-nav.tsx`: alternador de abas (`store`, `tables`, `security`, `subscription`, `danger`) com aba ativa em âmbar e texto branco.
2. `store-tab.tsx`: formulário de nome, telefone, endereço e horários de funcionamento.
3. `tables-tab.tsx`: controle numérico com botões de incremento/decremento e trava de validação.
4. `security-tab.tsx`: campos de senha com validação de força mínima.
5. `subscription-tab.tsx`: card de plano atual com detalhes de vencimento e botão de cancelamento com diálogo de confirmação.
6. `danger-tab.tsx`: painel de encerramento definitivo com input de confirmação por nome.

---

## 5. Plano de Testes Automatizados (TDD First)
- Testes unitários para `actions/settings.ts`:
  - Validação e atualização de dados da loja.
  - Aumento e redução de capacidade de mesas (incluindo trava para mesas ocupadas).
  - Troca de senha com validação de senha atual e regras de tamanho.
  - Cancelamento de assinatura Asaas com tratamento de sucesso e erro de API.
  - Exclusão na Zona de Perigo com validação do nome do restaurante e trava para mesas ativas.
