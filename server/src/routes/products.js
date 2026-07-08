import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { parsePagination } from "../utils.js";

const router = Router();

const productSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional().nullable(),
  sku: z.string().min(2),
  barcode: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  costPrice: z.coerce.number().nonnegative(),
  salePrice: z.coerce.number().positive(),
  promoPrice: z.coerce.number().optional().nullable(),
  minStock: z.coerce.number().int().nonnegative().default(1),
  location: z.string().optional().nullable(),
  active: z.boolean().default(true),
  onPromotion: z.boolean().default(false),
  availableOnline: z.boolean().default(true),
  categoryId: z.coerce.number().int(),
  brandId: z.coerce.number().int().optional().nullable(),
  variants: z.array(z.object({
    id: z.number().optional(),
    color: z.string().min(1),
    size: z.string().min(1),
    sku: z.string().min(2),
    barcode: z.string().optional().nullable(),
    stock: z.coerce.number().int().nonnegative(),
    price: z.coerce.number().optional().nullable(),
    active: z.boolean().default(true)
  })).default([])
});

router.get("/", async (req, res) => {
  const { limit, skip } = parsePagination(req);
  const q = String(req.query.q || "");
  const products = await prisma.product.findMany({
    where: q ? {
      OR: [
        { name: { contains: q } },
        { sku: { contains: q } },
        { barcode: { contains: q } },
        { variants: { some: { sku: { contains: q } } } }
      ]
    } : undefined,
    include: { category: true, brand: true, variants: true },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip
  });
  res.json(products);
});

router.post("/", async (req, res) => {
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Produto inválido.", issues: parsed.error.issues });
  const { variants, ...data } = parsed.data;
  const product = await prisma.product.create({
    data: {
      ...data,
      variants: { create: variants }
    },
    include: { category: true, brand: true, variants: true }
  });
  res.status(201).json(product);
});

router.put("/:id", async (req, res) => {
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Produto inválido.", issues: parsed.error.issues });
  const id = Number(req.params.id);
  const { variants, ...data } = parsed.data;

  const product = await prisma.$transaction(async (tx) => {
    const updated = await tx.product.update({ where: { id }, data });
    const incomingSkus = variants.map((variant) => variant.sku);

    for (const variant of variants) {
      await tx.productVariant.upsert({
        where: { sku: variant.sku },
        create: { ...variant, productId: id },
        update: {
          color: variant.color,
          size: variant.size,
          barcode: variant.barcode,
          stock: variant.stock,
          price: variant.price,
          active: variant.active
        }
      });
    }

    await tx.productVariant.updateMany({
      where: { productId: id, sku: { notIn: incomingSkus } },
      data: { active: false }
    });

    return tx.product.findUnique({
      where: { id: updated.id },
      include: { category: true, brand: true, variants: true }
    });
  });
  res.json(product);
});

router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  await prisma.product.update({ where: { id }, data: { active: false } });
  res.status(204).end();
});

router.get("/lookups/options", async (_req, res) => {
  const [categories, brands] = await Promise.all([
    prisma.category.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.brand.findMany({ where: { active: true }, orderBy: { name: "asc" } })
  ]);
  res.json({ categories, brands });
});

export default router;
