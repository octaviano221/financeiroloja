import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import authRoutes from "./routes/auth.js";
import dashboardRoutes from "./routes/dashboard.js";
import productRoutes from "./routes/products.js";
import customerRoutes from "./routes/customers.js";
import saleRoutes from "./routes/sales.js";
import moduleRoutes from "./routes/modules.js";
import onlineRoutes from "./routes/online.js";
import userRoutes from "./routes/users.js";
import { auth } from "./middleware/auth.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDist = path.resolve(__dirname, "../../client/dist");

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));

app.get("/health", (_req, res) => res.json({ ok: true, name: "Sud Daiana Modas API" }));
app.get("/health/db", async (_req, res) => {
  try {
    const users = await import("./db.js").then(({ prisma }) => prisma.user.count());
    res.json({ ok: true, database: "connected", users });
  } catch (error) {
    console.error("Erro no health/db:", error);
    res.status(500).json({ ok: false, database: "error", message: error.message });
  }
});
app.use("/api/auth", authRoutes);
app.use("/api/online", onlineRoutes);
app.use("/api/dashboard", auth(), dashboardRoutes);
app.use("/api/products", auth(), productRoutes);
app.use("/api/customers", auth(), customerRoutes);
app.use("/api/sales", auth(), saleRoutes);
app.use("/api/users", auth(), userRoutes);
app.use("/api", auth(), moduleRoutes);

app.use(express.static(clientDist));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  return res.sendFile(path.join(clientDist, "index.html"));
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(400).json({ message: err.message || "Erro inesperado." });
});

const port = process.env.PORT || 3333;
app.listen(port, () => {
  console.log(`API Sud Daiana Modas rodando na porta ${port}`);
});
