import { Router } from "express";
import { prisma } from "../db.js";

const router = Router();

router.get("/credit", async (_req, res) => {
  const rows = await prisma.creditAccount.findMany({
    include: { customer: true, sale: true, installments: true },
    orderBy: { createdAt: "desc" }
  });
  res.json(rows);
});

router.post("/credit/installments/:id/pay", async (req, res) => {
  const installment = await prisma.creditInstallment.update({
    where: { id: Number(req.params.id) },
    data: { paidAmount: req.body.amount, status: "PAGA", paidAt: new Date() }
  });
  res.json(installment);
});

router.get("/delivery", async (_req, res) => {
  res.json(await prisma.deliveryOrder.findMany({ include: { customer: true, sale: true }, orderBy: { createdAt: "desc" } }));
});

router.post("/delivery", async (req, res) => {
  const order = await prisma.deliveryOrder.create({ data: req.body });
  res.status(201).json(order);
});

router.patch("/delivery/:id/status", async (req, res) => {
  const order = await prisma.deliveryOrder.update({ where: { id: Number(req.params.id) }, data: { status: req.body.status } });
  res.json(order);
});

router.get("/promotions", async (_req, res) => {
  res.json(await prisma.promotion.findMany({ orderBy: { startsAt: "desc" } }));
});

router.post("/promotions", async (req, res) => {
  const promo = await prisma.promotion.create({ data: { ...req.body, startsAt: new Date(req.body.startsAt), endsAt: new Date(req.body.endsAt) } });
  res.status(201).json(promo);
});

router.get("/cash", async (_req, res) => {
  res.json(await prisma.cashRegister.findMany({ include: { movements: true }, orderBy: { openedAt: "desc" } }));
});

router.post("/cash/open", async (req, res) => {
  const cash = await prisma.cashRegister.create({ data: req.body });
  res.status(201).json(cash);
});

router.post("/cash/:id/movement", async (req, res) => {
  const movement = await prisma.cashMovement.create({ data: { ...req.body, cashRegisterId: Number(req.params.id) } });
  res.status(201).json(movement);
});

router.post("/cash/:id/close", async (req, res) => {
  const cash = await prisma.cashRegister.update({
    where: { id: Number(req.params.id) },
    data: {
      closingAmount: req.body.closingAmount,
      expectedAmount: req.body.expectedAmount,
      difference: Number(req.body.closingAmount || 0) - Number(req.body.expectedAmount || 0),
      status: "FECHADO",
      closedAt: new Date()
    }
  });
  res.json(cash);
});

router.get("/invoices", async (_req, res) => {
  res.json(await prisma.invoice.findMany({ include: { sale: true }, orderBy: { createdAt: "desc" } }));
});

router.post("/invoices", async (req, res) => {
  const invoice = await prisma.invoice.create({ data: req.body });
  res.status(201).json(invoice);
});

router.get("/reports", async (_req, res) => {
  const [byPayment, products, customers, lowStock] = await Promise.all([
    prisma.payment.groupBy({ by: ["method"], _sum: { amount: true } }),
    prisma.saleItem.groupBy({ by: ["productId"], _sum: { quantity: true, total: true }, orderBy: { _sum: { quantity: "desc" } }, take: 10 }),
    prisma.customer.findMany({ orderBy: { loyaltyPoints: "desc" }, take: 10 }),
    prisma.productVariant.findMany({ where: { stock: { lte: 3 } }, include: { product: true }, orderBy: { stock: "asc" }, take: 20 })
  ]);
  res.json({ byPayment, products, customers, lowStock });
});

router.get("/settings", async (_req, res) => {
  const config = await prisma.storeConfig.findFirst();
  res.json(config);
});

router.put("/settings", async (req, res) => {
  const current = await prisma.storeConfig.findFirst();
  const config = current
    ? await prisma.storeConfig.update({ where: { id: current.id }, data: req.body })
    : await prisma.storeConfig.create({ data: req.body });
  res.json(config);
});

export default router;
