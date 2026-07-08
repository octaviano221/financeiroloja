import { Router } from "express";
import { prisma } from "../db.js";
import { money } from "../utils.js";

const router = Router();

router.get("/", async (_req, res) => {
  const now = new Date();
  const startDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [
    todaySales,
    monthSales,
    todaySalesCount,
    monthSalesCount,
    monthSalesList,
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
    prisma.sale.count({ where: { createdAt: { gte: startMonth }, status: "FINALIZADA" } }),
    prisma.sale.findMany({
      where: { createdAt: { gte: startMonth, lt: nextMonth }, status: "FINALIZADA" },
      select: { createdAt: true, total: true },
      orderBy: { createdAt: "asc" }
    }),
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
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dailyTotals = new Map();
  for (const sale of monthSalesList) {
    const label = String(new Date(sale.createdAt).getDate()).padStart(2, "0");
    dailyTotals.set(label, money(dailyTotals.get(label) || 0) + money(sale.total));
  }

  res.json({
    cards: {
      todaySales: money(todaySales._sum.total),
      monthSales: money(monthSales._sum.total),
      salesCount: todaySalesCount,
      todaySalesCount,
      monthSalesCount,
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
    chart: Array.from({ length: daysInMonth }).map((_, index) => {
      const label = String(index + 1).padStart(2, "0");
      return {
        label,
        total: money(dailyTotals.get(label) || 0)
      };
    }),
    recentSales
  });
});

export default router;
