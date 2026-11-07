# Especificação Técnica: Landing Page - Seção Recursos em Bento Grid (`#recursos`)

**Data**: 2026-11-06  
**Status**: Aprovado  
**Módulo**: Landing Page Pública / Seção de Recursos (Bento Grid)

---

## 1. Visão Geral & Intenção (The Why)

A seção de **Recursos** (`#recursos`) é o núcleo expositivo do produto na Landing Page. Ela demonstra os diferenciais competitivos e o valor do KeroKero no formato moderno de **Bento Grid**.

O Bento Grid organiza as 5 principais soluções da plataforma de forma visualmente hierárquica e assimétrica, proporcionando leitura dinâmica tanto para donos de restaurantes quanto para operadores.

Cada card do Bento possui:
1. **Container de Informações**: Badge de categoria sutil, ícone temático em destaque âmbar, título de alto impacto, descrição concisa e benefícios objetivos.
2. **Container Visual com Efeito Esmaecido**: Espaço dedicado para imagens/mockups de cada feature, com degradê suave de transição (`gradient fade` / máscara) que funde 50% da imagem diretamente na cor de fundo do card (`bg-neutral-900`), garantindo que o usuário possa plugar suas imagens personalizadas facilmente.
3. **Animações de Container e Scroll**:
   - `motion/react` para animações fluidas de container e microinterações de hover.
   - `gsap` + `ScrollTrigger` para revelação dinâmica sincronizada com a rolagem da página.

---

## 2. Metas, Não-Metas e Anti-Metas

### Metas (Goals)
- **Estrutura Bento Grid Asimétrica**:
  - **Card 1 (Destaque Grande / 8 cols)**: *App Completo do Cliente na Mesa (Zero Fricção)* — cardápio interativo, envio direto para cozinha, sem garçom na mesa.
  - **Card 2 (Médio / 4 cols)**: *Customização de Cartões de Comanda & QR Code* — personalização física e digital com token criptográfico seguro.
  - **Card 3 (Médio / 4 cols)**: *KDS Cozinha 100% Digital* — fila de preparo em tempo real, sem papel e sem atrasos.
  - **Card 4 (Destaque Grande / 8 cols)**: *Dashboard Gerencial & Métricas ao Vivo* — faturamento por hora, ticket médio, histórico e ocupação.
  - **Card 5 (Largo / 12 cols)**: *PIX Dinâmico com Baixa Automática (Asaas)* — pagamento na mesa em 15 segundos, divisão de conta e conciliação instantânea.
- **Efeito Visual Half-Faded Image**:
  - Imagens com overlay de gradiente direcional (`from-neutral-900 via-neutral-900/40 to-transparent`) que integra a arte perfeitamente à superfície do card.
  - Slot pronto e documentado para substituição das imagens finais pelo usuário.
- **Animações Profissionais**:
  - GSAP ScrollTrigger orquestrando o fade-up sequencial ao entrar na seção.
  - Motion controlando hover, microinterações e sombras.

### Não-Metas (Non-Goals)
- Não inclui formulários ou ações transacionais dentro dos cards do Bento Grid (os cards são expositivos e orientados a conversão).

### Anti-Metas (Anti-Goals)
- **Zero AI Slop**: Sem emojis em textos, sem gradientes roxos saturados, sem tags desnecessárias.

---

## 3. Arquitetura Técnica & Estrutura de Arquivos

- `lib/landing/features-data.ts`: Dados tipados das 5 features do Bento Grid (títulos, descrições, tags, ícones, especificações de slots de imagem).
- `components/landing/bento-card.tsx`: Componente de card individual do Bento Grid com container de informações e container de imagem com fade.
- `components/landing/features-section.tsx`: Orquestrador da seção `#recursos` com integração de GSAP e Motion.
- `tests/unit/landing-features.test.ts`: Testes unitários para a integridade dos dados e lógica da seção.
