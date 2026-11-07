import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { Client, Databases, Query, ID } from 'node-appwrite';

const ESTABLISHMENT_ID = '6aeb8e7d000fc703d975';
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || 'kerokero';

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const db = new Databases(client);

console.log('--- INICIANDO SEED DO ESTABELECIMENTO ---');
console.log('ID:', ESTABLISHMENT_ID);
console.log('Database:', DATABASE_ID);

// 1. Atualizar nome e dados do estabelecimento
try {
  await db.updateDocument(DATABASE_ID, 'establishments', ESTABLISHMENT_ID, {
    name: 'Bempedi Burger & Tap',
    category: 'Hamburgueria & Choperia',
    subscriptionStatus: 'active',
  });
  console.log('✔ Estabelecimento atualizado para "Bempedi Burger & Tap"');
} catch (e) {
  console.log('Aviso ao atualizar estabelecimento:', e.message);
}

// 2. Limpar pedidos, chamados e produtos antigos do estabelecimento
console.log('\nLimpando dados antigos...');
const oldOrders = await db.listDocuments(DATABASE_ID, 'orders', [
  Query.equal('establishmentId', ESTABLISHMENT_ID),
  Query.limit(500),
]);
for (const o of oldOrders.documents) {
  await db.deleteDocument(DATABASE_ID, 'orders', o.$id);
}
console.log(`✔ ${oldOrders.total} pedidos antigos removidos`);

const oldCalls = await db.listDocuments(DATABASE_ID, 'service_calls', [
  Query.equal('establishmentId', ESTABLISHMENT_ID),
  Query.limit(100),
]);
for (const c of oldCalls.documents) {
  await db.deleteDocument(DATABASE_ID, 'service_calls', c.$id);
}
console.log(`✔ ${oldCalls.total} chamados antigos removidos`);

const oldProducts = await db.listDocuments(DATABASE_ID, 'products', [
  Query.equal('establishmentId', ESTABLISHMENT_ID),
  Query.limit(100),
]);
for (const p of oldProducts.documents) {
  await db.deleteDocument(DATABASE_ID, 'products', p.$id);
}
console.log(`✔ ${oldProducts.total} produtos antigos removidos`);

const oldCategories = await db.listDocuments(DATABASE_ID, 'categories', [
  Query.equal('establishmentId', ESTABLISHMENT_ID),
  Query.limit(50),
]);
for (const c of oldCategories.documents) {
  await db.deleteDocument(DATABASE_ID, 'categories', c.$id);
}
console.log(`✔ ${oldCategories.total} categorias antigas removidas`);

const oldSessions = await db.listDocuments(DATABASE_ID, 'table_sessions', [
  Query.equal('establishmentId', ESTABLISHMENT_ID),
  Query.limit(100),
]);
for (const s of oldSessions.documents) {
  await db.deleteDocument(DATABASE_ID, 'table_sessions', s.$id);
}
console.log(`✔ ${oldSessions.total} sessões antigas removidas`);

// 3. Criar Categorias Oficiais
console.log('\nCriando categorias...');
const catBurgers = await db.createDocument(DATABASE_ID, 'categories', ID.unique(), {
  establishmentId: ESTABLISHMENT_ID,
  name: 'Burgers & Sanduíches',
  order: 1,
});

const catPetiscos = await db.createDocument(DATABASE_ID, 'categories', ID.unique(), {
  establishmentId: ESTABLISHMENT_ID,
  name: 'Porções & Petiscos',
  order: 2,
});

const catBebidas = await db.createDocument(DATABASE_ID, 'categories', ID.unique(), {
  establishmentId: ESTABLISHMENT_ID,
  name: 'Bebidas & Chopp',
  order: 3,
});
console.log('✔ Categorias criadas com sucesso!');

// 4. Criar Produtos com Imagens Reais
console.log('\nCriando produtos...');
const prodSmashBacon = await db.createDocument(DATABASE_ID, 'products', ID.unique(), {
  establishmentId: ESTABLISHMENT_ID,
  categoryId: catBurgers.$id,
  categoryName: catBurgers.name,
  name: 'Smash Bacon Especial',
  description: 'Blend 160g, fatias generosas de cheddar inglês derretido, bacon crocante em tiras e maionese defumada artesanal no pão brioche amanteigado selado.',
  imageUrl: '/images/products/smash_burger.png',
  price: 3800, // R$ 38,00
  happyHourPrice: 3200, // R$ 32,00 no Happy Hour
  stockQuantity: 150,
  isActive: true,
  addons: JSON.stringify([
    { id: 'add_bacon', name: 'Bacon Extra Crocante (+4 fatias)', price: 600 },
    { id: 'add_cheddar', name: 'Queijo Cheddar Inglês Duplo', price: 500 },
    { id: 'add_picles', name: 'Picles Artesanal da Casa', price: 300 },
  ]),
  upsellProductIds: [],
  upsellMessage: 'Combina perfeitamente com Batata Rústica e Chopp Artesanal gelado!',
});

const prodClassicSalada = await db.createDocument(DATABASE_ID, 'products', ID.unique(), {
  establishmentId: ESTABLISHMENT_ID,
  categoryId: catBurgers.$id,
  categoryName: catBurgers.name,
  name: 'Classic Cheese Salada',
  description: 'Blend 160g, queijo prato selecionado derretido, alface americana crocante, tomate caqui fresco e molho especial da casa no pão brioche.',
  imageUrl: '/images/products/smash_burger.png',
  price: 3200, // R$ 32,00
  stockQuantity: 120,
  isActive: true,
  addons: JSON.stringify([
    { id: 'add_egg', name: 'Ovo Caipira na Manteiga', price: 400 },
    { id: 'add_bacon', name: 'Fatias de Bacon', price: 600 },
  ]),
  upsellProductIds: [],
});

const prodDuploMelt = await db.createDocument(DATABASE_ID, 'products', ID.unique(), {
  establishmentId: ESTABLISHMENT_ID,
  categoryId: catBurgers.$id,
  categoryName: catBurgers.name,
  name: 'Duplo Smash Cheddar Melt',
  description: 'Dois blends smash de 100g bem prensados na chapa com crostinha crocante, muito cheddar cremoso e cebola caramelizada artesanal.',
  imageUrl: '/images/products/smash_burger.png',
  price: 4400, // R$ 44,00
  stockQuantity: 80,
  isActive: true,
  addons: JSON.stringify([
    { id: 'add_bacon', name: 'Bacon em Cubos Caramelizado', price: 600 },
  ]),
  upsellProductIds: [],
});

const prodBatata = await db.createDocument(DATABASE_ID, 'products', ID.unique(), {
  establishmentId: ESTABLISHMENT_ID,
  categoryId: catPetiscos.$id,
  categoryName: catPetiscos.name,
  name: 'Batata Rústica Alecrim & Páprica',
  description: 'Batatas especiais cortadas com casca, douradas e crocantes, temperadas com flor de sal, alecrim fresco e páprica defumada especial. Acompanha maionese verde artesanal.',
  imageUrl: '/images/products/batata_frita.jpg',
  price: 2400, // R$ 24,00
  stockQuantity: 200,
  isActive: true,
  addons: JSON.stringify([
    { id: 'add_cheddar_bacon', name: 'Cobertura de Cheddar & Bacon', price: 1000 },
  ]),
  upsellProductIds: [],
});

const prodBolinho = await db.createDocument(DATABASE_ID, 'products', ID.unique(), {
  establishmentId: ESTABLISHMENT_ID,
  categoryId: catPetiscos.$id,
  categoryName: catPetiscos.name,
  name: 'Bolinho de Carne Seca com Queijo Coalho',
  description: 'Porção com 8 unidades douradas e crocantes, recheadas com carne seca desfiada bem temperada e queijo coalho cremoso. Acompanha geleia de pimenta da casa.',
  imageUrl: '/images/products/bolinho_carne_seca.jpg',
  price: 3600, // R$ 36,00
  stockQuantity: 90,
  isActive: true,
  addons: JSON.stringify([]),
  upsellProductIds: [],
});

const prodChoppIPA = await db.createDocument(DATABASE_ID, 'products', ID.unique(), {
  establishmentId: ESTABLISHMENT_ID,
  categoryId: catBebidas.$id,
  categoryName: catBebidas.name,
  name: 'Chopp Artesanal IPA 500ml',
  description: 'Chopp India Pale Ale artesanal de cervejaria local parceira, notas cítricas e florais de lúpulo americano, amargor equilibrado e espuma densa.',
  imageUrl: '/images/products/smash_burger.png',
  price: 1800, // R$ 18,00
  stockQuantity: 300,
  isActive: true,
  addons: JSON.stringify([]),
  upsellProductIds: [],
});

const prodOriginal = await db.createDocument(DATABASE_ID, 'products', ID.unique(), {
  establishmentId: ESTABLISHMENT_ID,
  categoryId: catBebidas.$id,
  categoryName: catBebidas.name,
  name: 'Cerveja Original 600ml',
  description: 'Garrafa 600ml servida estupidamente gelada com balde de gelo e copos tulipa.',
  imageUrl: '/images/products/original_600ml.jpg',
  price: 1600, // R$ 16,00
  stockQuantity: 180,
  isActive: true,
  addons: JSON.stringify([]),
  upsellProductIds: [],
});

const prodCaipirinha = await db.createDocument(DATABASE_ID, 'products', ID.unique(), {
  establishmentId: ESTABLISHMENT_ID,
  categoryId: catBebidas.$id,
  categoryName: catBebidas.name,
  name: 'Caipirinha Clássica de Limão',
  description: 'Cachaça artesanal de alambique mineiro, limão taiti fresco macerado na hora, açúcar e bastante gelo.',
  imageUrl: '/images/products/caipirinha_limao.jpg',
  price: 2200, // R$ 22,00
  stockQuantity: 150,
  isActive: true,
  addons: JSON.stringify([
    { id: 'add_vodka', name: 'Trocar por Vodka Smirnoff (Caipiroska)', price: 400 },
  ]),
  upsellProductIds: [],
});

// Configurar Upsell nos burgers (agora como array real de strings)
await db.updateDocument(DATABASE_ID, 'products', prodSmashBacon.$id, {
  upsellProductIds: [prodBatata.$id, prodChoppIPA.$id],
});

console.log('✔ 8 produtos criados com sucesso com fotos e complementos!');

// 5. Configurar Mesas e Sessões Ativas
console.log('\nConfigurando mesas e comandas ativas...');
const tablesList = await db.listDocuments(DATABASE_ID, 'tables', [
  Query.equal('establishmentId', ESTABLISHMENT_ID),
  Query.orderAsc('number'),
  Query.limit(20),
]);

const tablesMap = new Map();
for (const t of tablesList.documents) {
  tablesMap.set(t.number, t);
}

// Mesa 8 (Carlos & Ana) - Ocupada com Chamado de Garçom
const table8 = tablesMap.get(8);
const session8 = await db.createDocument(DATABASE_ID, 'table_sessions', ID.unique(), {
  establishmentId: ESTABLISHMENT_ID,
  tableId: table8.$id,
  tableNumber: 8,
  openedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  participants: JSON.stringify([
    { id: 'part_carlos', name: 'Carlos', joinedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString() },
    { id: 'part_ana', name: 'Ana', joinedAt: new Date(Date.now() - 40 * 60 * 1000).toISOString() },
  ]),
  totalAmount: 14800, // R$ 148,00
  paidAmount: 0,
  status: 'active',
});

// Chamado de serviço para a Mesa 8
await db.createDocument(DATABASE_ID, 'service_calls', ID.unique(), {
  establishmentId: ESTABLISHMENT_ID,
  tableId: table8.$id,
  tableNumber: 8,
  sessionId: session8.$id,
  type: 'waiter',
  description: 'Gelo / Copo adicional',
  requestedBy: 'Carlos',
  status: 'pending',
});

await db.updateDocument(DATABASE_ID, 'tables', table8.$id, {
  status: 'waiter_called',
  activeSessionId: session8.$id,
  currentTotal: 14800,
  serviceCallReason: 'Solicitação: Gelo / Copo adicional (há 1 min)',
  lastActivityAt: new Date().toISOString(),
});

// Mesa 4 (Mariana) - Ocupada
const table4 = tablesMap.get(4);
const session4 = await db.createDocument(DATABASE_ID, 'table_sessions', ID.unique(), {
  establishmentId: ESTABLISHMENT_ID,
  tableId: table4.$id,
  tableNumber: 4,
  openedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  participants: JSON.stringify([
    { id: 'part_mariana', name: 'Mariana', joinedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
  ]),
  totalAmount: 8400,
  paidAmount: 0,
  status: 'active',
});

await db.updateDocument(DATABASE_ID, 'tables', table4.$id, {
  status: 'occupied',
  activeSessionId: session4.$id,
  currentTotal: 8400,
  serviceCallReason: null,
  lastActivityAt: new Date().toISOString(),
});

// Mesa 12 (Roberto) - Pediu a Maquininha (Conta)
const table12 = tablesMap.get(12);
const session12 = await db.createDocument(DATABASE_ID, 'table_sessions', ID.unique(), {
  establishmentId: ESTABLISHMENT_ID,
  tableId: table12.$id,
  tableNumber: 12,
  openedAt: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
  participants: JSON.stringify([
    { id: 'part_roberto', name: 'Roberto', joinedAt: new Date(Date.now() - 75 * 60 * 1000).toISOString() },
  ]),
  totalAmount: 14200,
  paidAmount: 0,
  status: 'active',
});

await db.createDocument(DATABASE_ID, 'service_calls', ID.unique(), {
  establishmentId: ESTABLISHMENT_ID,
  tableId: table12.$id,
  tableNumber: 12,
  sessionId: session12.$id,
  type: 'bill_card',
  description: 'Conta / Maquininha Cartão de Crédito',
  requestedBy: 'Roberto',
  status: 'pending',
});

await db.updateDocument(DATABASE_ID, 'tables', table12.$id, {
  status: 'bill_requested',
  activeSessionId: session12.$id,
  currentTotal: 14200,
  serviceCallReason: 'Aguardando Maquininha',
  lastActivityAt: new Date().toISOString(),
});

// Mesa 2 (Lucas) - Ocupada
const table2 = tablesMap.get(2);
const session2 = await db.createDocument(DATABASE_ID, 'table_sessions', ID.unique(), {
  establishmentId: ESTABLISHMENT_ID,
  tableId: table2.$id,
  tableNumber: 2,
  openedAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
  participants: JSON.stringify([
    { id: 'part_lucas', name: 'Lucas', joinedAt: new Date(Date.now() - 20 * 60 * 1000).toISOString() },
  ]),
  totalAmount: 5200,
  paidAmount: 0,
  status: 'active',
});

await db.updateDocument(DATABASE_ID, 'tables', table2.$id, {
  status: 'occupied',
  activeSessionId: session2.$id,
  currentTotal: 5200,
  serviceCallReason: null,
  lastActivityAt: new Date().toISOString(),
});

// Mesa 10 (Pedro) - Ocupada
const table10 = tablesMap.get(10);
const session10 = await db.createDocument(DATABASE_ID, 'table_sessions', ID.unique(), {
  establishmentId: ESTABLISHMENT_ID,
  tableId: table10.$id,
  tableNumber: 10,
  openedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  participants: JSON.stringify([
    { id: 'part_pedro', name: 'Pedro', joinedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString() },
  ]),
  totalAmount: 6800,
  paidAmount: 0,
  status: 'active',
});

await db.updateDocument(DATABASE_ID, 'tables', table10.$id, {
  status: 'occupied',
  activeSessionId: session10.$id,
  currentTotal: 6800,
  serviceCallReason: null,
  lastActivityAt: new Date().toISOString(),
});

// Resetar as demais mesas para idle
for (const [num, t] of tablesMap.entries()) {
  if (![8, 4, 12, 2, 10].includes(num)) {
    await db.updateDocument(DATABASE_ID, 'tables', t.$id, {
      status: 'idle',
      activeSessionId: null,
      currentTotal: 0,
      serviceCallReason: null,
      lastActivityAt: new Date().toISOString(),
    });
  }
}
console.log('✔ Mesas e chamados de serviço configurados com sucesso!');

// 6. Criar Pedidos ao Vivo para o KDS (Kanban de Cozinha)
console.log('\nCriando pedidos para o KDS...');
// KDS Coluna 1: PENDENTES (Recebidos)
await db.createDocument(DATABASE_ID, 'orders', ID.unique(), {
  establishmentId: ESTABLISHMENT_ID,
  tableId: table8.$id,
  tableNumber: 8,
  sessionId: session8.$id,
  participantId: 'part_carlos',
  participantName: 'Carlos',
  productId: prodSmashBacon.$id,
  productName: 'Smash Bacon Especial',
  unitPrice: 3800,
  quantity: 2,
  totalPrice: 7600,
  notes: 'Ponto da carne: ao ponto. Sem cebola.',
  selectedOptions: JSON.stringify(['+Bacon Extra Crocante']),
  status: 'pending',
  createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
});

await db.createDocument(DATABASE_ID, 'orders', ID.unique(), {
  establishmentId: ESTABLISHMENT_ID,
  tableId: table8.$id,
  tableNumber: 8,
  sessionId: session8.$id,
  participantId: 'part_carlos',
  participantName: 'Carlos',
  productId: prodBolinho.$id,
  productName: 'Bolinho de Carne Seca com Queijo Coalho',
  unitPrice: 3600,
  quantity: 1,
  totalPrice: 3600,
  notes: 'Geleia de pimenta à parte',
  status: 'pending',
  createdAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
});

await db.createDocument(DATABASE_ID, 'orders', ID.unique(), {
  establishmentId: ESTABLISHMENT_ID,
  tableId: table2.$id,
  tableNumber: 2,
  sessionId: session2.$id,
  participantId: 'part_lucas',
  participantName: 'Lucas',
  productId: prodBatata.$id,
  productName: 'Batata Rústica Alecrim & Páprica',
  unitPrice: 2400,
  quantity: 1,
  totalPrice: 2400,
  notes: 'Batata bem sequinha e crocante',
  status: 'pending',
  createdAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
});

// KDS Coluna 2: EM PREPARO
await db.createDocument(DATABASE_ID, 'orders', ID.unique(), {
  establishmentId: ESTABLISHMENT_ID,
  tableId: table4.$id,
  tableNumber: 4,
  sessionId: session4.$id,
  participantId: 'part_mariana',
  participantName: 'Mariana',
  productId: prodDuploMelt.$id,
  productName: 'Duplo Smash Cheddar Melt',
  unitPrice: 4400,
  quantity: 1,
  totalPrice: 4400,
  notes: 'Ponto bem passado',
  status: 'preparing',
  createdAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
});

await db.createDocument(DATABASE_ID, 'orders', ID.unique(), {
  establishmentId: ESTABLISHMENT_ID,
  tableId: table4.$id,
  tableNumber: 4,
  sessionId: session4.$id,
  participantId: 'part_mariana',
  participantName: 'Mariana',
  productId: prodBatata.$id,
  productName: 'Batata Rústica Alecrim & Páprica',
  unitPrice: 2400,
  quantity: 1,
  totalPrice: 2400,
  notes: 'Com molho extra',
  status: 'preparing',
  createdAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
});

await db.createDocument(DATABASE_ID, 'orders', ID.unique(), {
  establishmentId: ESTABLISHMENT_ID,
  tableId: table10.$id,
  tableNumber: 10,
  sessionId: session10.$id,
  participantId: 'part_pedro',
  participantName: 'Pedro',
  productId: prodClassicSalada.$id,
  productName: 'Classic Cheese Salada',
  unitPrice: 3200,
  quantity: 1,
  totalPrice: 3200,
  notes: '',
  status: 'preparing',
  createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
});

// KDS Coluna 3: PRONTO PARA SERVIR
await db.createDocument(DATABASE_ID, 'orders', ID.unique(), {
  establishmentId: ESTABLISHMENT_ID,
  tableId: table8.$id,
  tableNumber: 8,
  sessionId: session8.$id,
  participantId: 'part_ana',
  participantName: 'Ana',
  productId: prodChoppIPA.$id,
  productName: 'Chopp Artesanal IPA 500ml',
  unitPrice: 1800,
  quantity: 2,
  totalPrice: 3600,
  notes: 'Copos com colarinho',
  status: 'ready',
  createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
});

await db.createDocument(DATABASE_ID, 'orders', ID.unique(), {
  establishmentId: ESTABLISHMENT_ID,
  tableId: table12.$id,
  tableNumber: 12,
  sessionId: session12.$id,
  participantId: 'part_roberto',
  participantName: 'Roberto',
  productId: prodCaipirinha.$id,
  productName: 'Caipirinha Clássica de Limão',
  unitPrice: 2200,
  quantity: 1,
  totalPrice: 2200,
  notes: 'Pouco açúcar',
  status: 'ready',
  createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
});

await db.createDocument(DATABASE_ID, 'orders', ID.unique(), {
  establishmentId: ESTABLISHMENT_ID,
  tableId: table4.$id,
  tableNumber: 4,
  sessionId: session4.$id,
  participantId: 'part_mariana',
  participantName: 'Mariana',
  productId: prodOriginal.$id,
  productName: 'Cerveja Original 600ml',
  unitPrice: 1600,
  quantity: 1,
  totalPrice: 1600,
  notes: 'Balde com gelo',
  status: 'ready',
  createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
});

console.log('✔ 9 pedidos no KDS criados (Pendentes, Em Preparo e Prontos)!');

// 7. Criar Histórico de Vendas de Hoje para o Dashboard (Gráfico de Vendas por Hora e Faturamento)
console.log('\nCriando histórico de vendas de hoje para o Dashboard...');

const now = new Date();
const year = now.getFullYear();
const month = String(now.getMonth() + 1).padStart(2, '0');
const day = String(now.getDate()).padStart(2, '0');

const hourlyDistribution = [
  { hour: 11, orders: 3, items: [prodSmashBacon, prodBatata] },
  { hour: 12, orders: 8, items: [prodSmashBacon, prodClassicSalada, prodChoppIPA, prodBatata] },
  { hour: 13, orders: 11, items: [prodDuploMelt, prodSmashBacon, prodBolinho, prodChoppIPA] },
  { hour: 14, orders: 5, items: [prodClassicSalada, prodBatata, prodOriginal] },
  { hour: 17, orders: 4, items: [prodBolinho, prodChoppIPA, prodOriginal] },
  { hour: 18, orders: 7, items: [prodSmashBacon, prodCaipirinha, prodBatata] },
  { hour: 19, orders: 13, items: [prodSmashBacon, prodDuploMelt, prodChoppIPA, prodBolinho] },
  { hour: 20, orders: 18, items: [prodSmashBacon, prodDuploMelt, prodChoppIPA, prodCaipirinha, prodBatata] },
  { hour: 21, orders: 12, items: [prodCaipirinha, prodOriginal, prodBolinho, prodBatata] },
];

let deliveredCount = 0;
let totalDeliveredRevenue = 0;

for (const h of hourlyDistribution) {
  // Ajuste do fuso de Brasília (UTC-3)
  const utcHour = (h.hour + 3) % 24;
  const isoTime = `${year}-${month}-${day}T${String(utcHour).padStart(2, '0')}:30:00.000Z`;

  for (let i = 0; i < h.orders; i++) {
    const prod = h.items[i % h.items.length];
    const qty = (i % 2) + 1;
    const price = prod.price * qty;
    const simSessionId = `hist_sess_${h.hour}_${i}`;

    await db.createDocument(DATABASE_ID, 'orders', ID.unique(), {
      establishmentId: ESTABLISHMENT_ID,
      tableId: table8.$id,
      tableNumber: (i % 15) + 1,
      sessionId: simSessionId,
      participantId: `part_guest_${h.hour}_${i}`,
      participantName: `Cliente ${(i % 10) + 1}`,
      productId: prod.$id,
      productName: prod.name,
      unitPrice: prod.price,
      quantity: qty,
      totalPrice: price,
      notes: '',
      status: 'delivered',
      createdAt: isoTime,
    });
    deliveredCount++;
    totalDeliveredRevenue += price;
  }
}

console.log(`✔ ${deliveredCount} pedidos entregues criados ao longo do dia!`);
console.log(`✔ Faturamento acumulado de hoje: R$ ${(totalDeliveredRevenue / 100).toFixed(2)}`);
console.log('\n--- SEED CONCLUÍDO COM SUCESSO ABSOLUTO! ---');
