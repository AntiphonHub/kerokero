# Especificação Técnica: Sidebar Flutuante do Painel do Lojista

**Data**: 2026-11-01  
**Autor**: KeroKero Engineering Team  
**Status**: Aprovado  

---

## 1. Objetivo & Escopo

### 1.1. Objetivo
Implementar a Sidebar de navegação flutuante para a área administrativa do lojista (`app/(app)`), proporcionando navegação rápida, fluida e sofisticada entre os módulos da plataforma (Dashboard, Mesas, Cozinha KDS, Cardápio, Financeiro e Configurações).

### 1.2. O que entra no escopo
- **Layout & Fundo**:
  - Fundo geral da aplicação com tom neutro cinza ligeiramente mais escuro que o branco (`#F4F4F5` / `zinc-100`).
  - Sidebar flutuante com margem em todos os lados (`m-3`), bordas arredondadas (`rounded-2xl`), fundo branco sólido (`#FFFFFF`), borda sutil (`border-zinc-200/80`) e sombra delicada.
- **Alternância Compacto/Expandido**:
  - Modo Expandido: Logo/Nome do app, botão recolher (`panel-left-close`), ícone + label dos itens, grupos com cabeçalho e chevron.
  - Modo Compacto: Header compacto, botão expandir (`panel-left-open`), apenas ícones centralizados e tooltips customizados animados com `motion`.
- **Ícones Animados Lucide**:
  - Utilização estrita dos componentes `@lucide-animated`:
    - `layout-panel-top` (Dashboard)
    - `cart` (Grupo Sua Loja)
    - `file-text` (Mesas & Comandas)
    - `cooking-pot` (Cozinha KDS)
    - `book-text` (Cardápio & Produtos)
    - `circle-dollar-sign` (Grupo Financeiro)
    - `receipt` (Histórico de Pedidos)
    - `chart-line` (Métricas & Vendas)
    - `settings` (Configurações)
    - `panel-left-open` / `panel-left-close` (Alternar sidebar)
- **Grupos de Navegação**:
  - *Sua Loja*: Mesas & Comandas, Cozinha (KDS), Cardápio & Produtos.
  - *Financeiro*: Histórico de Pedidos, Métricas & Vendas.
  - *Dashboard* e *Configurações*: itens diretos de primeiro nível.
- **Destaque de Seleção (Item Ativo)**:
  - Fundo sutilmente escurecido em tom de cinza (`bg-zinc-100`).
  - Ícone na cor de destaque âmbar (`#F59E0B` / `text-amber-500`).
- **Footer do Estabelecimento**:
  - Container com as 2 primeiras iniciais do nome do estabelecimento (ex: "My Bar" -> "MB").
  - Nome completo e quantidade de mesas ("10 mesas").
  - Versão compacta exibindo o badge com as iniciais e tooltip informativo.

### 1.3. O que fica de fora
- Criação das páginas completas de cada funcionalidade futura (`/tables`, `/kds`, etc.), que serão desenvolvidas em suas respectivas sprints.

---

## 2. Pontos Críticos & Casos de Borda

1. **Geração de Iniciais do Estabelecimento (`getEstablishmentInitials`)**:
   - Nome com 2 ou mais palavras ("My Bar" -> "MB").
   - Nome com 1 palavra ("KeroKero" -> "KE" ou "K").
   - Nome vazio ou indefinido (fallback gracioso para "KK" ou "LO").
   - Nomes com caracteres especiais ou espaços múltiplos normalizados via regex.
2. **Quantidade de Mesas (`tablesCount`)**:
   - Quando não configurado ou 0, exibir "0 mesas" ou "Mesa única".
3. **Persistência de Estado (Compacto/Expandido)**:
   - Armazenar no `localStorage` sem causar hydration mismatch no Next.js App Router (renderizar com valor default ou resolver via useEffect/hydration-safe pattern).
4. **Tooltips Animados no Modo Compacto**:
   - Evitar flickering durante hover rápido.
   - Posicionamento relativo fixado à direita com `pointer-events-none` e transição com `motion` (opacity, scale, x-offset).

---

## 3. Impacto de Performance

- **Zero overhead de I/O**: Os dados do estabelecimento já são retornados no Server Component do `layout.tsx`.
- **Renderização e Bundle**: Os ícones `@lucide-animated` importam SVG puro e animações declarativas via `motion/react`, sem dependências pesadas adicionais.
- **Hardware Acceleration**: Animações confinadas a `transform` e `opacity` sem acionar repaints caros.

---

## 4. Segurança & Permissões

- Todas as informações do estabelecimento exibidas são provenientes da sessão autenticada pelo Appwrite.
- Dados sanitizados para prevenção de XSS no nome do estabelecimento.
- Navegação restrita aos usuários autenticados via `access-gate`.
