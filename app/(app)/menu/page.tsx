import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { getLoggedInUser } from '@/lib/appwrite/session';
import { getEstablishmentByUserId } from '@/lib/appwrite/establishments';
import {
  getProductsByEstablishment,
  getCategoriesByEstablishment,
} from '@/lib/appwrite/products';
import { MenuView } from '@/components/menu/menu-view';

export const instant = false;

export const metadata = {
  title: 'Cardápio & Produtos | Bempedi',
  description: 'Gerencie o catálogo de produtos e cardápio digital do seu estabelecimento.',
};

export default async function MenuPage() {
  await connection();
  const user = await getLoggedInUser();
  if (!user) {
    redirect('/login');
  }

  const establishment = await getEstablishmentByUserId(user.$id);
  if (!establishment) {
    redirect('/onboarding/loja');
  }

  const [products, categories] = await Promise.all([
    getProductsByEstablishment(establishment.$id),
    getCategoriesByEstablishment(establishment.$id),
  ]);

  let happyDays: string[] = ['qua', 'qui', 'sex'];
  if (establishment.happyHourDays) {
    try {
      happyDays = JSON.parse(establishment.happyHourDays);
    } catch {
      // fallback
    }
  }

  const happyHourConfig = {
    enabled: Boolean(establishment.happyHourEnabled),
    days: happyDays,
    startTime: establishment.happyHourStartTime || '17:00',
    endTime: establishment.happyHourEndTime || '20:00',
  };

  return (
    <MenuView
      initialProducts={products}
      initialCategories={categories}
      initialHappyHourConfig={happyHourConfig}
    />
  );
}
