import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding B2B Trading ERP database...');

  // 1. Vendors
  const vendor1 = await prisma.vendor.upsert({
    where: { code: 'VND-001' },
    update: {},
    create: {
      code: 'VND-001',
      name: 'Apex Industrial Steel Ltd.',
      contactPerson: 'Rafiqul Islam',
      phone: '+880 1711-209841',
      email: 'procurement@apexsteel.com',
      address: 'Plot 44, Tejgaon Industrial Area, Dhaka',
      category: 'Steel & Construction',
      paymentTerms: 'NET_30',
      balancePayable: 142500,
      rating: 4.8,
      leadTimeDays: 7,
    },
  });

  const vendor2 = await prisma.vendor.upsert({
    where: { code: 'VND-002' },
    update: {},
    create: {
      code: 'VND-002',
      name: 'Bengal Chemical & Polymers Corp',
      contactPerson: 'Nasir Uddin',
      phone: '+880 1822-441190',
      email: 'sales@bengalchem.net',
      address: 'Shitalakhya Waterfront, Narayanganj',
      category: 'Industrial Chemicals',
      paymentTerms: 'NET_15',
      balancePayable: 78000,
      rating: 4.6,
      leadTimeDays: 5,
    },
  });

  // 2. Clients
  const client1 = await prisma.client.upsert({
    where: { code: 'CLI-101' },
    update: {},
    create: {
      code: 'CLI-101',
      name: 'Metro Mega-Infrastructure Corp',
      contactPerson: 'Engr. Mahmudul Hasan',
      phone: '+880 1713-909012',
      email: 'procurement@metroinfra.com',
      billingAddress: 'Level 14, Lotus Kamal Tower, Gulshan-1, Dhaka',
      shippingAddress: 'Metro Flyover Site Depot 4, Mirpur 10, Dhaka',
      creditLimit: 500000,
      balanceReceivable: 195000,
      paymentTerms: 'NET_30',
    },
  });

  // 3. Products
  const prod1 = await prisma.product.upsert({
    where: { sku: 'STL-REBAR-500W' },
    update: {},
    create: {
      sku: 'STL-REBAR-500W',
      name: '500W Deformed Steel TMT Rebar (16mm)',
      category: 'Steel & Construction',
      unit: 'ton',
      defaultBuyPrice: 840,
      defaultSellPrice: 975,
      currentStock: 45,
      committedStock: 25,
      incomingStock: 30,
      reorderLevel: 20,
    },
  });

  console.log('Seed completed successfully:', {
    vendors: [vendor1.name, vendor2.name],
    clients: [client1.name],
    products: [prod1.sku],
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

