(function () {
  window.BiantiAdminModules = window.BiantiAdminModules || {};
  window.BiantiAdminModules.dashboard = { init };

  async function init(ctx) {
    const H = ctx.helpers;
    await Promise.all([H.loadCore(ctx), H.loadPedidos(ctx), H.loadEventos(ctx), H.loadVentas(ctx)]);
    draw(ctx, H);
    document.querySelectorAll("[data-jump]").forEach((btn) => btn.addEventListener("click", () => ctx.go(btn.dataset.jump)));
    const link = new URL("../index.html", location.href).href;
    document.getElementById("dashCopy").addEventListener("click", async () => { await navigator.clipboard.writeText(link); ctx.ui.toast("Link copiado", "ok"); });
    document.getElementById("dashWa").href = `https://wa.me/${window.BIANTI?.WHATSAPP || ""}?text=${encodeURIComponent("Mirá el catálogo BIANTI: " + link)}`;
  }

  function draw(ctx, H) {
    const soldPedidos = ctx.state.pedidos.filter((p) => p.estado === "vendido");
    const sold = soldPedidos.length + ctx.state.ventas.length + ctx.state.ventasManuales.length;
    const review = ctx.state.pedidos.filter((p) => p.estado === "en_revision").length;
    const noSold = ctx.state.pedidos.filter((p) => p.estado === "no_vendido").length;
    const cancelled = ctx.state.pedidos.filter((p) => p.estado === "cancelado").length;
    const waEvents = ctx.state.eventos.filter((e) => String(e.type || "").includes("whatsapp"));
    const conversion = waEvents.length ? `${((sold / waEvents.length) * 100).toFixed(1)}%` : "0%";
    const incomes = H.sum(ctx.state.ventas, (v) => v.total ?? Number(v.precio || 0) * Number(v.cantidad || 1)) + H.sum(ctx.state.ventasManuales, (v) => v.total ?? Number(v.precio_final || v.precio || 0) * Number(v.cantidad || 1)) + H.sum(soldPedidos, H.getPedidoTotal);
    const intentEvents = ctx.state.eventos.filter((e) => ["view_product", "product_view", "producto_visto", "whatsapp_click", "click_whatsapp", "whatsapp"].includes(e.type));
    const topRows = H.countBy(intentEvents, H.eventProductId);
    const top = topRows[0];
    document.getElementById("dashKpis").innerHTML = H.kpi("Consultas WhatsApp", waEvents.length) + H.kpi("Ventas confirmadas", sold) + H.kpi("No vendidos", noSold) + H.kpi("Ingresos del período", H.money(incomes)) + H.kpi("Tasa de conversión", conversion) + H.kpi("Pedidos en revisión", review);
    document.getElementById("dashTopProduct").innerHTML = top ? productMini(ctx, H, top.key, `${top.count} eventos`) : H.empty("Todavía no hay consultas o vistas suficientes.");
    document.getElementById("dashTopProducts").innerHTML = topRows.slice(0, 6).map((r) => productMini(ctx, H, r.key, `${r.count} eventos`)).join("") || H.empty("Sin actividad registrada.");
    document.getElementById("dashLatest").innerHTML = latestPedidos(ctx, H);
    document.getElementById("dashStock").innerHTML = stockAlerts(ctx, H);
    document.getElementById("dashFlow").innerHTML = flowStep("WhatsApp", waEvents.length) + flowStep("En revisión", review) + flowStep("Vendidos", sold) + flowStep("Cancelados", cancelled);
  }

  function productMini(ctx, H, productId, metric) {
    const p = ctx.state.productos.find((item) => String(item.id) === String(productId));
    const img = p?.portada_url || ctx.state.fotos.find((foto) => String(foto.producto_id) === String(productId))?.url || "";
    return `<div class="miniRow">${img ? `<img class="thumbSmall" src="${H.html(img)}" alt="">` : `<div class="thumbBox">Sin foto</div>`}<div><strong>${H.html(p?.titulo || `Producto #${productId || "-"}`)}</strong><small>ID ${H.html(productId || "-")} · ${H.html(p ? H.catNames(ctx, p.id) || "Sin categoría" : "No encontrado")}</small></div><span class="miniMetric">${H.html(metric)}</span></div>`;
  }

  function latestPedidos(ctx, H) {
    return ctx.state.pedidos.slice(0, 6).map((p) => `<div class="miniRow"><div class="thumbBox">WA</div><div><strong>${H.html(p.producto_titulo || H.titleOf(ctx, p.producto_id))}</strong><small>${H.dateTime(p.created_at || p.fecha)} · ${labelEstado(p.estado)}</small></div><span class="miniMetric">${H.money(H.getPedidoTotal(p))}</span></div>`).join("") || H.empty("Las consultas aparecerán cuando un cliente use WhatsApp desde un producto.");
  }

  function flowStep(label, value) { return `<div class="flowStep"><b>${value}</b><span>${label}</span></div>`; }
  function labelEstado(estado) { return ({ en_revision: "En revisión", vendido: "Vendido", no_vendido: "No vendido", cancelado: "Cancelado" }[estado] || estado || "Sin estado"); }

  function stockAlerts(ctx, H) {
    const hasStock = ctx.state.productos.some((p) => Object.prototype.hasOwnProperty.call(p, "stock_actual") && Object.prototype.hasOwnProperty.call(p, "stock_minimo"));
    if (!hasStock) return H.empty("Las alertas de stock no están disponibles por el momento.");
    const rows = ctx.state.productos.filter((p) => Number.isFinite(Number(p.stock_actual)) && Number.isFinite(Number(p.stock_minimo)) && Number(p.stock_actual) <= Number(p.stock_minimo));
    return rows.map((p) => productMini(ctx, H, p.id, `${p.stock_actual} / mínimo ${p.stock_minimo}`)).join("") || H.empty("No hay alertas de stock activas.");
  }
})();
