# Especificação Técnica: Carteira & Saque Bancário via PIX (`/wallet`)

**Data**: 2026-11-04  
**Status**: Aprovado para Implementação  
**Módulo**: Carteira & Saques (`/wallet`)

---

## 1. Objetivo & Escopo

### 1.1. Objetivo Geral
Criar o módulo de **Carteira & Saques** (`/wallet`) no painel administrativo do estabelecimento, posicionado no grupo "Financeiro" da sidebar com ícone animado de carteira (`WalletIcon`). O módulo permite ao lojista consultar em tempo real o saldo disponível (`availableBalance`) acumulado pelas vendas via PIX nas mesas, visualizar seus dados bancários cadastrados e solicitar **saques instantâneos via PIX** para sua conta bancária externa (`POST /v3/transfers`), além de acompanhar o histórico de transferências realizadas.

### 1.2. O que entra no escopo
1. **Nova Rota e Navegação**:
   - Rota `/wallet` protegida por autenticação sob o layout `(app)`.
   - Item na sidebar: "Carteira & Saque", posicionado no grupo "Financeiro" com ícone vetorial interativo `WalletIcon` (`@lucide-animated`).
2. **Card de Saldo em Tempo Real**:
   - Saldo Disponível para Saque (`availableBalance`) consultado via API Asaas (`GET /v3/finance/balance`).
   - Saldo Total da Conta (`balance`).
   - Indicador de status da subconta no Asaas (Aprovado, Em Análise, etc.).
3. **Fluxo de Solicitação de Saque via PIX**:
   - Botão em destaque "Solicitar Saque via PIX".
   - Modal/Diálogo de saque:
     - Input de valor com máscara BRL.
     - Atalhos rápidos: R$ 50, R$ 100, R$ 200 ou "Sacar Saldo Total".
     - Validação estrita: valor maior que R$ 0,00 e menor ou igual ao saldo disponível.
     - Confirmação visual exibindo a chave PIX de destino cadastrada no onboarding (`establishment.bankPixKey`) e titular.
     - Execução da transferência via `POST /v3/transfers` na subconta do Asaas com a chave decifrada em memória.
     - Feedback de sucesso e atualização imediata do saldo exibido.
4. **Informações da Conta de Destino**:
   - Card apresentando os dados bancários cadastrados: Chave PIX, Banco, Agência, Conta Corrente e Nome do Titular/Representante.
5. **Histórico de Saques & Transferências**:
   - Tabela/lista de transferências realizadas (`GET /v3/transfers`), exibindo:
     - Data e hora da solicitação.
     - Valor líquido transferido.
     - Status da transferência (`DONE`, `PENDING`, `FAILED`, `CANCELLED`) com badges neutras e discretas.
     - Identificador da transferência para auditoria.

### 1.3. O que fica de fora
- Antecipação de recebíveis de cartão de crédito (vendas no KeroKero via PWA são 100% Pix imediato no MVP).
- Alteração da chave Pix nesta tela (alterações cadastrais completas pertencem às Configurações da Loja).

---

## 2. Pontos Críticos & Casos de Borda

1. **Tentativa de Saque Acima do Saldo Disponível**:
   - Validação dupla (cliente e servidor via Zod) bloqueando solicitações com valor superior ao `availableBalance`.
2. **Subconta Sem Chave Pix Cadastrada**:
   - Bloqueio preventivo na interface com instrução para cadastrar chave nas configurações caso o estabelecimento não possua `bankPixKey`.
3. **Ambiente Sandbox vs Produção**:
   - No Sandbox, o Asaas processa a transferência mockada com sucesso. No ambiente de produção, transferências para chaves de terceiros ou externas são auditadas pelo sistema antifraude do Asaas.
4. **Falha de Conectividade com Asaas**:
   - Tratamento de erro com mensagens amigáveis e claras sem expor tokens ou dados de infraestrutura.

---

## 3. Impacto de Performance & Segurança

- **Decifra em Memória Efêmera**: A chave de API da subconta (`asaasSubaccountApiKey`) é descriptografada exclusivamente dentro da Server Action do saque no servidor Next.js e nunca exposta ao frontend.
- **Cache Otimizado**: Consulta de saldo e transferências realizada via Server Action sob demanda e na carga inicial, com botão de atualização manual para evitar requisições desnecessárias.
