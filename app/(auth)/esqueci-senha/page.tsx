import type { Metadata } from 'next';
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';

export const instant = false;

export const metadata: Metadata = {
  title: 'Redefinir senha | Bempedi',
  description: 'Recupere o acesso à sua conta Bempedi com código de 6 dígitos',
};

export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-col">
      <ForgotPasswordForm />
    </div>
  );
}
