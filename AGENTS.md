<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# KeroKero - Comanda Digital Inteligente na Mesa

## 1. Visão Geral do Produto
O **KeroKero** é uma plataforma SaaS de autoatendimento e comanda digital para bares, restaurantes e estabelecimentos gastronômicos. O objetivo principal é transformar a experiência de consumo na mesa, eliminando atritos de atendimento, acelerando o ciclo de pedidos, otimizando a operação da equipe e impulsionando o faturamento do lojista através de inteligência de vendas.

---

## 2. Pilares de Design & Experiência (Anti-AI Slop)
- **Identidade Visual**: Clean, sofisticada e direta, sem ornamentos excessivos ou poluição visual.
- **Tolerância Zero a AI Slop**:
  - **Sem Badges Desnecessárias**: Nada de encher a interface de tags coloridas decorativas sem utilidade prática.
  - **Sem Gradientes Saturados**: Use superfícies sólidas, neutras e com contraste preciso.
  - **Sem Emojis**: Não utilize emojis em textos de interface, labels de botões ou documentação técnica. Use ícones SVG bem pensados e padronizados quando estritamente necessário.
  - **Textos Curtos e Diretos**: Evite parágrafos didáticos longos, explicações prolixas ou mensagens óbvias. A interface deve ser autoexplicativa pela clareza dos fluxos.
- **Paleta de Cores**:
  - Fundo & Superfícies: Branco (`#FFFFFF`) e Cinzas Neutros (`#F4F4F5`, `#E4E4E7`).
  - Textos & Ações Primárias: Preto profundo (`#121212`).
  - Cor de Destaque: Amarelo Âmbar (`#F59E0B`).
- **Zero Fricção no Mobile**: O cliente na mesa acessa via web/PWA escaneando o QR Code sem a obrigação de instalar aplicativo nativo.

---

## 3. Diretrizes de Engenharia e Princípios de Desenvolvimento

### 3.1. Simplicidade Primeiro (Anti Over-Engineering)
- **Pense Antes de Codificar**: Sempre antes de escrever qualquer código, pare e questione: *"Realmente precisamos de tudo isso?"*.
- **Código Mínimo que Resolve o Problema**: Evite criar abstrações prematuras, camadas desnecessárias de indireção ou configurações flexíveis para casos que nunca vão existir. Se 30 linhas resolvem com clareza, não escreva 150.
- **Foco Cirúrgico**: Faça apenas as alterações necessárias para a tarefa atual.

### 3.2. Segurança em Primeiro Lugar (Security First)
- **Validação Rigorosa**: Nunca confie em dados do cliente. Valide todos os payloads de entrada e saída com schemas Zod estritos.
- **Controle de Acesso no Backend**: Use o SDK Server do Appwrite (`node-appwrite`) com chaves de API restritas e permissões granulares por role/sessão.
- **Integridade da Sessão de Mesa**: Tokens temporários e assinados para prevenir acesso indevido ou manipulação de comandas por usuários fora do estabelecimento.
- **Proteção Financeira**: Idempotência em transações, validação estrita de webhooks de pagamento (verificação de assinatura e origem) e trava contra pagamentos duplicados.

### 3.3. Spec-First (Especificação Técnica Prévia Obrigatória)
- Antes de iniciar o desenvolvimento de qualquer feature, é **obrigatório escrever uma especificação técnica** (`spec`).
- A spec deve analisar:
  1. **Objetivo & Escopo**: O que entra e o que fica de fora.
  2. **Pontos Críticos & Casos de Borda**: Onde o fluxo pode falhar e como deve se comportar.
  3. **Impacto de Performance**: Gargalos potenciais, payload de rede, quantidade de queries/operações e tempo de resposta.
  4. **Segurança & Permissões**: Vetores de vulnerabilidade e como serão mitigados.

### 3.4. Testes Automatizados Antes da Feature (TDD)
- **Test-First**: Escreva testes automatizados antes de desenvolver a funcionalidade.
- Garanta que os testes cubram fluxos felizes, falhas esperadas, validações de schema e comportamentos de segurança antes de considerar a feature concluída.

---

## 4. Personas & Módulos da Aplicação

### 4.1. Consumidor (Mesa / Mobile First)
- **Abertura de Comanda via QR Code (Zero Fricção / Guest-First)**:
  - Leitura do código exclusivo da mesa com token assinado.
  - O cliente informa **apenas seu Apelido** (ex: "Carlos") para entrar instantaneamente na comanda. Sem login obrigatório para o consumidor.
- **Sessão Coletiva na Mesa**:
  - Múltiplos participantes entram na mesma comanda/mesa simultaneamente.
  - Separação clara de itens por participante (quem pediu o quê) e visão consolidada da mesa.
- **Cardápio Digital Interativo**:
  - Categorias, fotos reais, descrições claras, opções de personalização (ponto da carne, adicionais, remoção de ingredientes).
- **Envio de Pedidos (Padrão de Mercado)**:
  - Envio direto para o KDS da cozinha para máxima agilidade operacional.
  - Trava de confirmação e janela de segurança (grace period de 30-45s para cancelamento imediato antes de iniciar o preparo).
  - Modo configurável pelo lojista: Envio direto vs. Aprovação prévia do garçom.
- **Upsell Inteligente**:
  - Sugestões contextuais de combinações no carrinho e timing-based (sobremesas e bebidas sugeridas após o prato principal).
- **Serviços Rápidos**:
  - Botão "Chamar Garçom" com solicitações rápidas ("Trazer gelo/talher", "Dúvida no cardápio", etc.).
- **Fechamento e Pagamento Realista**:
  - Divisão de conta flexível: pagar apenas seus itens, dividir igualmente ou pagar conta total.
  - **PIX Dinâmico na Tela via Asaas**: Copia-e-cola e QR Code direto no celular do cliente com confirmação instantânea via webhook.
  - **Maquininha na Mesa**: Opção de chamar o garçom com a maquininha física (Débito, Crédito ou VR) com o valor exato selecionado.

### 4.2. Lojista / Painel Administrativo (Desktop & Tablet)
- **Autenticação Segura**: Login e cadastro com credenciais completas (E-mail, Senha, Nome, Telefone, CPF/CNPJ).
- **Configuração da Loja & Mesas**:
  - Cadastro do estabelecimento, horários e identidade.
  - Criação e gestão do mapa de mesas com geração de QR Codes com tokens seguros.
- **Gestão de Cardápio (Menu Engineering)**:
  - Produtos, categorias, complementos/adicionais, disponibilidade em tempo real e regras de upsell.
- **Monitor de Mesas em Tempo Real**:
  - Status ao vivo: Livre, Ocupada, Chamando Garçom, Aguardando Maquininha, Conta Paga.
- **Dashboards & Inteligência de Negócio**:
  - Faturamento diário/semanal/mensal, ticket médio por mesa e por consumidor, permanência na mesa, pratos mais vendidos e conversão de upsell.

### 4.3. Operação (Garçom & Cozinha / KDS 100% Digital)
- **Operação Digital no MVP**: 100% digital em telas (tablets/smartphones/monitores), sem dependência inicial de impressoras térmicas físicas.
- **Painel do Garçom**:
  - Alertas sonoros e visuais em tempo real (chamados de mesa, pedidos de maquininha com valor pré-calculado).
- **KDS (Kitchen Display System)**:
  - Fila de pedidos recebidos em tempo real, organizados por mesa e tempo de espera, com avanço de status (Recebido → Em Preparo → Pronto para Servir).

---

## 5. Arquitetura Técnica & Stack
- **Framework**: Next.js (App Router) + React 19 + TypeScript.
- **Backend & BaaS**: Appwrite (`node-appwrite` no backend para autenticação, banco de dados, storage, realtime e server actions/endpoints seguros).
- **Gateway de Pagamento**: Asaas (Cobranças PIX dinâmicas, conciliação e webhooks com verificação de assinatura).
- **Estilização & UI**: Tailwind CSS v4 + shadcn/ui (componentes acessíveis, limpos e sem over-styling).
- **Animações**: `motion` (Motion for React) para transições e microinterações discretas e funcionais.
- **Validação de Schemas**: Zod para tipagem estrita e validação em tempo de execução de formulários e payloads de API.
- **Testes Automatizados**: Vitest / React Testing Library para execução rápida de testes unitários e de integração antes de cada feature.
- **Comunicação em Tempo Real**: WebSockets / Server-Sent Events / Appwrite Realtime para atualização instantânea de comandas, chamados de garçom e status no KDS.

