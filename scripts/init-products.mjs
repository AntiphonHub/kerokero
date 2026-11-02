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

async function initProductsAndCategories() {
  const databaseId = process.env.APPWRITE_DATABASE_ID || 'kerokero';
  const categoriesCollectionId = process.env.APPWRITE_CATEGORIES_COLLECTION_ID || 'categories';
  const productsCollectionId = process.env.APPWRITE_PRODUCTS_COLLECTION_ID || 'products';

  // 1. Ensure database exists
  try {
    await databases.get(databaseId);
    console.log(`Database '${databaseId}' exists.`);
  } catch (err) {
    console.log(`Creating database '${databaseId}'...`);
    await databases.create(databaseId, 'KeroKero');
    console.log(`Database '${databaseId}' created.`);
  }

  // 2. Setup Categories Collection
  try {
    await databases.getCollection(databaseId, categoriesCollectionId);
    console.log(`Collection '${categoriesCollectionId}' already exists.`);
  } catch (err) {
    console.log(`Creating collection '${categoriesCollectionId}'...`);
    await databases.createCollection(
      databaseId,
      categoriesCollectionId,
      'Categorias',
      [
        Permission.read(Role.users()),
        Permission.create(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users()),
      ]
    );
    console.log(`Collection '${categoriesCollectionId}' created.`);

    console.log('Creating attributes for categories...');
    await databases.createStringAttribute(databaseId, categoriesCollectionId, 'establishmentId', 255, true);
    await sleep(400);
    await databases.createStringAttribute(databaseId, categoriesCollectionId, 'name', 255, true);
    await sleep(400);
    await databases.createIntegerAttribute(databaseId, categoriesCollectionId, 'order', false, 0, 10000, 0);
    await sleep(400);
    console.log(`Attributes for '${categoriesCollectionId}' created.`);
  }

  // 3. Setup Products Collection
  try {
    await databases.getCollection(databaseId, productsCollectionId);
    console.log(`Collection '${productsCollectionId}' already exists.`);
  } catch (err) {
    console.log(`Creating collection '${productsCollectionId}'...`);
    await databases.createCollection(
      databaseId,
      productsCollectionId,
      'Produtos',
      [
        Permission.read(Role.users()),
        Permission.create(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users()),
      ]
    );
    console.log(`Collection '${productsCollectionId}' created.`);

    console.log('Creating attributes for products...');
    await databases.createStringAttribute(databaseId, productsCollectionId, 'establishmentId', 255, true);
    await sleep(400);
    await databases.createStringAttribute(databaseId, productsCollectionId, 'categoryId', 255, true);
    await sleep(400);
    await databases.createStringAttribute(databaseId, productsCollectionId, 'categoryName', 255, true);
    await sleep(400);
    await databases.createStringAttribute(databaseId, productsCollectionId, 'name', 255, true);
    await sleep(400);
    await databases.createStringAttribute(databaseId, productsCollectionId, 'description', 2000, false);
    await sleep(400);
    await databases.createStringAttribute(databaseId, productsCollectionId, 'imageUrl', 2048, false);
    await sleep(400);
    await databases.createIntegerAttribute(databaseId, productsCollectionId, 'price', true);
    await sleep(400);
    await databases.createIntegerAttribute(databaseId, productsCollectionId, 'happyHourPrice', false);
    await sleep(400);
    await databases.createIntegerAttribute(databaseId, productsCollectionId, 'stockQuantity', false);
    await sleep(400);
    await databases.createBooleanAttribute(databaseId, productsCollectionId, 'isActive', false, true);
    await sleep(400);
    await databases.createStringAttribute(databaseId, productsCollectionId, 'addons', 65535, false, '[]');
    await sleep(400);
    await databases.createStringAttribute(databaseId, productsCollectionId, 'upsellProductIds', 255, false, null, true);
    await sleep(400);
    await databases.createStringAttribute(databaseId, productsCollectionId, 'upsellMessage', 255, false);
    await sleep(400);
    console.log(`Attributes for '${productsCollectionId}' created.`);
  }

  console.log('Initialization of products and categories completed successfully.');
}

initProductsAndCategories().catch(console.error);
