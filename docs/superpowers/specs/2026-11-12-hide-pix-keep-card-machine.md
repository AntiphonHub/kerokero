# Especificação Técnica: Ocultação Temporária de PIX e Pagamento Exclusivo via Maquininha no PWA

**Data**: 2026-11-12  
**Status**: Aprovado para Implementação  
**Módulo**: Checkout PWA Cliente (`components/client/pix-modal.tsx`, `actions/client.ts`, `lib/config/payment.ts`)

---

## 1. Visão Geral & Justificativa de Negócio
Durante a fase de homologação da conta mãe no gateway de pagamentos Asaas, a emissão de cobranças dinâmicas via PIX pode sofrer rejeição ou atrasos cadastrais. Para garantir que os clientes na mesa tenham uma experiência fluida e sem frustrações ao fechar a comanda, a opção de pagamento via PIX será temporariamente ocultada no PWA.

O fechamento de conta permanecerá 100% funcional através da **Maquininha de Cartão física**, permitindo que o cliente:
1. Escolha a divisão desejada (Pagar Meus Itens, Dividir Igualmente ou Pagar Conta Total).
2. Selecione a bandeira/modalidade (Crédito, Débito ou Refeição / VR).
3. Chame o garçom à mesa com o valor exato pré-calculado no painel da equipe.

Quando o processo de homologação da conta Asaas for finalizado, a ativação do PIX será feita instantaneamente via variável de ambiente ou flag centralizada, sem necessidade de refatoração de código.

---

## 2. Objetivo & Escopo

### 2.1. O que entra no escopo
1. **Configuração Centralizada de Feature Flag (`lib/config/payment.ts`)**:
   - Criação da flag `IS_PIX_PAYMENT_ENABLED` baseada na variável de ambiente `NEXT_PUBLIC_ENABLE_PIX_PAYMENT`.
   - Valor padrão: `false` (PIX oculto por padrão enquanto homologação estiver pendente).
   - Documentação de reativação no `.env.example`.
2. **Adaptação do Modal de Checkout (`components/client/pix-modal.tsx`)**:
   - Inicialização do `paymentMethod` em `'card'`.
   - Na etapa de forma de pagamento (`payment_method`):
     - Quando `IS_PIX_PAYMENT_ENABLED === false`:
       - Ocultar o card/botão de opção PIX.
       - Apresentar diretamente as opções de cartão (Crédito, Débito, Refeição / VR).
       - Título e instruções direcionadas à maquininha na mesa.
       - Ação primária clara: *"Chamar com Maquininha ({cardType})"*.
     - Quando `IS_PIX_PAYMENT_ENABLED === true`:
       - Exibição de ambas as opções (PIX Dinâmico e Maquininha) preservando o comportamento original.
3. **Proteção Backend / Security First (`actions/client.ts`)**:
   - Validação em `requestPixCheckoutAction`: se a flag de PIX estiver desativada, rejeita a requisição com mensagem limpa, impedindo chamadas desnecessárias à API do Asaas.
4. **Testes Unitários Automatizados**:
   - Teste da lógica de fallback e validação do flag de ativação.
   - Teste de rejeição na Server Action quando PIX estiver inativo.

### 2.2. O que fica de fora
- Remoção do código de integração com o Asaas (o código permanece intacto para ativação futura imediata).
- Alteração no fluxo de divisão da mesa (o cálculo de "Meus itens", "Dividir" e "Total" continua operando normalmente).
- Alteração no fechamento pelo painel do garçom/caixa.

---

## 3. Pontos Críticos & Casos de Borda

1. **Tentativa de Requisição Direta via API/Action**:
   - Caso um cliente tente chamar `requestPixCheckoutAction` diretamente sem passar pela UI, a Server Action verifica `isPixPaymentEnabled()` no servidor e retorna erro de indisponibilidade temporária.
2. **Voltar na Navegação do Modal**:
   - O botão de voltar (seta) de `payment_method` para `mode_select` permanece funcionando perfeitamente, permitindo alterar entre "Meus Itens", "Dividir" ou "Total".
3. **Reativação Futura com Zero Fricção**:
   - Ao definir `NEXT_PUBLIC_ENABLE_PIX_PAYMENT=true` no `.env` (ou alterar o padrão da flag), a interface volta a exibir o seletor com PIX instantâneo e QR Code sem qualquer alteração adicional de componentes.
4. **Transição de Status no Painel**:
   - O chamado de maquininha gera um chamado de atendimento do tipo `bill_card`, alertando o garçom com o valor e a modalidade exata selecionada.

---

## 4. Impacto de Performance & Segurança

- **Zero Sobrecarga**: Nenhuma requisição adicional ao banco ou APIs externas.
- **Redução de Carga**: Evita chamadas com falha à API do Asaas durante o período de homologação da conta mãe.
- **Segurança**: Bloqueio em camada dupla (Client UI e Server Action).
