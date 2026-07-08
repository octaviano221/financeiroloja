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
  Minus,
  Package,
  Plus,
  Printer,
  Receipt,
  Search,
  Settings,
  ShoppingBag,
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
              <span className="store-avatar"><ShoppingBag size={18} /></span>
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
          ...(products || []).slice(0, 4).map((item) => ({ type: "Produto", title: item.name, detail: `${item.sku} • ${money(item.salePrice)}`, page: "products" })),
          ...(customers || []).slice(0, 4).map((item) => ({ type: "Cliente", title: item.name, detail: item.phone || "Sem telefone", page: "customers" })),
          ...saleMatches.slice(0, 4).map((item) => ({ type: "Venda", title: item.code, detail: `${item.customer?.name || "Cliente não cadastrado"} • ${money(item.total)}`, page: "reports" }))
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

function DashboardPremium() {
  const [data, setData] = useState(null);

  async function loadDashboard() {
    setData(await api("/api/dashboard"));
  }

  useEffect(() => { loadDashboard().catch(console.error); }, []);

  const cards = data?.cards || {};
  const chartMax = Math.max(...(data?.chart || []).map((point) => Number(point.total || 0)), 1);
  const mainCards = [
    ["Vendas do Dia", money(cards.todaySales), "0 vendas realizadas", BadgeDollarSign, "rose", "line"],
    ["Vendas do Mês", money(cards.monthSales), "0 vendas realizadas", BarChart3, "rose", "bars"],
    ["Quantidade de Vendas", cards.salesCount || 0, "0% em relação ao mês anterior", ShoppingBag, "purple", "line"],
    ["Lucro Estimado", money(cards.estimatedProfit), "0% em relação ao mês anterior", WalletCards, "green", "line"]
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
        {mainCards.map(([label, value, helper, Icon, tone, spark]) => (
          <article className={`metric dashboard-card ${tone}`} key={label}>
            <div>
              <span>{label}</span>
              <strong>{value}</strong>
              <small>{helper}</small>
            </div>
            <Icon />
            <Sparkline type={spark} />
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
            <div className="chart-scale"><span>R$ 1.000</span><span>R$ 750</span><span>R$ 500</span><span>R$ 250</span><span>R$ 0</span></div>
            <div className="chart-area">
              {(data?.chart || []).map((point) => <i key={point.label} style={{ height: `${Math.max((Number(point.total || 0) / chartMax) * 160, 18)}px` }} title={`${point.label}: ${money(point.total)}`} />)}
            </div>
          </div>
        </section>

        <section className="panel alert-panel">
          <div className="panel-head"><h3>Alertas importantes</h3></div>
          <ul className="alert-list">
            <li className="success"><span>{data?.alerts?.overdueCredit || 0} parcelas vencidas<small>Situação em dia</small></span><em className="alert-pill ok">Ok</em></li>
            <li className="warning"><span>{data?.alerts?.pendingDelivery || 0} entregas aguardando<small>Acompanhe as entregas</small></span><em className="alert-pill pending">Pendente</em></li>
            {(data?.alerts?.lowStock || []).slice(0, 4).map((item) => <li className="warning" key={item.id}><span>{item.name} {item.size} com {item.stock} un.<small>Estoque baixo</small></span><em className="alert-pill low">Baixo</em></li>)}
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

function PDV() {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [cart, setCart] = useState([]);
  const [customerId, setCustomerId] = useState("");
  const [payment, setPayment] = useState("PIX");
  const [cashReceived, setCashReceived] = useState("");
  const [productSearch, setProductSearch] = useState("");
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
  const filteredProducts = products.filter((product) => {
    const term = productSearch.trim().toLowerCase();
    if (!term) return true;
    return [product.name, product.sku, product.category?.name].filter(Boolean).join(" ").toLowerCase().includes(term);
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

  async function finish() {
    setMessage("");
    if (payment === "DINHEIRO" && Number(cashReceived || 0) < total) {
      setMessage("Valor recebido menor que o total da venda.");
      return;
    }
    try {
      const sale = await api("/api/sales", {
        method: "POST",
        body: JSON.stringify({
          customerId: customerId ? Number(customerId) : null,
          discount: 0,
          items: cart.map(({ productId, variantId, quantity, discount }) => ({ productId, variantId, quantity, discount })),
          payments: [{ method: payment, amount: total }]
        })
      });
      setCart([]);
      setCashReceived("");
      setLastSale({ ...sale, customer: sale.customer || selectedCustomer, change, cashReceived: payment === "DINHEIRO" ? Number(cashReceived || 0) : null });
      setMessage("Venda finalizada, estoque baixado e pontos gerados.");
      setProducts(await api("/api/products"));
    } catch (err) {
      setMessage(err.message.includes("Abra o caixa") ? `${err.message} Vá em Caixa e clique em Abrir caixa.` : err.message);
    }
  }

  return (
    <section className="page pdv-grid">
      <div>
        <div className="page-title"><h2>PDV / Frente de Caixa</h2><p>Venda rápida com cliente, desconto, pagamento e baixa automática.</p></div>
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
                <span className="category-chip">{product.category?.name || "Produto"}</span>
                <button className="favorite-btn" type="button" title="Favoritar"><Heart size={18} /></button>
              </div>
              <strong>{product.name}</strong>
              <span>{money(product.promoPrice || product.salePrice)}</span>
              <small className="product-meta">{product.category?.name || "Produto"} <i /> {product.variants?.reduce((sum, item) => sum + Number(item.stock || 0), 0)} un.</small>
              <div className="variant-pills">
                {(product.variants || []).filter((item) => item.stock > 0).slice(0, 4).map((variant) => (
                  <button key={variant.id} onClick={() => add(product, variant.id)}>
                    {variant.size} {variant.color} · {variant.stock}
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
      <aside className="checkout">
        <h3><ShoppingBag size={18} /> Carrinho</h3>
        <label>Cliente
          <select value={customerId} onChange={(event) => setCustomerId(event.target.value)}>
            <option value="">Cliente não cadastrado</option>
            {customers.map((customer) => <option value={customer.id} key={customer.id}>{customer.name}</option>)}
          </select>
        </label>
        <div className="cart-lines">
          {cart.map((item, index) => (
            <div className="cart-line" key={`${item.productId}-${index}`}>
              <span>{item.product.name}<small>{item.variant?.color} {item.variant?.size}</small></span>
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
          {!cart.length && <p className="empty-cart"><Plus size={18} /> Adicione produtos pelo catálogo para começar a venda.</p>}
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
        {payment === "DINHEIRO" && (
          <label>Valor recebido
            <input type="number" min="0" value={cashReceived} onChange={(event) => setCashReceived(event.target.value)} placeholder="0,00" />
          </label>
        )}
        <div className="summary-lines">
          <span>Subtotal <strong>{money(subtotal)}</strong></span>
          <span>Descontos <strong>{money(discountTotal)}</strong></span>
          {payment === "DINHEIRO" && <span>Troco <strong>{money(change)}</strong></span>}
        </div>
        <div className="total"><span>Total</span><strong>{money(total)}</strong></div>
        <button className="primary" disabled={!cart.length} onClick={finish}>Finalizar venda</button>
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
          </style>
        </head>
        <body>
          <h2>Sud Daiana Modas</h2>
          <p class="muted">Comprovante de venda</p>
          <p><strong>${sale.code}</strong></p>
          <p class="muted">${new Date(sale.createdAt || Date.now()).toLocaleString("pt-BR")}</p>
          <p>Cliente: ${sale.customer?.name || "Cliente não cadastrado"}</p>
          <table>
            <thead><tr><th>Item</th><th>Qtd</th><th>Unit.</th><th>Total</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
          <p>Pagamento:<br>${payments}</p>
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

  return (
    <section className="page two-col">
      <div>
        <div className="page-title"><h2>Produtos</h2><p>Cadastro com categoria, marca, foto, preço e variações de roupa.</p></div>
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
  return (
    <section className="page two-col">
      <div>
        <div className="page-title"><h2>Clientes</h2><p>Histórico, WhatsApp, fidelidade e saldo de crediário.</p></div>
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
  return (
    <section className="page">
      <div className="page-title"><h2>{title}</h2><p>{description}</p></div>
      <div className="panel">
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

  return (
    <section className="page">
      <div className="page-title"><h2>Crediário</h2><p>Controle clientes devendo, parcelas pendentes e baixas de pagamento.</p></div>
      {message && <p className="notice">{message}</p>}
      <div className="panel">
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
              {!rows.length && <tr><td colSpan="6">Nenhum crediário encontrado.</td></tr>}
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
      <div className="panel-actions">
        <button onClick={() => exportCsv("estoque-baixo-sud-daiana.csv", data?.lowStock || [], ["product.name", "color", "size", "stock"])}>Exportar estoque baixo</button>
        <button onClick={() => exportCsv("pagamentos-sud-daiana.csv", data?.byPayment || [], ["method", "_sum.amount"])}>Exportar pagamentos</button>
      </div>
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
        <thead><tr>{columns.map((col) => <th key={col}>{labels[col] || col}</th>)}{actions && <th>Ações</th>}</tr></thead>
        <tbody>
          {safeRows.length === 0 && <tr><td colSpan={columns.length + (actions ? 1 : 0)}>Nenhum registro encontrado.</td></tr>}
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

function App() {
  const [user, setUser] = useState(getUser());
  const logged = useMemo(() => Boolean(getToken() && user), [user]);

  if (!logged) return <Login onLogin={setUser} />;
  return <Shell user={user} onLogout={() => { clearSession(); setUser(null); }} />;
}

createRoot(document.getElementById("root")).render(<App />);

