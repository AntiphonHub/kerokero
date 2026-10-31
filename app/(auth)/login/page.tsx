import type { Metadata } from 'next';
import { LoginForm } from '@/components/auth/login-form';

export const instant = false;

export const metadata: Metadata = {
  title: 'Entrar | KeroKero',
  description: 'Comanda digital na mesa',
};

export default function LoginPage() {
  return (
    <div className="flex flex-col">
      <div className="mb-7">
        <h1 className="text-[32px] lg:text-[34px] font-extrabold tracking-[-0.035em] text-zinc-900 leading-tight mb-1.5">
          Entrar no KeroKero
        </h1>
        <p className="text-[16px] lg:text-[17px] text-zinc-400 font-medium tracking-tight">
          Comanda digital na mesa
        </p>
      </div>

      <LoginForm />
    </div>
  );
}
