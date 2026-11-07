# Especificação Técnica: Landing Page - Seção Hero (`/`)

**Data**: 2026-11-06  
**Status**: Aprovado  
**Módulo**: Landing Page Pública / Seção Hero

---

## 1. Visão Geral & Intenção (The Why)

A Landing Page do KeroKero é a principal porta de entrada e conversão da plataforma SaaS. Ela precisa transmitir de imediato a sofisticação, velocidade e robustez do produto tanto para donos de restaurantes que buscam aumentar seu faturamento e eficiência operacional, quanto para clientes que valorizam agilidade na mesa.

A rota `/` torna-se uma página **100% pública**, acessível tanto por visitantes anônimos quanto por usuários já autenticados.

Esta primeira etapa foca na **Seção Hero**, que define o impacto visual e a promessa central do KeroKero, integrando:
1. Fundo visual temático com `/images/background_hero.png`.
2. Logo oficial na versão branca (`/images/logo_white.png`).
3. Headline e chamada com promessa de valor clara, direta e sem AI slop.
4. Call-to-Action (CTA) direto para criação de conta ou entrada na plataforma.
5. Duplo Mockup de Alta Fidelidade:
   - **MacBook / Mac Desktop**: tela do lojista com dashboard analítico em tempo real (gráficos populados, métricas de faturamento e fluxo de comandas).
   - **iPhone Mobile**: tela do cliente da mesa efetuando pedidos (visão da mesa, itens do cardápio, carrinho e checkout ágil).

---

## 2. Metas, Não-Metas e Anti-Metas

### Metas (Goals)
- **Acesso Público**: Liberar a raiz `/` para visualização irrestrita, sem redirecionamento forçado para `/login` ou `/dashboard`.
- **Hierarquia Visual Estrita Solicitada**:
  - Topo: Barra de navegação leve e transparente com links e atalhos de autenticação.
  - Centro Hero (vertical, um abaixo do outro):
    1. Logo branca (`/images/logo_white.png`).
    2. Texto de promessa com impacto (headline + subheadline direta).
    3. CTA primário destacado (Amarelo Âmbar `#F59E0B` / contraste preto).
    4. Mockups integrados: Mac com dashboard populado + iPhone com app do consumidor na mesa.
- **Mockups de Alta Resolução via Tailwind / CSS**:
  - Mockup do Mac com carcaça metálica elegante, barra de título e tela com dados realistas (faturamento, gráfico de vendas por hora, pedidos recentes).
  - Mockup do iPhone com notch/Dynamic Island, tela do cliente na mesa com itens e status do pedido.
- **Responsividade Impecável**: Ajuste fluido para telas mobile (onde o iPhone ganha destaque e o Mac se ajusta sem overflow horizontal).

### Não-Metas (Non-Goals)
- Não inclui as seções secundárias nesta entrega (Recursos detalhados, Como Funciona, Depoimentos, Planos/Pricing, FAQ e Rodapé completo virão nas próximas sessões planejadas da Landing Page).
- Não exige conexão com dados reais de banco na Landing Page (mockups utilizam dados demonstrativos realistas e consistentes com o ecossistema KeroKero).

### Anti-Metas (Anti-Goals)
- **Zero AI Slop**: Sem badges desnecessárias, sem gradientes roxos saturados, sem emojis em textos ou botões.
- **Zero Layout Shift (CLS)**: Imagens tratadas com `next/image` e dimensões apropriadas.
- **Zero Bloqueio de Acesso**: Visitantes autenticados não devem ser impedidos de rever a Landing Page.

---

## 3. Arquitetura de Componentes & Estrutura

### Estrutura de Arquivos
- `app/page.tsx`: Página Server Component principal pública. Detecta sessão opcionalmente para ajustar CTAs do header ("Acessar Painel" vs "Entrar").
- `components/landing/landing-header.tsx`: Header superior translúcido com links e botões de ação.
- `components/landing/hero-section.tsx`: Componente isolado da Seção Hero com background, logo, copy, CTA e mockups.
- `components/landing/mockup-mac.tsx`: Mockup do MacBook com o dashboard do lojista e gráficos.
- `components/landing/mockup-iphone.tsx`: Mockup do iPhone com o app de pedidos do cliente na mesa.

---

## 4. Segurança & Permissões

- **Pública**: Nenhuma verificação restritiva de middleware bloqueia a rota `/`.
- **Privacidade**: O dashboard demonstrativo do mockup exibe métricas fictícias e exemplares, sem risco de expor dados de clientes ou lojas existentes.

---

## 5. Estratégia de Testes

- Teste unitário para a renderização da Landing Page e Hero Section.
- Verificação da presença do background, logo branca, chamadas de promessa, CTAs e os dois mockups (Mac e iPhone).
- Verificação de comportamento para usuários logados e não-logados no header/CTA.
