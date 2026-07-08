import { Router } from "express";
import { prisma } from "../db.js";
import { money } from "../utils.js";

const router = Router();

router.get("/", async (_req, res) => {
  const now = new Date();
  const startDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    todaySales,
    monthSales,
    salesCount,
    openCredit,
    pendingDelivery,
    activeCustomers,
    activePromos,
    lowProducts,
    overdue,
    recentSales
  ] = await Promise.all([
    prisma.sale.aggregate({ where: { createdAt: { gte: startDay }, status: "FINALIZADA" }, _sum: { total: true, profit: true } }),
    prisma.sale.aggregate({ where: { createdAt: { gte: startMonth }, status: "FINALIZADA" }, _sum: { total: true, profit: true } }),
    prisma.sale.count({ where: { createdAt: { gte: startDay }, status: "FINALIZADA" } }),
    prisma.creditInstallment.aggregate({ where: { status: { in: ["PENDENTE", "VENCIDA"] }, }, _sum: { amount: true, paidAmount: true } }),
    prisma.deliveryOrder.count({ where: { status: { notIn: ["ENTREGUE", "CANCELADO"] } } }),
    prisma.customer.count({ where: { loyaltyPoints: { gt: 0 } } }),
    prisma.promotion.count({ where: { active: true, startsAt: { lte: now }, endsAt: { gte: now } } }),
    prisma.productVariant.findMany({
      where: { active: true, stock: { lte: 3 } },
      include: { product: true },
      take: 8,
      orderBy: { stock: "asc" }
    }),
    prisma.creditInstallment.count({ where: { dueDate: { lt: now }, status: "PENDENTE" } }),
    prisma.sale.findMany({
      where: { status: "FINALIZADA" },
      include: { customer: true, payments: true },
      orderBy: { createdAt: "desc" },
      take: 6
    })
  ]);

  const creditOpen = money(openCredit._sum.amount) - money(openCredit._sum.paidAmount);

  res.json({
    cards: {
      todaySales: money(todaySales._sum.total),
      monthSales: money(monthSales._sum.total),
      salesCount,
      estimatedProfit: money(monthSales._sum.profit),
      openCredit: creditOpen,
      pendingDelivery,
      lowStock: lowProducts.length,
      loyaltyCustomers: activeCustomers,
      activePromos
    },
    alerts: {
      overdueCredit: overdue,
      lowStock: lowProducts.map((item) => ({
        id: item.id,
        name: item.product.name,
        color: item.color,
        size: item.size,
        stock: item.stock
      })),
      pendingDelivery
    },
    chart: Array.from({ length: 12 }).map((_, index) => ({
      label: `${index + 1}`,
      total: Math.round(800 + Math.random() * 4200)
    })),
    recentSales
  });
});

export default router;
