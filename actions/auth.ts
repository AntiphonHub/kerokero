'use server';

import { ID } from 'node-appwrite';
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
      if (
        msg.includes('already exists') ||
        msg.includes('user_already_exists') ||
        msg.includes('email_already_exists')
      ) {
        return { message: 'Já existe uma conta com este e-mail' };
      }
      if (msg.includes('phone_already_exists')) {
        return { message: 'Já existe uma conta com este telefone' };
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
