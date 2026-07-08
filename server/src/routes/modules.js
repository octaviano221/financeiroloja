import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";

const router = Router();

const moneySchema = z.coerce.number().nonnegative();
const deliveryStatusSchema = z.enum(["NOVO", "SEPARANDO", "AGUARDANDO_PAGAMENTO", "PRONTO_ENTREGA", "SAIU_ENTREGA", "ENTREGUE", "CANCELADO"]);
const deliverySchema = z.object({
  saleId: z.number().optional().nullable(),
  customerId: z.number().optional().nullable(),
  customerName: z.string().min(2),
  phone: z.string().min(8),
  address: z.string().min(3),
  district: z.string().min(2),
  city: z.string().min(2),
  reference: z.string().optional().nullable(),
  fee: moneySchema.default(0),
  status: deliveryStatusSchema.default("NOVO"),
  payment: z.string().min(2),
  notes: z.string().optional().nullable()
});

const promoSchema = z.object({
  name: z.string().min(2),
  type: z.string().min(2),
  target: z.string().min(1),
  discountType: z.string().min(2),
  discountValue: moneySchema,
  minValue: moneySchema.optional().nullable(),
  startsAt: z.string(),
  endsAt: z.string(),
  active: z.boolean().default(true)
});

const cashOpenSchema = z.object({
  operatorName: z.string().min(2),
  openingAmount: moneySchema
});

const cashMovementSchema = z.object({
  type: z.string().min(2),
  method: z.string().min(2),
  amount: moneySchema,
  description: z.string().min(2)
});

const invoiceSchema = z.object({
  saleId: z.coerce.number().int().positive(),
  type: z.string().min(2),
  status: z.enum(["PENDENTE", "AUTORIZADA", "REJEITADA", "CANCELADA"]).default("PENDENTE"),
  number: z.string().optional().nullable(),
  xmlPath: z.string().optional().nullable(),
  danfePath: z.string().optional().nullable(),
  provider: z.string().optional().nullable(),
  rejection: z.string().optional().nullable()
});

const settingsSchema = z.object({
  storeName: z.string().min(2),
  logoUrl: z.string().optional().nullable(),
  cnpj: z.string().optional().nullable(),
  stateRegistration: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  taxRegime: z.string().optional().nullable(),
  fiscalEnvironment: z.string().min(2).default("HOMOLOGACAO"),
  loyaltyRate: z.coerce.number().nonnegative().default(1),
  lowStockDefault: z.coerce.number().int().nonnegative().default(3)
});

router.get("/credit", async (_req, res) => {
  const rows = await prisma.creditAccount.findMany({
    include: { customer: true, sale: true, installments: true },
    orderBy: { createdAt: "desc" }
  });
  res.json(rows);
});

router.post("/credit/installments/:id/pay", async (req, res) => {
  const parsed = z.object({ amount: moneySchema }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Pagamento inválido.", issues: parsed.error.issues });
  const installment = await prisma.$transaction(async (tx) => {
    const current = await tx.creditInstallment.findUnique({ where: { id: Number(req.params.id) } });
    if (!current) throw new Error("Parcela não encontrada.");
    if (current.status === "PAGA") return current;

    const updated = await tx.creditInstallment.update({
      where: { id: current.id },
      data: { paidAmount: parsed.data.amount, status: "PAGA", paidAt: new Date() }
    });

    const account = await tx.creditAccount.update({
      where: { id: current.creditAccountId },
      data: { paid: { increment: parsed.data.amount } },
      include: { installments: true }
    });

    const allPaid = account.installments.every((item) => item.id === updated.id || item.status === "PAGA");
    if (allPaid) await tx.creditAccount.update({ where: { id: account.id }, data: { status: "PAGA" } });
    return updated;
  });
  res.json(installment);
});

router.get("/delivery", async (_req, res) => {
  res.json(await prisma.deliveryOrder.findMany({ include: { customer: true, sale: true }, orderBy: { createdAt: "desc" } }));
});

router.post("/delivery", async (req, res) => {
  const parsed = deliverySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Pedido de delivery inválido.", issues: parsed.error.issues });
  const order = await prisma.deliveryOrder.create({ data: parsed.data });
  res.status(201).json(order);
});

router.patch("/delivery/:id/status", async (req, res) => {
  const parsed = z.object({ status: deliveryStatusSchema }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Status inválido.", issues: parsed.error.issues });
  const order = await prisma.deliveryOrder.update({ where: { id: Number(req.params.id) }, data: { status: parsed.data.status } });
  res.json(order);
});

router.get("/promotions", async (_req, res) => {
  res.json(await prisma.promotion.findMany({ orderBy: { startsAt: "desc" } }));
});

router.post("/promotions", async (req, res) => {
  const parsed = promoSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Promoção inválida.", issues: parsed.error.issues });
  const promo = await prisma.promotion.create({ data: { ...parsed.data, startsAt: new Date(parsed.data.startsAt), endsAt: new Date(parsed.data.endsAt) } });
  res.status(201).json(promo);
});

router.get("/cash", async (_req, res) => {
  res.json(await prisma.cashRegister.findMany({ include: { movements: true }, orderBy: { openedAt: "desc" } }));
});

router.post("/cash/open", async (req, res) => {
  const parsed = cashOpenSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Abertura de caixa inválida.", issues: parsed.error.issues });
  const opened = await prisma.cashRegister.findFirst({ where: { status: "ABERTO" } });
  if (opened) return res.status(409).json({ message: "Já existe um caixa aberto." });
  const cash = await prisma.cashRegister.create({ data: parsed.data });
  res.status(201).json(cash);
});

router.post("/cash/:id/movement", async (req, res) => {
  const parsed = cashMovementSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Movimento de caixa inválido.", issues: parsed.error.issues });
  const movement = await prisma.cashMovement.create({ data: { ...parsed.data, cashRegisterId: Number(req.params.id) } });
  res.status(201).json(movement);
});

router.post("/cash/:id/close", async (req, res) => {
  const parsed = z.object({ closingAmount: moneySchema, expectedAmount: moneySchema }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Fechamento de caixa inválido.", issues: parsed.error.issues });
  const cash = await prisma.cashRegister.update({
    where: { id: Number(req.params.id) },
    data: {
      closingAmount: parsed.data.closingAmount,
      expectedAmount: parsed.data.expectedAmount,
      difference: Number(parsed.data.closingAmount || 0) - Number(parsed.data.expectedAmount || 0),
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
  const parsed = invoiceSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Nota fiscal inválida.", issues: parsed.error.issues });
  const invoice = await prisma.invoice.create({ data: parsed.data });
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
  const parsed = settingsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Configurações inválidas.", issues: parsed.error.issues });
  const current = await prisma.storeConfig.findFirst();
  const config = current
    ? await prisma.storeConfig.update({ where: { id: current.id }, data: parsed.data })
    : await prisma.storeConfig.create({ data: parsed.data });
  res.json(config);
});

export default router;
