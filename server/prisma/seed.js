import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.user.upsert({
    where: { email: "admin@suddaiana.com" },
    update: {},
    create: {
      name: "Loja da Vo",
      email: "admin@suddaiana.com",
      password: await bcrypt.hash("admin123", 10),
      role: "ADMIN"
    }
  });

  const categories = ["Vestidos", "Blusas", "Calcas", "Infantil", "Acessorios", "Lingerie"];
  for (const name of categories) {
    await prisma.category.upsert({ where: { name }, update: {}, create: { name } });
  }

  const brands = ["Sud Daiana", "Flor de Seda", "Bella Moda"];
  for (const name of brands) {
    await prisma.brand.upsert({ where: { name }, update: {}, create: { name } });
  }

  const vestido = await prisma.category.findUnique({ where: { name: "Vestidos" } });
  const blusas = await prisma.category.findUnique({ where: { name: "Blusas" } });
  const calcas = await prisma.category.findUnique({ where: { name: "Calcas" } });
  const marca = await prisma.brand.findUnique({ where: { name: "Sud Daiana" } });

  const products = [
    {
      name: "Vestido Floral Midi",
      sku: "VEST-FLORAL",
      imageUrl: "https://images.unsplash.com/photo-1612336307429-8a898d10e223?auto=format&fit=crop&w=600&q=80",
      costPrice: 82.5,
      salePrice: 189.9,
      promoPrice: 169.9,
      onPromotion: true,
      categoryId: vestido.id,
      brandId: marca.id,
      variants: [
        { color: "Rosa", size: "P", sku: "VEST-FLORAL-RO-P", stock: 5 },
        { color: "Rosa", size: "M", sku: "VEST-FLORAL-RO-M", stock: 3 },
        { color: "Azul", size: "G", sku: "VEST-FLORAL-AZ-G", stock: 2 }
      ]
    },
    {
      name: "Camiseta Basica Feminina",
      sku: "CAM-BASICA",
      imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80",
      costPrice: 28,
      salePrice: 59.9,
      categoryId: blusas.id,
      brandId: marca.id,
      variants: [
        { color: "Branca", size: "P", sku: "CAM-BR-P", stock: 12 },
        { color: "Preta", size: "M", sku: "CAM-PT-M", stock: 9 },
        { color: "Rosa", size: "G", sku: "CAM-RO-G", stock: 7 }
      ]
    },
    {
      name: "Calca Jeans Skinny",
      sku: "JEANS-SKINNY",
      imageUrl: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=600&q=80",
      costPrice: 74,
      salePrice: 149.9,
      categoryId: calcas.id,
      brandId: marca.id,
      variants: [
        { color: "Jeans Claro", size: "36", sku: "JEANS-CL-36", stock: 4 },
        { color: "Jeans Escuro", size: "38", sku: "JEANS-ES-38", stock: 6 },
        { color: "Jeans Escuro", size: "40", sku: "JEANS-ES-40", stock: 1 }
      ]
    }
  ];

  for (const data of products) {
    const existing = await prisma.product.findUnique({ where: { sku: data.sku } });
    if (!existing) {
      await prisma.product.create({ data: { ...data, minStock: 3, location: "Arara principal", variants: { create: data.variants } } });
    }
  }

  const customer = await prisma.customer.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: "Mariana Silva",
      phone: "11999990000",
      cpf: "12345678901",
      email: "mariana@email.com",
      address: "Rua das Flores, 120",
      city: "Sao Paulo",
      district: "Centro",
      loyaltyPoints: 248
    }
  });

  const now = new Date();
  const promotionSeeds = [
    {
        name: "Dia das Maes 20% OFF",
        type: "CATEGORIA",
        target: "Vestidos",
        discountType: "PERCENTUAL",
        discountValue: 20,
        startsAt: new Date(now.getFullYear(), now.getMonth(), 1),
        endsAt: new Date(now.getFullYear(), now.getMonth() + 1, 10),
        active: true
      },
      {
        name: "Cliente Ouro",
        type: "FIDELIDADE",
        target: "OURO",
        discountType: "VALOR",
        discountValue: 25,
        minValue: 150,
        startsAt: new Date(now.getFullYear(), now.getMonth(), 1),
        endsAt: new Date(now.getFullYear(), now.getMonth() + 2, 1),
        active: true
      }
  ];

  for (const promo of promotionSeeds) {
    const exists = await prisma.promotion.findFirst({ where: { name: promo.name } });
    if (!exists) await prisma.promotion.create({ data: promo });
  }

  await prisma.storeConfig.upsert({
    where: { id: 1 },
    update: {},
    create: {
      storeName: "Sud Daiana Modas",
      phone: "(11) 3333-0000",
      whatsapp: "11999990000",
      email: "contato@suddaiana.com",
      address: "Rua da Moda, 100",
      fiscalEnvironment: "HOMOLOGACAO"
    }
  });

  const deliveryExists = await prisma.deliveryOrder.findFirst({
    where: { customerName: customer.name, phone: customer.phone, status: "SEPARANDO" }
  });

  if (!deliveryExists) {
    await prisma.deliveryOrder.create({
      data: {
        customerId: customer.id,
        customerName: customer.name,
        phone: customer.phone,
        address: "Rua das Flores, 120",
        district: "Centro",
        city: "Sao Paulo",
        fee: 8,
        payment: "Pix",
        status: "SEPARANDO",
        notes: "Enviar mensagem antes de sair."
      }
    });
  }
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
