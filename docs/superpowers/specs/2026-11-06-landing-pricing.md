# Especificação Técnica: Landing Page - Seção Preço (`#preco`)

**Data**: 2026-11-06  
**Status**: Aprovado  
**Módulo**: Landing Page Pública / Seção de Preço

---

## 1. Visão Geral & Intenção (The Why)

A seção de **Preço** (`#preco`) apresenta o modelo comercial do KeroKero com máxima transparência e simplicidade. 

O produto opera sob o modelo de **Mensalidade Única ("Pagou, Usou")**:
- **Valor**: **R$ 149,00 / mês**
- **Sem planos fragmentados**: Todas as funcionalidades da plataforma inclusas.
- **Sem versão gratuita/freemium**: Acesso integral após assinatura.
- **Sem fidelidade ou taxa de setup**: Cancelamento flexível a qualquer momento.

A proposta de valor é clara: por um valor mensal acessível e fixo, o restaurante substitui impressoras térmicas, reduz custos com equipes sobrecarregadas e acelera o ciclo de pedidos e pagamentos.

---

## 2. Metas, Não-Metas e Anti-Metas

### Metas (Goals)
- **Apresentação em Card Único de Alto Impacto**:
  - Destaque claro de valor: **R$ 149** com sufixo **/ mês**.
  - Relação concisa de tudo o que está incluso:
    - Mesas e comandas ilimitadas no salão.
    - App do cliente na mesa via QR Code (Zero Fricção).
    - KDS da cozinha 100% digital em tempo real.
    - Painel executivo com métricas financeiras e de operação.
    - PIX dinâmico integrado via Asaas com baixa instantânea.
    - Suporte direto e sem taxa de adesão ou fidelidade.
- **CTA Direto para Cadastro**:
  - Botão de ação primário levando a `/signup` (ou `/dashboard` para usuários já autenticados).
- **Atualização da Navegação**:
  - Atualizar o link no header de "Planos" para "Preço" apontando para `#preco`.

### Não-Metas (Non-Goals)
- Não inclui comparadores de tabelas de planos múltiplos ou seletores de ciclo anual/mensal (o modelo é mensalidade única de R$ 149,00).

### Anti-Metas (Anti-Goals)
- **Zero AI Slop**: Sem emojis em listas ou títulos, sem badges saturadas, textos curtos e transparentes.

---

## 3. Arquitetura Técnica & Estrutura de Arquivos

- `lib/landing/pricing-data.ts`: Dados tipados da seção de preço (título, descrição, valor, periodicidade, lista de benefícios e CTA).
- `components/landing/pricing-section.tsx`: Componente isolado da seção de Preço com estilização refinada.
- `components/landing/landing-header.tsx`: Atualização do rótulo de navegação de "Planos" para "Preço" (`#preco`).
- `tests/unit/landing-pricing.test.ts`: Testes unitários para validar os dados e regras de negócio da precificação.
