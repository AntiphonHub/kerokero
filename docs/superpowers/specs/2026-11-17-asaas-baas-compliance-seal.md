# Especificação Técnica: Implementação do Selo de Conformidade BaaS Asaas

## 1. Objetivo & Escopo

### 1.1. Objetivo
Implementar a exibição do selo oficial homologado de Banking as a Service (BaaS) do Asaas (`https://baas.asaas.com/selos/Servicos_financeiros_Asaas-Reduzida-Positivo.svg?id=aaa17caf-5100-4b58-bffc-4f1fb50bd390`) em estrita conformidade com o **Playbook de BaaS para Clientes Asaas** e a **Resolução Conjunta nº 16/2025 do Banco Central**.

### 1.2. O que entra no escopo
1. **Componente Reutilizável (`AsaasSeal`)**:
   - Componente dedicado, tipado e com opções de tamanho (padrão 160x48 conforme Slide 13/14 do Playbook, ou compacto 128x38 para modais mobile).
   - Link de redirecionamento seguro para `https://asaas.com` com `target="_blank"` e `rel="noopener noreferrer"`.
   - Garantia de envio do Referer para a CDN do Asaas (sem `referrerPolicy="no-referrer"` na tag `img`, viabilizando a validação automatizada de compliance do Asaas).
2. **Posicionamento Estratégico & Discreto**:
   - **Criação de Subconta** (`components/onboarding/step-subconta-form.tsx`): Posicionado junto à caixa de conformidade regulatória / rodapé do formulário de subconta (conforme exemplo do Slide 10 do Playbook).
   - **Gestão de Carteira & Saques** (`components/wallet/wallet-view.tsx`): Posicionado de forma sutil no rodapé do painel de transferências/carteira e no card de validação regulatória KYC.
   - **Modal de Pagamento PIX do Consumidor** (`components/client/pix-modal.tsx`): Posicionado discretamente no rodapé da etapa do QR Code PIX, deixando transparente a liquidação financeira sem poluir a experiência da mesa.
3. **Design & Diretrizes Anti-AI Slop**:
   - Sem poluição visual, sem badges chamativas ou ornamentos desnecessários.
   - Encaixe harmonioso com o design system minimalista da aplicação (preto/branco/cinzas neutros/âmbar).

### 1.3. O que fica fora do escopo
- Nenhuma alteração nas regras de negócio de criação de subconta, cobrança ou webhooks.
- Não carregar imagens locais estáticas que bypassassem o parâmetro `?id=...` fornecido pelo Asaas (a CDN remota precisa receber a requisição com o ID da conta do cliente).

---

## 2. Pontos Críticos & Casos de Borda

1. **Falha de Carregamento da Imagem Remota da CDN**:
   - Se a CDN do Asaas oscilar ou o cliente estiver offline temporariamente, a tag `img` possui texto alternativo claro (`alt="Selo Banco Asaas"`) e dimensões fixas (`width`/`height`) para evitar Cumulative Layout Shift (CLS).
2. **Restrição de Referrer**:
   - O Playbook pontua expressamente (Slide 14): *"Para \<img não utilize políticas que restrinjam o envio do Refferer (no-referrer) pois isso impede que o Asaas verifique se sua aplicação carregou o selo corretamente"*. O componente garante a ausência de atributos que bloqueiem o cabeçalho.
3. **Responsividade Mobile**:
   - Na tela do consumidor na mesa (dispositivo móvel de ~360px a 390px de largura), o selo no modal PIX deve ser compacto para não exigir scroll forçado e não deslocar o botão de cópia do PIX.

---

## 3. Impacto de Performance

- **Payload de Rede**: O SVG remoto é leve (< 5KB), vetorial e cacheado via CDN do Asaas.
- **Renderização**: Zero queries de banco de dados, componente puramente visual sem estados complexos ou re-renders desnecessários.
- **Dimensões intrínsecas**: `width` e `height` especificados explicitamente previnem layout shifts.

---

## 4. Segurança & Permissões

- **Proteção contra Tabnabbing**: A tag `<a>` externa possui obrigatoriamente `rel="noopener noreferrer"`.
- **Origem Segura**: O endpoint da imagem é HTTPS estrito em domínio oficial (`baas.asaas.com`).
- **Validação Regulatória**: Atende diretamente à Resolução Conjunta nº 16/2025 do Bacen, protegendo a plataforma contra penalidades de descaracterização de instituição de pagamento.
