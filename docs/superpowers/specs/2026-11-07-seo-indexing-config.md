# Especificação Técnica: SEO, Google Search Console, Robots, Sitemap & Open Graph

**Data**: 2026-11-07  
**Status**: Aprovado  
**Módulo**: Infraestrutura de SEO & Indexação Pública (`bempedi.com`)

---

## 1. Visão Geral & Intenção (The Why)

Para posicionar o **Bempedi** de forma orgânica nos motores de busca (Google, Bing), facilitar o compartilhamento em redes sociais (WhatsApp, LinkedIn, Twitter/X) e permitir a verificação imediata no **Google Search Console**, esta funcionalidade estabelece as fundações completas de SEO técnico para o App Router do Next.js.

Também protege rotas privadas sensíveis (como as comandas de mesa `/m/[token]` e o painel `/dashboard`) contra indexação indevida por crawlers.

---

## 2. Metas, Não-Metas e Anti-Metas

### Metas (Goals)
1. **Configuração de Metadata Centralizada (`lib/seo/config.ts`)**:
   - URL canônica base: `https://bempedi.com`.
   - Title com template dinâmico (`%s | Bempedi`).
   - Description focada em conversão e palavras-chave do segmento gastronômico.
   - Metadados Open Graph e Twitter Cards completos.
   - Integração nativa com o Google Search Console via meta tag `google-site-verification`.
2. **Robots Dinâmico (`app/robots.ts`)**:
   - Permitir indexação de rotas públicas (`/`, `/login`, `/cadastro`, `/signup`).
   - Desautorizar (`disallow`) rotas restritas e privadas (`/dashboard/`, `/kds/`, `/m/`, `/api/`, etc.).
   - Apontar para o sitemap em `https://bempedi.com/sitemap.xml`.
3. **Sitemap Dinâmico (`app/sitemap.ts`)**:
   - Listar páginas públicas canônicas com suas respectivas prioridades e frequências de atualização.
4. **Open Graph Image Dinâmica (`app/opengraph-image.tsx`)**:
   - Card 1200x630 gerado com `ImageResponse` (`next/og`) com identidade visual consistente (Preto Profundo + Amarelo Âmbar).
5. **Dados Estruturados Schema.org (JSON-LD)**:
   - Esquemas `SoftwareApplication` e `Organization` em `app/page.tsx` para exibição de rich snippets no Google.

### Não-Metas (Non-Goals)
- Não indexar comandas de mesa de clientes (`/m/[token]`), pois contêm dados privados e temporários de pedidos.

### Anti-Metas (Anti-Goals)
- **Zero AI Slop**: Sem excesso de emojis em títulos de busca ou meta descriptions caóticas. Textos focados em autoridade técnica e clareza comercial.

---

## 3. Arquitetura Técnica & Arquivos

- `lib/seo/config.ts`: Definição de constantes, metadados padrão, regras de robots e gerador de JSON-LD.
- `app/robots.ts`: Metadata route do Next.js gerando `robots.txt`.
- `app/sitemap.ts`: Metadata route do Next.js gerando `sitemap.xml`.
- `app/opengraph-image.tsx`: Gerador OG 1200x630.
- `app/layout.tsx`: Configuração de `Metadata` raiz e meta tag de verificação do Google.
- `app/page.tsx`: Inclusão do Schema.org JSON-LD na página inicial.
- `tests/unit/seo-config.test.ts`: Testes unitários para validar a consistência e conformidade do SEO.
