# Especificação Técnica: Criptografia AES-256-GCM de Credenciais e Persistência de API Key no Onboarding

**Data**: 2026-11-04  
**Status**: Aprovado para Implementação  
**Módulo**: Segurança, Onboarding & Pagamentos Asaas

---

## 1. Objetivo & Escopo

### 1.1. Objetivo Geral
Implementar uma camada de criptografia simétrica reversível em repouso (**AES-256-GCM**) utilizando o módulo nativo `node:crypto` para proteger as chaves de API das subcontas do Asaas no Appwrite. Integrar essa camada ao Passo 3 do Onboarding (`actions/onboarding.ts`) para capturar a `apiKey` retornada na criação da subconta, cifrá-la antes da gravação e decifrá-la em memória exclusivamente no momento da emissão do PIX da mesa (`actions/client.ts`) e das operações financeiras de consulta de saldo e saque (`/settings`).

### 1.2. O que entra no escopo
1. **Utilitário de Criptografia Simétrica (`lib/security/encryption.ts`)**:
   - Cifra `aes-256-gcm` com IV aleatório de 12 bytes por operação e Authentication Tag de 16 bytes para garantia de integridade.
   - Derivação determinística de chave de 32 bytes via HKDF / SHA-256 a partir de `ENCRYPTION_KEY` ou segredos de ambiente existentes (`APPWRITE_API_KEY` / `ASAAS_API_KEY`).
   - Prefixo de versionamento `enc:v1:<iv>:<tag>:<ciphertext>` para identificação clara de dados cifrados.
   - Decifragem com fallback resiliente: se a string não possuir o prefixo `enc:v1:` (ex: chave legada já cadastrada em texto puro), o decifrador retorna o valor original sem lançar exceções.
2. **Captura e Cifra no Onboarding (`actions/onboarding.ts`)**:
   - No Passo 3, ao chamar `createAsaasSubaccount`, capturar o campo `apiKey` retornado pela API do Asaas.
   - Passar a chave por `encryptSecret()` antes de persistir em `establishments.asaasSubaccountApiKey`.
3. **Decifra Transparente no Fluxo de Pagamento PIX (`actions/client.ts`)**:
   - Na Server Action `requestPixCheckoutAction`, recuperar `establishment.asaasSubaccountApiKey`, decifrá-la com `decryptSecret()` e injetar a chave em texto claro somente nas chamadas autenticadas à API do Asaas.

### 1.3. O que fica de fora
- Armazenamento em HSM externo ou AWS KMS dedicado no MVP (o uso de chave de servidor gerenciada no ambiente com AES-256-GCM atende plenamente o padrão de segurança e evita complexidade de infraestrutura).

---

## 2. Pontos Críticos & Casos de Borda

1. **Variável de Ambiente Ausente**:
   - Se `ENCRYPTION_KEY` não estiver definida explicitamente no `.env.local`, o utilitário deriva a chave a partir de `APPWRITE_API_KEY` ou `ASAAS_API_KEY` de forma segura, evitando falhas silenciosas ou chaves nulas.
2. **Dados Antigos em Texto Puro no Banco**:
   - Se uma subconta existente já tiver uma chave gravada como texto puro (`$aact_...`), o decifrador detecta a ausência do prefixo `enc:v1:` e devolve o texto sem quebrar o fluxo.
3. **Chave Corrompida ou Adulterada**:
   - O modo GCM verifica a Authentication Tag. Qualquer alteração indevida de bits no banco dispara um erro controlado de integridade, impedindo o uso de credenciais corrompidas.

---

## 3. Impacto de Performance & Segurança

- **Zero Dependências Externas**: Utiliza a biblioteca C nativa `node:crypto` já compilada no Node.js.
- **Overhead Desprezível**: Operação de cifra/decifra AES-GCM leva menos de 0.05 ms por requisição.
- **Proteção Total em Repouso**: Mesmo com acesso completo de leitura ao Appwrite Database, as chaves das subcontas permanecem ilegíveis sem o segredo do servidor.
