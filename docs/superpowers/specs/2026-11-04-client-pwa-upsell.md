# Especificação Técnica: Upsell Inteligente no PWA do Cliente

**Data**: 2026-11-04  
**Status**: Proposto / Em Especificação  
**Módulo**: PWA do Consumidor (`/m/[token]`, `ProductModal`, `CartSheet`)

---

## 1. Objetivo & Escopo

### 1.1. Objetivo Geral
Tornar operacional o recurso de **Upsell Inteligente (Venda Cruzada)** no PWA do cliente. O lojista já cadastra no painel administrativo (`/menu`) os produtos sugeridos (`upsellProductIds`) e a frase persuasiva customizada (`upsellMessage`). Esta especificação define a renderização, interação e comportamento dessas recomendações no modal de detalhes do item (`ProductModal`) e na revisão do pedido no carrinho (`CartSheet`), respeitando a diretriz de zero fricção no mobile e estética Anti-AI Slop (sem emojis, sem poluição visual, tipografia e contraste precisos).

### 1.2. O que entra no escopo
1. **Upsell no Modal de Detalhes do Produto (`ProductModal`)**:
   - Resolução reativa dos produtos recomendados a partir da lista já carregada de produtos ativos (`products`).
   - Exibição de cabeçalho contextual: se o lojista definiu `upsellMessage`, exibir a frase com aspas sutis; caso contrário, usar rótulo padrão direto: "Combina com este item".
   - Carrossel horizontal compacto ou lista de itens sugeridos com miniatura, nome, preço e botão de ação rápida (`+` / Adicionar).
   - Comportamento de clique no item sugerido:
     - Se o item de upsell tiver complementos/adicionais obrigatórios/opcionais (`addons.length > 0`): abre o modal para personalização daquele item.
     - Se o item de upsell for simples (sem adicionais): adiciona 1 unidade diretamente ao carrinho local do participante com microinteração de confirmação.
2. **Upsell Contextual no Carrinho (`CartSheet`)**:
   - Coleta de todos os `upsellProductIds` dos itens presentes no carrinho.
   - Deduplicação e filtragem de itens que já estejam no carrinho.
   - Exibição de uma seção discreta e recolhível antes do botão de envio: "Sugestões para seu pedido".
   - Adição com um toque direto ao carrinho.
3. **Mecanismo de Filtro e Resiliência**:
   - Descarte gracioso de IDs de produtos desativados (`isActive === false`), sem estoque ou excluídos.
   - Prevenção estrita de auto-recomendação (o produto nunca sugere a si próprio).

### 1.3. O que fica de fora
- Algoritmos de Machine Learning complexos ou recomendações baseadas em histórico externo (o MVP utiliza estritamente a curadoria do lojista via `upsellProductIds`).
- Upsell invasivo ou bloqueador tipo popup em tela cheia (interromper o fluxo de checkout com modais empilhados é anti-UX).

---

## 2. Pontos Críticos & Casos de Borda

1. **Produto sugerido excluído ou inativo**:
   - *Cenário*: O lojista configurou o produto B como upsell do produto A, mas depois inativou ou deletou o produto B.
   - *Solução*: A função seletora filtra os produtos por existência e status ativo (`p && p.isActive`). Se a lista resultante for vazia, a seção de upsell nem sequer é renderizada, sem erro e sem espaço em branco.
2. **Auto-Upsell**:
   - *Cenário*: Produto A tem o próprio ID de A em sua lista de `upsellProductIds`.
   - *Solução*: Filtragem explícita descartando `id === currentProduct.$id`.
3. **Item com adicionais adicionado via Upsell**:
   - *Cenário*: O cliente clica no botão rápido de adicionar uma "Batata Recheada" que possui seleção obrigatória ou opcional de adicionais.
   - *Solução*: Se `addons && addons.length > 0`, alternar o modal ativo para a personalização do item de upsell. Se `!addons || addons.length === 0`, disparar `cartStore.addItem` imediatamente.
4. **Produtos já inseridos no carrinho**:
   - *Cenário*: O cliente já adicionou um refrigerante ao carrinho e abre o modal de um hambúrguer que recomenda o mesmo refrigerante.
   - *Solução*: Indicar visualmente que o item já está no carrinho ou exibir botão `+` que incrementa mais 1 unidade sem duplicar linhas. No `CartSheet`, o item já presente no carrinho é omitido da lista de sugestões.

---

## 3. Impacto de Performance

- **Zero Queries Adicionais de Rede**:
  - O cardápio digital do cliente (`/m/[token]`) já carrega todos os produtos ativos do estabelecimento na renderização server-side inicial através de `getProductsByEstablishment`.
  - A resolução de `upsellProductIds` é realizada localmente em memória via mapa indexado (`Map<string, ProductDocument>` ou busca direta em array), com complexidade $O(N)$ desprezível (menos de 1ms para cardápios de centenas de itens).
- **Bundle & Rerender**:
  - Não há inclusão de novas bibliotecas de terceiros.
  - O estado do carrossel/lista de upsell é encapsulado, evitando re-renderizações desnecessárias de toda a página.

---

## 4. Segurança & Permissões

- **Integridade de Preço e Dados**:
  - Toda adição via upsell respeita a função existente `getEffectiveProductPrice(product)`, aplicando preços de Happy Hour vigentes de forma consistente.
  - A submissão final dos pedidos continua sendo validada pelo backend em `submitOrderAction` via Zod schema estrito, impedindo manipulação de preços ou itens inválidos pelo cliente.

---

## 5. Design & Experiência (Diretrizes Anti-AI Slop)

- **Tipografia & Textos**:
  - Sem emojis em títulos ou botões.
  - Rótulos concisos: "Combina com este item" ou a frase entre aspas definida pelo lojista (máx. 120 caracteres).
- **Superfícies & Cores**:
  - Superfícies em branco (`#FFFFFF`) ou cinza suave (`#F4F4F5` / `zinc-50`), com bordas sutis `border-zinc-200/80`.
  - Botão de adicionar compacto em preto neutro (`#121212` / `bg-zinc-900`) ou contorno suave, com ícone SVG `Plus`.
- **Acessibilidade Mobile**:
  - Áreas de toque de no mínimo 44x44px.
  - Suporte a rolagem horizontal suave com `snap-x` no mobile.
