import { redirect } from 'next/navigation';
import { getSession } from '@/lib/appwrite/session';

export const instant = false;

export default async function HomePage() {
  const session = await getSession();

  if (session) {
    redirect('/dashboard');
  }

  redirect('/login');
}
