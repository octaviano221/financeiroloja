import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../db.js";

const router = Router();

const roles = ["ADMIN", "CAIXA", "VENDEDOR", "ESTOQUISTA", "ENTREGADOR"];

const createSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(roles),
  active: z.boolean().default(true)
});

const updateSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6).optional().or(z.literal("")),
  role: z.enum(roles),
  active: z.boolean()
});

function ensureAdmin(req, res, next) {
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({ message: "Apenas administrador pode gerenciar usuarios." });
  }
  return next();
}

router.use(ensureAdmin);

router.get("/", async (_req, res) => {
  const users = await prisma.user.findMany({
    orderBy: [{ active: "desc" }, { name: "asc" }],
    select: { id: true, name: true, email: true, role: true, active: true, createdAt: true, updatedAt: true }
  });
  res.json(users);
});

router.post("/", async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Usuario invalido.", issues: parsed.error.issues });

  const exists = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (exists) return res.status(409).json({ message: "Ja existe usuario com este email." });

  const user = await prisma.user.create({
    data: { ...parsed.data, password: await bcrypt.hash(parsed.data.password, 10) },
    select: { id: true, name: true, email: true, role: true, active: true, createdAt: true, updatedAt: true }
  });
  res.status(201).json(user);
});

router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Usuario invalido.", issues: parsed.error.issues });

  const data = { ...parsed.data };
  if (data.password) data.password = await bcrypt.hash(data.password, 10);
  else delete data.password;

  const user = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, name: true, email: true, role: true, active: true, createdAt: true, updatedAt: true }
  });
  res.json(user);
});

router.patch("/:id/toggle", async (req, res) => {
  const id = Number(req.params.id);
  if (id === req.user.id) return res.status(400).json({ message: "Voce nao pode desativar seu proprio usuario." });

  const current = await prisma.user.findUnique({ where: { id } });
  if (!current) return res.status(404).json({ message: "Usuario nao encontrado." });

  const user = await prisma.user.update({
    where: { id },
    data: { active: !current.active },
    select: { id: true, name: true, email: true, role: true, active: true, createdAt: true, updatedAt: true }
  });
  res.json(user);
});

export default router;
