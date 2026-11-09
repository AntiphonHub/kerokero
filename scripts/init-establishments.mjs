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

async function initEstablishments() {
  const databaseId = process.env.APPWRITE_DATABASE_ID || 'kerokero';
  const collectionId = process.env.APPWRITE_ESTABLISHMENTS_COLLECTION_ID || 'establishments';

  // 1. Ensure database exists
  try {
    await databases.get(databaseId);
    console.log(`Database '${databaseId}' exists.`);
  } catch (err) {
    console.log(`Creating database '${databaseId}'...`);
    await databases.create(databaseId, 'KeroKero');
    console.log(`Database '${databaseId}' created.`);
  }

  // 2. Ensure collection exists
  try {
    await databases.getCollection(databaseId, collectionId);
    console.log(`Collection '${collectionId}' already exists.`);
  } catch (err) {
    console.log(`Creating collection '${collectionId}'...`);
    await databases.createCollection(
      databaseId,
      collectionId,
      'Establishments',
      [
        Permission.read(Role.users()),
        Permission.create(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users()),
      ]
    );
    console.log(`Collection '${collectionId}' created.`);

    // 3. Create Attributes
    console.log('Creating attributes...');
    const stringAttrs = [
      { key: 'userId', size: 255, required: true },
      { key: 'name', size: 255, required: true },
      { key: 'legalName', size: 255, required: false },
      { key: 'cnpj', size: 32, required: false },
      { key: 'category', size: 64, required: false },
      { key: 'phone', size: 32, required: false },
      { key: 'postalCode', size: 16, required: false },
      { key: 'address', size: 255, required: false },
      { key: 'orderMode', size: 32, required: false },
      { key: 'openingDays', size: 255, required: false },
      { key: 'openingTime', size: 16, required: false },
      { key: 'closingTime', size: 16, required: false },
      { key: 'repName', size: 255, required: false },
      { key: 'repCpf', size: 32, required: false },
      { key: 'repBirthDate', size: 16, required: false },
      { key: 'bankCode', size: 16, required: false },
      { key: 'bankPixKey', size: 255, required: false },
      { key: 'bankAgency', size: 16, required: false },
      { key: 'bankAccount', size: 32, required: false },
      { key: 'docIdKey', size: 255, required: false },
      { key: 'docCnpjKey', size: 255, required: false },
      { key: 'asaasCustomerId', size: 255, required: false },
      { key: 'asaasSubscriptionId', size: 255, required: false },
      { key: 'subscriptionStatus', size: 32, required: false, default: 'pending' },
      { key: 'trialStartDate', size: 64, required: false },
      { key: 'trialEndsAt', size: 64, required: false },
      { key: 'asaasSubaccountId', size: 255, required: false },
      { key: 'asaasWalletId', size: 255, required: false },
      { key: 'asaasSubaccountApiKey', size: 1024, required: false },
      { key: 'subaccountStatus', size: 32, required: false, default: 'under_analysis' },
      { key: 'happyHourDays', size: 255, required: false },
      { key: 'happyHourStartTime', size: 16, required: false },
      { key: 'happyHourEndTime', size: 16, required: false },
    ];

    for (const attr of stringAttrs) {
      console.log(`Creating string attribute: ${attr.key}`);
      await databases.createStringAttribute(
        databaseId,
        collectionId,
        attr.key,
        attr.size,
        attr.required,
        attr.default
      );
    }

    console.log('Creating integer attributes...');
    await databases.createIntegerAttribute(databaseId, collectionId, 'tablesCount', false, 1, 200, 15);
    await databases.createIntegerAttribute(databaseId, collectionId, 'onboardingStep', false, 1, 4, 1);

    console.log('Creating boolean attributes...');
    await databases.createBooleanAttribute(databaseId, collectionId, 'onboardingCompleted', false, false);
    await databases.createBooleanAttribute(databaseId, collectionId, 'happyHourEnabled', false, false);

    console.log('All attributes created successfully.');
  }
}

initEstablishments().catch(console.error);
