import type { Metadata } from 'next';
import { SignupForm } from '@/components/auth/signup-form';

export const instant = false;

export const metadata: Metadata = {
  title: 'Criar conta | KeroKero',
  description: 'Preencha os campos para acessar sua comanda',
};

export default function CadastroPage() {
  return (
    <div className="flex flex-col">
      <div className="mb-6">
        <h1 className="text-[30px] lg:text-[32px] font-extrabold tracking-[-0.035em] text-zinc-900 leading-tight mb-1">
          Criar sua conta
        </h1>
        <p className="text-[14px] lg:text-[15px] text-zinc-400 font-medium tracking-tight">
          Preencha os campos para acessar sua comanda
        </p>
      </div>

      <SignupForm />
    </div>
  );
}
