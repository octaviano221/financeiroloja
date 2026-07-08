import { Router } from "express";
import { prisma } from "../db.js";

const router = Router();

router.get("/catalog", async (_req, res) => {
  const products = await prisma.product.findMany({
    where: { active: true, availableOnline: true },
    include: { category: true, brand: true, variants: { where: { active: true, stock: { gt: 0 } } } },
    orderBy: { name: "asc" }
  });
  res.json(products);
});

router.post("/orders", async (req, res) => {
  const order = await prisma.deliveryOrder.create({
    data: {
      customerName: req.body.customerName,
      phone: req.body.phone,
      address: req.body.address || "Retirada na loja",
      district: req.body.district || "Centro",
      city: req.body.city || "Cidade",
      reference: req.body.reference,
      fee: req.body.fee || 0,
      payment: req.body.payment,
      notes: req.body.notes,
      status: "NOVO"
    }
  });
  res.status(201).json(order);
});

export default router;
