(function () {
  const knownMetricTypes = ["view_product", "product_view", "producto_visto", "whatsapp_click", "click_whatsapp", "whatsapp", "view_category", "category_view", "catalogo_view", "pedido_abierto", "pedido_estado"];
  const html = (value) => String(value ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#039;" }[ch]));
  const money = (value) => Number(value || 0).toLocaleString("es-AR", { style: "currency", currency: "ARS" });
  const dateTime = (value) => new Date(value || Date.now()).toLocaleString("es-AR");
  const dateYmd = (value) => { const d = value ? new Date(value) : new Date(); return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10); };
  const numOrNull = (value) => { const n = Number(value); return Number.isFinite(n) ? n : null; };
  const sum = (rows, fn) => rows.reduce((acc, row) => acc + Number(fn(row) || 0), 0);

  async function safeQuery(label, promise, fallback = []) {
    try {
      const result = await promise;
      if (result.error) throw result.error;
      return result.data || fallback;
    } catch (error) {
      console.warn(label, error?.message || error);
      return fallback;
    }
  }

  async function loadCore(ctx) {
    const [productos, categorias, rels, talles, fotos] = await Promise.all([
      safeQuery("productos", ctx.sb.from("productos").select("*").order("id", { ascending: false })),
      safeQuery("categorias", ctx.sb.from("categorias").select("*").order("orden", { ascending: true }).order("id", { ascending: true })),
      safeQuery("producto_categorias", ctx.sb.from("producto_categorias").select("producto_id,categoria_id")),
      safeQuery("producto_talles", ctx.sb.from("producto_talles").select("producto_id,talle")),
      safeQuery("producto_fotos", ctx.sb.from("producto_fotos").select("id,producto_id,url,orden").order("orden", { ascending: true }))
    ]);
    Object.assign(ctx.state, { productos, categorias, rels, talles, fotos });
  }

  async function loadPedidos(ctx) { ctx.state.pedidos = await safeQuery("pedidos", ctx.sb.from("pedidos").select("*").order("id", { ascending: false })); }
  async function loadEventos(ctx) { ctx.state.eventos = await safeQuery("eventos", ctx.sb.from("eventos").select("*").order("created_at", { ascending: false }).limit(3000)); }
  async function loadVentas(ctx) {
    const [ventas, ventasManuales] = await Promise.all([safeQuery("ventas", ctx.sb.from("ventas").select("*")), safeQuery("ventas_manuales", ctx.sb.from("ventas_manuales").select("*"))]);
    Object.assign(ctx.state, { ventas, ventasManuales });
  }

  function catsOf(ctx, productId) { return ctx.state.rels.filter((r) => String(r.producto_id) === String(productId)).map((r) => String(r.categoria_id)); }
  function catNames(ctx, productId) { return catsOf(ctx, productId).map((id) => ctx.state.categorias.find((c) => String(c.id) === id)?.nombre).filter(Boolean).join(", "); }
  function tallesOf(ctx, productId) { return ctx.state.talles.filter((t) => String(t.producto_id) === String(productId)).map((t) => t.talle).filter(Boolean); }
  function titleOf(ctx, productId) { return ctx.state.productos.find((p) => String(p.id) === String(productId))?.titulo || `Producto #${productId || "-"}`; }
  function getPedidoTotal(p) { return Number(p.total ?? p.producto_precio ?? p.precio_final ?? p.precio ?? 0) * Number(p.cantidad ?? 1); }
  function showRlsError(error) { console.warn(error?.message || error); return "No se pudo completar la operación. Revisá permisos o datos disponibles."; }
  function kpi(label, value) { return `<div class="kpiCard"><span>${html(label)}</span><strong>${value}</strong></div>`; }
  function empty(message = "Sin datos para mostrar.") { return `<div class="empty">${html(message)}</div>`; }
  function miniList(rows, fn) { return rows.length ? rows.map((row) => `<div class="status" style="margin-bottom:8px">${fn(row)}</div>`).join("") : empty(); }
  function countBy(rows, fn) { const map = new Map(); rows.forEach((row) => { const key = fn(row); if (key != null && key !== "") map.set(String(key), (map.get(String(key)) || 0) + 1); }); return Array.from(map.entries()).map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count); }
  function eventProductId(event) { let payload = event?.payload || {}; if (typeof payload === "string") { try { payload = JSON.parse(payload || "{}"); } catch { payload = {}; } } return event?.producto_id || payload.producto_id || payload.product_id || payload.id || ""; }
  function renderTop(ctx, rows) { return rows.length ? rows.slice(0, 8).map((r) => `<div class="status" style="margin-bottom:8px"><b>${html(titleOf(ctx, r.key))}</b><br>${r.count} eventos</div>`).join("") : empty(); }
  function getOffers() { try { return JSON.parse(localStorage.getItem("bianti_ofertas_static") || "[]"); } catch { return []; } }
  function setOffers(rows) { localStorage.setItem("bianti_ofertas_static", JSON.stringify(rows)); }
  function nowPlus(hours) { const d = new Date(); d.setHours(d.getHours() + Number(hours || 0)); return d.toISOString(); }
  async function uploadProductImage(ctx, file, productId) { const path = `${productId}/${Date.now()}-${file.name.replace(/[^a-z0-9._-]+/gi, "-")}`; const { error } = await ctx.sb.storage.from("productos").upload(path, file, { upsert: false }); if (error) throw new Error(`Storage bloqueó la subida al bucket productos: ${error.message}`); return ctx.sb.storage.from("productos").getPublicUrl(path).data.publicUrl; }
  function loadScript(src) { return new Promise((resolve, reject) => { const s = document.createElement("script"); s.src = src; s.onload = resolve; s.onerror = reject; document.head.appendChild(s); }); }
  function barChart(rows) { const max = Math.max(...rows.map((r) => r.value), 0); return rows.length ? rows.map((r) => `<div class="barRow"><span>${html(r.label)}</span><div class="bar"><span style="width:${max ? (r.value / max) * 100 : 0}%"></span></div><b>${money(r.value)}</b></div>`).join("") : empty("No hay datos suficientes para graficar."); }

  window.BiantiHelpers = { knownMetricTypes, html, esc: html, money, dateTime, dateYmd, numOrNull, sum, safeQuery, loadCore, loadPedidos, loadEventos, loadVentas, catsOf, catNames, tallesOf, titleOf, getPedidoTotal, showRlsError, kpi, empty, miniList, countBy, eventProductId, renderTop, getOffers, setOffers, nowPlus, uploadProductImage, loadScript, barChart };
})();
