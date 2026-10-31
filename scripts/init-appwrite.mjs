import { Client, Databases, Permission, Role } from 'node-appwrite';
import dotenv from 'dotenv';
import { readFileSync, existsSync } from 'fs';

// Load .env.local
if (existsSync('.env.local')) {
  const envConfig = dotenv.parse(readFileSync('.env.local'));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const project = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;

console.log('Appwrite Endpoint:', endpoint);
console.log('Appwrite Project:', project);

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(project)
  .setKey(apiKey);

const databases = new Databases(client);

async function init() {
  const databaseId = 'kerokero';
  const collectionId = 'profiles';

  // 1. Check or create database
  try {
    await databases.get(databaseId);
    console.log(`Database '${databaseId}' already exists.`);
  } catch (err) {
    console.log(`Creating database '${databaseId}'...`);
    await databases.create(databaseId, 'KeroKero');
    console.log(`Database '${databaseId}' created.`);
  }

  // 2. Check or create profiles collection
  try {
    await databases.getCollection(databaseId, collectionId);
    console.log(`Collection '${collectionId}' already exists.`);
  } catch (err) {
    console.log(`Creating collection '${collectionId}'...`);
    await databases.createCollection(
      databaseId,
      collectionId,
      'Profiles',
      [
        Permission.read(Role.users()),
        Permission.create(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users()),
      ]
    );
    console.log(`Collection '${collectionId}' created.`);

    // 3. Create attributes
    console.log('Creating attributes...');
    await databases.createStringAttribute(databaseId, collectionId, 'userId', 255, true);
    await databases.createStringAttribute(databaseId, collectionId, 'cpf', 32, true);
    await databases.createStringAttribute(databaseId, collectionId, 'phone', 32, false);
    console.log('Attributes created successfully.');
  }
}

init().catch(console.error);
