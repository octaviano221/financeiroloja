import "dotenv/config";
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
import { auth } from "./middleware/auth.js";

const app = express();

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));

app.get("/health", (_req, res) => res.json({ ok: true, name: "Sud Daiana Modas API" }));
app.use("/api/auth", authRoutes);
app.use("/api/online", onlineRoutes);
app.use("/api/dashboard", auth(), dashboardRoutes);
app.use("/api/products", auth(), productRoutes);
app.use("/api/customers", auth(), customerRoutes);
app.use("/api/sales", auth(), saleRoutes);
app.use("/api", auth(), moduleRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(400).json({ message: err.message || "Erro inesperado." });
});

const port = process.env.PORT || 3333;
app.listen(port, () => {
  console.log(`API Sud Daiana Modas rodando na porta ${port}`);
});
