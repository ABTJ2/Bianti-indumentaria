(function () {
  window.BiantiAdminModules = window.BiantiAdminModules || {};
  window.BiantiAdminModules.metricas = { init };
  let ctx, H;
  const viewTypes = ["view_product", "product_view", "producto_visto"];
  const whatsappTypes = ["whatsapp_click", "click_whatsapp", "whatsapp"];

  async function init(context) {
    ctx = context;
    H = ctx.helpers;
    await Promise.all([H.loadCore(ctx), H.loadEventos(ctx)]);
    draw();
    document.getElementById("cleanOrphans").addEventListener("click", cleanOrphans);
    document.getElementById("resetMetrics").addEventListener("click", resetMetrics);
  }

  function draw() {
    const productIds = new Set(ctx.state.productos.map((p) => String(p.id)));
    const productEvents = ctx.state.eventos.filter((e) => { const id = H.eventProductId(e); return id && productIds.has(String(id)); });
    const views = productEvents.filter((e) => viewTypes.includes(e.type));
    const wa = productEvents.filter((e) => whatsappTypes.includes(e.type) || String(e.type || "").includes("whatsapp"));
    const cats = ctx.state.eventos.filter((e) => ["view_category", "category_view"].includes(e.type));
    const orphan = ctx.state.eventos.filter((e) => { const id = H.eventProductId(e); return id && !productIds.has(String(id)); });
    document.getElementById("metricKpis").innerHTML = H.kpi("Vistas de productos", views.length) + H.kpi("Clicks WhatsApp", wa.length) + H.kpi("Categorías vistas", cats.length) + H.kpi("Eventos totales", ctx.state.eventos.length) + H.kpi("Métricas huérfanas", orphan.length);
    document.getElementById("activityChart").innerHTML = groupedActivity(views, wa);
    document.getElementById("topViews").innerHTML = horizontalTop(H.countBy(views, H.eventProductId), "vistas");
    document.getElementById("topWa").innerHTML = horizontalTop(H.countBy(wa, H.eventProductId), "clics");
    document.getElementById("metricDonut").innerHTML = donut([{ label: "Vistas", value: views.length, color: "#7c3aed" }, { label: "WhatsApp", value: wa.length, color: "#16a34a" }, { label: "Categorías", value: cats.length, color: "#f59e0b" }]);
  }

  function byDay(rows) {
    const map = new Map();
    rows.forEach((row) => { const key = H.dateYmd(row.created_at); if (key) map.set(key, (map.get(key) || 0) + 1); });
    return map;
  }

  function groupedActivity(views, wa) {
    const viewMap = byDay(views);
    const waMap = byDay(wa);
    const labels = Array.from(new Set([...viewMap.keys(), ...waMap.keys()])).sort().slice(-14);
    if (!labels.length) return H.empty("No hay vistas ni clics de WhatsApp para graficar.");
    const max = Math.max(...labels.flatMap((label) => [viewMap.get(label) || 0, waMap.get(label) || 0]), 1);
    return labels.map((label) => {
      const v = viewMap.get(label) || 0;
      const w = waMap.get(label) || 0;
      return `<div class="groupRow" title="${H.html(label)}: ${v} vistas, ${w} WhatsApp"><span class="groupLabel">${H.html(label)}</span><div class="groupBars"><div class="groupBar barViews"><span style="width:${(v / max) * 100}%"></span><b>${H.html(v)}</b></div><div class="groupBar barWa"><span style="width:${(w / max) * 100}%"></span><b>${H.html(w)}</b></div></div><strong>${H.html(v + w)}</strong></div>`;
    }).join("");
  }

  function horizontalTop(rows, label) {
    const top = rows.slice(0, 8);
    if (!top.length) return H.empty("Sin eventos para mostrar.");
    const max = Math.max(...top.map((r) => r.count), 1);
    return top.map((r) => `<div class="hBarRow" title="${H.html(productName(r.key))}: ${r.count} ${label}"><span class="hBarName">${H.html(productName(r.key))}</span><div class="hBarTrack"><span style="width:${(r.count / max) * 100}%"></span></div><span class="hBarValue">${H.html(r.count)} ${H.html(label)}</span></div>`).join("");
  }

  function productName(productId) {
    return ctx.state.productos.find((item) => String(item.id) === String(productId))?.titulo || `Producto #${productId || "-"}`;
  }

  function donut(rows) {
    const usable = rows.filter((row) => row.value > 0);
    const total = H.sum(usable, (row) => row.value);
    if (!total || usable.length < 2) return H.empty("No hay datos suficientes para un resumen proporcional.");
    let acc = 0;
    const stops = usable.map((row) => {
      const from = acc;
      acc += (row.value / total) * 100;
      return `${row.color} ${from}% ${acc}%`;
    }).join(", ");
    return `<div class="donutWrap"><div class="donut" style="background:conic-gradient(${stops})" title="Total: ${H.html(total)} eventos"></div><div class="donutList">${usable.map((row) => `<div><span>${H.html(row.label)}</span><strong>${H.html(row.value)}</strong></div>`).join("")}</div></div>`;
  }

  function setLoading(button, loading, text) {
    button.disabled = loading;
    button.dataset.originalText = button.dataset.originalText || button.textContent;
    button.textContent = loading ? text : button.dataset.originalText;
  }

  async function cleanOrphans(event) {
    if (!await ctx.ui.modal({ title: "Limpiar métricas huérfanas", message: "Se eliminarán eventos asociados a productos que ya no existen. No se eliminarán productos, categorías, pedidos, ventas ni información contable.", confirmText: "Limpiar", danger: true })) return;
    const button = event.currentTarget;
    setLoading(button, true, "Limpiando...");
    try {
      const ids = new Set(ctx.state.productos.map((p) => String(p.id)));
      const orphanIds = ctx.state.eventos.filter((e) => { const id = H.eventProductId(e); return e.id && id && !ids.has(String(id)); }).map((e) => e.id);
      if (orphanIds.length) { const { error } = await ctx.sb.from("eventos").delete().in("id", orphanIds); if (error) throw error; }
      await H.loadEventos(ctx);
      draw();
      ctx.ui.toast(orphanIds.length ? "Métricas huérfanas limpiadas" : "No había métricas huérfanas", "ok");
    } catch (error) {
      ctx.ui.notice("No se pudo limpiar", H.showRlsError(error), { danger: true });
    } finally {
      setLoading(button, false);
    }
  }

  async function resetMetrics(event) {
    if (!await ctx.ui.modal({ title: "Resetear métricas", message: "Se eliminarán los eventos usados para contar vistas y clics de WhatsApp. Los contadores volverán a cero. No se eliminarán productos, categorías, pedidos, ventas ni contabilidad.", confirmText: "Resetear", danger: true })) return;
    const button = event.currentTarget;
    setLoading(button, true, "Reseteando...");
    try {
      const { error } = await ctx.sb.from("eventos").delete().in("type", [...viewTypes, ...whatsappTypes]);
      if (error) throw error;
      await H.loadEventos(ctx);
      draw();
      ctx.ui.toast("Métricas reseteadas", "ok");
    } catch (error) {
      ctx.ui.notice("No se pudo resetear", H.showRlsError(error), { danger: true });
    } finally {
      setLoading(button, false);
    }
  }
})();
