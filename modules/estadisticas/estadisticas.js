(function () {
  window.BiantiAdminModules = window.BiantiAdminModules || {};
  window.BiantiAdminModules.estadisticas = { init };
  let ctx, H;

  async function init(context) {
    ctx = context;
    H = ctx.helpers;
    await Promise.all([H.loadCore(ctx), H.loadEventos(ctx)]);
    draw();
    document.getElementById("resetStats").addEventListener("click", resetStats);
  }

  function hasPhoto(product) { return Boolean(product.portada_url || ctx.state.fotos.some((foto) => String(foto.producto_id) === String(product.id) && foto.url)); }
  function draw() {
    const sinFoto = ctx.state.productos.filter((p) => !hasPhoto(p)).length;
    const productEvents = ctx.state.eventos.filter((e) => H.eventProductId(e));
    const wa = productEvents.filter((e) => String(e.type || "").includes("whatsapp"));
    document.getElementById("statKpis").innerHTML = H.kpi("Productos totales", ctx.state.productos.length) + H.kpi("Visibles", ctx.state.productos.filter((p) => p.visible !== false).length) + H.kpi("Ocultos", ctx.state.productos.filter((p) => p.visible === false).length) + H.kpi("Sin foto", sinFoto) + H.kpi("Categorías activas", ctx.state.categorias.filter((c) => c.visible !== false).length);
    document.getElementById("byCat").innerHTML = countBars(ctx.state.categorias.map((c) => ({ label: c.nombre || `#${c.id}`, value: ctx.state.rels.filter((r) => String(r.categoria_id) === String(c.id)).length })));
    document.getElementById("statsTop").innerHTML = renderTop(H.countBy(productEvents, H.eventProductId), "eventos");
    document.getElementById("statsWa").innerHTML = renderTop(H.countBy(wa, H.eventProductId), "WhatsApp");
  }

  function renderTop(rows, label) { return rows.length ? rows.slice(0, 8).map((r) => productMini(r.key, `${r.count} ${label}`)).join("") : H.empty("Sin datos para mostrar."); }
  function productMini(productId, metric) { const p = ctx.state.productos.find((item) => String(item.id) === String(productId)); const img = p?.portada_url || ctx.state.fotos.find((foto) => String(foto.producto_id) === String(productId))?.url || ""; return `<div class="miniRow">${img ? `<img class="thumbSmall" src="${H.html(img)}" alt="">` : `<div class="thumbBox">Sin foto</div>`}<div><strong>${H.html(p?.titulo || `Producto #${productId || "-"}`)}</strong><small>ID ${H.html(productId || "-")}</small></div><span class="miniMetric">${H.html(metric)}</span></div>`; }
  function countBars(rows) { const max = Math.max(...rows.map((r) => r.value), 0); return rows.length ? rows.map((r) => `<div class="barRow"><span>${H.html(r.label)}</span><div class="bar"><span style="width:${max ? (r.value / max) * 100 : 0}%"></span></div><b>${H.html(r.value)}</b></div>`).join("") : H.empty("No hay datos suficientes para graficar."); }
  async function resetStats() { if (!await ctx.ui.modal({ title: "Resetear estadísticas", message: "Resetear estadísticas elimina únicamente los eventos del catálogo usados para calcular vistas y consultas.\n\nVolverán a cero las vistas, consultas y rankings derivados de eventos. No elimina productos, categorías, pedidos, ventas ni contabilidad.", confirmText: "Resetear", danger: true })) return; const { error } = await ctx.sb.from("eventos").delete().in("type", H.knownMetricTypes); if (error) return ctx.ui.notice("No se pudo resetear", H.showRlsError(error), { danger: true }); await H.loadEventos(ctx); draw(); }
})();
