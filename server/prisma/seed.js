import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(currentDir, "../.env") });
dotenv.config({ path: resolve(currentDir, "../../.env"), override: false });

const prisma = new PrismaClient();

const daysAgo = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

async function upsertByName(model, name, data = {}) {
  return prisma[model].upsert({
    where: { name },
    update: { active: true, ...data },
    create: { name, ...data }
  });
}

async function upsertProduct(product) {
  const existing = await prisma.product.findUnique({ where: { sku: product.sku } });
  const { variants, ...data } = product;

  if (existing) {
    await prisma.product.update({ where: { id: existing.id }, data });
    for (const variant of variants) {
      await prisma.productVariant.upsert({
        where: { sku: variant.sku },
        update: { ...variant, productId: existing.id },
        create: { ...variant, productId: existing.id }
      });
    }
    return prisma.product.findUnique({ where: { id: existing.id }, include: { variants: true } });
  }

  return prisma.product.create({
    data: { ...data, variants: { create: variants } },
    include: { variants: true }
  });
}

async function upsertCustomer(customer) {
  const existing = await prisma.customer.findFirst({ where: { phone: customer.phone } });
  if (existing) {
    return prisma.customer.update({ where: { id: existing.id }, data: customer });
  }
  return prisma.customer.create({ data: customer });
}

async function createSaleIfMissing({ code, customer, user, items, method, discount = 0, createdAt }) {
  const existing = await prisma.sale.findUnique({ where: { code } });
  if (existing) return existing;

  const priced = items.map(({ product, variantSku, quantity }) => {
    const variant = product.variants.find((item) => item.sku === variantSku) || product.variants[0];
    const unitPrice = Number(variant.price || product.promoPrice || product.salePrice);
    const costPrice = Number(product.costPrice);
    const total = unitPrice * quantity;
    return { product, variant, quantity, unitPrice, costPrice, total };
  });

  const subtotal = priced.reduce((sum, item) => sum + item.total, 0);
  const total = Math.max(subtotal - discount, 0);
  const profit = priced.reduce((sum, item) => sum + (item.unitPrice - item.costPrice) * item.quantity, 0) - discount;

  return prisma.sale.create({
    data: {
      code,
      customerId: customer?.id || null,
      userId: user.id,
      subtotal,
      discount,
      total,
      profit,
      createdAt,
      notes: "Venda de demonstração criada para alimentar o painel.",
      items: {
        create: priced.map((item) => ({
          productId: item.product.id,
          variantId: item.variant.id,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: 0,
          total: item.total
        }))
      },
      payments: { create: [{ method, amount: total, createdAt }] }
    }
  });
}

async function main() {
  const password = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@suddaiana.com" },
    update: { name: "Administradora Sud Daiana", role: "ADMIN", active: true },
    create: { name: "Administradora Sud Daiana", email: "admin@suddaiana.com", password, role: "ADMIN" }
  });

  await prisma.user.upsert({
    where: { email: "caixa@suddaiana.com" },
    update: { name: "Caixa da Loja", role: "CAIXA", active: true },
    create: { name: "Caixa da Loja", email: "caixa@suddaiana.com", password, role: "CAIXA" }
  });

  const categories = {};
  for (const name of ["Vestidos", "Blusas", "Calças", "Conjuntos", "Infantil", "Acessórios", "Bolsas", "Plus Size"]) {
    categories[name] = await upsertByName("category", name);
  }

  const brands = {};
  for (const name of ["Sud Daiana", "Flor de Seda", "Bella Moda", "Doce Charme"]) {
    brands[name] = await upsertByName("brand", name);
  }

  const productSeeds = [
    {
      name: "Vestido Floral Midi",
      description: "Vestido leve com estampa floral e caimento elegante.",
      sku: "VEST-FLORAL-MIDI",
      imageUrl: "https://images.unsplash.com/photo-1612336307429-8a898d10e223?auto=format&fit=crop&w=800&q=80",
      costPrice: 82.5,
      salePrice: 189.9,
      promoPrice: 169.9,
      minStock: 3,
      location: "Arara premium A1",
      active: true,
      onPromotion: true,
      availableOnline: true,
      categoryId: categories.Vestidos.id,
      brandId: brands["Flor de Seda"].id,
      variants: [
        { color: "Rosa", size: "P", sku: "VEST-FLORAL-RO-P", stock: 7 },
        { color: "Rosa", size: "M", sku: "VEST-FLORAL-RO-M", stock: 5 },
        { color: "Azul", size: "G", sku: "VEST-FLORAL-AZ-G", stock: 2 }
      ]
    },
    {
      name: "Camiseta Básica Feminina",
      description: "Malha macia para combinações do dia a dia.",
      sku: "CAM-BASICA-FEM",
      imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80",
      costPrice: 28,
      salePrice: 59.9,
      minStock: 4,
      location: "Prateleira B2",
      active: true,
      availableOnline: true,
      categoryId: categories.Blusas.id,
      brandId: brands["Sud Daiana"].id,
      variants: [
        { color: "Branca", size: "P", sku: "CAM-BR-P", stock: 12 },
        { color: "Preta", size: "M", sku: "CAM-PT-M", stock: 9 },
        { color: "Rosa", size: "G", sku: "CAM-RO-G", stock: 8 }
      ]
    },
    {
      name: "Calça Jeans Skinny",
      description: "Jeans com elastano e modelagem confortável.",
      sku: "JEANS-SKINNY-FEM",
      imageUrl: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80",
      costPrice: 74,
      salePrice: 149.9,
      minStock: 3,
      location: "Arara jeans C1",
      active: true,
      availableOnline: true,
      categoryId: categories.Calças.id,
      brandId: brands["Bella Moda"].id,
      variants: [
        { color: "Jeans Claro", size: "36", sku: "JEANS-CL-36", stock: 4 },
        { color: "Jeans Escuro", size: "38", sku: "JEANS-ES-38", stock: 6 },
        { color: "Jeans Escuro", size: "40", sku: "JEANS-ES-40", stock: 1 }
      ]
    },
    {
      name: "Conjunto Linho Elegance",
      description: "Blusa e short em linho, perfeito para vitrines de verão.",
      sku: "CONJ-LINHO-ELEG",
      imageUrl: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=800&q=80",
      costPrice: 96,
      salePrice: 229.9,
      minStock: 2,
      location: "Manequim entrada",
      active: true,
      availableOnline: true,
      categoryId: categories.Conjuntos.id,
      brandId: brands["Doce Charme"].id,
      variants: [
        { color: "Areia", size: "P", sku: "CONJ-LINHO-AR-P", stock: 3 },
        { color: "Areia", size: "M", sku: "CONJ-LINHO-AR-M", stock: 2 },
        { color: "Verde", size: "G", sku: "CONJ-LINHO-VD-G", stock: 2 }
      ]
    },
    {
      name: "Bolsa Feminina Caramelo",
      description: "Bolsa estruturada com acabamento dourado.",
      sku: "BOLSA-CARAMELO",
      imageUrl: "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=800&q=80",
      costPrice: 68,
      salePrice: 139.9,
      minStock: 2,
      location: "Expositor de acessórios",
      active: true,
      availableOnline: true,
      categoryId: categories.Bolsas.id,
      brandId: brands["Sud Daiana"].id,
      variants: [
        { color: "Caramelo", size: "Único", sku: "BOLSA-CAR-UN", stock: 5 },
        { color: "Preta", size: "Único", sku: "BOLSA-PT-UN", stock: 3 }
      ]
    },
    {
      name: "Vestido Infantil Laço",
      description: "Vestido infantil delicado para ocasiões especiais.",
      sku: "VEST-INF-LACO",
      imageUrl: "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?auto=format&fit=crop&w=800&q=80",
      costPrice: 45,
      salePrice: 99.9,
      minStock: 3,
      location: "Infantil D1",
      active: true,
      availableOnline: true,
      categoryId: categories.Infantil.id,
      brandId: brands["Doce Charme"].id,
      variants: [
        { color: "Lilás", size: "4", sku: "VEST-INF-LI-4", stock: 4 },
        { color: "Rosa", size: "6", sku: "VEST-INF-RO-6", stock: 2 },
        { color: "Rosa", size: "8", sku: "VEST-INF-RO-8", stock: 1 }
      ]
    }
  ];

  const products = {};
  for (const product of productSeeds) {
    products[product.sku] = await upsertProduct(product);
  }

  const customers = await Promise.all([
    upsertCustomer({ name: "Mariana Silva", phone: "11999990000", cpf: "12345678901", email: "mariana@email.com", address: "Rua das Flores, 120", city: "São Paulo", district: "Centro", loyaltyPoints: 420, notes: "Cliente gosta de vestidos midi." }),
    upsertCustomer({ name: "Juliana Costa", phone: "11988887777", cpf: "23456789012", email: "juliana@email.com", address: "Av. Primavera, 45", city: "São Paulo", district: "Vila Nova", loyaltyPoints: 185 }),
    upsertCustomer({ name: "Beatriz Lima", phone: "11977776666", cpf: "34567890123", email: "beatriz@email.com", address: "Rua das Acácias, 78", city: "São Paulo", district: "Jardim Bela Vista", loyaltyPoints: 760 }),
    upsertCustomer({ name: "Camila Santos", phone: "11966665555", cpf: "45678901234", email: "camila@email.com", address: "Rua Aurora, 300", city: "São Paulo", district: "Centro", loyaltyPoints: 95 })
  ]);

  await prisma.storeConfig.upsert({
    where: { id: 1 },
    update: {
      storeName: "Sud Daiana Modas",
      phone: "(11) 3333-0000",
      whatsapp: "11999990000",
      email: "contato@suddaiana.com",
      address: "Rua da Moda, 100 - Centro",
      taxRegime: "Simples Nacional",
      fiscalEnvironment: "HOMOLOGACAO",
      loyaltyRate: 1,
      lowStockDefault: 3
    },
    create: {
      storeName: "Sud Daiana Modas",
      phone: "(11) 3333-0000",
      whatsapp: "11999990000",
      email: "contato@suddaiana.com",
      address: "Rua da Moda, 100 - Centro",
      taxRegime: "Simples Nacional",
      fiscalEnvironment: "HOMOLOGACAO",
      loyaltyRate: 1,
      lowStockDefault: 3
    }
  });

  const sale1 = await createSaleIfMissing({
    code: "SD-2026-0001",
    customer: customers[0],
    user: admin,
    method: "PIX",
    createdAt: daysAgo(0),
    items: [
      { product: products["VEST-FLORAL-MIDI"], variantSku: "VEST-FLORAL-RO-M", quantity: 1 },
      { product: products["BOLSA-CARAMELO"], variantSku: "BOLSA-CAR-UN", quantity: 1 }
    ]
  });

  const sale2 = await createSaleIfMissing({
    code: "SD-2026-0002",
    customer: customers[1],
    user: admin,
    method: "CREDITO",
    discount: 10,
    createdAt: daysAgo(1),
    items: [
      { product: products["CONJ-LINHO-ELEG"], variantSku: "CONJ-LINHO-AR-M", quantity: 1 }
    ]
  });

  const sale3 = await createSaleIfMissing({
    code: "SD-2026-0003",
    customer: customers[2],
    user: admin,
    method: "CREDIARIO",
    createdAt: daysAgo(2),
    items: [
      { product: products["JEANS-SKINNY-FEM"], variantSku: "JEANS-ES-38", quantity: 1 },
      { product: products["CAM-BASICA-FEM"], variantSku: "CAM-BR-P", quantity: 2 }
    ]
  });

  await createSaleIfMissing({
    code: "SD-2026-0004",
    customer: customers[3],
    user: admin,
    method: "DINHEIRO",
    createdAt: daysAgo(4),
    items: [
      { product: products["VEST-INF-LACO"], variantSku: "VEST-INF-RO-6", quantity: 1 }
    ]
  });

  const creditExists = await prisma.creditAccount.findUnique({ where: { saleId: sale3.id } });
  if (!creditExists) {
    await prisma.creditAccount.create({
      data: {
        saleId: sale3.id,
        customerId: customers[2].id,
        total: sale3.total,
        paid: 0,
        status: "PENDENTE",
        installments: {
          create: [
            { number: 1, dueDate: daysAgo(-7), amount: Number(sale3.total) / 2, status: "PENDENTE" },
            { number: 2, dueDate: daysAgo(-37), amount: Number(sale3.total) / 2, status: "PENDENTE" }
          ]
        }
      }
    });
  }

  const openCash = await prisma.cashRegister.findFirst({ where: { operatorName: "Caixa da Loja", status: "ABERTO" } });
  if (!openCash) {
    await prisma.cashRegister.create({
      data: {
        operatorName: "Caixa da Loja",
        openingAmount: 150,
        status: "ABERTO",
        movements: {
          create: [
            { type: "ENTRADA", method: "DINHEIRO", amount: 150, description: "Fundo de troco" },
            { type: "VENDA", method: "PIX", amount: Number(sale1.total), description: `Venda ${sale1.code}` },
            { type: "VENDA", method: "CREDITO", amount: Number(sale2.total), description: `Venda ${sale2.code}` }
          ]
        }
      }
    });
  }

  const promotionSeeds = [
    { name: "Semana Premium 20% OFF", type: "CATEGORIA", target: "Vestidos", discountType: "PERCENTUAL", discountValue: 20, minValue: 100, startsAt: daysAgo(2), endsAt: daysAgo(-12), active: true },
    { name: "Cliente Ouro", type: "FIDELIDADE", target: "OURO", discountType: "VALOR", discountValue: 25, minValue: 150, startsAt: daysAgo(1), endsAt: daysAgo(-45), active: true },
    { name: "Combo Bolsa + Vestido", type: "COMBO", target: "Bolsas", discountType: "VALOR", discountValue: 30, minValue: 250, startsAt: daysAgo(0), endsAt: daysAgo(-20), active: true }
  ];

  for (const promo of promotionSeeds) {
    const exists = await prisma.promotion.findFirst({ where: { name: promo.name } });
    if (exists) await prisma.promotion.update({ where: { id: exists.id }, data: promo });
    else await prisma.promotion.create({ data: promo });
  }

  const deliverySeeds = [
    { saleId: sale1.id, customerId: customers[0].id, customerName: customers[0].name, phone: customers[0].phone, address: customers[0].address, district: customers[0].district, city: customers[0].city, fee: 8, payment: "Pix", status: "SEPARANDO", notes: "Enviar mensagem antes de sair." },
    { customerId: customers[1].id, customerName: customers[1].name, phone: customers[1].phone, address: customers[1].address, district: customers[1].district, city: customers[1].city, fee: 10, payment: "Cartão", status: "PRONTO_ENTREGA", notes: "Cliente pediu embalagem para presente." }
  ];

  for (const delivery of deliverySeeds) {
    const exists = delivery.saleId
      ? await prisma.deliveryOrder.findUnique({ where: { saleId: delivery.saleId } })
      : await prisma.deliveryOrder.findFirst({ where: { customerName: delivery.customerName, status: delivery.status } });
    if (!exists) await prisma.deliveryOrder.create({ data: delivery });
  }

  const invoiceExists = await prisma.invoice.findUnique({ where: { saleId: sale2.id } });
  if (!invoiceExists) {
    await prisma.invoice.create({
      data: {
        saleId: sale2.id,
        type: "NFC-e",
        status: "AUTORIZADA",
        number: "0000125",
        provider: "Homologação",
        xmlPath: "/fiscal/xml/0000125.xml",
        danfePath: "/fiscal/danfe/0000125.pdf"
      }
    });
  }

  const loyaltyExists = await prisma.loyaltyTransaction.findFirst({ where: { description: "Pontos premium de boas-vindas" } });
  if (!loyaltyExists) {
    await prisma.loyaltyTransaction.createMany({
      data: customers.map((customer, index) => ({
        customerId: customer.id,
        points: [120, 80, 200, 50][index],
        type: "ENTRADA",
        description: "Pontos premium de boas-vindas"
      }))
    });
  }

  console.log("Seed premium da Sud Daiana Modas concluído.");
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
