import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { Client, Databases, Query } from 'node-appwrite';

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const db = new Databases(client);

const res = await db.listDocuments('kerokero', 'tables', [
  Query.equal('establishmentId', '6aeb8e7d000fc703d975'),
  Query.orderAsc('number'),
  Query.limit(20),
]);

console.log('Tables:');
for (const t of res.documents) {
  console.log(`Mesa ${t.number} ($id: ${t.$id}, token: ${t.token}, status: ${t.status})`);
}
