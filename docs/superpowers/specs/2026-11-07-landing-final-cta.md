# Especificação Técnica: Landing Page - CTA Final & Rodapé (`FinalCTA`)

**Data**: 2026-11-07  
**Status**: Aprovado  
**Módulo**: Landing Page Pública / Seção de Conversão Final & Rodapé

---

## 1. Visão Geral & Intenção (The Why)

O **CTA Final** é o ponto de fechamento decisivo da Landing Page do KeroKero. Após o visitante conhecer a promessa (Hero), as funcionalidades (Bento Grid) e a transparência do modelo comercial de mensalidade única (Preço R$ 149/mês), este bloco elimina qualquer atrito restante e direciona o lojista diretamente para o cadastro e ativação do seu estabelecimento.

Complementando o CTA, um rodapé sóbrio e minimalista encerra a página com os links essenciais (login, cadastro, termos e privacidade).

---

## 2. Metas, Não-Metas e Anti-Metas

### Metas (Goals)
- **Container de Alta Conversão**:
  - Headline direta: foco em acelerar o salão, eliminar filas na maquininha e aumentar o giro de mesas.
  - Subheadline curta reafirmando os diferenciais: setup em menos de 10 minutos, sem fidelidade e sem taxa de adesão.
  - Botão Primário de Conversão em Amarelo Âmbar (`#F59E0B`) ou Branco com alto contraste (`/signup` ou `/dashboard` se autenticado).
  - Botão Secundário para login (`/login`).
- **Rodapé Institucional Clean**:
  - Logo oficial KeroKero na versão branca (`/images/logo_white.png`).
  - Links de navegação suave (`#recursos`, `#demonstracao`, `#preco`).
  - Nota de copyright e proteção de dados.
- **Animações Fluidas**:
  - `motion/react` para efeito de entrada e hover nos botões.

### Não-Metas (Non-Goals)
- Não inclui formulários longos ou inputs de captura de e-mail na Landing Page (o usuário clica e vai direto para a tela otimizada de criação de conta em `/signup`).

### Anti-Metas (Anti-Goals)
- **Zero AI Slop**: Sem emojis em textos ou botões, sem badges decorativas dispensáveis, textos objetivos e diretos.

---

## 3. Arquitetura Técnica & Estrutura de Arquivos

- `lib/landing/cta-data.ts`: Dados tipados do CTA final (título, descrição, destaques, atalhos de autenticação e links de rodapé).
- `components/landing/final-cta-section.tsx`: Componente da seção do CTA Final com fundo estilizado e botões de ação.
- `components/landing/landing-footer.tsx`: Rodapé minimalista com logo branca e links essenciais.
- `tests/unit/landing-final-cta.test.ts`: Testes unitários para validar os dados do CTA final e links do rodapé.
