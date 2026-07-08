import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";

const router = Router();

const onlineOrderSchema = z.object({
  customerName: z.string().min(2),
  phone: z.string().min(8),
  address: z.string().optional().nullable(),
  district: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  reference: z.string().optional().nullable(),
  fee: z.coerce.number().nonnegative().default(0),
  payment: z.string().min(2),
  notes: z.string().optional().nullable()
});

router.get("/catalog", async (_req, res) => {
  const products = await prisma.product.findMany({
    where: { active: true, availableOnline: true },
    include: { category: true, brand: true, variants: { where: { active: true, stock: { gt: 0 } } } },
    orderBy: { name: "asc" }
  });
  res.json(products);
});

router.post("/orders", async (req, res) => {
  const parsed = onlineOrderSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Pedido online inválido.", issues: parsed.error.issues });
  const data = parsed.data;
  const order = await prisma.deliveryOrder.create({
    data: {
      customerName: data.customerName,
      phone: data.phone,
      address: data.address || "Retirada na loja",
      district: data.district || "Centro",
      city: data.city || "Cidade",
      reference: data.reference,
      fee: data.fee,
      payment: data.payment,
      notes: data.notes,
      status: "NOVO"
    }
  });
  res.status(201).json(order);
});

export default router;
