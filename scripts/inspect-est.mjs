import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { Client, Databases, Query } from 'node-appwrite';

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const db = new Databases(client);

try {
  const est = await db.getDocument('kerokero', 'establishments', '6aeb8e7d000fc703d975');
  console.log('Establishment:', {
    id: est.$id,
    name: est.name,
    segment: est.segment,
    userId: est.userId,
    status: est.status,
    subscriptionStatus: est.subscriptionStatus,
  });

  // Checar mesas existentes
  const tables = await db.listDocuments('kerokero', 'tables', [
    Query.equal('establishmentId', '6aeb8e7d000fc703d975'),
    Query.limit(25),
  ]);
  console.log('Tables count:', tables.total);

  // Checar categorias existentes
  const categories = await db.listDocuments('kerokero', 'categories', [
    Query.equal('establishmentId', '6aeb8e7d000fc703d975'),
  ]);
  console.log('Categories count:', categories.total);

  // Checar produtos existentes
  const products = await db.listDocuments('kerokero', 'products', [
    Query.equal('establishmentId', '6aeb8e7d000fc703d975'),
  ]);
  console.log('Products count:', products.total);

  // Checar pedidos existentes
  const orders = await db.listDocuments('kerokero', 'orders', [
    Query.equal('establishmentId', '6aeb8e7d000fc703d975'),
    Query.limit(10),
  ]);
  console.log('Orders count:', orders.total);

} catch (err) {
  console.error('Error:', err);
}
