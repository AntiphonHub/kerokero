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

if (!endpoint || !project || !apiKey) {
  console.error('Missing Appwrite environment variables in .env.local');
  process.exit(1);
}

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(project)
  .setKey(apiKey);

const databases = new Databases(client);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function createAttributeSafely(fn, desc) {
  try {
    await fn();
    console.log(`Attribute created: ${desc}`);
    await sleep(400);
  } catch (err) {
    if (err.code === 409) {
      console.log(`Attribute already exists: ${desc}`);
    } else {
      console.warn(`Warning creating attribute ${desc}:`, err.message);
    }
  }
}

async function createIndexSafely(fn, desc) {
  try {
    await fn();
    console.log(`Index created: ${desc}`);
    await sleep(400);
  } catch (err) {
    if (err.code === 409) {
      console.log(`Index already exists: ${desc}`);
    } else {
      console.warn(`Warning creating index ${desc}:`, err.message);
    }
  }
}

async function initOrdersCollection() {
  const databaseId = process.env.APPWRITE_DATABASE_ID || 'kerokero';
  const ordersCollectionId = process.env.APPWRITE_ORDERS_COLLECTION_ID || 'orders';

  // 1. Ensure database exists
  try {
    await databases.get(databaseId);
    console.log(`Database '${databaseId}' exists.`);
  } catch {
    console.log(`Creating database '${databaseId}'...`);
    await databases.create(databaseId, 'KeroKero');
    console.log(`Database '${databaseId}' created.`);
  }

  // 2. Setup Orders Collection
  try {
    await databases.getCollection(databaseId, ordersCollectionId);
    console.log(`Collection '${ordersCollectionId}' already exists.`);
  } catch {
    console.log(`Creating collection '${ordersCollectionId}'...`);
    await databases.createCollection(
      databaseId,
      ordersCollectionId,
      'Pedidos',
      [
        Permission.read(Role.any()),
        Permission.create(Role.any()),
        Permission.update(Role.any()),
        Permission.delete(Role.users()),
      ]
    );
    console.log(`Collection '${ordersCollectionId}' created.`);
  }

  console.log('Ensuring attributes for orders collection...');
  await createAttributeSafely(() => databases.createStringAttribute(databaseId, ordersCollectionId, 'establishmentId', 255, true), 'establishmentId');
  await createAttributeSafely(() => databases.createStringAttribute(databaseId, ordersCollectionId, 'tableId', 255, true), 'tableId');
  await createAttributeSafely(() => databases.createIntegerAttribute(databaseId, ordersCollectionId, 'tableNumber', true), 'tableNumber');
  await createAttributeSafely(() => databases.createStringAttribute(databaseId, ordersCollectionId, 'sessionId', 255, true), 'sessionId');
  await createAttributeSafely(() => databases.createStringAttribute(databaseId, ordersCollectionId, 'participantId', 255, true), 'participantId');
  await createAttributeSafely(() => databases.createStringAttribute(databaseId, ordersCollectionId, 'participantName', 255, true), 'participantName');
  await createAttributeSafely(() => databases.createStringAttribute(databaseId, ordersCollectionId, 'productId', 255, true), 'productId');
  await createAttributeSafely(() => databases.createStringAttribute(databaseId, ordersCollectionId, 'productName', 255, true), 'productName');
  await createAttributeSafely(() => databases.createIntegerAttribute(databaseId, ordersCollectionId, 'unitPrice', true, 0, 100000000), 'unitPrice');
  await createAttributeSafely(() => databases.createIntegerAttribute(databaseId, ordersCollectionId, 'quantity', true, 1, 10000), 'quantity');
  await createAttributeSafely(() => databases.createIntegerAttribute(databaseId, ordersCollectionId, 'totalPrice', true, 0, 100000000), 'totalPrice');
  await createAttributeSafely(() => databases.createStringAttribute(databaseId, ordersCollectionId, 'notes', 1000, false), 'notes');
  await createAttributeSafely(() => databases.createStringAttribute(databaseId, ordersCollectionId, 'selectedOptions', 2000, false), 'selectedOptions');
  await createAttributeSafely(() => databases.createStringAttribute(databaseId, ordersCollectionId, 'status', 50, false, 'pending'), 'status');
  await createAttributeSafely(() => databases.createStringAttribute(databaseId, ordersCollectionId, 'createdAt', 255, true), 'createdAt');

  // Wait for attributes to become available
  console.log('Waiting for attributes to settle...');
  await sleep(2500);

  console.log('Ensuring indexes for orders collection...');
  await createIndexSafely(() => databases.createIndex(databaseId, ordersCollectionId, 'idx_orders_session', 'key', ['sessionId'], ['ASC']), 'idx_orders_session');
  await createIndexSafely(() => databases.createIndex(databaseId, ordersCollectionId, 'idx_orders_table', 'key', ['tableId'], ['ASC']), 'idx_orders_table');
  await createIndexSafely(() => databases.createIndex(databaseId, ordersCollectionId, 'idx_orders_establishment', 'key', ['establishmentId'], ['ASC']), 'idx_orders_establishment');

  console.log('Orders collection successfully initialized in Appwrite!');
}

initOrdersCollection().catch((err) => {
  console.error('Fatal initialization error:', err);
  process.exit(1);
});
