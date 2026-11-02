import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signup } from '@/actions/auth';
import { AppwriteException } from 'node-appwrite';

const mockUsersCreate = vi.fn();
const mockUsersUpdatePrefs = vi.fn();
const mockUsersDelete = vi.fn();
const mockDatabasesCreateDocument = vi.fn();

vi.mock('@/lib/appwrite/server', () => ({
  createAdminClient: () => ({
    users: {
      create: mockUsersCreate,
      updatePrefs: mockUsersUpdatePrefs,
      delete: mockUsersDelete,
    },
    databases: {
      createDocument: mockDatabasesCreateDocument,
    },
  }),
}));

describe('Auth Server Actions - signup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function createValidFormData() {
    const formData = new FormData();
    formData.set('name', 'Lojista Teste');
    formData.set('email', 'novo@teste.com');
    formData.set('phone', '(61) 99131-4734');
    formData.set('cpf', '627.814.540-52');
    formData.set('password', 'Test12345#');
    formData.set('passwordConfirm', 'Test12345#');
    return formData;
  }

  it('should identify when phone number already exists and return clear phone error', async () => {
    const appwritePhoneError = new AppwriteException(
      'A user with the same phone already exists in your project.',
      409,
      'user_phone_already_exists',
    );
    mockUsersCreate.mockRejectedValue(appwritePhoneError);

    const result = await signup(undefined, createValidFormData());

    expect(result).toBeDefined();
    expect(result?.errors?.phone).toBeDefined();
    expect(result?.errors?.phone?.[0]).toContain('telefone');
    expect(result?.message).toContain('telefone');
    expect(result?.message).not.toContain('e-mail');
  });

  it('should identify when email already exists and return clear email error', async () => {
    const appwriteEmailError = new AppwriteException(
      'A user with the same email already exists in your project.',
      409,
      'user_email_already_exists',
    );
    mockUsersCreate.mockRejectedValue(appwriteEmailError);

    const result = await signup(undefined, createValidFormData());

    expect(result).toBeDefined();
    expect(result?.errors?.email).toBeDefined();
    expect(result?.errors?.email?.[0]).toContain('e-mail');
    expect(result?.message).toContain('e-mail');
  });

  it('should handle invalid phone number error clearly', async () => {
    const appwriteInvalidPhoneError = new AppwriteException(
      'Invalid phone number',
      400,
      'user_invalid_phone',
    );
    mockUsersCreate.mockRejectedValue(appwriteInvalidPhoneError);

    const result = await signup(undefined, createValidFormData());

    expect(result).toBeDefined();
    expect(result?.errors?.phone).toBeDefined();
  });
});
