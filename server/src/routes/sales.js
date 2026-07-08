import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { money, saleCode } from "../utils.js";

const router = Router();

const saleSchema = z.object({
  customerId: z.number().optional().nullable(),
  discount: z.coerce.number().default(0),
  notes: z.string().optional().nullable(),
  items: z.array(z.object({
    productId: z.number(),
    variantId: z.number(),
    quantity: z.coerce.number().int().positive(),
    discount: z.coerce.number().default(0)
  })).min(1),
  payments: z.array(z.object({
    method: z.enum(["DINHEIRO", "PIX", "DEBITO", "CREDITO", "CREDIARIO", "VALE_TROCA"]),
    amount: z.coerce.number().positive(),
    details: z.string().optional().nullable()
  })).min(1),
  credit: z.object({
    installments: z.coerce.number().int().positive().default(1),
    firstDueDate: z.string()
  }).optional()
});

router.get("/", async (_req, res) => {
  const sales = await prisma.sale.findMany({
    include: { customer: true, user: true, items: { include: { product: true, variant: true } }, payments: true },
    orderBy: { createdAt: "desc" },
    take: 80
  });
  res.json(sales);
});

router.post("/", async (req, res) => {
  const parsed = saleSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Venda invalida.", issues: parsed.error.issues });

  const data = parsed.data;
  const sale = await prisma.$transaction(async (tx) => {
    const openCash = await tx.cashRegister.findFirst({ where: { status: "ABERTO" }, orderBy: { openedAt: "desc" } });
    if (!openCash) throw new Error("Abra o caixa antes de finalizar vendas.");

    const pricedItems = [];
    for (const item of data.items) {
      const variant = await tx.productVariant.findUnique({
        where: { id: item.variantId },
        include: { product: true }
      });
      if (!variant || !variant.active || !variant.product.active) throw new Error("Variação de produto inválida ou inativa.");
      if (variant.productId !== item.productId) throw new Error("Variação não pertence ao produto informado.");
      if (variant.stock < item.quantity) throw new Error(`Estoque insuficiente para ${variant.sku}.`);

      const unitPrice = money(variant.price || variant.product.promoPrice || variant.product.salePrice);
      const lineTotal = item.quantity * unitPrice - money(item.discount);
      pricedItems.push({ ...item, unitPrice, lineTotal, costPrice: money(variant.product.costPrice) });

      await tx.productVariant.update({ where: { id: item.variantId }, data: { stock: { decrement: item.quantity } } });
      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          variantId: item.variantId,
          type: "SAIDA",
          quantity: item.quantity,
          reason: "Venda PDV"
        }
      });
    }

    const subtotal = pricedItems.reduce((sum, item) => sum + item.lineTotal, 0);
    const total = Math.max(subtotal - money(data.discount), 0);
    const paid = data.payments.reduce((sum, item) => sum + money(item.amount), 0);
    if (Math.abs(paid - total) > 0.01) throw new Error("Pagamentos precisam fechar o total da venda.");
    const profit = pricedItems.reduce((sum, item) => sum + (item.unitPrice - item.costPrice) * item.quantity, 0) - money(data.discount);

    const created = await tx.sale.create({
      data: {
        code: saleCode(),
        customerId: data.customerId || null,
        userId: req.user.id,
        subtotal,
        discount: data.discount,
        total,
        profit,
        notes: data.notes,
        items: {
          create: pricedItems.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount,
            total: item.lineTotal
          }))
        },
        payments: { create: data.payments }
      },
      include: { items: true, payments: true, customer: true }
    });

    if (data.customerId) {
      await tx.customer.update({
        where: { id: data.customerId },
        data: { loyaltyPoints: { increment: Math.floor(total) } }
      });
      await tx.loyaltyTransaction.create({
        data: { customerId: data.customerId, points: Math.floor(total), type: "ENTRADA", description: `Pontos da venda ${created.code}` }
      });
    }

    const creditPayment = data.payments.find((payment) => payment.method === "CREDIARIO");
    if (creditPayment) {
      if (!data.customerId) throw new Error("Crediario exige cliente cadastrado.");
      const installments = data.credit?.installments || 1;
      const amount = money(creditPayment.amount) / installments;
      const firstDue = new Date(data.credit?.firstDueDate || Date.now());
      await tx.creditAccount.create({
        data: {
          saleId: created.id,
          customerId: data.customerId,
          total: creditPayment.amount,
          installments: {
            create: Array.from({ length: installments }).map((_, index) => {
              const dueDate = new Date(firstDue);
              dueDate.setMonth(firstDue.getMonth() + index);
              return { number: index + 1, dueDate, amount };
            })
          }
        }
      });
    }

    for (const payment of data.payments) {
      await tx.cashMovement.create({
        data: {
          cashRegisterId: openCash.id,
          type: "VENDA",
          method: payment.method,
          amount: payment.amount,
          description: `Venda ${created.code}`
        }
      });
    }

    return created;
  });

  res.status(201).json(sale);
});

router.post("/:id/cancel", async (req, res) => {
  if (req.user.role !== "ADMIN") return res.status(403).json({ message: "Apenas administrador cancela venda." });
  const id = Number(req.params.id);
  const sale = await prisma.sale.findUnique({ where: { id }, include: { items: true } });
  if (!sale) return res.status(404).json({ message: "Venda nao encontrada." });
  if (sale.status === "CANCELADA") return res.json(sale);

  await prisma.$transaction(async (tx) => {
    for (const item of sale.items) {
      if (item.variantId) await tx.productVariant.update({ where: { id: item.variantId }, data: { stock: { increment: item.quantity } } });
      await tx.stockMovement.create({ data: { productId: item.productId, variantId: item.variantId, type: "ENTRADA", quantity: item.quantity, reason: "Cancelamento de venda", reference: sale.code } });
    }
    await tx.sale.update({ where: { id }, data: { status: "CANCELADA" } });
  });

  res.json({ message: "Venda cancelada." });
});

export default router;
