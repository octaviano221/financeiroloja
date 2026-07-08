import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BadgeDollarSign,
  BarChart3,
  Bell,
  Boxes,
  CalendarHeart,
  CreditCard,
  FileText,
  Gift,
  Heart,
  Home,
  LogOut,
  Menu,
  Package,
  Receipt,
  Search,
  Settings,
  ShoppingBag,
  Truck,
  Users,
  WalletCards,
  X
} from "lucide-react";
import { api, clearSession, getToken, getUser, money, setSession } from "./api";
import "./styles.css";

const nav = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "pdv", label: "PDV", icon: ShoppingBag },
  { id: "products", label: "Produtos", icon: Package },
  { id: "stock", label: "Estoque", icon: Boxes },
  { id: "customers", label: "Clientes", icon: Users },
  { id: "credit", label: "Crediario", icon: CreditCard },
  { id: "delivery", label: "Delivery", icon: Truck },
  { id: "promos", label: "Promocoes", icon: Gift },
  { id: "loyalty", label: "Fidelidade", icon: Heart },
  { id: "cash", label: "Caixa", icon: WalletCards },
  { id: "fiscal", label: "Nota Fiscal", icon: Receipt },
  { id: "reports", label: "Relatorios", icon: BarChart3 },
  { id: "online", label: "Pedido Online", icon: CalendarHeart },
  { id: "settings", label: "Configuracoes", icon: Settings }
];

function Login({ onLogin }) {
  const [email, setEmail] = useState("admin@suddaiana.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setError("");
    try {
      const session = await api("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      setSession(session);
      onLogin(session.user);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="brand-mark">SD</div>
        <h1>Sud Daiana Modas</h1>
        <p>Sistema de gestao para vender, controlar estoque e cuidar dos clientes com carinho.</p>
        <form onSubmit={submit} className="form-stack">
          <label>
            Email
            <input value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label>
            Senha
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>
          {error && <span className="error">{error}</span>}
          <button className="primary">Entrar no sistema</button>
        </form>
      </section>
    </main>
  );
}

function Shell({ user, onLogout }) {
  const [page, setPage] = useState("dashboard");
  const [open, setOpen] = useState(false);

  return (
    <div className="app-shell">
      <aside className={open ? "sidebar open" : "sidebar"}>
        <div className="logo">
          <div className="brand-mark small">SD</div>
          <div>
            <strong>Sud Daiana</strong>
            <span>Modas</span>
          </div>
          <button className="ghost mobile-only" onClick={() => setOpen(false)}><X size={18} /></button>
        </div>
        <nav>
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} className={page === item.id ? "active" : ""} onClick={() => { setPage(item.id); setOpen(false); }}>
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="made">Feito com amor para vestir historias.</div>
      </aside>

      <main className="content">
        <header className="topbar">
          <button className="ghost mobile-only" onClick={() => setOpen(true)}><Menu /></button>
          <div className="search">
            <Search size={18} />
            <input placeholder="Buscar produtos, clientes, pedidos..." />
          </div>
          <Bell size={20} />
          <div className="user-pill">
            <span>{user?.name || "Loja"}</span>
            <small>{user?.role || "ADMIN"}</small>
          </div>
          <button className="ghost" onClick={onLogout} title="Sair"><LogOut size={18} /></button>
        </header>
        <Page page={page} />
      </main>
    </div>
  );
}

function Page({ page }) {
  const map = {
    dashboard: <Dashboard />,
    pdv: <PDV />,
    products: <Products />,
    stock: <SimpleModule title="Estoque" endpoint="/api/products" description="Movimentacoes, inventario, filtros por cor/tamanho e alertas de estoque baixo." />,
    customers: <Customers />,
    credit: <SimpleModule title="Crediario" endpoint="/api/credit" description="Parcelas, baixas de pagamento, vencidos e saldo devedor por cliente." />,
    delivery: <SimpleModule title="Delivery" endpoint="/api/delivery" description="Pedidos do WhatsApp, retirada na loja, entrega propria e status de separacao." />,
    promos: <SimpleModule title="Promocoes" endpoint="/api/promotions" description="Cupons, descontos por produto/categoria e campanhas por periodo." />,
    loyalty: <SimpleModule title="Fidelidade" endpoint="/api/customers" description="Pontos, niveis Bronze/Prata/Ouro/VIP e campanhas para clientes inativos." />,
    cash: <SimpleModule title="Caixa" endpoint="/api/cash" description="Abertura, sangria, entradas, saidas, fechamento e diferenca de caixa." />,
    fiscal: <SimpleModule title="Nota Fiscal" endpoint="/api/invoices" description="Estrutura pronta para NFC-e/NF-e, XML, DANFE e provedor fiscal homologado." />,
    reports: <Reports />,
    online: <OnlineStore />,
    settings: <SettingsPage />
  };
  return map[page] || map.dashboard;
}

function Dashboard() {
  const [data, setData] = useState(null);
  useEffect(() => { api("/api/dashboard").then(setData).catch(console.error); }, []);
  const cards = data?.cards || {};
  const cardList = [
    ["Vendas do Dia", money(cards.todaySales), BadgeDollarSign],
    ["Vendas do Mes", money(cards.monthSales), BarChart3],
    ["Quantidade de Vendas", cards.salesCount || 0, ShoppingBag],
    ["Lucro Estimado", money(cards.estimatedProfit), WalletCards],
    ["Crediario em Aberto", money(cards.openCredit), CreditCard],
    ["Delivery Pendente", cards.pendingDelivery || 0, Truck],
    ["Estoque Baixo", cards.lowStock || 0, Boxes],
    ["Clientes Fidelidade", cards.loyaltyCustomers || 0, Heart],
    ["Promocoes Ativas", cards.activePromos || 0, Gift]
  ];

  return (
    <section className="page">
      <div className="page-title">
        <h2>Dashboard</h2>
        <p>Visao geral da loja hoje.</p>
      </div>
      <div className="metric-grid">
        {cardList.map(([label, value, Icon]) => (
          <article className="metric" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
            <Icon />
          </article>
        ))}
      </div>
      <div className="dashboard-grid">
        <section className="panel wide">
          <div className="panel-head"><h3>Grafico de Vendas</h3><button>Este mes</button></div>
          <div className="chart">
            {(data?.chart || []).map((point) => <i key={point.label} style={{ height: `${Math.max(point.total / 55, 18)}px` }} title={`${point.label}: ${money(point.total)}`} />)}
          </div>
        </section>
        <section className="panel">
          <div className="panel-head"><h3>Alertas</h3></div>
          <ul className="soft-list">
            <li>{data?.alerts?.overdueCredit || 0} parcelas vencidas</li>
            <li>{data?.alerts?.pendingDelivery || 0} entregas aguardando</li>
            {(data?.alerts?.lowStock || []).slice(0, 4).map((item) => <li key={item.id}>{item.name} {item.size} com {item.stock} un.</li>)}
          </ul>
        </section>
        <section className="panel wide">
          <div className="panel-head"><h3>Vendas Recentes</h3></div>
          <DataTable rows={data?.recentSales || []} columns={["code", "customer.name", "total", "createdAt"]} />
        </section>
      </div>
    </section>
  );
}

function PDV() {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [cart, setCart] = useState([]);
  const [customerId, setCustomerId] = useState("");
  const [payment, setPayment] = useState("PIX");
  const [message, setMessage] = useState("");

  useEffect(() => {
    api("/api/products").then(setProducts);
    api("/api/customers").then(setCustomers);
  }, []);

  const total = cart.reduce((sum, item) => sum + item.quantity * Number(item.unitPrice), 0);

  function add(product) {
    const variant = product.variants?.[0];
    setCart((current) => [...current, { product, variant, productId: product.id, variantId: variant?.id, quantity: 1, unitPrice: Number(product.promoPrice || product.salePrice), discount: 0 }]);
  }

  async function finish() {
    setMessage("");
    try {
      await api("/api/sales", {
        method: "POST",
        body: JSON.stringify({
          customerId: customerId ? Number(customerId) : null,
          discount: 0,
          items: cart.map(({ productId, variantId, quantity, unitPrice, discount }) => ({ productId, variantId, quantity, unitPrice, discount })),
          payments: [{ method: payment, amount: total }]
        })
      });
      setCart([]);
      setMessage("Venda finalizada, estoque baixado e pontos gerados.");
    } catch (err) {
      setMessage(err.message);
    }
  }

  return (
    <section className="page pdv-grid">
      <div>
        <div className="page-title"><h2>PDV / Frente de Caixa</h2><p>Venda rapida com cliente, desconto, pagamento e baixa automatica.</p></div>
        <div className="product-grid">
          {products.map((product) => (
            <button className="product-card" key={product.id} onClick={() => add(product)}>
              <img src={product.imageUrl || "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=600&q=80"} alt="" />
              <strong>{product.name}</strong>
              <span>{money(product.promoPrice || product.salePrice)}</span>
              <small>{product.variants?.length || 0} variacoes</small>
            </button>
          ))}
        </div>
      </div>
      <aside className="checkout">
        <h3>Carrinho</h3>
        <select value={customerId} onChange={(event) => setCustomerId(event.target.value)}>
          <option value="">Cliente nao cadastrado</option>
          {customers.map((customer) => <option value={customer.id} key={customer.id}>{customer.name}</option>)}
        </select>
        <div className="cart-lines">
          {cart.map((item, index) => (
            <div className="cart-line" key={`${item.productId}-${index}`}>
              <span>{item.product.name}<small>{item.variant?.color} {item.variant?.size}</small></span>
              <input type="number" min="1" value={item.quantity} onChange={(event) => setCart((rows) => rows.map((row, i) => i === index ? { ...row, quantity: Number(event.target.value) } : row))} />
              <strong>{money(item.quantity * item.unitPrice)}</strong>
            </div>
          ))}
        </div>
        <label>Forma de pagamento
          <select value={payment} onChange={(event) => setPayment(event.target.value)}>
            <option value="DINHEIRO">Dinheiro</option>
            <option value="PIX">Pix</option>
            <option value="DEBITO">Cartao de debito</option>
            <option value="CREDITO">Cartao de credito</option>
            <option value="CREDIARIO">Crediario</option>
            <option value="VALE_TROCA">Vale-troca</option>
          </select>
        </label>
        <div className="total"><span>Total</span><strong>{money(total)}</strong></div>
        <button className="primary" disabled={!cart.length} onClick={finish}>Finalizar venda</button>
        {message && <p className="notice">{message}</p>}
      </aside>
    </section>
  );
}

function Products() {
  const [products, setProducts] = useState([]);
  const [options, setOptions] = useState({ categories: [], brands: [] });
  const [form, setForm] = useState({ name: "", sku: "", salePrice: "", costPrice: "", categoryId: "", variants: "Rosa,P,SKU-RO-P,3" });

  useEffect(() => {
    api("/api/products").then(setProducts);
    api("/api/products/lookups/options").then(setOptions);
  }, []);

  async function save(event) {
    event.preventDefault();
    const variants = form.variants.split("\n").filter(Boolean).map((line) => {
      const [color, size, sku, stock] = line.split(",");
      return { color, size, sku, stock: Number(stock || 0) };
    });
    const product = await api("/api/products", {
      method: "POST",
      body: JSON.stringify({ ...form, costPrice: Number(form.costPrice), salePrice: Number(form.salePrice), categoryId: Number(form.categoryId), variants })
    });
    setProducts((rows) => [product, ...rows]);
  }

  return (
    <section className="page two-col">
      <div>
        <div className="page-title"><h2>Produtos</h2><p>Cadastro com categoria, marca, foto, preco e variacoes de roupa.</p></div>
        <DataTable rows={products} columns={["name", "sku", "category.name", "salePrice", "active"]} />
      </div>
      <form className="panel form-stack" onSubmit={save}>
        <h3>Novo produto</h3>
        <input placeholder="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input placeholder="SKU principal" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
        <input placeholder="Preco de custo" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} />
        <input placeholder="Preco de venda" value={form.salePrice} onChange={(e) => setForm({ ...form, salePrice: e.target.value })} />
        <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
          <option value="">Categoria</option>
          {options.categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        <textarea rows="4" value={form.variants} onChange={(e) => setForm({ ...form, variants: e.target.value })} />
        <button className="primary">Salvar produto</button>
      </form>
    </section>
  );
}

function Customers() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ name: "", phone: "", cpf: "", email: "", address: "" });
  useEffect(() => { api("/api/customers").then(setRows); }, []);
  async function save(event) {
    event.preventDefault();
    const customer = await api("/api/customers", { method: "POST", body: JSON.stringify(form) });
    setRows((current) => [customer, ...current]);
  }
  return (
    <section className="page two-col">
      <div><div className="page-title"><h2>Clientes</h2><p>Historico, WhatsApp, fidelidade e saldo de crediario.</p></div><DataTable rows={rows} columns={["name", "phone", "cpf", "loyaltyPoints"]} /></div>
      <form className="panel form-stack" onSubmit={save}>
        <h3>Novo cliente</h3>
        {["name", "phone", "cpf", "email", "address"].map((field) => <input key={field} placeholder={field} value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })} />)}
        <button className="primary">Salvar cliente</button>
      </form>
    </section>
  );
}

function SimpleModule({ title, endpoint, description }) {
  const [rows, setRows] = useState([]);
  useEffect(() => { api(endpoint).then((data) => setRows(Array.isArray(data) ? data : [data])).catch(() => setRows([])); }, [endpoint]);
  return (
    <section className="page">
      <div className="page-title"><h2>{title}</h2><p>{description}</p></div>
      <div className="panel">
        <DataTable rows={rows} columns={["id", "name", "status", "total", "createdAt"]} />
      </div>
    </section>
  );
}

function Reports() {
  const [data, setData] = useState(null);
  useEffect(() => { api("/api/reports").then(setData); }, []);
  return (
    <section className="page">
      <div className="page-title"><h2>Relatorios</h2><p>Vendas, formas de pagamento, clientes, estoque baixo e exportacoes.</p></div>
      <div className="metric-grid">
        {(data?.byPayment || []).map((item) => <article className="metric" key={item.method}><span>{item.method}</span><strong>{money(item._sum.amount)}</strong><FileText /></article>)}
      </div>
      <div className="panel"><DataTable rows={data?.lowStock || []} columns={["product.name", "color", "size", "stock"]} /></div>
    </section>
  );
}

function OnlineStore() {
  const [products, setProducts] = useState([]);
  const [message, setMessage] = useState("");
  useEffect(() => { api("/api/online/catalog").then(setProducts); }, []);
  async function order() {
    await api("/api/online/orders", { method: "POST", body: JSON.stringify({ customerName: "Cliente Online", phone: "11999990000", payment: "Pix", notes: "Pedido criado pela vitrine online." }) });
    setMessage("Pedido online recebido no painel de delivery.");
  }
  return (
    <section className="page">
      <div className="page-title"><h2>Vitrine de Pedido Online</h2><p>Catalogo simples para cliente escolher produtos e enviar pedido.</p></div>
      <div className="product-grid">{products.map((product) => <article className="product-card" key={product.id}><img src={product.imageUrl} alt="" /><strong>{product.name}</strong><span>{money(product.promoPrice || product.salePrice)}</span></article>)}</div>
      <button className="primary" onClick={order}>Simular pedido online</button>
      {message && <p className="notice">{message}</p>}
    </section>
  );
}

function SettingsPage() {
  const [form, setForm] = useState({});
  useEffect(() => { api("/api/settings").then((data) => setForm(data || {})); }, []);
  async function save(event) {
    event.preventDefault();
    setForm(await api("/api/settings", { method: "PUT", body: JSON.stringify(form) }));
  }
  return (
    <section className="page two-col">
      <div className="page-title"><h2>Configuracoes</h2><p>Dados da loja, fiscal, estoque, fidelidade e permissoes.</p></div>
      <form className="panel form-stack" onSubmit={save}>
        {["storeName", "cnpj", "stateRegistration", "address", "phone", "whatsapp", "email", "taxRegime", "fiscalEnvironment"].map((field) => <input key={field} placeholder={field} value={form?.[field] || ""} onChange={(e) => setForm({ ...form, [field]: e.target.value })} />)}
        <button className="primary">Salvar configuracoes</button>
      </form>
    </section>
  );
}

function DataTable({ rows, columns }) {
  const safeRows = rows || [];
  function value(row, key) {
    const val = key.split(".").reduce((acc, part) => acc?.[part], row);
    if (key.toLowerCase().includes("price") || key === "total") return money(val);
    if (key.toLowerCase().includes("created") && val) return new Date(val).toLocaleDateString("pt-BR");
    if (typeof val === "boolean") return val ? "Sim" : "Nao";
    if (val && typeof val === "object") return JSON.stringify(val);
    return val ?? "-";
  }
  return (
    <div className="table-wrap">
      <table>
        <thead><tr>{columns.map((col) => <th key={col}>{col.replace(".", " ")}</th>)}</tr></thead>
        <tbody>
          {safeRows.length === 0 && <tr><td colSpan={columns.length}>Nenhum registro encontrado.</td></tr>}
          {safeRows.map((row, index) => <tr key={row.id || index}>{columns.map((col) => <td key={col}>{value(row, col)}</td>)}</tr>)}
        </tbody>
      </table>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(getUser());
  const logged = useMemo(() => Boolean(getToken() && user), [user]);

  if (!logged) return <Login onLogin={setUser} />;
  return <Shell user={user} onLogout={() => { clearSession(); setUser(null); }} />;
}

createRoot(document.getElementById("root")).render(<App />);
