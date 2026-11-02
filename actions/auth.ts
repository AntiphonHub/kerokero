'use server';

import { ID, AppwriteException } from 'node-appwrite';
import { signupSchema, type AuthFormState } from '@/lib/schemas/auth';
import { createAdminClient } from '@/lib/appwrite/server';
import { appwriteConfig } from '@/lib/appwrite/config';
import { unmask } from '@/lib/masks';

export async function signup(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  try {
    const parsed = signupSchema.safeParse({
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      cpf: formData.get('cpf'),
      password: formData.get('password'),
      passwordConfirm: formData.get('passwordConfirm'),
    });

    if (!parsed.success) {
      return { errors: parsed.error.flatten().fieldErrors };
    }

    const { name, email, phone, cpf, password } = parsed.data;
    const rawCpf = unmask(cpf);
    const rawPhone = unmask(phone);
    const formattedPhone = rawPhone.length >= 10 ? `+55${rawPhone}` : undefined;

    let createdUserId: string | null = null;
    const { users, databases } = createAdminClient();

    // Etapa 1: Criar usuário no Appwrite
    try {
      const user = await users.create(
        ID.unique(),
        email,
        formattedPhone,
        password,
        name,
      );
      createdUserId = user.$id;

      // Também salvar nas preferências do usuário como redundância segura
      try {
        await users.updatePrefs(user.$id, {
          cpf: rawCpf,
          cpfFormatted: cpf,
          phone: rawPhone,
          phoneFormatted: phone,
        });
      } catch (prefError: unknown) {
        const prefMsg = prefError instanceof Error ? prefError.message : String(prefError);
        console.warn('Aviso: Não foi possível atualizar prefs:', prefMsg);
      }
    } catch (userError: unknown) {
      const msg = userError instanceof Error ? userError.message : String(userError);
      const errType =
        userError instanceof AppwriteException
          ? userError.type
          : userError && typeof userError === 'object' && 'type' in userError
            ? String((userError as { type: unknown }).type)
            : '';
      const lowerMsg = msg.toLowerCase();

      // 1. Checa conflito de telefone
      if (
        errType === 'user_phone_already_exists' ||
        msg.includes('phone_already_exists') ||
        (lowerMsg.includes('phone') && lowerMsg.includes('already exists'))
      ) {
        return {
          errors: { phone: ['Já existe uma conta com este telefone'] },
          message: 'Já existe uma conta cadastrada com este telefone',
        };
      }

      // 2. Checa conflito de e-mail
      if (
        errType === 'user_email_already_exists' ||
        msg.includes('email_already_exists') ||
        (lowerMsg.includes('email') && lowerMsg.includes('already exists'))
      ) {
        return {
          errors: { email: ['Já existe uma conta com este e-mail'] },
          message: 'Já existe uma conta cadastrada com este e-mail',
        };
      }

      // 3. Checa formato inválido de telefone
      if (
        errType === 'user_invalid_phone' ||
        lowerMsg.includes('invalid phone')
      ) {
        return {
          errors: { phone: ['Telefone inválido ou não suportado'] },
          message: 'Número de telefone inválido para cadastro',
        };
      }

      // 4. Checa limite de tentativas (rate limit)
      if (
        errType === 'general_rate_limit_exceeded' ||
        lowerMsg.includes('rate limit')
      ) {
        return {
          message: 'Muitas tentativas em pouco tempo. Aguarde alguns instantes e tente novamente.',
        };
      }

      // 5. Conflito genérico restante
      if (lowerMsg.includes('already exists') || msg.includes('user_already_exists')) {
        return { message: 'Já existe um cadastro com estas credenciais.' };
      }

      return { message: msg || 'Erro ao criar conta de usuário. Tente novamente.' };
    }

    // Etapa 2: Criar row/documento na tabela de Profile
    try {
      await databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.profiles,
        ID.unique(),
        {
          userId: createdUserId,
          cpf: rawCpf,
          phone: rawPhone,
        },
      );
    } catch (profileError: unknown) {
      const msg = profileError instanceof Error ? profileError.message : String(profileError);
      console.warn(`[Auth] Falha ao criar row em profiles: ${msg}. Executando rollback...`);

      // ROLLBACK: Deletar a conta criada se a etapa 2 falhar
      if (createdUserId) {
        try {
          await users.delete(createdUserId);
          console.log(`[Auth] Rollback concluído: usuário ${createdUserId} removido com sucesso.`);
        } catch (rollbackError: unknown) {
          const rollbackMsg =
            rollbackError instanceof Error ? rollbackError.message : String(rollbackError);
          console.warn(`[Auth] Falha no rollback do usuário ${createdUserId}: ${rollbackMsg}`);
        }
      }

      if (msg.includes('missing scopes') || msg.includes('documents.write')) {
        return {
          message:
            'Chave de API do Appwrite sem permissão para documentos. Habilite o escopo "documents.write" (e "documents.read") na sua API Key no console do Appwrite.',
        };
      }

      return {
        message: 'Erro ao criar o perfil do usuário. A conta foi desfeita por segurança (rollback).',
      };
    }

    return undefined;
  } catch (fatalError: unknown) {
    const fatalMsg = fatalError instanceof Error ? fatalError.message : String(fatalError);
    console.warn('[Auth] Erro inesperado no cadastro:', fatalMsg);
    return {
      message: 'Ocorreu um erro inesperado ao cadastrar. Tente novamente em instantes.',
    };
  }
}
