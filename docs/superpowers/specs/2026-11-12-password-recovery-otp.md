# Especificação Técnica: Fluxo de Redefinição de Senha via Código OTP (Recover with a Code)

**Data**: 2026-11-12  
**Status**: Aprovado para Implementação  
**Módulo**: Autenticação (`(auth)`), Segurança de Conta, UI Components & Template de E-mail

---

## 1. Objetivo & Escopo

Implementar o fluxo completo de redefinição de senha do lojista no Bempedi utilizando o método **Recover with a code** do Appwrite (`createRecoveryOTP` e `updateRecoveryOTP`), respeitando a identidade visual e as diretrizes Anti-AI Slop do projeto.

### 1.1. O que entra no escopo
1. **Atualização do SDK Web Appwrite (`appwrite`)**:
   - Atualizar `appwrite` de `^25.2.0` para `^29.2.0` (mantendo compatibilidade com `@appwrite.io/react` via `overrides`), habilitando nativamente `account.createRecoveryOTP` e `account.updateRecoveryOTP`.
2. **Rota Pública de Recuperação (`/esqueci-senha`)**:
   - Página dentro do route group `(auth)` (`app/(auth)/esqueci-senha/page.tsx`), compartilhando o layout split com `Brand` e `AuthShowcase`.
   - Link funcional *"Esqueceu a senha?"* em `LoginForm` (`/login`) apontando para `/esqueci-senha`.
   - Inclusão de `/esqueci-senha` nas rotas de autenticação em `proxy.ts` e `lib/auth/access-gate.ts`.
3. **Fluxo em Duas Etapas no Browser (Origin-Bound OTP-Token)**:
   - **Etapa 1 (Solicitar código)**:
     - Validação estrita de e-mail com Zod (`recoveryEmailSchema`).
     - Chamada direta via SDK do navegador (`useAppwrite().account.createRecoveryOTP({ email, phrase: true })`) para preservar o header `OTP-Token` vinculado à origem (suporte a autofill em clientes de e-mail e gerenciadores de senha).
     - Armazenamento em memória de `userId` (retornado no token) e eventual `phrase` de segurança (exibida apenas se não vazia).
     - Mensagem idêntica independentemente de existir conta ativa para o e-mail: *"Se existir uma conta para este e-mail, enviamos um código de 6 dígitos."*
   - **Etapa 2 (Código de 6 dígitos + Nova senha)**:
     - Componente `OtpInput` com 6 campos numéricos individuais:
       - Ao digitar um dígito, avança automaticamente para o próximo campo.
       - Ao colar (ou preencher via autofill `one-time-code`), extrai até 6 dígitos e completa todos os campos automaticamente.
       - Navegação completa por teclado (`Backspace`, `Delete`, `ArrowLeft`, `ArrowRight`, `Home`, `End`).
     - Campos de `Nova senha` e `Confirmar nova senha` validados via Zod (`recoveryResetSchema`, mínimo 8 e máximo 256 caracteres).
     - Reenvio do código com cooldown visual discreto (ex.: 60s) para evitar disparo acidental e rate limit.
     - Chamada a `account.updateRecoveryOTP({ userId, secret: code, password })`.
     - **Login automático pós-redefinição**: Como `updateRecoveryOTP` não cria sessão, executar `signIn.emailPassword({ email, password })` via `@appwrite.io/react` para gravar o cookie SSR e redirecionar para `/dashboard`.
4. **Template HTML de E-mail Tematizado**:
   - Template HTML table-based com CSS inline compatível com clientes de e-mail modernos e legados, seguindo exatamente a paleta Bempedi (`#FFFFFF`, `#F4F4F5`, `#E4E4E7`, `#121212`, `#F59E0B`), sem emojis ou gradientes saturados, pronto para uso no SMTP do Appwrite.
   - Armazenamento de gerador/constante e arquivo de referência (`lib/email/recovery-otp-template.ts`) e entrega no output final.
5. **Testes Automatizados (TDD)**:
   - Testes unitários para schemas Zod (`recoveryEmailSchema`, `recoveryResetSchema`), helpers de OTP (`sanitizeOtpDigits`, `applyOtpPaste`), normalização segura de erros (`normalizeRecoveryError`), `evaluateUserAccess` e integridade do template HTML de e-mail.

### 1.2. O que fica de fora
- Recuperação de senha via link de redirecionamento (`createRecovery` / `updateRecovery`).
- Alteração de senha de usuário já logado dentro do painel `/settings`.
- Envio de SMS ou WhatsApp OTP.

---

## 2. Pontos Críticos & Casos de Borda

1. **Prevenção de Enumeração de Contas (Account Enumeration)**:
   - Na Etapa 1, o Appwrite retorna um token com `userId` aleatório mesmo quando não há usuário ativo para o e-mail informado. A UI deve avançar normalmente para a Etapa 2 exibindo exatamente a mesma mensagem neutra.
   - Na Etapa 2, um código inválido/expirado/já usado retorna `user_invalid_token`, enquanto um e-mail sem conta retorna `user_not_found`. Ambos os erros devem produzir exatamente a **mesma mensagem genérica** (*"Código inválido ou expirado. Verifique o código ou solicite um novo."*).
2. **Rejeição de Senha pelas Políticas do Appwrite**:
   - Caso a nova senha falhe nas políticas de força, dicionário, histórico ou senhas vazadas (*breached passwords*), o código OTP de 6 dígitos **permanece válido**.
   - A aplicação NÃO pode limpar o código nem voltar o usuário para a Etapa 1: deve manter o `userId` e os 6 dígitos intactos, exibir a mensagem orientando a escolha de outra senha no campo de senha, e permitir reenvio com o mesmo código.
3. **Colagem e Autofill em Input de 6 Dígitos**:
   - Usuários frequentemente copiam códigos com espaços (`123 456`), hífens (`123-456`) ou texto ao redor. O sanitizador deve extrair apenas dígitos e preencher os 6 inputs sequencialmente.
   - Autofill nativo do navegador/iOS (`autocomplete="one-time-code"`) pode disparar `onChange` com os 6 dígitos de uma vez no primeiro input; o handler de mudança deve tratar strings com mais de 1 dígito com a mesma lógica da colagem.
4. **Falha no Login Automático Pós-Reset**:
   - Se `updateRecoveryOTP` tiver sucesso, a senha já foi alterada no Appwrite. Se o login automático subsequente (`signIn.emailPassword`) falhar por oscilação de rede ou rate limit, a UI deve informar claramente que a senha foi redefinida e oferecer botão/link direto para `/login` em vez de sugerir que o reset falhou.
5. **Tempo de Validade do Código**:
   - Códigos OTP de recuperação do Appwrite expiram em 15 minutos. Se o usuário voltar à Etapa 1 ou clicar em "Reenviar código", um novo `userId`/token deve substituir o anterior em memória.

---

## 3. Impacto de Performance

- **Zero Consultas ao Banco Próprio**: O fluxo utiliza diretamente os endpoints nativos de conta do Appwrite (`POST /account/recovery/otp` e `PUT /account/recovery/otp`) a partir do navegador, sem passar por Server Actions intermediárias nem consultar coleções no `Databases`.
- **Bundle Enxuto**: `OtpInput` e `ForgotPasswordForm` usam apenas React state/refs locais, `zod` (já no bundle de auth), `motion/react` (já utilizado em `LoginForm` e `SignupForm`) e `lucide-react`.

---

## 4. Segurança & Permissões

- **Validação Client-Side com Zod**: Validação estrita de formato de e-mail, exatamente 6 dígitos numéricos (`^\d{6}$`) e confirmação de senha antes de qualquer chamada de rede.
- **Origin-Bound `OTP-Token`**: Chamadas disparadas diretamente no browser garantem que o Appwrite anexe o cabeçalho `OTP-Token` vinculado à origem da aplicação.
- **Anti-Enumeração Estrita**: Respostas padronizadas tanto na criação quanto na confirmação do OTP (`user_invalid_token` e `user_not_found` unificados).
- **Sem Persistência Sensível**: `userId` temporário, código OTP e nova senha permanecem apenas em estado React efêmero (nunca salvos em `localStorage`, `sessionStorage` ou URL query string).
- **XSS / HTML Injection no Template de E-mail**: Template HTML estático com placeholders padrão Appwrite e zero execução de script.
