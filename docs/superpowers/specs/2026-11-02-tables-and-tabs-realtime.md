# Especificação Técnica: Mesas, Comandas Digitais e Impressão de Cartões QR Code

**Data**: 2026-11-02  
**Autor**: KeroKero Engineering Team  
**Status**: Em Revisão / Aguardando Aprovação  

---

## 1. Objetivo & Escopo

### 1.1. Objetivo Geral
Implementar o sistema de **Mesas e Comandas Digitais** no painel administrativo (`/tables`), integrando a geração automática de mesas pós-onboarding com QR Codes seguros, a customização e impressão econômica de cartões de mesa em folha A4 com guias de corte, a visualização em tempo real dos status operacionais da mesa (Grade de Cards e Tabela), e o painel detalhado de chamados, pedidos e histórico da mesa ao clicar.

### 1.2. O que entra no escopo
1. **Provisionamento Automático de Mesas**:
   - Criação idempotente em lote das mesas de 1 até `tablesCount` (definido no onboarding) com tokens únicos assinados para os QR Codes.
   - Sincronização automática para estabelecimentos existentes que já concluíram o onboarding ao acessar `/tables`.
   - Adição ou remoção manual de mesas avulsas pelo lojista caso a capacidade física mude.
2. **Visualização Dupla da Operação (`/tables`)**:
   - **Grade com Cards (`grid`)**: Cards visuais com número da mesa, status operacional destacado, tempo decorrido no status, valor total da comanda em aberto, participantes ativos e badge discreta de alertas.
   - **Tabela Minimalista (`table`)**: Apresentação compacta e rápida para operadores, com colunas para Mesa, Status, Chamado Pendente, Total da Conta, Tempo Ocupada e Ações.
   - **Filtros e Busca**: Filtrar por status (Todas, Livres, Ocupadas, Chamou Garçom, Solicitou Maquininha, Pagamento PIX) e busca por número da mesa ou nome de participante.
3. **Status Operacionais em Tempo Real**:
   - `idle` (Livre / Disponível)
   - `occupied` (Ocupada / Cliente presente na mesa)
   - `order_placed` (Pedido Realizado / Aguardando preparo ou entrega)
   - `waiter_called` (Chamou o Garçom: pedido de atendimento presencial com motivo)
   - `bill_requested` (Solicitou a Maquininha com valor pré-calculado)
   - `paid_pix` (Conta Paga via PIX no PWA)
4. **Painel de Detalhes da Mesa (Side Drawer / Sheet)**:
   - Visualização completa da sessão ativa ao clicar no card ou linha da mesa.
   - Lista cronológica de chamados de atendimento com botão de "Atender / Concluir chamado".
   - Lista de pedidos realizados na mesa com itens, adicionais, participante autor e status.
   - Divisão e totalizador da comanda da mesa (total acumulado, valor por participante).
   - Botão para encerrar / liberar mesa manualmente caso os clientes tenham saído.
5. **Customizador e Impressão Econômica de Cartões QR Code**:
   - Modal de customização de cartão de mesa:
     - Logotipo do estabelecimento (upload ou uso do logo cadastrado na loja).
     - Subtítulo "powered by Bempedi".
     - QR Code vetorial nítido (SVG/Canvas) apontando para a URL da comanda `/m/[token]`.
     - Identificador da mesa (ex: "Mesa 01", "Mesa 02").
     - Texto de apoio / instrução customizável (ex: "Aponte a câmera para pedir e pagar").
     - Cores personalizáveis (cor de fundo e cor dos textos/acentos).
   - **Impressão Econômica em Folha A4**:
     - Otimização para encaixar o máximo de cartões por página A4 (grid 2x3 = 6 cartões de 9x9cm ou 3x3 = 9 cartões compactos de 6.5x6.5cm).
     - Guias de corte pontilhadas para refilamento rápido com tesoura ou estilete.
     - Suporte nativo a `@media print` com margens zero e quebras de página automáticas (`page-break-inside: avoid`).
     - Opção de imprimir todas as mesas de uma só vez ou selecionar um intervalo específico.
6. **Sincronização em Tempo Real (Appwrite Realtime)**:
   - Inscrição via WebSocket na coleção de `tables`, `table_sessions` e `service_calls` do estabelecimento.
   - Atualização sem necessidade de recarregar a página quando um cliente pedir algo, chamar o garçom ou pagar no PWA.

### 1.3. O que fica de fora
- PWA final do consumidor final (telas completas do cliente final para seleção de itens do cardápio e fluxo de pagamento Asaas serão integradas nos módulos subsequentes; mock de acionamento de eventos será fornecido para testes de ponta a ponta).
- Impressão térmica de comandas de produção (cozinha) em ESC/POS — o sistema é 100% digital via tela KDS no MVP.

---

## 2. Modelagem de Dados & Schemas

### 2.1. Coleções no Appwrite (`appwriteConfig`)

#### Coleção: `tables`
Identificador: `tables`
| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `$id` | String | ID único no Appwrite |
| `establishmentId` | String | ID do estabelecimento (Tenant) |
| `number` | Integer | Número da mesa (ex: 1, 2, 3...) |
| `label` | String | Rótulo amigável (ex: "Mesa 01", "Varanda 04") |
| `token` | String | Token único de acesso público via QR Code (ex: 64-char hex seguro) |
| `status` | String | `idle`, `occupied`, `order_placed`, `waiter_called`, `bill_requested`, `paid_pix` |
| `activeSessionId` | String (opcional) | ID da sessão ativa vinculada |
| `currentTotal` | Integer | Valor atual em aberto da comanda em centavos |
| `lastActivityAt` | String (ISO) | Timestamp da última interação ou mudança de status |
| `serviceCallReason` | String (opcional) | Motivo do chamado atual (ex: "Gelo e limão", "Maquininha de cartão") |
| `isActive` | Boolean | Se a mesa está disponível fisicamente no salão |

#### Coleção: `table_sessions`
Identificador: `table_sessions`
| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `$id` | String | ID único |
| `establishmentId` | String | ID do estabelecimento |
| `tableId` | String | ID da mesa |
| `tableNumber` | Integer | Número da mesa para consultas desnormalizadas |
| `status` | String | `open`, `closed` |
| `openedAt` | String (ISO) | Timestamp de abertura da sessão |
| `closedAt` | String (opcional) | Timestamp de encerramento |
| `participants` | String | JSON serializado de `Array<{ id: string; name: string; joinedAt: string }>` |
| `totalAmount` | Integer | Total acumulado em centavos |
| `paidAmount` | Integer | Total já liquidado em centavos |

#### Coleção: `service_calls`
Identificador: `service_calls`
| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `$id` | String | ID único |
| `establishmentId` | String | ID do estabelecimento |
| `tableId` | String | ID da mesa |
| `tableNumber` | Integer | Número da mesa |
| `sessionId` | String | ID da sessão ativa |
| `type` | String | `waiter` (Garçom), `bill_card` (Maquininha), `custom` (Outros) |
| `description` | String (opcional) | Detalhe da solicitação (ex: "Troca de pratos") |
| `requestedBy` | String | Nome do cliente que acionou |
| `status` | String | `pending` (Pendente), `in_progress` (Em atendimento), `completed` (Concluído) |
| `$createdAt` | String (ISO) | Data do chamado |

---

## 3. Pontos Críticos, Segurança Indoor & Casos de Borda

1. **Prevenção Contra Acesso Remoto (Anti-Troll / Sistema 100% Indoor)**:
   - **Vulnerabilidade**: Usuários que fotografem a placa da mesa física e tentem abrir a comanda de suas casas para enviar pedidos falsos ou disparar chamados de garçom.
   - **Mitigação Estrita (Bloqueio Total)**:
     - O KeroKero opera exclusivamente em regime **Indoor**.
     - **Camada 1 (Geofencing Estrito no Navegador)**: Ao abrir o link do QR Code (`/m/[token]`), o PWA captura as coordenadas do cliente via `navigator.geolocation` e valida a distância até a coordenada do restaurante (`haversineDistance <= 250m`).
     - **Camada 2 (Bloqueio Incondicional de Fora)**: Se a localização estiver fora do raio do estabelecimento ou se o usuário recusar a permissão de localização no dispositivo, o acesso à comanda e o envio de qualquer pedido ou chamado de serviço são **completamente bloqueados**, exibindo a mensagem: *"Você precisa estar presente no estabelecimento para acessar esta mesa"*. Não há opção de pagamento remoto ou contorno.
     - **Indicador de Confiabilidade no Painel do Lojista**: No card e na linha da mesa, o operador tem a garantia de que 100% das sessões ativas foram abertas com validação de presença física indoor confirmada.
2. **Tentativa de Forjar QR Code / Token**:
   - Um cliente mal-intencionado pode tentar alterar o número da mesa na URL para enviar pedidos em nome de outra mesa.
   - **Mitigação**: O QR Code utiliza um `token` criptográfico aleatório (não sequencial) gerado com entropia criptográfica (`crypto.randomBytes(24).toString('hex')`). Apenas requisições que apresentarem o token correspondente à mesa ativa têm permissão para interagir com a sessão.
3. **Mesas Criadas em Excesso ou Estabelecimento com 0 Mesas**:
   - Se o lojista informar 50 mesas no onboarding, a criação sequencial no Appwrite pode sofrer timeout ou estourar limites de requisição.
   - **Mitigação**: Criação em lotes (chunks de 10 mesas em paralelo via `Promise.allSettled`) com tratamento resiliente e verificação de existência prévia para idempotência total.
3. **Múltiplos Clientes Chamando Garçom ao Mesmo Tempo na Mesma Mesa**:
   - Se dois participantes clicarem em "Chamar Garçom" no mesmo minuto, a mesa não deve poluir a tela com chamados repetidos do mesmo tipo.
   - **Mitigação**: Deduplicação: se já houver um chamado `pending` do mesmo tipo para aquela mesa, atualiza o timestamp em vez de duplicar o registro.
4. **Fechamento e Liberação de Mesa**:
   - Após pagamento no PIX ou na Maquininha, a mesa deve transitar para `paid_pix` e permitir liberação para `idle` pelo lojista, limpando a sessão ativa.
5. **Impressão em Dispositivos Móveis e Desktops**:
   - Configurações de impressão do navegador costumam incluir cabeçalho de URL e data.
   - **Mitigação**: Regras CSS `@page { size: A4 portrait; margin: 8mm; }` e `@media print { header, footer { display: none; } }` com quebras forçadas de página após cada lote de cartões.

---

## 4. Impacto de Performance & Otimizações

1. **Carga Inicial do Painel (`/tables`)**:
   - Renderização inicial no Server Component com busca direta das mesas do estabelecimento indexadas por `establishmentId`.
   - Payload leve: dados de mesas com totais já agregados no documento da mesa, evitando N+1 queries para buscar pedidos de cada mesa na listagem geral.
2. **Atualização em Tempo Real Sem Sobrecarga de Renderização**:
   - Utilização de `client-side state` com atualização cirúrgica via `tableId` recebido no evento do Appwrite Realtime.
   - Throttle de áudio/alertas visuais para evitar múltiplos disparos simultâneos.
3. **Renderização de QR Codes**:
   - Utilização de biblioteca SVG leve (`qrcode.react` ou equivalente otimizado) sem requisições a APIs externas de imagem de QR Code, garantindo funcionamento offline e renderização instantânea no cliente.

---

## 5. Segurança & Permissões

1. **Isolamento Multitenant Estrito**:
   - Todas as queries do backend utilizam `Query.equal('establishmentId', establishment.$id)`.
   - Nenhuma ação de servidor aceita `establishmentId` vindo do formulário do cliente; ele é sempre extraído da sessão autenticada do lojista (`getLoggedInUser`).
2. **Validação de Schemas com Zod**:
   - Schemas estritos para customização de cartões, criação avulsa de mesas, resolução de chamados e encerramento de comanda.
3. **Permissões Granulares no Appwrite**:
   - Leitura de mesas protegida pelo lojista autenticado.
   - Acesso público restrito apenas à rota de handshake via token de mesa assinado.

---

## 6. Layout do Cartão & Otimização de Impressão em Folha A4

### 6.1. Anatomia do Cartão
```
+---------------------------------------+
|              [ LOGO ]                 |
|          powered by Bempedi           |
|                                       |
|            +---------+                |
|            | QR CODE |                |
|            | VETORIAL|                |
|            +---------+                |
|                                       |
|               MESA 04                 |
|   Aponte a câmera para fazer seu      |
|      pedido e fechar a conta          |
+---------------------------------------+
```

### 6.2. Aproveitamento Máximo na Folha A4
- **Formato Grade 2x3 (6 cartões por página)**: 
  - Dimensões do cartão: ~8.5cm x 8.5cm.
  - Cartão legível à distância, com espaço confortável para o logo e QR Code grande (ideal para leitura de câmeras de smartphones até em ambientes com pouca luz de restaurantes/bares).
- **Formato Grade 3x3 (9 cartões por página)**:
  - Dimensões do cartão: ~6.2cm x 6.2cm.
  - Máxima economia de papel para pequenos adesivos.
- **Guias de Corte**:
  - Borda pontilhada fina de 1px cinza claro ao redor de cada cartão para guiar o corte com facilidade.
