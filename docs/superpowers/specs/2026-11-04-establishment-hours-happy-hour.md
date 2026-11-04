# Especificação Técnica: Horário de Funcionamento, Trava do PWA e Happy Hour Inteligente

**Data**: 2026-11-04  
**Status**: Aprovado para Implementação  
**Módulos**: Estabelecimentos (`lib/appwrite/establishments.ts`), Gestão de Cardápio (`/menu`), PWA do Consumidor (`/m/[token]`, `MenuView`, `ProductModal`)

---

## 1. Objetivo & Escopo

### 1.1. Objetivo Geral
Implementar o controle temporal completo do estabelecimento no KeroKero:
1. **Trava de Acesso ao PWA Fora do Horário de Atendimento**: Impedir que clientes entrem na mesa ou façam pedidos fora dos dias e horários de funcionamento do restaurante (`openingDays`, `openingTime`, `closingTime`).
2. **Configuração de Happy Hour no Estabelecimento**: Permitir ao lojista configurar dias e janelas de horário de Happy Hour no banco de dados através da área de cardápio (`/menu`).
3. **Preço Dinâmico de Happy Hour**: Aplicar o preço promocional (`happyHourPrice`) exclusivamente durante o período de Happy Hour vigente, tanto na exibição quanto na validação do pedido no backend.
4. **Categoria Virtual de Happy Hour**: Durante o período de Happy Hour, disponibilizar automaticamente uma categoria destacada "Happy Hour" no PWA do cliente, reunindo todos os itens em promoção.

### 1.2. O que entra no escopo
1. **Modelagem de Dados**:
   - Atributos na coleção `establishments`:
     - `happyHourEnabled` (Boolean, default `false`)
     - `happyHourDays` (String/JSON, array de identificadores de dias, ex: `["qui", "sex"]`)
     - `happyHourStartTime` (String `HH:MM`, ex: `"17:00"`)
     - `happyHourEndTime` (String `HH:MM`, ex: `"20:00"`)
2. **Motor de Validação de Horários (`lib/utils/operating-hours.ts`)**:
   - `isEstablishmentOpen(establishment, date?)`: Valida se o estabelecimento está aberto no momento atual, com suporte a horários que cruzam a meia-noite (ex: `18:00` às `02:00`).
   - `isHappyHourActive(establishment, date?)`: Valida se o Happy Hour está ativo no momento atual.
   - `formatOperatingHours(establishment)`: Formata texto amigável de funcionamento para exibição.
3. **PWA do Consumidor (`/m/[token]`)**:
   - Trava de restaurante fechado no `page.tsx`: se o estabelecimento estiver fechado e a mesa não possuir sessão aberta prévia, renderiza tela de bloqueio com `PwaShell`.
   - Injeção da categoria virtual "Happy Hour" no `MenuView` durante o período promocional.
   - Ajuste em `getEffectiveProductPrice(product, isHappyHourActive)` para aplicar o preço correto em tempo real.
   - Exibição de preços tachados e destaques promocionais apenas se o Happy Hour estiver ativo.
4. **Painel do Lojista (`/menu`)**:
   - Botão no cabeçalho: "Horário de Happy Hour" com status visual (Ativo / Inativo).
   - Modal limpo de configuração com seletor de dias da semana (Seg-Dom), horários de início e término, e switch de ativação.
   - Server Action para atualização segura das configurações de Happy Hour no Appwrite.

### 1.3. O que fica de fora
- Happy Hour por produto individual com horários diferentes para cada prato (regrade negócio centralizada por loja para simplicidade operacional).
- Fuso horários múltiplos por loja (o MVP opera no horário oficial de Brasília / `America/Sao_Paulo`).

---

## 2. Pontos Críticos & Casos de Borda

1. **Horários que cruzam a meia-noite (madrugada)**:
   - *Cenário*: Um bar abre às `18:00` de sexta-feira e fecha às `03:00` de sábado.
   - *Solução*: Se `closingTime < openingTime`, o horário cruza a meia-noite. A validação verifica se o horário atual é $\ge 18:00$ do dia anterior ou $\le 03:00$ do dia seguinte, associando corretamente ao dia de início do turno.
2. **Cliente com comanda aberta durante o fechamento do restaurante**:
   - *Cenário*: O restaurante encerra o atendimento às `23:30`, mas clientes na mesa ainda precisam pagar a conta.
   - *Solução*: Se já existir uma sessão ativa (`activeSession`) vinculada à mesa, o PWA permite visualizar a comanda e concluir o pagamento via PIX ou maquininha, bloqueando apenas novos ingressos e novos pedidos se o restaurante estiver fechado.
3. **Falsificação de preço no cliente (Race Condition ou manipulação)**:
   - *Cenário*: Cliente abre o carrinho às `19:59` (durante Happy Hour) e envia o pedido às `20:05` (após o término).
   - *Solução*: A Server Action `submitOrderAction` valida o status de Happy Hour no momento do recebimento no servidor e recalcula o preço efetivo autorizado.

---

## 3. Impacto de Performance & Segurança

- **Zero Queries Adicionais**: O documento de `establishment` já é carregado no servidor em `/m/[token]` e em `/menu`. A validação temporal ocorre de forma pura e determinística em memória.
- **Validação de Schema**: Configuração de Happy Hour validada com Zod (`happyHourSchema`), rejeitando horários mal formatados ou sem dias selecionados.
