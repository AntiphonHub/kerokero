# Plano de Implementação: Landing Page - Seção Hero

**Data**: 2026-11-06  
**Status**: Pronto para Execução  
**Referência**: [docs/superpowers/specs/2026-11-06-landing-page-hero.md](file:///c:/Users/games/Documents/projetos/kerokero/docs/superpowers/specs/2026-11-06-landing-page-hero.md)

---

## Fases de Execução

### Fase 1: Testes Automatizados (TDD)
- Criar `tests/unit/landing-hero.test.ts` verificando:
  - Presença dos textos chave da promessa e headline na seção hero.
  - Links para criação de conta (`/signup`) e login (`/login`).
  - Renderização do background e logo branca.
  - Estrutura visual dos mockups do Mac e do iPhone.

### Fase 2: Componentes do Mockup Mac & iPhone
- Criar `components/landing/mockup-mac.tsx`:
  - Carcaça do MacBook em tons metálicos neutros (`#1e1e24`, `#121212`, `#2b2b36`), tela com moldura fina e barra de janela (círculos de fechar/minimizar/expandir).
  - Conteúdo da tela: Dashboard gerencial KeroKero com KPIs destacados (Faturamento do Dia, Ticket Médio, Mesas Ocupadas, Pedidos Ativos), gráfico vetorial/SVG estilizado de faturamento por hora e feed de pedidos recentes no salão.
- Criar `components/landing/mockup-iphone.tsx`:
  - Carcaça do iPhone elegante em preto titânio, Dynamic Island / notch discreto, bordas arredondadas e efeito de reflexo sutil.
  - Conteúdo da tela: Visão da Mesa 08 do KeroKero com cliente identificado ("Carlos"), seleção de itens apetitosos do cardápio e botão de pedido/checkout dinâmico.

### Fase 3: Hero Section & Header
- Criar `components/landing/landing-header.tsx`:
  - Barra de navegação com logotipo, links institucionais e ações de autenticação (Entrar / Criar Conta ou Ir para o Painel se logado).
- Criar `components/landing/hero-section.tsx`:
  - Background `/images/background_hero.png` com overlay de legibilidade.
  - Disposição vertical conforme solicitado:
    1. Logo branca (`/images/logo_white.png`)
    2. Texto de promessa e chamada
    3. Botão de CTA primário
    4. Mockups integrados (Macbook na base e iPhone em primeiro plano).

### Fase 4: Integração na Rota Raiz (`app/page.tsx`)
- Substituir o redirecionamento forçado em `app/page.tsx` pela estrutura da Landing Page.
- Obter sessão para enriquecer as ações do usuário sem bloquear o acesso público.
- Testar e validar visualmente e via testes unitários.
