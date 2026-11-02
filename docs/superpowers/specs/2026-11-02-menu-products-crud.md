# Especificação Técnica: Cadastro e Gestão de Cardápio e Produtos

**Data**: 2026-11-02  
**Autor**: KeroKero Engineering Team  
**Status**: Em Revisão / Aguardando Aprovação  

---

## 1. Objetivo & Escopo

### 1.1. Objetivo Geral
Implementar o módulo completo de **Gestão de Cardápio e Produtos** na área administrativa do lojista (`/menu`), permitindo aos estabelecimentos cadastrar, visualizar, filtrar, editar e desativar produtos de forma ágil, com suporte a categorias dinâmicas, adicionais customizados, precificação regular e Happy Hour, além do mecanismo de recomendação de venda cruzada (*upsell*).

### 1.2. O que entra no escopo
1. **CRUD Completo de Produtos**:
   - Criação de novos produtos com validação de dados em tempo real.
   - Listagem com visualização dinâmica via Tab Switch (Grade de Cards e Tabela Minimalista).
   - Edição completa de informações e status.
   - Alternância rápida de disponibilidade (Ativo / Desativado) diretamente da listagem.
   - Exclusão com diálogo de confirmação.
2. **Visualização Dupla (Tab Switch)**:
   - **Grade com Cards (`grid`)**: Apresentação visual rica com imagem, identificação de categoria, nome, descrição resumida, preços (regular e Happy Hour), adicionais e status.
   - **Tabela Minimalista (`table`)**: Apresentação densa e focada em produtividade operacional, com ordenação rápida, mini-thumbnail, colunas alinhadas e ações diretas.
3. **Filtros e Busca**:
   - Busca textual por nome do produto ou descrição.
   - Filtro por status: Todos, Apenas Ativos, Apenas Desativados.
   - Filtro seletor por categoria existente.
   - Ordenação por preço (Menor Preço, Maior Preço) e nome (A-Z).
4. **Diálogo de Cadastro e Edição (shadcn/ui Dialog)**:
   - **Nome**: Texto obrigatório (3 a 100 caracteres).
   - **Descrição**: Texto livre opcional (até 300 caracteres).
   - **Imagem**: Upload com preview imediato, armazenada no Cloudflare R2 com validação de formato (JPEG, PNG, WebP) e tamanho máximo (5MB).
   - **Preço Regular**: Valor numérico obrigatório em formato de moeda brasileira (BRL), convertido em centavos ou decimal no backend.
   - **Preço Happy Hour**: Valor opcional em BRL, aplicado em horários promocionais configurados na loja.
   - **Categoria com Autocomplete e Criação Inline**: Input pesquisável que filtra as categorias existentes do estabelecimento; se não existir correspondência, oferece a opção imediata "+ Criar categoria '[nome digitado]'" sem sair do modal.
   - **Switch Ativo/Inativo**: Controle booleano para disponibilidade no cardápio.
   - **Estoque (Quantidade)**: Campo numérico opcional para informar o saldo em estoque (ex: 25 unidades). Permite controle de esgotamento; quando deixado vazio ou nulo, o estoque é considerado contínuo / sob demanda.
   - **Adicionais / Opcionais**: Lista dinâmica onde o lojista pode cadastrar opções extras com nome e preço adicional (ex: "Bacon extra", "Molho da casa").
   - **Upsell ("Combina com este item")**: Seletor multiselect de outros produtos já cadastrados do mesmo estabelecimento para serem sugeridos durante o consumo na mesa.
5. **Categorias de Produtos**:
   - Persistência e listagem das categorias isoladas por estabelecimento.

### 1.3. O que fica de fora
- Baixa automática de estoque por integração com PDVs legados físicos (estoque gerenciado diretamente pelo lojista na plataforma KeroKero).
- Regras automatizadas de agendamento de relógio para Happy Hour (o preço Happy Hour fica registrado no produto para consumo pelo motor de pedidos).
- Exibição do cardápio para o consumidor final (será implementado no módulo da comanda mobile via QR Code).

---

## 2. Modelagem de Dados & Schemas

### 2.1. Coleções no Appwrite (`appwriteConfig`)

#### Coleção: `categories`
Identificador da coleção: `categories`
| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `$id` | String | ID único gerado pelo Appwrite |
| `establishmentId` | String | ID do estabelecimento proprietário (Tenant) |
| `name` | String | Nome da categoria (ex: "Hambúrgueres", "Bebidas", "Sobremesas") |
| `order` | Integer | Ordem de exibição no cardápio (default: 0) |

#### Coleção: `products`
Identificador da coleção: `products`
| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `$id` | String | ID único gerado pelo Appwrite |
| `establishmentId` | String | ID do estabelecimento proprietário |
| `categoryId` | String | ID da categoria associada |
| `categoryName` | String | Cache do nome da categoria para renderização ágil sem joins |
| `name` | String | Nome do produto |
| `description` | String (opcional) | Descrição curta |
| `imageUrl` | String (opcional) | URL da imagem salva no Cloudflare R2 |
| `price` | Integer | Preço regular em centavos (ex: R$ 35,00 -> `3500`) |
| `happyHourPrice` | Integer (opcional) | Preço promocional em centavos |
| `stockQuantity` | Integer (opcional) | Quantidade em estoque (null = ilimitado) |
| `isActive` | Boolean | Se o produto está disponível para venda |
| `addons` | String | JSON serializado de `Array<{ id: string; name: string; price: number }>` |
| `upsellProductIds` | String[] | Lista de IDs de produtos indicados para compra conjunta |
| `$createdAt` | String (ISO) | Data de criação |
| `$updatedAt` | String (ISO) | Data da última atualização |

### 2.2. Schemas Zod (`lib/schemas/product.ts`)

```typescript
import { z } from 'zod';

export const productAddonSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Nome do adicional é obrigatório').max(60),
  price: z.number().int().min(0, 'Preço do adicional não pode ser negativo'),
});

export const productInputSchema = z.object({
  name: z.string().trim().min(2, 'Nome deve conter pelo menos 2 caracteres').max(100),
  description: z.string().trim().max(300, 'Descrição não pode exceder 300 caracteres').optional().default(''),
  imageUrl: z.string().url('URL de imagem inválida').optional().or(z.literal('')),
  price: z.number().int().positive('Preço regular deve ser maior que zero'),
  happyHourPrice: z.number().int().positive('Preço happy hour deve ser maior que zero').optional().nullable(),
  stockQuantity: z.number().int().min(0, 'Quantidade em estoque não pode ser negativa').optional().nullable(),
  categoryId: z.string().min(1, 'Categoria é obrigatória'),
  categoryName: z.string().trim().min(1, 'Nome da categoria é obrigatório'),
  isActive: z.boolean().default(true),
  addons: z.array(productAddonSchema).default([]),
  upsellProductIds: z.array(z.string()).default([]),
}).refine((data) => {
  if (data.happyHourPrice != null && data.happyHourPrice >= data.price) {
    return false;
  }
  return true;
}, {
  message: 'O preço de Happy Hour deve ser menor que o preço regular',
  path: ['happyHourPrice'],
});

export const categoryInputSchema = z.object({
  name: z.string().trim().min(2, 'Nome da categoria deve conter ao menos 2 caracteres').max(50),
});
```

---

## 3. Experiência de Usuário & Anti-AI Slop

Seguindo os pilares estéticos do KeroKero:
- **Cores & Superfícies**: Fundo neutro `bg-zinc-100`, cards em fundo branco `#FFFFFF` com bordas sutis `border-zinc-200/80` e sombras ultra-leves (`shadow-xs`).
- **Sem Badges Desnecessárias**: Nada de etiquetas decorativas em gradiente. Usaremos marcadores discretos:
  - Categoria: texto sutil em uppercase com tracking (`text-xs font-medium text-zinc-500 uppercase tracking-wider`).
  - Status: ponto colorido simples (verde `bg-emerald-500` para ativo, cinza `bg-zinc-400` para desativado) ou Switch direto.
- **Tipografia & Textos Diretos**: Labels objetivos ("Novo Produto", "Salvar Produto", "Preço Happy Hour", "Adicionais"). Sem frases pedagógicas ou emojis.
- **Transições Suaves**: A alternância de visualização entre Grade e Tabela e a abertura do Dialog utilizam transições discretas via `motion`.

---

## 4. Componentes e Estrutura de Telas

### 4.1. Página Principal (`app/(app)/menu/page.tsx`)
- **Cabeçalho de Página**:
  - Título: `Cardápio & Produtos`.
  - Subtítulo resumido: Total de itens e status geral.
  - Botão Primário: `+ Novo Produto` (preto sólido `#121212` com hover texturizado).
- **Barra de Ações e Filtros**:
  - Input de busca com ícone de lupa e debounce (300ms).
  - Seletor de Categoria (dropdown com opção "Todas as categorias").
  - Seletor de Status ("Todos", "Ativos", "Desativados").
  - Tab Switch de visualização: Grade (`grid`) vs. Tabela (`table`).
- **Área de Conteúdo**:
  - **Visualização em Grade**: Grid responsivo (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4`).
  - **Visualização em Tabela**: Tabela minimalista com linhas com espaçamento uniforme, hover suave `hover:bg-zinc-50/80`, colunas formatadas para moeda alinhadas à direita.
  - **Estado Vazio (Empty State)**: Mensagem direta com botão de ação rápida para criar o primeiro produto.

### 4.2. Diálogo de Cadastro / Edição (`components/menu/product-dialog.tsx`)
- Janela modal (`max-w-2xl`, scroll vertical interno se necessário).
- **Seção de Mídia (Imagem)**:
  - Upload via drag-and-drop ou clique para selecionar arquivo.
  - Preview imediato em proporção 1:1 ou 16:9 limpa.
  - Indicador de progresso/upload discreto.
- **Seção de Identificação**:
  - Nome do produto e descrição.
- **Seção de Categoria (Combobox Dinâmico)**:
  - Input com busca instantânea sobre categorias carregadas.
  - Se a busca não encontrar correspondência idêntica, renderiza botão de ação:
    `Criar categoria "[termo digitado]"` -> dispara criação da categoria e já a seleciona automaticamente.
- **Seção de Preços & Estoque**:
  - Preço Regular (R$) com máscara monetária ou input formatado.
  - Preço Happy Hour (R$, opcional).
  - Estoque em unidades (input numérico inteiro positivo ou zero; se vazio, exibido como contínuo).
- **Seção de Adicionais**:
  - Lista de complementos com campos "Nome do adicional" e "Valor (R$)", com botão de remoção por linha e botão `+ Adicionar complemento`.
- **Seção de Upsell ("Combina com este item")**:
  - Busca e seleção de outros produtos da loja já cadastrados (exceto o próprio produto atual).
- **Rodapé do Dialog**:
  - Botão "Cancelar" (outline/ghost) e Botão "Salvar Produto" (primário com indicador de loading).

---

## 5. Pontos Críticos & Casos de Borda

1. **Prevenção de Referência Circular ou Auto-Upsell**:
   - Um produto não pode ter a si próprio em sua lista de produtos de `upsell`.
   - Na edição, o produto atual é filtrado da lista de opções de recomendação.
2. **Exclusão de Produtos Vinculados a Upsell**:
   - Se um produto A foi indicado no upsell do produto B e depois o produto A for excluído, o sistema deve tratar graciosamente a ausência do produto A na renderização sem quebrar o front-end.
3. **Criação de Categorias Duplicadas**:
   - A normalização de strings (ex: `trim().toLowerCase()`) previne a criação acidental de "Bebidas" e "bebidas".
4. **Validação do Preço de Happy Hour**:
   - O preço promocional deve ser estritamente menor que o preço de tabela. O schema Zod e a validação no formulário bloqueiam o envio com mensagem de erro contextual.
5. **Tratamento de Estoque Zero e Alerta de Esgotamento**:
   - Quando o estoque controlado atinge 0, o card e a tabela indicam "Esgotado" com destaque neutro sem quebrar a operação. O lojista pode editar e repor as unidades a qualquer momento.
6. **Upload de Imagens & Tratamento de Falha**:
   - Upload de imagens pesadas é barrado no cliente antes do envio de rede (> 5MB).
   - O upload de imagens gera chaves isoladas no bucket R2 (`establishments/{id}/products/{randomKey}.ext`).

---

## 6. Impacto de Performance

- **Zero N+1 Queries**: O nome da categoria é armazenado em cache no documento do produto (`categoryName`), permitindo listar produtos sem precisar fazer queries adicionais para cada item.
- **Otimização de Imagens**: Next.js `<Image />` com tamanhos responsivos e formatos WebP/AVIF automáticos.
- **Debounce nos Filtros**: A busca por texto aplica debounce de 300ms para evitar refetching desnecessário a cada tecla.
- **Tamanho dos Payloads**: Adicionais serializados diretamente no documento economizam joins e mantêm o payload de leitura abaixo de 3KB por produto.

---

## 7. Segurança & Permissões

- **Multi-Tenant Estrito**:
  - Todas as queries de listagem, criação, atualização e exclusão utilizam o `establishmentId` resolvido a partir da sessão segura do usuário logado.
  - Qualquer tentativa de editar ou excluir um produto de outro estabelecimento é bloqueada no backend com erro 403/Forbidden.
- **Validação de Entrada Zod no Backend**:
  - Server Actions validam todos os dados recebidos antes de invocar o SDK do Appwrite.
- **Sanitização de Upload**:
  - Restrição de Content-Type estrita no upload de arquivos de imagem (`image/jpeg`, `image/png`, `image/webp`).

---

## 8. Estratégia de Testes Automatizados (TDD)

Antes de iniciar a implementação dos componentes visuais e das Server Actions, os seguintes testes automatizados serão criados:
1. `tests/unit/product-schema.test.ts`:
   - Validação de produtos válidos com e sem Happy Hour.
   - Validação de estoque numérico (inteiro >= 0 ou nulo/indefinido para ilimitado), rejeição de estoque negativo.
   - Rejeição de preço zero ou negativo.
   - Rejeição de Happy Hour maior ou igual ao preço regular.
   - Validação de adicionais com preços não-negativos.
   - Validação de categorias e nomes com caracteres em branco.
2. `tests/unit/products-service.test.ts`:
   - Criação de categoria e verificação de duplicidade.
   - Isolamento de produtos por `establishmentId`.
   - Exclusão de produto e validação de permissões de tenant.
   - Toggle de status ativo/desativo.

---

## 9. Próximos Passos
Após aprovação desta especificação técnica:
1. Execução do ciclo TDD com criação dos testes de schema e serviços.
2. Criação das coleções/configurações do Appwrite e helpers no backend (`lib/appwrite/products.ts`).
3. Implementação dos componentes de UI (dialog com combobox dinâmico, lista com tab switch grid/table).
4. Integração na rota `/menu` e verificação final.
