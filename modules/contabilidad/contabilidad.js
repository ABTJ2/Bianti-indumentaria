(function () {
  window.BiantiAdminModules = window.BiantiAdminModules || {};
  window.BiantiAdminModules.contabilidad = { init };
  let ctx, H;

  async function init(context) {
    ctx = context;
    H = ctx.helpers;
    await Promise.all([H.loadCore(ctx), H.loadPedidos(ctx), H.loadVentas(ctx)]);
    draw();
  }

  function movements() {
    const prod = new Map(ctx.state.productos.map((p) => [String(p.id), p]));
    const base = [
      ...ctx.state.ventas.map((v) => ({ ...v, tipo: "venta", total: Number(v.total ?? Number(v.precio || v.precio_final || 0) * Number(v.cantidad || 1)), fecha: v.fecha || v.created_at })),
      ...ctx.state.ventasManuales.map((v) => ({ ...v, tipo: "manual", total: Number(v.total ?? Number(v.precio || v.precio_final || 0) * Number(v.cantidad || 1)), fecha: v.fecha || v.created_at })),
      ...ctx.state.pedidos.filter((p) => p.estado === "vendido").map((p) => ({ ...p, tipo: "pedido", total: H.getPedidoTotal(p), fecha: p.fecha || p.created_at }))
    ];
    return base.map((m) => {
      const p = prod.get(String(m.producto_id));
      const cantidad = Number(m.cantidad || 1);
      const costo = p?.precio_costo ? Number(p.precio_costo) * cantidad : null;
      return { ...m, titulo: m.producto_titulo || p?.titulo || "-", cantidad, costo_total: costo, ganancia: costo == null ? null : Number(m.total || 0) - costo };
    }).sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));
  }

  function draw() {
    const rows = movements();
    const investment = H.sum(ctx.state.productos, (p) => p.precio_costo);
    const recovered = Math.min(investment, H.sum(rows, (m) => m.costo_total));
    const incomes = H.sum(rows, (m) => m.total);
    const gainRows = rows.filter((m) => m.ganancia != null);
    const gainKnown = H.sum(gainRows, (m) => m.ganancia);
    const ops = rows.length;
    document.getElementById("accountKpis").innerHTML = H.kpi("Inversión total", H.money(investment)) + H.kpi("Inversión recuperada", H.money(recovered)) + H.kpi("Inversión activa", H.money(Math.max(investment - recovered, 0))) + H.kpi("Ingresos", H.money(incomes)) + H.kpi("Ganancia real", gainRows.length ? H.money(gainKnown) : "Sin costos") + H.kpi("Caja total", H.money(incomes)) + H.kpi("Caja libre", gainRows.length ? H.money(Math.max(gainKnown, 0)) : "Sin costos") + H.kpi("Operaciones", ops) + H.kpi("Ticket promedio", H.money(ops ? incomes / ops : 0));
    document.getElementById("incomeCostGainChart").innerHTML = groupedFinance(rows);
    document.getElementById("salesChart").innerHTML = verticalSales(byMonth(rows, () => 1));
    document.getElementById("investmentChart").innerHTML = investmentDonut(recovered, Math.max(investment - recovered, 0));
    document.getElementById("gainTop").innerHTML = topGain(rows);
    document.getElementById("movementsList").innerHTML = latest(rows);
  }

  function byMonth(rows, fn) {
    const map = new Map();
    rows.forEach((r) => { const key = H.dateYmd(r.fecha).slice(0, 7) || "sin fecha"; map.set(key, (map.get(key) || 0) + Number(fn(r) || 0)); });
    return Array.from(map.entries()).sort().map(([label, value]) => ({ label, value }));
  }

  function financeByMonth(rows) {
    const map = new Map();
    rows.forEach((row) => {
      const key = H.dateYmd(row.fecha).slice(0, 7) || "sin fecha";
      const item = map.get(key) || { label: key, income: 0, cost: 0, gain: 0 };
      item.income += Number(row.total || 0);
      item.cost += Number(row.costo_total || 0);
      item.gain += Number(row.ganancia || 0);
      map.set(key, item);
    });
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
  }

  function groupedFinance(rows) {
    const data = financeByMonth(rows).slice(-12);
    if (!data.length) return H.empty("No hay ventas, ventas manuales ni pedidos vendidos para graficar.");
    const max = Math.max(...data.flatMap((row) => [row.income, row.cost, Math.max(row.gain, 0)]), 1);
    return data.map((row) => `<div class="groupRow" title="${H.html(row.label)} · Ingresos ${H.money(row.income)} · Costos ${H.money(row.cost)} · Ganancia ${H.money(row.gain)}"><span class="groupLabel">${H.html(row.label)}</span><div class="groupBars"><div class="groupBar barIncome"><span style="width:${(row.income / max) * 100}%"></span><b>${H.money(row.income)}</b></div><div class="groupBar barCost"><span style="width:${(row.cost / max) * 100}%"></span><b>${H.money(row.cost)}</b></div><div class="groupBar barGain"><span style="width:${(Math.max(row.gain, 0) / max) * 100}%"></span><b>${H.money(row.gain)}</b></div></div><strong>${H.money(row.gain)}</strong></div>`).join("");
  }

  function investmentDonut(recovered, pending) {
    const total = recovered + pending;
    if (!total) return H.empty("No hay inversión cargada para comparar.");
    const pct = (recovered / total) * 100;
    return `<div class="donutWrap"><div class="donut" style="background:conic-gradient(#7c3aed 0 ${pct}%, #e7dff0 ${pct}% 100%)" title="Recuperada ${H.money(recovered)} · Pendiente ${H.money(pending)}"></div><div class="donutList"><div><span>Inversión recuperada</span><strong>${H.money(recovered)}</strong></div><div><span>Inversión pendiente</span><strong>${H.money(pending)}</strong></div></div></div>`;
  }

  function verticalSales(rows) {
    if (!rows.length) return H.empty("No hay operaciones vendidas para graficar.");
    const max = Math.max(...rows.map((r) => r.value), 1);
    return rows.slice(-12).map((r) => `<div class="barRow" title="${H.html(r.label)}: ${r.value} operaciones"><span>${H.html(r.label)}</span><div class="bar"><span style="width:${(r.value / max) * 100}%"></span></div><b>${H.html(r.value)}</b></div>`).join("");
  }

  function topGain(rows) {
    const map = new Map();
    rows.filter((r) => r.ganancia != null).forEach((r) => map.set(r.titulo, (map.get(r.titulo) || 0) + r.ganancia));
    const out = Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8);
    if (!out.length) return H.empty("No hay ventas con precio_costo suficiente para calcular ganancia.");
    const max = Math.max(...out.map(([, val]) => Math.max(val, 0)), 1);
    return out.map(([name, val]) => `<div class="hBarRow" title="${H.html(name)}: ${H.money(val)}"><span class="hBarName">${H.html(name)}</span><div class="hBarTrack"><span style="width:${(Math.max(val, 0) / max) * 100}%"></span></div><span class="hBarValue">${H.money(val)}</span></div>`).join("");
  }

  function latest(rows) {
    return rows.length ? rows.slice(0, 8).map((m) => `<div class="miniRow"><div class="thumbBox">${H.html(m.tipo.slice(0, 2).toUpperCase())}</div><div><strong>${H.html(m.titulo)}</strong><small>${H.dateTime(m.fecha)} · ${H.html(m.tipo)} · costo ${m.costo_total == null ? "sin dato" : H.money(m.costo_total)}</small></div><span class="miniMetric">${H.money(m.total)}</span></div>`).join("") : H.empty("No hay ventas, ventas manuales ni pedidos vendidos para mostrar.");
  }
})();
