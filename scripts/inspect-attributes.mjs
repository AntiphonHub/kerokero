import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { Client, Databases } from 'node-appwrite';

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const db = new Databases(client);

const collections = ['categories', 'products', 'tables', 'table_sessions', 'service_calls', 'orders'];

for (const col of collections) {
  try {
    const c = await db.getCollection('kerokero', col);
    console.log(`\n=== Collection: ${col} ===`);
    console.log(c.attributes.map(a => `${a.key} (${a.type}${a.required ? ', req' : ''})`).join(', '));
  } catch (e) {
    console.error(`Collection ${col} error:`, e.message);
  }
}
