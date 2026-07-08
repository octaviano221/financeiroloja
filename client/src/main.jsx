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
  UserCog,
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
  { id: "credit", label: "Crediário", icon: CreditCard },
  { id: "delivery", label: "Delivery", icon: Truck },
  { id: "promos", label: "Promoções", icon: Gift },
  { id: "loyalty", label: "Fidelidade", icon: Heart },
  { id: "cash", label: "Caixa", icon: WalletCards },
  { id: "fiscal", label: "Nota Fiscal", icon: Receipt },
  { id: "reports", label: "Relatórios", icon: BarChart3 },
  { id: "users", label: "Usuários", icon: UserCog },
  { id: "online", label: "Pedido Online", icon: CalendarHeart },
  { id: "settings", label: "Configurações", icon: Settings }
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
        <p>Sistema de gestão para vender, controlar estoque e cuidar dos clientes com carinho.</p>
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
        <div className="made">Feito com amor para vestir histórias.</div>
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
    stock: <SimpleModule title="Estoque" endpoint="/api/products" description="Movimentações, inventário, filtros por cor/tamanho e alertas de estoque baixo." columns={["name", "sku", "category.name", "salePrice", "active"]} />,
    customers: <Customers />,
    credit: <CreditPage />,
    delivery: <SimpleModule title="Delivery" endpoint="/api/delivery" description="Pedidos do WhatsApp, retirada na loja, entrega própria e status de separação." columns={["customerName", "phone", "district", "city", "status", "payment", "fee", "createdAt"]} />,
    promos: <SimpleModule title="Promoções" endpoint="/api/promotions" description="Cupons, descontos por produto/categoria e campanhas por período." columns={["name", "type", "target", "discountValue", "active", "startsAt", "endsAt"]} />,
    loyalty: <SimpleModule title="Fidelidade" endpoint="/api/customers" description="Pontos, níveis Bronze/Prata/Ouro/VIP e campanhas para clientes inativos." columns={["name", "phone", "loyaltyPoints", "createdAt"]} />,
    cash: <CashPage />,
    fiscal: <SimpleModule title="Nota Fiscal" endpoint="/api/invoices" description="Estrutura pronta para NFC-e/NF-e, XML, DANFE e provedor fiscal homologado." columns={["type", "status", "number", "provider", "createdAt"]} />,
    reports: <Reports />,
    users: <UsersPage />,
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
    ["Vendas do Mês", money(cards.monthSales), BarChart3],
    ["Quantidade de Vendas", cards.salesCount || 0, ShoppingBag],
    ["Lucro Estimado", money(cards.estimatedProfit), WalletCards],
    ["Crediário em Aberto", money(cards.openCredit), CreditCard],
    ["Delivery Pendente", cards.pendingDelivery || 0, Truck],
    ["Estoque Baixo", cards.lowStock || 0, Boxes],
    ["Clientes Fidelidade", cards.loyaltyCustomers || 0, Heart],
    ["Promoções Ativas", cards.activePromos || 0, Gift]
  ];

  return (
    <section className="page">
      <div className="page-title">
        <h2>Dashboard</h2>
        <p>Visão geral da loja hoje.</p>
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
          <div className="panel-head"><h3>Gráfico de Vendas</h3><button>Este mês</button></div>
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
    const variant = product.variants?.find((item) => item.stock > 0);
    if (!variant) {
      setMessage("Produto sem variação com estoque disponível.");
      return;
    }
    const unitPrice = Number(variant.price || product.promoPrice || product.salePrice);
    setCart((current) => [...current, { product, variant, productId: product.id, variantId: variant.id, quantity: 1, unitPrice, discount: 0 }]);
  }

  async function finish() {
    setMessage("");
    try {
      await api("/api/sales", {
        method: "POST",
        body: JSON.stringify({
          customerId: customerId ? Number(customerId) : null,
          discount: 0,
          items: cart.map(({ productId, variantId, quantity, discount }) => ({ productId, variantId, quantity, discount })),
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
        <div className="page-title"><h2>PDV / Frente de Caixa</h2><p>Venda rápida com cliente, desconto, pagamento e baixa automática.</p></div>
        <div className="product-grid">
          {products.map((product) => (
            <button className="product-card" key={product.id} onClick={() => add(product)}>
              <img src={product.imageUrl || "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=600&q=80"} alt="" />
              <strong>{product.name}</strong>
              <span>{money(product.promoPrice || product.salePrice)}</span>
              <small>{product.variants?.length || 0} variações</small>
            </button>
          ))}
        </div>
      </div>
      <aside className="checkout">
        <h3>Carrinho</h3>
        <select value={customerId} onChange={(event) => setCustomerId(event.target.value)}>
          <option value="">Cliente não cadastrado</option>
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
            <option value="DEBITO">Cartão de débito</option>
            <option value="CREDITO">Cartão de crédito</option>
            <option value="CREDIARIO">Crediário</option>
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
        <div className="page-title"><h2>Produtos</h2><p>Cadastro com categoria, marca, foto, preço e variações de roupa.</p></div>
        <DataTable rows={products} columns={["name", "sku", "category.name", "salePrice", "active"]} />
      </div>
      <form className="panel form-stack" onSubmit={save}>
        <h3>Novo produto</h3>
        <input placeholder="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input placeholder="SKU principal" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
        <input placeholder="Preço de custo" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} />
        <input placeholder="Preço de venda" value={form.salePrice} onChange={(e) => setForm({ ...form, salePrice: e.target.value })} />
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
      <div><div className="page-title"><h2>Clientes</h2><p>Histórico, WhatsApp, fidelidade e saldo de crediário.</p></div><DataTable rows={rows} columns={["name", "phone", "cpf", "loyaltyPoints"]} /></div>
      <form className="panel form-stack" onSubmit={save}>
        <h3>Novo cliente</h3>
        {["name", "phone", "cpf", "email", "address"].map((field) => <input key={field} placeholder={field} value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })} />)}
        <button className="primary">Salvar cliente</button>
      </form>
    </section>
  );
}

function SimpleModule({ title, endpoint, description, columns = ["id", "name", "status", "total", "createdAt"] }) {
  const [rows, setRows] = useState([]);
  useEffect(() => { api(endpoint).then((data) => setRows(Array.isArray(data) ? data : [data])).catch(() => setRows([])); }, [endpoint]);
  return (
    <section className="page">
      <div className="page-title"><h2>{title}</h2><p>{description}</p></div>
      <div className="panel">
        <DataTable rows={rows} columns={columns} />
      </div>
    </section>
  );
}

function CreditPage() {
  const [rows, setRows] = useState([]);
  const [message, setMessage] = useState("");
  useEffect(() => { api("/api/credit").then(setRows).catch((err) => setMessage(err.message)); }, []);

  async function pay(installment) {
    setMessage("");
    try {
      await api(`/api/credit/installments/${installment.id}/pay`, { method: "POST", body: JSON.stringify({ amount: Number(installment.amount) }) });
      setRows(await api("/api/credit"));
      setMessage("Parcela baixada com sucesso.");
    } catch (err) {
      setMessage(err.message);
    }
  }

  return (
    <section className="page">
      <div className="page-title"><h2>Crediário</h2><p>Controle clientes devendo, parcelas pendentes e baixas de pagamento.</p></div>
      {message && <p className="notice">{message}</p>}
      <div className="panel">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Cliente</th><th>Venda</th><th>Total</th><th>Pago</th><th>Parcelas</th></tr></thead>
            <tbody>
              {rows.map((account) => (
                <tr key={account.id}>
                  <td>{account.customer?.name}</td>
                  <td>{account.sale?.code}</td>
                  <td>{money(account.total)}</td>
                  <td>{money(account.paid)}</td>
                  <td>
                    <div className="installments-list">
                      {account.installments?.map((item) => (
                        <button key={item.id} disabled={item.status === "PAGA"} onClick={() => pay(item)}>
                          #{item.number} {money(item.amount)} - {item.status}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
              {!rows.length && <tr><td colSpan="5">Nenhum crediário encontrado.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function CashPage() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ operatorName: "", openingAmount: "0" });
  const [movement, setMovement] = useState({ type: "ENTRADA", method: "DINHEIRO", amount: "", description: "" });
  const [message, setMessage] = useState("");
  const openCash = rows.find((cash) => cash.status === "ABERTO");

  async function load() {
    setRows(await api("/api/cash"));
  }

  useEffect(() => { load().catch((err) => setMessage(err.message)); }, []);

  async function open(event) {
    event.preventDefault();
    setMessage("");
    try {
      await api("/api/cash/open", { method: "POST", body: JSON.stringify({ ...form, openingAmount: Number(form.openingAmount) }) });
      setForm({ operatorName: "", openingAmount: "0" });
      await load();
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function addMovement(event) {
    event.preventDefault();
    if (!openCash) return;
    setMessage("");
    try {
      await api(`/api/cash/${openCash.id}/movement`, { method: "POST", body: JSON.stringify({ ...movement, amount: Number(movement.amount) }) });
      setMovement({ type: "ENTRADA", method: "DINHEIRO", amount: "", description: "" });
      await load();
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function closeCash() {
    if (!openCash) return;
    const expected = Number(openCash.openingAmount || 0) + (openCash.movements || []).reduce((sum, item) => sum + Number(item.amount || 0), 0);
    setMessage("");
    try {
      await api(`/api/cash/${openCash.id}/close`, { method: "POST", body: JSON.stringify({ closingAmount: expected, expectedAmount: expected }) });
      await load();
      setMessage("Caixa fechado.");
    } catch (err) {
      setMessage(err.message);
    }
  }

  return (
    <section className="page two-col">
      <div>
        <div className="page-title"><h2>Caixa</h2><p>Abertura, movimentos, vendas automáticas e fechamento.</p></div>
        {message && <p className="notice">{message}</p>}
        <div className="panel">
          <DataTable rows={rows} columns={["operatorName", "openingAmount", "closingAmount", "status", "openedAt"]} />
        </div>
      </div>
      <div className="form-stack">
        {!openCash && (
          <form className="panel form-stack" onSubmit={open}>
            <h3>Abrir caixa</h3>
            <input placeholder="Operador" value={form.operatorName} onChange={(e) => setForm({ ...form, operatorName: e.target.value })} />
            <input placeholder="Valor inicial" value={form.openingAmount} onChange={(e) => setForm({ ...form, openingAmount: e.target.value })} />
            <button className="primary">Abrir caixa</button>
          </form>
        )}
        {openCash && (
          <form className="panel form-stack" onSubmit={addMovement}>
            <h3>Caixa aberto</h3>
            <p>Operador: <strong>{openCash.operatorName}</strong></p>
            <select value={movement.type} onChange={(e) => setMovement({ ...movement, type: e.target.value })}>
              <option value="ENTRADA">Entrada</option>
              <option value="SAIDA">Saída</option>
              <option value="SANGRIA">Sangria</option>
            </select>
            <select value={movement.method} onChange={(e) => setMovement({ ...movement, method: e.target.value })}>
              <option value="DINHEIRO">Dinheiro</option>
              <option value="PIX">Pix</option>
              <option value="CREDITO">Crédito</option>
              <option value="DEBITO">Débito</option>
            </select>
            <input placeholder="Valor" value={movement.amount} onChange={(e) => setMovement({ ...movement, amount: e.target.value })} />
            <input placeholder="Descrição" value={movement.description} onChange={(e) => setMovement({ ...movement, description: e.target.value })} />
            <button className="primary">Adicionar movimento</button>
            <button type="button" onClick={closeCash}>Fechar caixa</button>
          </form>
        )}
      </div>
    </section>
  );
}

function Reports() {
  const [data, setData] = useState(null);
  useEffect(() => { api("/api/reports").then(setData); }, []);
  return (
    <section className="page">
      <div className="page-title"><h2>Relatórios</h2><p>Vendas, formas de pagamento, clientes, estoque baixo e exportações.</p></div>
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
      <div className="page-title"><h2>Vitrine de Pedido Online</h2><p>Catálogo simples para cliente escolher produtos e enviar pedido.</p></div>
      <div className="product-grid">{products.map((product) => <article className="product-card" key={product.id}><img src={product.imageUrl} alt="" /><strong>{product.name}</strong><span>{money(product.promoPrice || product.salePrice)}</span></article>)}</div>
      <button className="primary" onClick={order}>Simular pedido online</button>
      {message && <p className="notice">{message}</p>}
    </section>
  );
}

function SettingsPage() {
  const [form, setForm] = useState({});
  const fields = [
    ["storeName", "Nome da loja"],
    ["cnpj", "CNPJ"],
    ["stateRegistration", "Inscrição Estadual"],
    ["address", "Endereço"],
    ["phone", "Telefone"],
    ["whatsapp", "WhatsApp"],
    ["email", "E-mail"],
    ["taxRegime", "Regime tributário"],
    ["fiscalEnvironment", "Ambiente fiscal"]
  ];
  useEffect(() => { api("/api/settings").then((data) => setForm(data || {})); }, []);
  async function save(event) {
    event.preventDefault();
    setForm(await api("/api/settings", { method: "PUT", body: JSON.stringify(form) }));
  }
  return (
    <section className="page two-col">
      <div className="page-title"><h2>Configurações</h2><p>Dados da loja, fiscal, estoque, fidelidade e permissões.</p></div>
      <form className="panel form-stack" onSubmit={save}>
        {fields.map(([field, label]) => (
          <label key={field}>
            {label}
            <input placeholder={label} value={form?.[field] || ""} onChange={(e) => setForm({ ...form, [field]: e.target.value })} />
          </label>
        ))}
        <button className="primary">Salvar configurações</button>
      </form>
    </section>
  );
}

function UsersPage() {
  const empty = { name: "", email: "", password: "", role: "VENDEDOR", active: true };
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");

  async function load() {
    setRows(await api("/api/users"));
  }

  useEffect(() => { load().catch((err) => setMessage(err.message)); }, []);

  function edit(user) {
    setEditingId(user.id);
    setForm({ name: user.name, email: user.email, password: "", role: user.role, active: user.active });
    setMessage("Editando usuário. Deixe a senha vazia para manter a atual.");
  }

  async function save(event) {
    event.preventDefault();
    setMessage("");
    try {
      const path = editingId ? `/api/users/${editingId}` : "/api/users";
      const method = editingId ? "PUT" : "POST";
      await api(path, { method, body: JSON.stringify(form) });
      setForm(empty);
      setEditingId(null);
      await load();
      setMessage(editingId ? "Usuário atualizado." : "Usuário criado.");
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function toggle(user) {
    setMessage("");
    try {
      await api(`/api/users/${user.id}/toggle`, { method: "PATCH" });
      await load();
    } catch (err) {
      setMessage(err.message);
    }
  }

  return (
    <section className="page two-col">
      <div>
        <div className="page-title"><h2>Usuários e Permissões</h2><p>Controle quem acessa o sistema e o papel de cada pessoa na loja.</p></div>
        <div className="panel">
          <div className="table-wrap">
            <table>
              <thead><tr><th>Nome</th><th>Email</th><th>Perfil</th><th>Status</th><th>Ações</th></tr></thead>
              <tbody>
                {rows.map((user) => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{roleLabel(user.role)}</td>
                    <td><StatusBadge value={user.active ? "ATIVO" : "INATIVO"} /></td>
                    <td className="actions-cell">
                      <button onClick={() => edit(user)}>Editar</button>
                      <button onClick={() => toggle(user)}>{user.active ? "Desativar" : "Ativar"}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <form className="panel form-stack" onSubmit={save}>
        <h3>{editingId ? "Editar usuário" : "Novo usuário"}</h3>
        <input placeholder="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input type="password" placeholder={editingId ? "Nova senha opcional" : "Senha"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
          <option value="ADMIN">Administrador</option>
          <option value="CAIXA">Caixa</option>
          <option value="VENDEDOR">Vendedor</option>
          <option value="ESTOQUISTA">Estoquista</option>
          <option value="ENTREGADOR">Entregador</option>
        </select>
        <label className="check-row"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Usuário ativo</label>
        <button className="primary">{editingId ? "Salvar alterações" : "Criar usuário"}</button>
        {editingId && <button type="button" onClick={() => { setEditingId(null); setForm(empty); }}>Cancelar edição</button>}
        {message && <p className="notice">{message}</p>}
      </form>
    </section>
  );
}

function roleLabel(role) {
  return {
    ADMIN: "Administrador",
    CAIXA: "Caixa",
    VENDEDOR: "Vendedor",
    ESTOQUISTA: "Estoquista",
    ENTREGADOR: "Entregador"
  }[role] || role;
}

function DataTable({ rows, columns }) {
  const safeRows = rows || [];
  const labels = {
    id: "Código",
    code: "Venda",
    sku: "SKU",
    name: "Nome",
    customerName: "Cliente",
    phone: "Telefone",
    cpf: "CPF",
    email: "E-mail",
    district: "Bairro",
    city: "Cidade",
    payment: "Pagamento",
    fee: "Taxa",
    active: "Ativo",
    status: "Status",
    total: "Total",
    type: "Tipo",
    target: "Alvo",
    discountValue: "Desconto",
    startsAt: "Início",
    endsAt: "Fim",
    number: "Número",
    provider: "Provedor",
    salePrice: "Preço de venda",
    openingAmount: "Valor inicial",
    closingAmount: "Valor final",
    operatorName: "Operador",
    createdAt: "Criado em",
    openedAt: "Aberto em",
    stock: "Estoque",
    size: "Tamanho",
    color: "Cor",
    method: "Forma",
    loyaltyPoints: "Pontos",
    "customer.name": "Cliente",
    "category.name": "Categoria",
    "product.name": "Produto"
  };

  function value(row, key) {
    const val = key.split(".").reduce((acc, part) => acc?.[part], row);
    if (key.toLowerCase().includes("price") || ["total", "fee", "discountValue", "openingAmount", "closingAmount"].includes(key)) return money(val);
    if ((key.toLowerCase().includes("at") || key === "openedAt") && val) return new Date(val).toLocaleDateString("pt-BR");
    if (key === "status") return <StatusBadge value={val} />;
    if (typeof val === "boolean") return <StatusBadge value={val ? "SIM" : "NÃO"} />;
    if (typeof val === "string" && /^[A-Z_]+$/.test(val)) return formatText(val);
    if (val && typeof val === "object") return JSON.stringify(val);
    return val ?? "-";
  }
  return (
    <div className="table-wrap">
      <table>
        <thead><tr>{columns.map((col) => <th key={col}>{labels[col] || col}</th>)}</tr></thead>
        <tbody>
          {safeRows.length === 0 && <tr><td colSpan={columns.length}>Nenhum registro encontrado.</td></tr>}
          {safeRows.map((row, index) => <tr key={row.id || index}>{columns.map((col) => <td key={col}>{value(row, col)}</td>)}</tr>)}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ value }) {
  const text = String(value || "-");
  const tone = {
    ATIVO: "success",
    SIM: "success",
    PAGA: "success",
    ENTREGUE: "success",
    AUTORIZADA: "success",
    FINALIZADA: "success",
    ABERTO: "warning",
    ABERTA: "warning",
    PENDENTE: "warning",
    NOVO: "warning",
    AGUARDANDO_PAGAMENTO: "warning",
    SEPARANDO: "info",
    PRONTO_ENTREGA: "info",
    SAIU_ENTREGA: "info",
    INATIVO: "muted",
    NÃO: "muted",
    FECHADO: "muted",
    CANCELADO: "danger",
    CANCELADA: "danger",
    REJEITADA: "danger",
    VENCIDA: "danger"
  }[text] || "info";

  return <span className={`status-badge ${tone}`}>{formatText(text)}</span>;
}

function formatText(value) {
  return String(value || "-")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
}

function App() {
  const [user, setUser] = useState(getUser());
  const logged = useMemo(() => Boolean(getToken() && user), [user]);

  if (!logged) return <Login onLogin={setUser} />;
  return <Shell user={user} onLogout={() => { clearSession(); setUser(null); }} />;
}

createRoot(document.getElementById("root")).render(<App />);

