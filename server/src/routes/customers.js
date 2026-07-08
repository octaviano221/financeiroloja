import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";

const router = Router();

const schema = z.object({
  name: z.string().min(2),
  phone: z.string().min(8),
  cpf: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  birthDate: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  district: z.string().optional().nullable(),
  notes: z.string().optional().nullable()
});

router.get("/", async (req, res) => {
  const q = String(req.query.q || "");
  const customers = await prisma.customer.findMany({
    where: q ? { OR: [{ name: { contains: q } }, { phone: { contains: q } }, { cpf: { contains: q } }] } : undefined,
    include: { sales: { take: 5, orderBy: { createdAt: "desc" } }, creditAccounts: true },
    orderBy: { name: "asc" },
    take: 80
  });
  res.json(customers);
});

router.post("/", async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Cliente invalido.", issues: parsed.error.issues });
  const customer = await prisma.customer.create({
    data: { ...parsed.data, birthDate: parsed.data.birthDate ? new Date(parsed.data.birthDate) : null }
  });
  res.status(201).json(customer);
});

router.put("/:id", async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Cliente invalido.", issues: parsed.error.issues });
  const customer = await prisma.customer.update({
    where: { id: Number(req.params.id) },
    data: { ...parsed.data, birthDate: parsed.data.birthDate ? new Date(parsed.data.birthDate) : null }
  });
  res.json(customer);
});

export default router;
