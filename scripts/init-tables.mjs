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

async function initTablesAndCalls() {
  const databaseId = process.env.APPWRITE_DATABASE_ID || 'kerokero';
  const tablesCollectionId = process.env.APPWRITE_TABLES_COLLECTION_ID || 'tables';
  const serviceCallsCollectionId = process.env.APPWRITE_SERVICE_CALLS_COLLECTION_ID || 'service_calls';
  const tableSessionsCollectionId = process.env.APPWRITE_TABLE_SESSIONS_COLLECTION_ID || 'table_sessions';

  // 1. Ensure database exists
  try {
    await databases.get(databaseId);
    console.log(`Database '${databaseId}' exists.`);
  } catch (err) {
    console.log(`Creating database '${databaseId}'...`);
    await databases.create(databaseId, 'KeroKero');
    console.log(`Database '${databaseId}' created.`);
  }

  // 2. Setup Tables Collection
  try {
    await databases.getCollection(databaseId, tablesCollectionId);
    console.log(`Collection '${tablesCollectionId}' already exists.`);
  } catch (err) {
    console.log(`Creating collection '${tablesCollectionId}'...`);
    await databases.createCollection(
      databaseId,
      tablesCollectionId,
      'Mesas',
      [
        Permission.read(Role.any()),
        Permission.create(Role.users()),
        Permission.update(Role.any()),
        Permission.delete(Role.users()),
      ]
    );
    console.log(`Collection '${tablesCollectionId}' created.`);
  }

  console.log('Ensuring attributes for tables...');
  await createAttributeSafely(() => databases.createStringAttribute(databaseId, tablesCollectionId, 'establishmentId', 255, true), 'establishmentId');
  await createAttributeSafely(() => databases.createIntegerAttribute(databaseId, tablesCollectionId, 'number', true), 'number');
  await createAttributeSafely(() => databases.createStringAttribute(databaseId, tablesCollectionId, 'label', 255, true), 'label');
  await createAttributeSafely(() => databases.createStringAttribute(databaseId, tablesCollectionId, 'token', 255, true), 'token');
  await createAttributeSafely(() => databases.createStringAttribute(databaseId, tablesCollectionId, 'status', 50, true), 'status');
  await createAttributeSafely(() => databases.createStringAttribute(databaseId, tablesCollectionId, 'activeSessionId', 255, false), 'activeSessionId');
  await createAttributeSafely(() => databases.createIntegerAttribute(databaseId, tablesCollectionId, 'currentTotal', false, 0, 100000000, 0), 'currentTotal');
  await createAttributeSafely(() => databases.createStringAttribute(databaseId, tablesCollectionId, 'lastActivityAt', 255, false), 'lastActivityAt');
  await createAttributeSafely(() => databases.createStringAttribute(databaseId, tablesCollectionId, 'serviceCallReason', 255, false), 'serviceCallReason');
  await createAttributeSafely(() => databases.createBooleanAttribute(databaseId, tablesCollectionId, 'isActive', false, true), 'isActive');

  // 3. Setup Service Calls Collection
  try {
    await databases.getCollection(databaseId, serviceCallsCollectionId);
    console.log(`Collection '${serviceCallsCollectionId}' already exists.`);
  } catch (err) {
    console.log(`Creating collection '${serviceCallsCollectionId}'...`);
    await databases.createCollection(
      databaseId,
      serviceCallsCollectionId,
      'Chamados de Serviço',
      [
        Permission.read(Role.any()),
        Permission.create(Role.any()),
        Permission.update(Role.any()),
        Permission.delete(Role.users()),
      ]
    );
    console.log(`Collection '${serviceCallsCollectionId}' created.`);
  }

  console.log('Ensuring attributes for service_calls...');
  await createAttributeSafely(() => databases.createStringAttribute(databaseId, serviceCallsCollectionId, 'establishmentId', 255, true), 'establishmentId');
  await createAttributeSafely(() => databases.createStringAttribute(databaseId, serviceCallsCollectionId, 'tableId', 255, true), 'tableId');
  await createAttributeSafely(() => databases.createIntegerAttribute(databaseId, serviceCallsCollectionId, 'tableNumber', true), 'tableNumber');
  await createAttributeSafely(() => databases.createStringAttribute(databaseId, serviceCallsCollectionId, 'sessionId', 255, false), 'sessionId');
  await createAttributeSafely(() => databases.createStringAttribute(databaseId, serviceCallsCollectionId, 'type', 50, true), 'type');
  await createAttributeSafely(() => databases.createStringAttribute(databaseId, serviceCallsCollectionId, 'description', 255, false), 'description');
  await createAttributeSafely(() => databases.createStringAttribute(databaseId, serviceCallsCollectionId, 'requestedBy', 255, true), 'requestedBy');
  await createAttributeSafely(() => databases.createStringAttribute(databaseId, serviceCallsCollectionId, 'status', 50, true), 'status');

  // 4. Setup Table Sessions Collection
  try {
    await databases.getCollection(databaseId, tableSessionsCollectionId);
    console.log(`Collection '${tableSessionsCollectionId}' already exists.`);
  } catch (err) {
    console.log(`Creating collection '${tableSessionsCollectionId}'...`);
    await databases.createCollection(
      databaseId,
      tableSessionsCollectionId,
      'Sessões de Mesa',
      [
        Permission.read(Role.any()),
        Permission.create(Role.any()),
        Permission.update(Role.any()),
        Permission.delete(Role.users()),
      ]
    );
    console.log(`Collection '${tableSessionsCollectionId}' created.`);
  }

  console.log('Ensuring attributes for table_sessions...');
  await createAttributeSafely(() => databases.createStringAttribute(databaseId, tableSessionsCollectionId, 'establishmentId', 255, true), 'establishmentId');
  await createAttributeSafely(() => databases.createStringAttribute(databaseId, tableSessionsCollectionId, 'tableId', 255, true), 'tableId');
  await createAttributeSafely(() => databases.createIntegerAttribute(databaseId, tableSessionsCollectionId, 'tableNumber', true), 'tableNumber');
  await createAttributeSafely(() => databases.createStringAttribute(databaseId, tableSessionsCollectionId, 'status', 50, true), 'status');
  await createAttributeSafely(() => databases.createStringAttribute(databaseId, tableSessionsCollectionId, 'openedAt', 255, true), 'openedAt');
  await createAttributeSafely(() => databases.createStringAttribute(databaseId, tableSessionsCollectionId, 'closedAt', 255, false), 'closedAt');
  await createAttributeSafely(() => databases.createStringAttribute(databaseId, tableSessionsCollectionId, 'participants', 5000, false), 'participants');
  await createAttributeSafely(() => databases.createIntegerAttribute(databaseId, tableSessionsCollectionId, 'totalAmount', false, 0, 100000000, 0), 'totalAmount');
  await createAttributeSafely(() => databases.createIntegerAttribute(databaseId, tableSessionsCollectionId, 'paidAmount', false, 0, 100000000, 0), 'paidAmount');

  console.log('Tables, Service Calls and Table Sessions initialized successfully!');
}

initTablesAndCalls().catch((err) => {
  console.error('Fatal initialization error:', err);
  process.exit(1);
});
