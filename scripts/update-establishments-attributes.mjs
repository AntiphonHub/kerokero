import { Client, Databases } from 'node-appwrite';
import dotenv from 'dotenv';
import { readFileSync, existsSync } from 'fs';

if (existsSync('.env.local')) {
  const envConfig = dotenv.parse(readFileSync('.env.local'));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const project = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;
const databaseId = process.env.APPWRITE_DATABASE_ID || 'kerokero';
const collectionId = process.env.APPWRITE_ESTABLISHMENTS_COLLECTION_ID || 'establishments';

const client = new Client().setEndpoint(endpoint).setProject(project).setKey(apiKey);
const databases = new Databases(client);

async function main() {
  console.log(`Checking attributes in ${databaseId}.${collectionId}...`);

  const attrs = [
    { type: 'boolean', key: 'happyHourEnabled', required: false, default: false },
    { type: 'string', key: 'happyHourDays', size: 255, required: false },
    { type: 'string', key: 'happyHourStartTime', size: 16, required: false },
    { type: 'string', key: 'happyHourEndTime', size: 16, required: false },
  ];

  for (const attr of attrs) {
    try {
      if (attr.type === 'boolean') {
        await databases.createBooleanAttribute(
          databaseId,
          collectionId,
          attr.key,
          attr.required,
          attr.default
        );
      } else {
        await databases.createStringAttribute(
          databaseId,
          collectionId,
          attr.key,
          attr.size,
          attr.required
        );
      }
      console.log(`Attribute '${attr.key}' created successfully.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('already exists')) {
        console.log(`Attribute '${attr.key}' already exists.`);
      } else {
        console.error(`Error creating attribute '${attr.key}':`, msg);
      }
    }
  }

  console.log('Finished updating establishments attributes.');
}

main().catch(console.error);
