import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BadgeDollarSign,
  Barcode,
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
  Minus,
  Package,
  Plus,
  Printer,
  Receipt,
  Search,
  Settings,
  ShoppingBag,
  Star,
  Trash2,
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
          <GlobalSearch onNavigate={setPage} />
          <div className="topbar-actions">
            <button className="notification-button" type="button" title="Notificações">
              <Bell size={19} />
              <span>3</span>
            </button>
            <div className="user-pill">
              <span className="store-avatar">SD</span>
              <div>
                <strong>Sud Daiana Modas</strong>
                <small>{roleLabel(user?.role || "ADMIN")}</small>
              </div>
            </div>
            <button className="ghost logout-button" onClick={onLogout} title="Sair"><LogOut size={18} /></button>
          </div>
        </header>
        <Page page={page} />
      </main>
    </div>
  );
}

function GlobalSearch({ onNavigate }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const [products, customers, sales] = await Promise.all([
          api(`/api/products?q=${encodeURIComponent(term)}`),
          api(`/api/customers?q=${encodeURIComponent(term)}`),
          api("/api/sales")
        ]);

        const normalized = term.toLowerCase();
        const saleMatches = (sales || []).filter((sale) => {
          const text = [sale.code, sale.customer?.name, sale.total].filter(Boolean).join(" ").toLowerCase();
          return text.includes(normalized);
        });

        setResults([
          ...(products || []).slice(0, 4).map((item) => ({ type: "Produto", title: item.name, detail: `${item.sku} · ${money(item.salePrice)}`, page: "products" })),
          ...(customers || []).slice(0, 4).map((item) => ({ type: "Cliente", title: item.name, detail: item.phone || "Sem telefone", page: "customers" })),
          ...saleMatches.slice(0, 4).map((item) => ({ type: "Venda", title: item.code, detail: `${item.customer?.name || "Cliente não cadastrado"} · ${money(item.total)}`, page: "reports" }))
        ]);
        setOpen(true);
      } catch {
        setResults([]);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [query]);

  function choose(result) {
    onNavigate(result.page);
    setQuery("");
    setOpen(false);
  }

  return (
    <div className="search-wrap">
      <div className="search">
        <Search size={18} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => query.trim().length >= 2 && setOpen(true)}
          placeholder="Buscar produtos, clientes, vendas..."
        />
      </div>
      {open && query.trim().length >= 2 && (
        <div className="search-results">
          {results.length === 0 && <p>Nenhum resultado encontrado.</p>}
          {results.map((result, index) => (
            <button key={`${result.type}-${result.title}-${index}`} onClick={() => choose(result)}>
              <small>{result.type}</small>
              <strong>{result.title}</strong>
              <span>{result.detail}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Page({ page }) {
  const map = {
    dashboard: <DashboardPremium />,
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
            {(data?.alerts?.lowStock || []).slice(0, 4).map((item) => <li key={item.id}>{displayText(item.name)} {item.size} com {item.stock} un.</li>)}
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

function DashboardPremium() {
  const [data, setData] = useState(null);

  async function loadDashboard() {
    setData(await api("/api/dashboard"));
  }

  useEffect(() => { loadDashboard().catch(console.error); }, []);

  const cards = data?.cards || {};
  const realChart = (data?.chart || []).filter((point) => Number(point.total || 0) > 0);
  const chartData = realChart.length ? realChart : (data?.chart || []);
  const chartMax = Math.max(...chartData.map((point) => Number(point.total || 0)), 1);
  const chartTop = Math.max(Math.ceil(chartMax / 100) * 100, 100);
  const chartScale = [chartTop, chartTop * 0.75, chartTop * 0.5, chartTop * 0.25, 0];
  const todaySalesCount = cards.todaySalesCount ?? cards.salesCount ?? 0;
  const monthSalesCount = cards.monthSalesCount ?? todaySalesCount;
  const saleText = (count, suffix) => `${count} ${count === 1 ? "venda" : "vendas"} ${suffix}`;
  const mainProgressMax = Math.max(Number(cards.monthSales || 0), Number(cards.estimatedProfit || 0), monthSalesCount, 1);
  const mainCards = [
    ["Vendas do Dia", money(cards.todaySales), saleText(todaySalesCount, "hoje"), BadgeDollarSign, "rose", Number(cards.todaySales || 0)],
    ["Vendas do Mês", money(cards.monthSales), saleText(monthSalesCount, "no mês"), BarChart3, "rose", Number(cards.monthSales || 0)],
    ["Quantidade de Vendas", todaySalesCount, saleText(monthSalesCount, "no mês"), ShoppingBag, "purple", monthSalesCount],
    ["Lucro Estimado", money(cards.estimatedProfit), "dados reais do mês", WalletCards, "green", Number(cards.estimatedProfit || 0)]
  ];
  const miniCards = [
    ["Crediário em Aberto", money(cards.openCredit), "clientes", CreditCard, "rose"],
    ["Delivery Pendente", cards.pendingDelivery || 0, "entregas", Truck, "orange"],
    ["Estoque Baixo", cards.lowStock || 0, "produtos", Boxes, "amber"],
    ["Clientes Fidelidade", cards.loyaltyCustomers || 0, "cliente", Heart, "purple"],
    ["Promoções Ativas", cards.activePromos || 0, "promoções", Gift, "rose"]
  ];

  return (
    <section className="page dashboard-page">
      <div className="dashboard-hero">
        <div>
          <h2>Olá, Admin!</h2>
          <p>Veja o desempenho da sua loja hoje.</p>
        </div>
        <div className="dashboard-actions">
          <button type="button">Hoje, {new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</button>
          <button className="primary" type="button" onClick={loadDashboard}>Atualizar dados</button>
        </div>
      </div>

      <div className="metric-grid dashboard-main-cards">
        {mainCards.map(([label, value, helper, Icon, tone, progress]) => (
          <article className={`metric dashboard-card ${tone}`} key={label}>
            <div>
              <span>{label}</span>
              <strong>{value}</strong>
              <small>{helper}</small>
            </div>
            <Icon />
            <div className="metric-progress">
              <span>Dados reais</span>
              <i><b style={{ width: `${Math.min(Math.max((Number(progress || 0) / mainProgressMax) * 100, progress ? 12 : 0), 100)}%` }} /></i>
            </div>
          </article>
        ))}
      </div>

      <div className="dashboard-mini-grid">
        {miniCards.map(([label, value, helper, Icon, tone]) => (
          <article className={`mini-metric ${tone}`} key={label}>
            <div>
              <span>{label}</span>
              <strong>{value}</strong>
              <small>{helper}</small>
            </div>
            <Icon />
          </article>
        ))}
      </div>

      <div className="dashboard-grid premium">
        <section className="panel wide">
          <div className="panel-head"><h3>Gráfico de Vendas</h3><button>Este mês</button></div>
          <div className="sales-chart">
            <div className="chart-scale">{chartScale.map((value) => <span key={value}>{money(value)}</span>)}</div>
            <div className={`chart-area ${chartData.length <= 6 ? "compact" : ""}`}>
              {chartData.map((point) => {
                const total = Number(point.total || 0);
                return (
                  <span className="chart-day" key={point.label}>
                    <i className={total > 0 ? "" : "empty"} style={{ height: `${total > 0 ? Math.max((total / chartTop) * 180, 18) : 2}px` }} title={`Dia ${point.label}: ${money(total)}`} />
                    <small>{point.label}</small>
                  </span>
                );
              })}
            </div>
          </div>
        </section>

        <section className="panel alert-panel">
          <div className="panel-head"><h3>Alertas importantes</h3></div>
          <ul className="alert-list">
            <li className="success"><span>{data?.alerts?.overdueCredit || 0} parcelas vencidas<small>Situação em dia</small></span><em className="alert-pill ok">Ok</em></li>
            <li className="warning"><span>{data?.alerts?.pendingDelivery || 0} entregas aguardando<small>Acompanhe as entregas</small></span><em className="alert-pill pending">Pendente</em></li>
            {(data?.alerts?.lowStock || []).slice(0, 4).map((item) => <li className="warning" key={item.id}><span>{displayText(item.name)} {item.size} com {item.stock} un.<small>Estoque baixo</small></span><em className="alert-pill low">Baixo</em></li>)}
          </ul>
        </section>

        <section className="panel wide">
          <div className="panel-head"><h3>Vendas Recentes</h3></div>
          {(data?.recentSales || []).length ? (
            <DataTable rows={data?.recentSales || []} columns={["code", "customer.name", "total", "createdAt", "status"]} />
          ) : (
            <EmptyState title="Nenhum registro encontrado." text="As vendas realizadas aparecerão aqui." action="Ir para o PDV" />
          )}
        </section>
      </div>
    </section>
  );
}

function Sparkline({ type }) {
  const bars = type === "line" ? [16, 24, 20, 28, 18, 25, 21, 30, 22, 26] : [9, 14, 8, 23, 12, 16, 10, 26, 18, 11, 15, 20];
  return (
    <div className={`sparkline ${type}`}>
      {bars.map((height, index) => <i key={index} style={{ height }} />)}
    </div>
  );
}

function EmptyState({ title, text, action }) {
  return (
    <div className="empty-state">
      <Receipt size={22} />
      <div>
        <strong>{title}</strong>
        <span>{text}</span>
        {action && <button type="button">{action}</button>}
      </div>
    </div>
  );
}

function InsightStrip({ items }) {
  return (
    <div className="insight-grid">
      {items.map(([label, value, helper, Icon, tone = "rose"]) => (
        <article className={`insight-card ${tone}`} key={label}>
          <div>
            <span>{label}</span>
            <strong>{value}</strong>
            {helper && <small>{helper}</small>}
          </div>
          <Icon size={20} />
        </article>
      ))}
    </div>
  );
}

function PDV() {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [cart, setCart] = useState([]);
  const [customerId, setCustomerId] = useState("");
  const [payment, setPayment] = useState("PIX");
  const [cashReceived, setCashReceived] = useState("");
  const [creditInstallments, setCreditInstallments] = useState(1);
  const [creditFirstDueDate, setCreditFirstDueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [productSearch, setProductSearch] = useState("");
  const [barcodeQuery, setBarcodeQuery] = useState("");
  const [message, setMessage] = useState("");
  const [lastSale, setLastSale] = useState(null);

  useEffect(() => {
    api("/api/products").then(setProducts);
    api("/api/customers").then(setCustomers);
  }, []);

  const selectedCustomer = customers.find((customer) => String(customer.id) === String(customerId));
  const subtotal = cart.reduce((sum, item) => sum + item.quantity * Number(item.unitPrice), 0);
  const discountTotal = cart.reduce((sum, item) => sum + Number(item.discount || 0), 0);
  const total = Math.max(subtotal - discountTotal, 0);
  const change = payment === "DINHEIRO" ? Math.max(Number(cashReceived || 0) - total, 0) : 0;
  const cartItemsCount = cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const totalStock = products.reduce((sum, product) => sum + (product.variants || []).reduce((acc, variant) => acc + Number(variant.stock || 0), 0), 0);
  const paymentOptions = [
    ["PIX", "Pix", BadgeDollarSign],
    ["DINHEIRO", "Dinheiro", WalletCards],
    ["DEBITO", "Débito", CreditCard],
    ["CREDITO", "Crédito", CreditCard],
    ["CREDIARIO", "Fiado", FileText],
    ["VALE_TROCA", "Vale", Receipt]
  ];
  const quickCategories = [
    ["Blusas", "Blusas", Package],
    ["Calças", "Calças", Boxes],
    ["Vestidos", "Vestidos", Heart],
    ["Promoções", "Promo", Gift],
    ["Mais vendidos", "", Star]
  ];
  const filteredProducts = products.filter((product) => {
    const term = productSearch.trim().toLowerCase();
    if (!term) return true;
    const variantText = (product.variants || []).map((variant) => [variant.sku, variant.barcode, variant.color, variant.size].filter(Boolean).join(" ")).join(" ");
    return [product.name, product.sku, product.barcode, product.category?.name, variantText].filter(Boolean).join(" ").toLowerCase().includes(term);
  });

  function add(product, variantId) {
    const variant = variantId
      ? product.variants?.find((item) => String(item.id) === String(variantId))
      : product.variants?.find((item) => item.stock > 0);
    if (!variant) {
      setMessage("Produto sem variação com estoque disponível.");
      return;
    }
    const unitPrice = Number(variant.price || product.promoPrice || product.salePrice);
    setLastSale(null);
    setMessage("");
    setCart((current) => {
      const existing = current.find((item) => item.variantId === variant.id);
      if (existing) {
        return current.map((item) => item.variantId === variant.id ? { ...item, quantity: Math.min(item.quantity + 1, Number(variant.stock || 1)) } : item);
      }
      return [...current, { product, variant, productId: product.id, variantId: variant.id, quantity: 1, unitPrice, discount: 0 }];
    });
  }

  function updateCart(index, patch) {
    setCart((rows) => rows.map((row, i) => {
      if (i !== index) return row;
      const nextQuantity = patch.quantity === undefined ? row.quantity : Math.max(1, Math.min(Number(patch.quantity || 1), Number(row.variant?.stock || 1)));
      const maxDiscount = nextQuantity * Number(row.unitPrice || 0);
      const nextDiscount = patch.discount === undefined ? row.discount : Math.max(0, Math.min(Number(patch.discount || 0), maxDiscount));
      return { ...row, ...patch, quantity: nextQuantity, discount: nextDiscount };
    }));
  }

  function remove(index) {
    setCart((rows) => rows.filter((_, i) => i !== index));
  }

  function scanBarcode(event) {
    event.preventDefault();
    const code = barcodeQuery.trim().toLowerCase();
    if (!code) return;
    for (const product of products) {
      const variant = (product.variants || []).find((item) => [item.barcode, item.sku].filter(Boolean).some((value) => String(value).toLowerCase() === code));
      if (variant) {
        if (Number(variant.stock || 0) <= 0) {
          setMessage(`Sem estoque para ${displayText(product.name)} ${variant.size} ${displayText(variant.color)}.`);
          return;
        }
        add(product, variant.id);
        setBarcodeQuery("");
        setMessage(`Produto adicionado: ${displayText(product.name)} (${variant.size} ${displayText(variant.color)}).`);
        return;
      }
      if ([product.barcode, product.sku].filter(Boolean).some((value) => String(value).toLowerCase() === code)) {
        add(product);
        setBarcodeQuery("");
        setMessage(`Produto adicionado: ${displayText(product.name)}.`);
        return;
      }
    }
    setProductSearch(barcodeQuery);
    setMessage("Código não encontrado. Mostrei resultados próximos no catálogo.");
  }

  async function finish() {
    setMessage("");
    if (payment === "DINHEIRO" && Number(cashReceived || 0) < total) {
      setMessage("Valor recebido menor que o total da venda.");
      return;
    }
    if (payment === "CREDIARIO" && !customerId) {
      setMessage("Crediário exige cliente cadastrado. Selecione um cliente antes de finalizar.");
      return;
    }
    try {
      const sale = await api("/api/sales", {
        method: "POST",
        body: JSON.stringify({
          customerId: customerId ? Number(customerId) : null,
          discount: 0,
          items: cart.map(({ productId, variantId, quantity, discount }) => ({ productId, variantId, quantity, discount })),
          payments: [{ method: payment, amount: total }],
          credit: payment === "CREDIARIO" ? { installments: Number(creditInstallments || 1), firstDueDate: creditFirstDueDate } : undefined
        })
      });
      setCart([]);
      setCashReceived("");
      setCreditInstallments(1);
      setCreditFirstDueDate(new Date().toISOString().slice(0, 10));
      setLastSale({
        ...sale,
        customer: sale.customer || selectedCustomer,
        change,
        cashReceived: payment === "DINHEIRO" ? Number(cashReceived || 0) : null,
        saleMode: payment === "CREDIARIO" ? "FIADO" : "A_VISTA",
        creditInstallments: payment === "CREDIARIO" ? Number(creditInstallments || 1) : null,
        creditFirstDueDate: payment === "CREDIARIO" ? creditFirstDueDate : null
      });
      setMessage(`Venda ${sale.code} finalizada: estoque baixado, caixa atualizado e dashboard pronto para atualizar.`);
      setProducts(await api("/api/products"));
    } catch (err) {
      setMessage(err.message.includes("Abra o caixa") ? `${err.message} Vá em Caixa e clique em Abrir caixa.` : err.message);
    }
  }

  return (
    <section className="page pdv-workstation">
      <div>
        <div className="pdv-operator-bar">
          <span><ShoppingBag size={17} /> Loja: Sud Daiana Modas</span>
          <span><CalendarHeart size={17} /> {new Date().toLocaleDateString("pt-BR")}</span>
          <span><BadgeDollarSign size={17} /> Caixa aberto</span>
        </div>
        <div className="pdv-hero">
          <div className="page-title"><h2>PDV / Frente de Caixa</h2><p>Venda rápida com leitor, cliente, pagamento e cupom.</p></div>
          <div className="pdv-kpis">
            <span><ShoppingBag size={19} /><strong>{cartItemsCount}</strong><small>itens</small></span>
            <span><BadgeDollarSign size={19} /><strong>{money(total)}</strong><small>total</small></span>
            <span><Boxes size={19} /><strong>{totalStock}</strong><small>un. estoque</small></span>
          </div>
        </div>
        <form className="barcode-panel" onSubmit={scanBarcode}>
          <div>
            <Barcode size={24} />
            <label>
              Ler código de barras ou SKU
              <input value={barcodeQuery} onChange={(event) => setBarcodeQuery(event.target.value)} placeholder="Passe o leitor ou digite o código e pressione Enter" autoComplete="off" />
            </label>
          </div>
          <button className="primary scanner-add" type="submit"><Plus size={17} /> Adicionar</button>
        </form>
        <div className="pdv-command-row">
          <button type="button" onClick={() => document.querySelector(".pdv-tools input")?.focus()}><Search size={20} /><span>Buscar produto<small>F2</small></span></button>
          <button type="button" onClick={() => setProductSearch("")}><Package size={20} /><span>Produto sem código<small>Catálogo</small></span></button>
          <button type="button" onClick={() => setProductSearch("")}><Gift size={20} /><span>Venda rápida<small>Atalho</small></span></button>
          <button type="button" onClick={() => remove(cart.length - 1)} disabled={!cart.length}><X size={20} /><span>Cancelar item<small>Esc</small></span></button>
        </div>
        <div className="pdv-category-row">
          {quickCategories.map(([label, term, Icon]) => (
            <button key={label} type="button" onClick={() => setProductSearch(term)}>
              <Icon size={19} />
              {label}
            </button>
          ))}
        </div>
        <section className="sale-items-panel">
          <div className="sale-items-head">
            <h3>Itens da venda</h3>
            <button type="button" onClick={() => setCart([])} disabled={!cart.length}><Trash2 size={15} /> Esvaziar carrinho</button>
          </div>
          <div className="sale-table">
            <div className="sale-table-head">
              <span>Produto</span>
              <span>Qtd.</span>
              <span>Valor unit.</span>
              <span>Desconto</span>
              <span>Total</span>
              <span />
            </div>
            {cart.map((item, index) => (
              <div className="sale-table-row" key={`${item.productId}-${index}`}>
                <span className="sale-product">
                  <img src={item.product.imageUrl || "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=120&q=80"} alt="" />
                  <span>{displayText(item.product.name)}<small>{displayText(item.variant?.color)} - {item.variant?.size}</small><em>SKU: {item.variant?.sku || item.product.sku}</em></span>
                </span>
                <span className="qty-stepper">
                  <button type="button" onClick={() => updateCart(index, { quantity: item.quantity - 1 })}><Minus size={14} /></button>
                  <input type="number" min="1" value={item.quantity} onChange={(event) => updateCart(index, { quantity: Number(event.target.value) })} />
                  <button type="button" onClick={() => updateCart(index, { quantity: item.quantity + 1 })}><Plus size={14} /></button>
                </span>
                <strong>{money(item.unitPrice)}</strong>
                <input className="discount-input" type="number" min="0" value={item.discount} onChange={(event) => updateCart(index, { discount: Number(event.target.value) })} />
                <strong>{money(Math.max(item.quantity * item.unitPrice - Number(item.discount || 0), 0))}</strong>
                <button className="icon-action" type="button" title="Remover item" onClick={() => remove(index)}><Trash2 size={16} /></button>
              </div>
            ))}
            {!cart.length && (
              <div className="sale-table-empty">
                <Barcode size={34} />
                <strong>Passe o leitor ou escolha um produto abaixo</strong>
                <span>Os itens da venda aparecem aqui para conferir antes de finalizar.</span>
              </div>
            )}
          </div>
          <button className="sale-note" type="button"><Plus size={15} /> Adicionar observação ou informação da venda</button>
        </section>
        <div className="pdv-tools">
          <div className="search inline">
            <Search size={18} />
            <input value={productSearch} onChange={(event) => setProductSearch(event.target.value)} placeholder="Buscar no catálogo do PDV..." />
          </div>
          <span>{filteredProducts.length} produtos disponíveis</span>
        </div>
        <div className="product-grid">
          {filteredProducts.map((product) => (
            <article className="product-card" key={product.id}>
              <div className="product-media">
                <img src={product.imageUrl || "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=600&q=80"} alt="" />
                <span className="category-chip">{displayText(product.category?.name || "Produto")}</span>
                <button className="favorite-btn" type="button" title="Favoritar"><Heart size={18} /></button>
              </div>
              <strong>{displayText(product.name)}</strong>
              <span>{money(product.promoPrice || product.salePrice)}</span>
              <small className="product-meta">{displayText(product.category?.name || "Produto")} <i /> {product.variants?.reduce((sum, item) => sum + Number(item.stock || 0), 0)} un.</small>
              <div className="variant-pills">
                {(product.variants || []).filter((item) => item.stock > 0).slice(0, 4).map((variant) => (
                  <button key={variant.id} onClick={() => add(product, variant.id)}>
                    {variant.size} {displayText(variant.color)} · {variant.stock}
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>
        <div className="pdv-footer">
          <span>Mostrando 1 a {filteredProducts.length} de {filteredProducts.length} produtos</span>
          <div>
            <button type="button">‹</button>
            <strong>1</strong>
            <button type="button">›</button>
          </div>
        </div>
      </div>
      <aside className="checkout pos-summary">
        <h3><ShoppingBag size={18} /> Fechamento da venda</h3>
        <label>Cliente
          <select value={customerId} onChange={(event) => setCustomerId(event.target.value)}>
            <option value="">Cliente não cadastrado</option>
            {customers.map((customer) => <option value={customer.id} key={customer.id}>{customer.name}</option>)}
          </select>
        </label>
        <div className="cart-lines">
          {cart.map((item, index) => (
            <div className="cart-line" key={`${item.productId}-${index}`}>
              <span>{displayText(item.product.name)}<small>{displayText(item.variant?.color)} {item.variant?.size}</small></span>
              <div className="qty-stepper">
                <button type="button" onClick={() => updateCart(index, { quantity: item.quantity - 1 })}><Minus size={14} /></button>
                <input type="number" min="1" value={item.quantity} onChange={(event) => updateCart(index, { quantity: Number(event.target.value) })} />
                <button type="button" onClick={() => updateCart(index, { quantity: item.quantity + 1 })}><Plus size={14} /></button>
              </div>
              <input className="discount-input" type="number" min="0" placeholder="Desc." value={item.discount} onChange={(event) => updateCart(index, { discount: Number(event.target.value) })} />
              <strong>{money(Math.max(item.quantity * item.unitPrice - Number(item.discount || 0), 0))}</strong>
              <button className="icon-action" type="button" title="Remover item" onClick={() => remove(index)}><Trash2 size={16} /></button>
            </div>
          ))}
          {!cart.length && (
            <div className="empty-cart">
              <div className="empty-cart-art">
                <ShoppingBag size={42} />
                <span>%</span>
              </div>
              <strong>Adicione produtos pelo catálogo</strong>
              <small>ou passe o leitor de código de barras para começar a venda.</small>
            </div>
          )}
        </div>
        <div className="payment-panel">
          <span>Forma de pagamento</span>
          <div className="payment-options">
            {paymentOptions.map(([value, label, Icon]) => (
              <button className={payment === value ? "active" : ""} key={value} type="button" onClick={() => setPayment(value)}>
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>
        </div>
        {payment === "DINHEIRO" && (
          <label>Valor recebido
            <input type="number" min="0" value={cashReceived} onChange={(event) => setCashReceived(event.target.value)} placeholder="0,00" />
          </label>
        )}
        {payment === "CREDIARIO" && (
          <div className="credit-box">
            <strong>Crediário da venda</strong>
            <small>Selecione um cliente para gerar as parcelas automaticamente.</small>
            <label>Parcelas
              <input type="number" min="1" max="12" value={creditInstallments} onChange={(event) => setCreditInstallments(event.target.value)} />
            </label>
            <label>Primeiro vencimento
              <input type="date" value={creditFirstDueDate} onChange={(event) => setCreditFirstDueDate(event.target.value)} />
            </label>
          </div>
        )}
        <div className="flow-hint">
          <div>
            <strong>Fluxo automático</strong>
            <span>Finalizou a venda? O sistema baixa estoque, movimenta o caixa, soma fidelidade e alimenta dashboard/relatórios.</span>
          </div>
          <i aria-hidden="true" />
        </div>
        <div className="summary-lines">
          <span>Subtotal <strong>{money(subtotal)}</strong></span>
          <span>Descontos <strong>{money(discountTotal)}</strong></span>
          {payment === "DINHEIRO" && <span>Troco <strong>{money(change)}</strong></span>}
        </div>
        <div className="total"><span>Total</span><strong>{money(total)}</strong></div>
        <button className="primary" disabled={!cart.length} onClick={finish}><ShoppingBag size={18} /> Finalizar venda</button>
        {lastSale && <ReceiptCard sale={lastSale} />}
        {message && <p className="notice">{message}</p>}
      </aside>
    </section>
  );
}

function ReceiptCard({ sale }) {
  function printReceipt() {
    const rows = (sale.items || []).map((item) => `
      <tr>
        <td>${item.product?.name || "Produto"}</td>
        <td>${item.quantity}</td>
        <td>${money(item.unitPrice)}</td>
        <td>${money(item.total)}</td>
      </tr>
    `).join("");
    const payments = (sale.payments || []).map((payment) => `${formatText(payment.method)} ${money(payment.amount)}`).join("<br>");
    const isCreditSale = sale.saleMode === "FIADO" || (sale.payments || []).some((payment) => payment.method === "CREDIARIO");
    const modeLabel = isCreditSale ? "FIADO / CREDIÁRIO" : "À VISTA";
    const firstDue = sale.creditFirstDueDate ? new Date(`${sale.creditFirstDueDate}T00:00:00`).toLocaleDateString("pt-BR") : "";
    const creditRows = isCreditSale ? `
      <p><strong>Condição:</strong> ${sale.creditInstallments || 1} parcela(s)${firstDue ? ` · 1º vencimento: ${firstDue}` : ""}</p>
      <div class="signature">Assinatura do cliente</div>
    ` : "";
    const popup = window.open("", "receipt", "width=380,height=620");
    popup.document.write(`
      <html>
        <head>
          <title>Comprovante ${sale.code}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 18px; color: #222; }
            h2, p { margin: 0 0 8px; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin: 14px 0; }
            td, th { border-bottom: 1px solid #ddd; padding: 6px 0; font-size: 12px; text-align: left; }
            .total { font-size: 18px; font-weight: bold; text-align: right; margin-top: 12px; }
            .muted { color: #666; font-size: 12px; }
            .badge { display: inline-block; margin: 6px auto 10px; padding: 6px 10px; border-radius: 999px; background: #fff1f5; color: #a72f4e; font-weight: bold; font-size: 12px; }
            .signature { margin-top: 34px; padding-top: 8px; border-top: 1px solid #222; text-align: center; font-size: 12px; }
          </style>
        </head>
        <body>
          <h2>Sud Daiana Modas</h2>
          <p class="muted">Comprovante de venda</p>
          <p class="badge">${modeLabel}</p>
          <p><strong>${sale.code}</strong></p>
          <p class="muted">${new Date(sale.createdAt || Date.now()).toLocaleString("pt-BR")}</p>
          <p>Cliente: ${sale.customer?.name || "Cliente não cadastrado"}</p>
          <table>
            <thead><tr><th>Item</th><th>Qtd</th><th>Unit.</th><th>Total</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
          <p>Pagamento:<br>${payments}</p>
          ${creditRows}
          ${sale.cashReceived ? `<p>Recebido: ${money(sale.cashReceived)}<br>Troco: ${money(sale.change)}</p>` : ""}
          <p class="total">Total: ${money(sale.total)}</p>
          <p class="muted">Obrigada pela preferência!</p>
          <script>window.print(); window.close();</script>
        </body>
      </html>
    `);
    popup.document.close();
  }

  return (
    <div className="receipt-card">
      <div>
        <small>Última venda</small>
        <strong>{sale.code}</strong>
        <span>{money(sale.total)}</span>
        <em>{sale.saleMode === "FIADO" ? "Cupom fiado pronto para assinatura" : "Cupom à vista pronto para imprimir"}</em>
        <small>Fluxo concluído: estoque, caixa e relatórios atualizados.</small>
      </div>
      <button type="button" onClick={printReceipt}><Printer size={16} /> Imprimir</button>
    </div>
  );
}

function Products() {
  const empty = { name: "", sku: "", salePrice: "", costPrice: "", categoryId: "", brandId: "", imageUrl: "", variants: "Rosa,P,SKU-RO-P,3" };
  const [products, setProducts] = useState([]);
  const [options, setOptions] = useState({ categories: [], brands: [] });
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    api("/api/products").then(setProducts);
    api("/api/products/lookups/options").then(setOptions);
  }, []);

  function edit(product) {
    setEditingId(product.id);
    setForm({
      name: product.name || "",
      sku: product.sku || "",
      salePrice: product.salePrice || "",
      costPrice: product.costPrice || "",
      categoryId: product.categoryId || "",
      brandId: product.brandId || "",
      imageUrl: product.imageUrl || "",
      variants: (product.variants || []).map((variant) => [variant.color, variant.size, variant.sku, variant.stock].join(",")).join("\n")
    });
    setMessage("Editando produto. Revise as variações antes de salvar.");
  }

  async function loadProducts() {
    setProducts(await api("/api/products"));
  }

  async function save(event) {
    event.preventDefault();
    setMessage("");
    const variants = form.variants.split("\n").filter(Boolean).map((line) => {
      const [color, size, sku, stock] = line.split(",");
      return { color, size, sku, stock: Number(stock || 0) };
    });
    const payload = {
      ...form,
      costPrice: Number(form.costPrice),
      salePrice: Number(form.salePrice),
      categoryId: Number(form.categoryId),
      brandId: form.brandId ? Number(form.brandId) : null,
      variants
    };
    try {
      const path = editingId ? `/api/products/${editingId}` : "/api/products";
      const method = editingId ? "PUT" : "POST";
      await api(path, { method, body: JSON.stringify(payload) });
      setForm(empty);
      setEditingId(null);
      await loadProducts();
      setMessage(editingId ? "Produto atualizado." : "Produto cadastrado.");
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function removeProduct(product) {
    if (!confirm(`Desativar ${product.name}?`)) return;
    await api(`/api/products/${product.id}`, { method: "DELETE" });
    await loadProducts();
  }

  const productStats = [
    ["Produtos ativos", products.filter((item) => item.active).length, "itens disponíveis", Package, "rose"],
    ["Categorias", new Set(products.map((item) => item.category?.name).filter(Boolean)).size, "organização da vitrine", Boxes, "amber"],
    ["Estoque total", products.reduce((sum, item) => sum + (item.variants || []).reduce((acc, variant) => acc + Number(variant.stock || 0), 0), 0), "unidades cadastradas", ShoppingBag, "green"]
  ];

  return (
    <section className="page two-col">
      <div>
        <div className="page-title"><h2>Produtos</h2><p>Cadastro com categoria, marca, foto, preço e variações de roupa.</p></div>
        <InsightStrip items={productStats} />
        <div className="panel-actions">
          <button onClick={() => exportCsv("produtos-sud-daiana.csv", products, ["name", "sku", "category.name", "salePrice", "active"])}>Exportar CSV</button>
        </div>
        <DataTable
          rows={products}
          columns={["name", "sku", "category.name", "salePrice", "active"]}
          actions={(product) => (
            <>
              <button onClick={() => edit(product)}>Editar</button>
              <button onClick={() => removeProduct(product)}>Desativar</button>
            </>
          )}
        />
      </div>
      <form className="panel form-stack" onSubmit={save}>
        <h3>{editingId ? "Editar produto" : "Novo produto"}</h3>
        <input placeholder="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input placeholder="SKU principal" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
        <input placeholder="URL da foto" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
        <input placeholder="Preço de custo" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} />
        <input placeholder="Preço de venda" value={form.salePrice} onChange={(e) => setForm({ ...form, salePrice: e.target.value })} />
        <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
          <option value="">Categoria</option>
          {options.categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        <select value={form.brandId} onChange={(e) => setForm({ ...form, brandId: e.target.value })}>
          <option value="">Marca opcional</option>
          {options.brands.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        <small className="form-help">Variações: uma por linha no formato cor, tamanho, SKU, estoque.</small>
        <textarea rows="4" value={form.variants} onChange={(e) => setForm({ ...form, variants: e.target.value })} />
        <button className="primary">{editingId ? "Salvar alterações" : "Salvar produto"}</button>
        {editingId && <button type="button" onClick={() => { setEditingId(null); setForm(empty); }}>Cancelar edição</button>}
        {message && <p className="notice">{message}</p>}
      </form>
    </section>
  );
}

function Customers() {
  const empty = { name: "", phone: "", cpf: "", email: "", address: "", city: "", district: "", notes: "" };
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  useEffect(() => { api("/api/customers").then(setRows); }, []);

  async function loadCustomers() {
    setRows(await api("/api/customers"));
  }

  function edit(customer) {
    setEditingId(customer.id);
    setForm({
      name: customer.name || "",
      phone: customer.phone || "",
      cpf: customer.cpf || "",
      email: customer.email || "",
      address: customer.address || "",
      city: customer.city || "",
      district: customer.district || "",
      notes: customer.notes || ""
    });
    setMessage("Editando cliente.");
  }

  async function save(event) {
    event.preventDefault();
    setMessage("");
    try {
      const path = editingId ? `/api/customers/${editingId}` : "/api/customers";
      const method = editingId ? "PUT" : "POST";
      await api(path, {
        method,
        body: JSON.stringify({
          ...form,
          cpf: form.cpf || null,
          email: form.email || null,
          address: form.address || null,
          city: form.city || null,
          district: form.district || null,
          notes: form.notes || null
        })
      });
      setForm(empty);
      setEditingId(null);
      await loadCustomers();
      setMessage(editingId ? "Cliente atualizado." : "Cliente cadastrado.");
    } catch (err) {
      setMessage(err.message);
    }
  }
  const customerStats = [
    ["Clientes cadastrados", rows.length, "base da loja", Users, "rose"],
    ["Com fidelidade", rows.filter((item) => Number(item.loyaltyPoints || 0) > 0).length, "clientes pontuando", Heart, "purple"],
    ["WhatsApp ativo", rows.filter((item) => item.phone).length, "contatos para venda", Truck, "green"]
  ];
  return (
    <section className="page two-col">
      <div>
        <div className="page-title"><h2>Clientes</h2><p>Histórico, WhatsApp, fidelidade e saldo de crediário.</p></div>
        <InsightStrip items={customerStats} />
        <div className="panel-actions">
          <button onClick={() => exportCsv("clientes-sud-daiana.csv", rows, ["name", "phone", "cpf", "email", "loyaltyPoints"])}>Exportar CSV</button>
        </div>
        <DataTable
          rows={rows}
          columns={["name", "phone", "cpf", "loyaltyPoints"]}
          actions={(customer) => (
            <>
              <button onClick={() => edit(customer)}>Editar</button>
              <a className="table-link" href={whatsAppUrl(customer.phone, `Olá ${customer.name}, tudo bem? Aqui é da Sud Daiana Modas.`)} target="_blank" rel="noreferrer">WhatsApp</a>
            </>
          )}
        />
      </div>
      <form className="panel form-stack" onSubmit={save}>
        <h3>{editingId ? "Editar cliente" : "Novo cliente"}</h3>
        {[
          ["name", "Nome"],
          ["phone", "Telefone/WhatsApp"],
          ["cpf", "CPF"],
          ["email", "E-mail"],
          ["address", "Endereço"],
          ["district", "Bairro"],
          ["city", "Cidade"],
          ["notes", "Observações"]
        ].map(([field, label]) => <input key={field} placeholder={label} value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })} />)}
        <button className="primary">{editingId ? "Salvar alterações" : "Salvar cliente"}</button>
        {editingId && <button type="button" onClick={() => { setEditingId(null); setForm(empty); }}>Cancelar edição</button>}
        {message && <p className="notice">{message}</p>}
      </form>
    </section>
  );
}

function SimpleModule({ title, endpoint, description, columns = ["id", "name", "status", "total", "createdAt"] }) {
  const [rows, setRows] = useState([]);
  useEffect(() => { api(endpoint).then((data) => setRows(Array.isArray(data) ? data : [data])).catch(() => setRows([])); }, [endpoint]);
  const activeRows = rows.filter((row) => row.active !== false).length;
  const statusCount = rows.filter((row) => row.status && !["CANCELADO", "INATIVO"].includes(row.status)).length;
  return (
    <section className="page">
      <div className="page-title"><h2>{title}</h2><p>{description}</p></div>
      <InsightStrip items={[
        ["Registros", rows.length, "no módulo", FileText, "rose"],
        ["Em andamento", statusCount || activeRows, "ativos ou pendentes", CalendarHeart, "amber"],
        ["Exportação", rows.length ? "Pronta" : "Aguardando", "CSV disponível", Package, "green"]
      ]} />
      <div className="panel">
        <div className="panel-head compact"><h3>{title === "Estoque" ? "Produtos monitorados" : `Lista de ${title.toLowerCase()}`}</h3></div>
        <div className="panel-actions">
          <button onClick={() => exportCsv(`${title.toLowerCase().replaceAll(" ", "-")}-sud-daiana.csv`, rows, columns)}>Exportar CSV</button>
        </div>
        <DataTable
          rows={rows}
          columns={columns}
          actions={title === "Delivery" ? (row) => (
            <a className="table-link" href={whatsAppUrl(row.phone, `Olá ${row.customerName}, seu pedido da Sud Daiana Modas está com status: ${formatText(row.status)}.`)} target="_blank" rel="noreferrer">WhatsApp</a>
          ) : null}
        />
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
  const pendingInstallments = rows.flatMap((account) => account.installments || []).filter((item) => item.status !== "PAGA");
  const openTotal = rows.reduce((sum, account) => sum + Number(account.total || 0) - Number(account.paid || 0), 0);

  return (
    <section className="page">
      <div className="page-title"><h2>Crediário</h2><p>Controle clientes devendo, parcelas pendentes e baixas de pagamento.</p></div>
      <InsightStrip items={[
        ["Saldo em aberto", money(openTotal), "a receber", CreditCard, "rose"],
        ["Clientes no crediário", rows.length, "contas abertas", Users, "purple"],
        ["Parcelas pendentes", pendingInstallments.length, "para acompanhar", CalendarHeart, "amber"]
      ]} />
      {message && <p className="notice">{message}</p>}
      <div className="panel">
        <div className="panel-head compact"><h3>Contas e parcelas</h3></div>
        <div className="table-wrap">
          <div className="panel-actions">
            <button onClick={() => exportCsv("crediario-sud-daiana.csv", rows, ["customer.name", "sale.code", "total", "paid", "status"])}>Exportar CSV</button>
          </div>
          <table>
            <thead><tr><th>Cliente</th><th>Venda</th><th>Total</th><th>Pago</th><th>Parcelas</th><th>Ações</th></tr></thead>
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
                  <td className="actions-cell">
                    <a className="table-link" href={whatsAppUrl(account.customer?.phone, `Olá ${account.customer?.name}, tudo bem? Passando para lembrar das parcelas em aberto na Sud Daiana Modas.`)} target="_blank" rel="noreferrer">Cobrar no WhatsApp</a>
                  </td>
                </tr>
              ))}
              {!rows.length && <tr><td className="empty-cell" colSpan="6"><strong>Nenhum crediário em aberto.</strong><span>Quando uma venda for feita no crediário, as parcelas aparecerão aqui.</span></td></tr>}
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
  const cashExpected = openCash
    ? Number(openCash.openingAmount || 0) + (openCash.movements || []).reduce((sum, item) => {
      const amount = Number(item.amount || 0);
      return ["SAIDA", "SANGRIA", "CANCELAMENTO"].includes(item.type) ? sum - amount : sum + amount;
    }, 0)
    : 0;
  const movementCount = openCash?.movements?.length || 0;

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
    setMessage("");
    try {
      await api(`/api/cash/${openCash.id}/close`, { method: "POST", body: JSON.stringify({ closingAmount: cashExpected, expectedAmount: cashExpected }) });
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
        <InsightStrip items={[
          ["Status do caixa", openCash ? "Aberto" : "Fechado", openCash ? "pronto para vender" : "abra antes do PDV", WalletCards, openCash ? "green" : "amber"],
          ["Movimentos", movementCount, "entradas, vendas e saídas", FileText, "rose"],
          ["Total esperado", money(cashExpected), "para fechamento", BadgeDollarSign, "purple"]
        ]} />
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
      <InsightStrip items={[
        ["Formas de pagamento", data?.byPayment?.length || 0, "com movimento", CreditCard, "rose"],
        ["Estoque crítico", data?.lowStock?.length || 0, "variações baixas", Boxes, "amber"],
        ["Total recebido", money((data?.byPayment || []).reduce((sum, item) => sum + Number(item._sum?.amount || 0), 0)), "no período", BadgeDollarSign, "green"]
      ]} />
      <div className="panel-actions">
        <button onClick={() => exportCsv("estoque-baixo-sud-daiana.csv", data?.lowStock || [], ["product.name", "color", "size", "stock"])}>Exportar estoque baixo</button>
        <button onClick={() => exportCsv("pagamentos-sud-daiana.csv", data?.byPayment || [], ["method", "_sum.amount"])}>Exportar pagamentos</button>
      </div>
      <div className="metric-grid">
        {(data?.byPayment || []).map((item) => <article className="metric" key={item.method}><span>{item.method}</span><strong>{money(item._sum.amount)}</strong><FileText /></article>)}
      </div>
      <div className="panel"><div className="panel-head compact"><h3>Estoque baixo</h3></div><DataTable rows={data?.lowStock || []} columns={["product.name", "color", "size", "stock"]} /></div>
    </section>
  );
}

function OnlineStore() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("todos");
  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    address: "",
    district: "",
    city: "",
    reference: "",
    payment: "Pix",
    deliveryMode: "Retirada na loja"
  });
  const [message, setMessage] = useState("");

  useEffect(() => { api("/api/online/catalog").then(setProducts).catch((err) => setMessage(err.message)); }, []);

  const featured = products.filter((product) => product.onPromotion || product.promoPrice);
  const filtered = products.filter((product) => {
    const term = search.trim().toLowerCase();
    const stock = (product.variants || []).reduce((sum, variant) => sum + Number(variant.stock || 0), 0);
    const text = [product.name, product.category?.name, product.brand?.name].filter(Boolean).join(" ").toLowerCase();
    const matchesText = !term || text.includes(term);
    const matchesFilter = filter === "todos"
      || (filter === "promocoes" && (product.onPromotion || product.promoPrice))
      || (filter === "disponiveis" && stock > 0);
    return matchesText && matchesFilter;
  });
  const cartTotal = cart.reduce((sum, item) => sum + item.quantity * Number(item.price || 0), 0);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  function addToOnlineCart(product, variantId) {
    const variant = variantId
      ? product.variants?.find((item) => String(item.id) === String(variantId))
      : product.variants?.find((item) => Number(item.stock || 0) > 0);
    if (!variant) {
      setMessage("Produto sem estoque disponível para pedido online.");
      return;
    }
    const price = Number(variant.price || product.promoPrice || product.salePrice);
    const key = `${product.id}-${variant.id}`;
    setMessage("");
    setCart((current) => {
      const existing = current.find((item) => item.key === key);
      if (existing) {
        return current.map((item) => item.key === key ? { ...item, quantity: Math.min(item.quantity + 1, Number(variant.stock || 1)) } : item);
      }
      return [...current, { key, name: product.name, color: variant.color, size: variant.size, price, quantity: 1, stock: Number(variant.stock || 1) }];
    });
  }

  function updateOnlineCart(key, quantity) {
    setCart((current) => current.map((item) => item.key === key ? { ...item, quantity: Math.max(1, Math.min(Number(quantity || 1), item.stock)) } : item));
  }

  async function order(event) {
    event.preventDefault();
    setMessage("");
    if (!cart.length) {
      setMessage("Adicione pelo menos um produto ao pedido online.");
      return;
    }
    try {
      const itemsText = cart.map((item) => `${item.quantity}x ${item.name} - ${item.size} ${item.color} (${money(item.price)})`).join("; ");
      await api("/api/online/orders", {
        method: "POST",
        body: JSON.stringify({
          customerName: form.customerName,
          phone: form.phone,
          address: form.deliveryMode === "Entrega" ? form.address : "Retirada na loja",
          district: form.deliveryMode === "Entrega" ? form.district : "Centro",
          city: form.city || "Cidade",
          reference: form.reference,
          payment: form.payment,
          notes: `Pedido online (${form.deliveryMode}) - ${itemsText}. Total estimado: ${money(cartTotal)}`
        })
      });
      setCart([]);
      setForm({ customerName: "", phone: "", address: "", district: "", city: "", reference: "", payment: "Pix", deliveryMode: "Retirada na loja" });
      setMessage("Pedido online recebido no painel de delivery.");
    } catch (err) {
      setMessage(err.message);
    }
  }

  return (
    <section className="page online-page">
      <div className="online-hero">
        <div>
          <span className="eyebrow">Vitrine mobile</span>
          <h2>Pedido Online Sud Daiana Modas</h2>
          <p>Catálogo bonito para vender pelo celular, divulgar promoções e receber pedidos no delivery.</p>
          <div className="online-hero-actions">
            <button className={filter === "todos" ? "active" : ""} type="button" onClick={() => setFilter("todos")}>Tudo</button>
            <button className={filter === "promocoes" ? "active" : ""} type="button" onClick={() => setFilter("promocoes")}>Promoções</button>
            <button className={filter === "disponiveis" ? "active" : ""} type="button" onClick={() => setFilter("disponiveis")}>Disponíveis</button>
          </div>
        </div>
        <div className="online-hero-card">
          <ShoppingBag size={26} />
          <strong>{itemCount} itens</strong>
          <span>{money(cartTotal)} no carrinho</span>
        </div>
      </div>
      <InsightStrip items={[
        ["Produtos na vitrine", products.length, "visíveis para venda", ShoppingBag, "rose"],
        ["Promoções", featured.length, "campanhas ativas", Gift, "amber"],
        ["Canal rápido", "Delivery", "pedido chega no painel", Truck, "green"]
      ]} />
      <div className="online-layout">
        <div>
          <div className="online-search">
            <Search size={18} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar vestido, blusa, calça..." />
          </div>
          <div className="online-product-grid">
            {filtered.map((product) => {
              const stock = (product.variants || []).reduce((sum, variant) => sum + Number(variant.stock || 0), 0);
              const price = Number(product.promoPrice || product.salePrice);
              const hasPromo = product.onPromotion || product.promoPrice;
              return (
                <article className="online-card" key={product.id}>
                  <div className="online-media">
                    <img src={product.imageUrl || "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=600&q=80"} alt="" />
                    <span>{displayText(hasPromo ? "Promoção" : product.category?.name || "Produto")}</span>
                  </div>
                  <div className="online-card-body">
                    <strong>{displayText(product.name)}</strong>
                    <p>{displayText(product.description || `${product.category?.name || "Moda"} com pronta entrega na Sud Daiana Modas.`)}</p>
                    <div className="online-price-row">
                      <span>{money(price)}</span>
                      <small>{stock} un. disponíveis</small>
                    </div>
                    <div className="variant-pills">
                      {(product.variants || []).filter((item) => item.stock > 0).slice(0, 4).map((variant) => (
                        <button key={variant.id} type="button" onClick={() => addToOnlineCart(product, variant.id)}>
                          {variant.size} {displayText(variant.color)} · {variant.stock}
                        </button>
                      ))}
                    </div>
                    <button className="primary online-add" type="button" onClick={() => addToOnlineCart(product)}><Plus size={16} /> Adicionar</button>
                  </div>
                </article>
              );
            })}
            {!filtered.length && <EmptyState title="Nenhum produto encontrado." text="Tente outro termo ou marque produtos como disponíveis online." />}
          </div>
        </div>
        <form className="online-checkout" onSubmit={order}>
          <h3><Receipt size={18} /> Pedido</h3>
          <div className="online-cart-lines">
            {cart.map((item) => (
              <div className="online-cart-line" key={item.key}>
                <span>{displayText(item.name)}<small>{item.size} {displayText(item.color)}</small></span>
                <input type="number" min="1" max={item.stock} value={item.quantity} onChange={(event) => updateOnlineCart(item.key, event.target.value)} />
                <strong>{money(item.quantity * item.price)}</strong>
                <button type="button" onClick={() => setCart((current) => current.filter((row) => row.key !== item.key))}><X size={14} /></button>
              </div>
            ))}
            {!cart.length && <p className="empty-cart"><ShoppingBag size={20} /> Escolha os produtos para montar o pedido.</p>}
          </div>
          <div className="total"><span>Total estimado</span><strong>{money(cartTotal)}</strong></div>
          <input required placeholder="Nome da cliente" value={form.customerName} onChange={(event) => setForm({ ...form, customerName: event.target.value })} />
          <input required placeholder="WhatsApp" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
          <select value={form.deliveryMode} onChange={(event) => setForm({ ...form, deliveryMode: event.target.value })}>
            <option>Retirada na loja</option>
            <option>Entrega</option>
          </select>
          {form.deliveryMode === "Entrega" && (
            <>
              <input placeholder="Endereço" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} />
              <input placeholder="Bairro" value={form.district} onChange={(event) => setForm({ ...form, district: event.target.value })} />
            </>
          )}
          <input placeholder="Cidade" value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} />
          <input placeholder="Referência/observação" value={form.reference} onChange={(event) => setForm({ ...form, reference: event.target.value })} />
          <select value={form.payment} onChange={(event) => setForm({ ...form, payment: event.target.value })}>
            <option>Pix</option>
            <option>Dinheiro</option>
            <option>Cartão</option>
            <option>Fiado</option>
          </select>
          <button className="primary" disabled={!cart.length}>Enviar pedido</button>
        </form>
      </div>
      {message && <p className="notice">{message}</p>}
    </section>
  );
}

function OnlineStoreLegacy() {
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
      <InsightStrip items={[
        ["Produtos na vitrine", products.length, "visíveis para venda", ShoppingBag, "rose"],
        ["Canal rápido", "WhatsApp", "pedido chega no delivery", Truck, "green"],
        ["Status", "Ativo", "catálogo disponível", Heart, "purple"]
      ]} />
      <div className="product-grid">{products.map((product) => <article className="product-card" key={product.id}><img src={product.imageUrl} alt="" /><strong>{displayText(product.name)}</strong><span>{money(product.promoPrice || product.salePrice)}</span></article>)}</div>
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
      <div>
        <div className="page-title"><h2>Configurações</h2><p>Dados da loja, fiscal, estoque, fidelidade e permissões.</p></div>
        <div className="setup-card">
          <strong>Checklist da loja</strong>
          <span>Complete estes dados para deixar recibos, fiscal e atendimento prontos.</span>
          <ul>
            <li>Nome, telefone e WhatsApp da loja</li>
            <li>Dados fiscais para NFC-e/NF-e</li>
            <li>Ambiente fiscal e regime tributário</li>
          </ul>
        </div>
      </div>
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
        <InsightStrip items={[
          ["Usuários", rows.length, "com acesso", UserCog, "rose"],
          ["Ativos", rows.filter((item) => item.active).length, "podem entrar", Heart, "green"],
          ["Administradores", rows.filter((item) => item.role === "ADMIN").length, "controle total", Settings, "purple"]
        ]} />
        <div className="panel">
          <div className="table-wrap">
            <table>
              <thead><tr><th>Nome</th><th>Email</th><th>Perfil</th><th>Status</th><th>Ações</th></tr></thead>
              <tbody>
                {rows.map((user) => (
                  <tr key={user.id}>
                    <td>{user.email === "admin@suddaiana.com" ? "Sud Daiana Modas" : user.name}</td>
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

function DataTable({ rows, columns, actions }) {
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
    if (key === "status") return <StatusBadge value={val} />;
    if ((/(At|Date)$/i.test(key) || key === "openedAt") && val) return new Date(val).toLocaleDateString("pt-BR");
    if (typeof val === "boolean") return <StatusBadge value={val ? "SIM" : "NÃO"} />;
    if (typeof val === "string" && /^[A-Z_]+$/.test(val)) return formatText(val);
    if (val && typeof val === "object") return JSON.stringify(val);
    return typeof val === "string" ? displayText(val) : val ?? "-";
  }
  return (
    <div className="table-wrap">
      <table>
        <thead><tr>{columns.map((col) => <th key={col}>{labels[col] || col}</th>)}{actions && <th>Ações</th>}</tr></thead>
        <tbody>
          {safeRows.length === 0 && <tr><td className="empty-cell" colSpan={columns.length + (actions ? 1 : 0)}><strong>Nenhum registro encontrado.</strong><span>Quando houver dados neste módulo, eles aparecerão aqui.</span></td></tr>}
          {safeRows.map((row, index) => (
            <tr key={row.id || index}>
              {columns.map((col) => <td key={col}>{value(row, col)}</td>)}
              {actions && <td className="actions-cell">{actions(row)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function exportCsv(filename, rows, columns) {
  const labels = columns;
  const values = rows.map((row) => columns.map((column) => {
    const value = column.split(".").reduce((acc, part) => acc?.[part], row);
    if (value === null || value === undefined) return "";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value).replaceAll('"', '""');
  }));
  const csv = [labels, ...values].map((line) => line.map((cell) => `"${cell}"`).join(";")).join("\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function whatsAppUrl(phone, message = "") {
  const digits = String(phone || "").replace(/\D/g, "");
  const withCountry = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${withCountry}?text=${encodeURIComponent(message)}`;
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

function displayText(value) {
  if (value == null) return "";
  return String(value)
    .replace(/\bBasica\b/g, "Básica")
    .replace(/\bbasica\b/g, "básica")
    .replace(/\bCalca\b/g, "Calça")
    .replace(/\bcalca\b/g, "calça")
    .replace(/\bCalcas\b/g, "Calças")
    .replace(/\bcalcas\b/g, "calças")
    .replace(/\bCodigo\b/g, "Código")
    .replace(/\bcodigo\b/g, "código")
    .replace(/\bPromocao\b/g, "Promoção")
    .replace(/\bpromocao\b/g, "promoção")
    .replace(/\bPromocoes\b/g, "Promoções")
    .replace(/\bpromocoes\b/g, "promoções");
}

function App() {
  const [user, setUser] = useState(getUser());
  const logged = useMemo(() => Boolean(getToken() && user), [user]);

  useEffect(() => {
    const expire = () => setUser(null);
    window.addEventListener("sud:session-expired", expire);
    return () => window.removeEventListener("sud:session-expired", expire);
  }, []);

  if (!logged) return <Login onLogin={setUser} />;
  return <Shell user={user} onLogout={() => { clearSession(); setUser(null); }} />;
}

createRoot(document.getElementById("root")).render(<App />);

