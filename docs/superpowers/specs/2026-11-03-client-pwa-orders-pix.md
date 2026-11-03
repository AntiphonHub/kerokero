# Especificação Técnica: PWA do Cliente (Mesa, Pedidos Individuais e Pagamento PIX)

**Data**: 2026-11-03  
**Status**: Aprovado para Planejamento  
**Módulo**: PWA do Consumidor (`/m/[token]`)

---

## 1. Objetivo & Escopo

### 1.1. Objetivo Geral
Desenvolver o Progressive Web App (PWA) mobile-first do cliente final para consumo presencial na mesa. O cliente escaneia o QR Code físico da mesa, passa por uma trava estrita de presença física via geolocalização indoor, informa apenas seu apelido (guest-first, sem cadastro inicial) e ingressa na sessão da mesa. Múltiplos participantes podem compartilhar a mesma mesa, mantendo carrinhos de compras individuais, visualização consolidada da comanda em tempo real e fechamento flexível via PIX dinâmico (Asaas), com 100% do valor creditado diretamente na subconta do estabelecimento.

### 1.2. O que entra no escopo
1. **Acesso Seguro via QR Code (`/m/[token]`)**:
   - Validação criptográfica do token da mesa no banco de dados.
   - Reconhecimento automático do estabelecimento e do número da mesa.
2. **Hard Gate de Geolocalização Indoor**:
   - Bloqueio estrito obrigatório: exige permissão de GPS no navegador do smartphone.
   - Validação server-side via fórmula de Haversine (`geofence.ts`) contra as coordenadas geográficas do restaurante (raio máximo de 250 metros).
   - Telas de bloqueio claras em caso de GPS desligado, permissão negada ou localização fora do perímetro físico da loja.
   - Em ambiente de desenvolvimento local (`NODE_ENV === 'development'`), tolerância/bypass de simulação para permitir testes de bancada.
3. **Ingresso Zero-Fricção (Guest Onboarding)**:
   - Entrada informando apenas o apelido (ex: "Carlos").
   - Resolução de apelidos duplicados na mesma mesa (sufixo numérico automático, ex: "Carlos (2)").
   - Criação/vinculação à sessão ativa da mesa (`table_sessions`).
   - Emissão de cookie `HttpOnly` assinado contendo a credencial do participante (`kerokero_participant`).
4. **Cardápio Digital & Carrinho Individual**:
   - Exibição de categorias e itens ativos com fotos, descrições e valores.
   - Modal de item com seleção de adicionais/complementos e observações de preparo.
   - Carrinho local no dispositivo de cada participante (independente e reativo via Zustand/localStorage).
5. **Envio de Pedidos & Fila em Coleção Dedicada**:
   - Envio individual de pedidos etiquetados com o nome do participante.
   - Criação de documentos individuais na coleção `orders` no Appwrite para prevenir condições de corrida de escrita simultânea e alimentar o KDS da cozinha.
   - Atualização do status da mesa para `order_placed` / `occupied` e incremento do total da comanda.
   - Transmissão instantânea via Appwrite Realtime para sincronização com o painel da loja (`/tables`) e outros clientes na mesa.
6. **Comanda da Mesa Compartilhada**:
   - Visão em duas abas:
     - **Meus Itens**: Apenas os itens consumidos por aquele participante e seu subtotal individual.
     - **Mesa Completa**: Extrato consolidado de todos os pedidos da mesa, agrupados por participante, com total geral acumulado.
7. **Serviços Rápidos**:
   - Botão flutuante para "Chamar Garçom" (motivos rápidos: talheres, gelo, guardanapo ou ajuda).
   - Botão para "Pedir Maquininha" com seleção prévia da forma (Débito, Crédito ou VR).
8. **Fechamento de Conta & Pagamento PIX (Asaas)**:
   - Opções flexíveis de pagamento:
     - **Pagar Meus Itens**: Quita o valor exato consumido pelo participante.
     - **Dividir Igualmente**: Divide o saldo restante da mesa pelo número de participantes ativos.
     - **Pagar Conta Total**: Quita o valor restante total da mesa.
   - **Solicitação de CPF no Checkout do PIX (Opção A)**:
     - No momento de clicar em "Pagar com PIX", um modal minimalista solicita apenas o CPF do pagador (validado via `isValidCpf`).
     - Criação/busca do cliente na API do Asaas com nome e CPF sob a subconta do estabelecimento.
   - Geração de cobrança PIX dinâmica na API do Asaas utilizando a chave de API da subconta do estabelecimento (100% do valor líquido vai para o lojista, sem comissão da plataforma).
   - Apresentação do QR Code PIX e chave copia-e-cola com contagem regressiva de expiração (15 minutos).
   - Confirmação de pagamento resiliente: polling server-side a cada 3 segundos enquanto a tela de QR Code estiver aberta, com suporte complementar a webhooks.
   - Atualização do status do participante para quitado e exibição do comprovante na tela.
   - Encerramento automático da comanda individual: participante quitado tem o cookie revogado; mesa física é liberada para `idle` automaticamente quando o total acumulado estiver 100% quitado.

### 1.3. O que fica de fora
- Autenticação por e-mail ou senha para o consumidor final (fluxo 100% guest para eliminar atrito).
- Pagamento via cartão de crédito digitado diretamente no PWA nesta primeira fase (foco no PIX instantâneo e na Maquininha física na mesa).
- Impressão térmica de comandas em impressoras ESC/POS de cozinha (opera via KDS / painel digital).

---

## 2. Abordagens Consideradas & Decisão Arquitetural

| Abordagem | Descrição | Prós | Contras | Decisão |
| :--- | :--- | :--- | :--- | :--- |
| **1. Next.js App Router + Server Actions + Appwrite Realtime** | Validação centralizada no servidor, cookie HttpOnly assinado, regras de negócio isoladas em Server Actions e sincronização reativa via Appwrite Realtime. | Máxima segurança contra fraudes e manipulação de valores; geolocalização validada no servidor; alinhado ao padrão do projeto. | Requer configuração de cookies HttpOnly no Next.js. | **Escolhida** |
| **2. Appwrite Client SDK Puro (Sessões Anônimas)** | Cliente web conecta diretamente ao Appwrite via SDK client do browser, com permissões em coleções públicas. | Menos código de backend no Next.js. | Impossível garantir validação de geolocalização segura; regras de permissões frágeis no banco; complexidade de orquestrar pagamentos Asaas. | Descartada |
| **3. SPA Desacoplado com Rotas REST Manuais** | Frontend como SPA consumindo endpoints manuais (`/api/client/*`). | Separação estrita de rotas. | Duplicação de código, rotas manuais e boilerplate desnecessário frente às Server Actions. | Descartada |

---

## 3. Modelagem de Dados & Schemas

### 3.1. Coleções no Appwrite

#### Coleção: `table_sessions`
| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `establishmentId` | String | ID do estabelecimento |
| `tableId` | String | ID da mesa |
| `tableNumber` | Integer | Número da mesa |
| `status` | String | `open` \| `closed` |
| `openedAt` | String (ISO) | Timestamp de abertura da mesa |
| `closedAt` | String (opcional) | Timestamp de encerramento |
| `participants` | String (JSON) | Array de participantes: `[{ id: string, name: string, joinedAt: string, isPaid: boolean, paidAmount: number }]` |
| `totalAmount` | Integer | Total acumulado da mesa em centavos |
| `paidAmount` | Integer | Total já pago da mesa em centavos |

#### Coleção: `orders` (Dedicada)
Identificador: `orders`
| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `establishmentId` | String | ID do estabelecimento |
| `tableId` | String | ID da mesa |
| `tableNumber` | Integer | Número da mesa |
| `sessionId` | String | ID da sessão ativa da mesa |
| `participantId` | String | ID do participante que realizou o pedido |
| `participantName` | String | Apelido do participante |
| `productId` | String | ID do produto |
| `productName` | String | Nome do produto no momento da compra |
| `unitPrice` | Integer | Preço unitário em centavos |
| `quantity` | Integer | Quantidade |
| `totalPrice` | Integer | Preço total do item em centavos (`unitPrice * quantity`) |
| `notes` | String (opcional) | Observações de preparo |
| `selectedOptions` | String (opcional) | JSON de adicionais/opções selecionadas |
| `status` | String | `pending` (recebido), `preparing` (em preparo), `ready` (pronto), `delivered` (entregue), `cancelled` (cancelado) |
| `createdAt` | String (ISO) | Data/hora do pedido |

#### Coleção: `service_calls`
Já existente em [`lib/appwrite/tables.ts`](file:///c:/Users/games/Documents/projetos/kerokero/lib/appwrite/tables.ts).
Suporta chamados do tipo `waiter` e `bill_card`.

---

## 4. Fluxo Detalhado do Usuário (Step-by-Step)

```
[Escaneamento do QR Code] 
          │
          ▼
   /m/[token] (PWA)
          │
          ▼
[Gate 1: Verificação de Token da Mesa] ──── Inválido? ──► [Tela de Erro / QR Code Inválido]
          │ Válido
          ▼
[Gate 2: Trava de Geolocalização]
          │ Solicita permissão do GPS
          ├──── Negado / Desligado ──────► [Tela de Bloqueio: Ative o GPS no Navegador]
          ├──── Fora do Raio (> 250m) ────► [Tela de Bloqueio: Acesso Permitido Apenas no Local]
          │ Dentro do Raio (<= 250m) (ou Dev Mode)
          ▼
[Gate 3: Entrada do Apelido]
          │ Digita "Carlos"
          ▼
[Registro de Participante & Cookie HttpOnly]
          │ Cria participante na sessão ativa da mesa
          ▼
[Cardápio Digital da Mesa]
          │
    ┌─────┴─────────────────────────────────┐
    ▼                                       ▼
[Montagem do Carrinho Individual]      [Visualização da Comanda da Mesa]
    │                                       │ "Meus Itens" vs "Mesa Completa"
    ▼                                       ▼
[Envio do Pedido para a Cozinha]       [Serviços Rápidos]
    │ Cria doc na coleção 'orders'         ├─ Chamar Garçom
    ▼                                       └─ Pedir Maquininha (Crédito/Débito/VR)
[Atualização em Tempo Real na Mesa]
    │
    ▼
[Fechamento & Pagamento PIX]
    ├─ Pagar Meus Itens
    ├─ Dividir Igualmente
    └─ Pagar Conta Total
    │
    ▼
[Modal de Checkout PIX: Solicita CPF]
    │ Validação estrita via CPF Zod schema
    ▼
[Emissão de PIX Dinâmico Asaas (Subconta do Estabelecimento)]
    │ Exibe QR Code + Copia e Cola + Timer de 15 min
    ▼
[Confirmação de Pagamento: Polling 3s / Webhook]
    │ Abate o saldo da mesa e marca participante como quitado
    ▼
[Comprovante na Tela & Encerramento da Sessão Individual]
```

---

## 5. Pontos Críticos & Casos de Borda

1. **Permissão de GPS Negada ou Browser sem Suporte**:
   - A interface não permite avançar sem as coordenadas. Exibe instrução visual objetiva de como tocar no ícone de configurações do Safari ou Chrome para permitir a localização e tentar novamente.
2. **Ambiente Local e Testes Sem GPS**:
   - Em ambiente de desenvolvimento (`process.env.NODE_ENV === 'development'`), o sistema permite bypass de teste com coordenadas pré-configuradas para viabilizar testes em emuladores desktop/mobile.
3. **Múltiplos Clientes com o Mesmo Apelido**:
   - Se já existir um "Carlos" na mesa ativa, o sistema armazena internamente um ID único (UUID) e exibe o apelido como "Carlos (2)" para evitar ambiguidades visuais na comanda e na cozinha.
4. **Fechamento Concorrente de Pagamento**:
   - Antes de gerar a cobrança PIX no Asaas, o backend valida se o saldo restante da mesa comporta o valor solicitado. Se a mesa tinha R$ 100 em aberto e outro participante acabou de pagar R$ 60, uma tentativa de pagar os R$ 100 originais recalcula para o saldo restante real (R$ 40) para prevenir cobrança a maior.
5. **Reabertura Após Quitação**:
   - Quando o participante paga sua parte, o cookie de sessão é revogado e ele vê a tela de sucesso com o recibo. Se ele decidir pedir novamente na mesma mesa, ele escaneia o QR Code de novo, passa pela geolocalização e cria um novo ciclo de consumo.
6. **Desconexão de Rede / Recarregamento da Página**:
   - Como a sessão do participante fica armazenada em cookie `HttpOnly` seguro atrelado ao `token` da mesa, recarregar a página reconecta instantaneamente o cliente à sua sessão ativa sem pedir apelido novamente.

---

## 6. Critérios de Aceite

1. Ao acessar `/m/[token-invalido]`, exibe página de erro amigável sem vazar dados.
2. Ao acessar `/m/[token-valido]`, solicita localização; se recusada ou fora do raio (> 250m), bloqueia com instrução clara.
3. Se autorizada dentro do raio (<= 250m), solicita apelido e abre/vincula à sessão da mesa.
4. Segundo participante acessando o mesmo QR Code entra na mesma sessão sem sobrescrever o primeiro.
5. Itens adicionados ao carrinho por "Carlos" aparecem no carrinho dele; ao enviar o pedido, o pedido é registrado na coleção `orders` com autoria de "Carlos".
6. A aba "Meus Itens" exibe apenas os pedidos de "Carlos", enquanto "Mesa Completa" exibe pedidos de todos os participantes e total acumulado.
7. Botão "Chamar Garçom" cria documento em `service_calls` e atualiza o status da mesa para `waiter_called` no painel da loja.
8. Ao solicitar PIX, exige CPF válido do pagador, emite cobrança na subconta do lojista no Asaas e exibe o QR Code e chave copia-e-cola.
9. Ao pagar o PIX, o polling a cada 3s detecta a quitação no Asaas, avança para o comprovante, limpa o cookie do participante e abate o saldo da comanda.
