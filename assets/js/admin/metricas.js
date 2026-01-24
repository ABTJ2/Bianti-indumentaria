// assets/js/admin/metricas.js
const supabase = window.supabaseClient;

const $ = (id) => document.getElementById(id);

const periodo = $("periodo");
const inclEventos = $("inclEventos");
const btnRefresh = $("btnRefresh");
const lastUpdate = $("lastUpdate");

// KPIs
const kTotal = $("kTotal");
const kUnidades = $("kUnidades");
const kTicket = $("kTicket");
const kCantVentas = $("kCantVentas");

const kTotalSub = $("kTotalSub");
const kUnidadesSub = $("kUnidadesSub");
const kTicketSub = $("kTicketSub");
const kCantVentasSub = $("kCantVentasSub");

// Charts
const ctxVentasDia = $("chartVentasDia");
const ctxUnidadesDia = $("chartUnidadesDia");
const eventosCard = $("eventosCard");
const ctxEventos = $("chartEventos");

// Top lists
const topProductos = $("topProductos");
const topUnidades = $("topUnidades");

let chart1 = null;
let chart2 = null;
let chart3 = null;

function money(n){
  const v = Number(n);
  if (!Number.isFinite(v)) return "$0";
  return v.toLocaleString("es-AR", { style:"currency", currency:"ARS" });
}
function nfmt(n){
  const v = Number(n);
  if (!Number.isFinite(v)) return "0";
  return v.toLocaleString("es-AR");
}
function isoDate(d){
  return d.toISOString().slice(0,10);
}
function startOfDay(d){
  const x = new Date(d);
  x.setHours(0,0,0,0);
  return x;
}
function endOfDay(d){
  const x = new Date(d);
  x.setHours(23,59,59,999);
  return x;
}
function daysBetween(a,b){
  const ms = startOfDay(b) - startOfDay(a);
  return Math.round(ms / 86400000);
}
function setKpi(el, val){ el.textContent = val; }
function setSub(el, val){ el.textContent = val; }

function destroyCharts(){
  if (chart1) { chart1.destroy(); chart1 = null; }
  if (chart2) { chart2.destroy(); chart2 = null; }
  if (chart3) { chart3.destroy(); chart3 = null; }
}

async function load(){
  destroyCharts();

  const days = Number(periodo.value || 30);
  const now = new Date();
  const from = new Date(now.getTime() - (days * 86400000));
  const fromISO = isoDate(from);
  const toISO = isoDate(now);

  lastUpdate.textContent = `Actualizado: ${new Date().toLocaleString("es-AR")}`;

  // Traer ventas del periodo
  // Nota: fecha es "date" -> conviene filtrar por >= y <=
  const { data: ventas, error } = await supabase
    .from("ventas")
    .select("id,producto_id,cantidad,precio,total,fecha,nota")
    .gte("fecha", fromISO)
    .lte("fecha", toISO)
    .order("fecha", { ascending: true });

  if (error){
    console.error(error);
    setKpi(kTotal, "—");
    setKpi(kUnidades, "—");
    setKpi(kTicket, "—");
    setKpi(kCantVentas, "—");
    topProductos.innerHTML = `<div class="muted">Error cargando ventas.</div>`;
    topUnidades.innerHTML = ``;
    return;
  }

  const list = ventas || [];

  // Map producto -> titulo
  const ids = Array.from(new Set(list.map(v => v.producto_id).filter(Boolean)));
  let prodMap = new Map();
  if (ids.length){
    const r = await supabase
      .from("productos")
      .select("id,titulo")
      .in("id", ids);
    if (!r.error){
      (r.data || []).forEach(p => prodMap.set(p.id, p.titulo || `#${p.id}`));
    }
  }

  // KPIs generales periodo
  const total = list.reduce((s,v)=> s + Number(v.total || (Number(v.precio||0)*Number(v.cantidad||0)) || 0), 0);
  const unidades = list.reduce((s,v)=> s + Number(v.cantidad || 0), 0);
  const cantVentas = list.length;
  const ticket = cantVentas ? (total / cantVentas) : 0;

  setKpi(kTotal, money(total));
  setKpi(kUnidades, nfmt(unidades));
  setKpi(kTicket, money(ticket));
  setKpi(kCantVentas, nfmt(cantVentas));

  // Sub KPIs (hoy / semana / mes)
  const todayISO = isoDate(now);
  const weekFrom = new Date(now.getTime() - (7 * 86400000));
  const monthFrom = new Date(now.getTime() - (30 * 86400000));
  const weekISO = isoDate(weekFrom);
  const monthISO = isoDate(monthFrom);

  const hoy = list.filter(v => v.fecha === todayISO);
  const sem = list.filter(v => v.fecha >= weekISO);
  const mes = list.filter(v => v.fecha >= monthISO);

  const sumTot = (arr) => arr.reduce((s,v)=> s + Number(v.total || (Number(v.precio||0)*Number(v.cantidad||0)) || 0), 0);

  setSub(kTotalSub, `Hoy: ${money(sumTot(hoy))} · 7d: ${money(sumTot(sem))} · 30d: ${money(sumTot(mes))}`);
  setSub(kUnidadesSub, `Hoy: ${nfmt(hoy.reduce((s,v)=>s+Number(v.cantidad||0),0))} · 7d: ${nfmt(sem.reduce((s,v)=>s+Number(v.cantidad||0),0))}`);
  setSub(kTicketSub, `Ticket 7d: ${money(sem.length ? sumTot(sem)/sem.length : 0)}`);
  setSub(kCantVentasSub, `Hoy: ${nfmt(hoy.length)} · 7d: ${nfmt(sem.length)} · 30d: ${nfmt(mes.length)}`);

  // Series por día
  const byDayTotal = new Map();
  const byDayUnits = new Map();

  // Inicializar días para que no queden agujeros
  for (let i = 0; i <= daysBetween(from, now); i++){
    const d = new Date(from.getTime() + i*86400000);
    const key = isoDate(d);
    byDayTotal.set(key, 0);
    byDayUnits.set(key, 0);
  }

  list.forEach(v => {
    const key = v.fecha;
    const t = Number(v.total || (Number(v.precio||0)*Number(v.cantidad||0)) || 0);
    const u = Number(v.cantidad || 0);
    byDayTotal.set(key, (byDayTotal.get(key) || 0) + t);
    byDayUnits.set(key, (byDayUnits.get(key) || 0) + u);
  });

  const labels = Array.from(byDayTotal.keys());
  const dataTotal = labels.map(k => byDayTotal.get(k) || 0);
  const dataUnits = labels.map(k => byDayUnits.get(k) || 0);

  // Charts (sin setear colores, Chart.js elige defaults)
  chart1 = new Chart(ctxVentasDia, {
    type: "line",
    data: {
      labels,
      datasets: [{ label: "Facturación", data: dataTotal, tension: 0.25 }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: true },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${money(ctx.parsed.y)}`
          }
        }
      },
      scales: {
        y: {
          ticks: {
            callback: (v) => {
              const n = Number(v);
              if (!Number.isFinite(n)) return v;
              return n.toLocaleString("es-AR");
            }
          }
        }
      }
    }
  });

  chart2 = new Chart(ctxUnidadesDia, {
    type: "bar",
    data: {
      labels,
      datasets: [{ label: "Unidades", data: dataUnits }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: true } }
    }
  });

  // Top productos por total y por unidades
  const byProdTotal = new Map();
  const byProdUnits = new Map();

  list.forEach(v => {
    const id = v.producto_id;
    if (!id) return;
    const t = Number(v.total || (Number(v.precio||0)*Number(v.cantidad||0)) || 0);
    const u = Number(v.cantidad || 0);
    byProdTotal.set(id, (byProdTotal.get(id)||0) + t);
    byProdUnits.set(id, (byProdUnits.get(id)||0) + u);
  });

  const topTotal = Array.from(byProdTotal.entries())
    .sort((a,b)=> b[1]-a[1])
    .slice(0, 8);

  const topUnit = Array.from(byProdUnits.entries())
    .sort((a,b)=> b[1]-a[1])
    .slice(0, 8);

  topProductos.innerHTML = topTotal.length ? topTotal.map(([id,val]) => {
    const name = prodMap.get(id) || `#${id}`;
    return `
      <div class="row">
        <div>
          <div class="name">${name}</div>
          <div class="muted">ID ${id}</div>
        </div>
        <div style="text-align:right">
          <div class="name">${money(val)}</div>
          <div class="muted">facturación</div>
        </div>
      </div>
    `;
  }).join("") : `<div class="muted">Todavía no hay ventas en este periodo.</div>`;

  topUnidades.innerHTML = topUnit.length ? topUnit.map(([id,val]) => {
    const name = prodMap.get(id) || `#${id}`;
    return `
      <div class="row">
        <div>
          <div class="name">${name}</div>
          <div class="muted">ID ${id}</div>
        </div>
        <div style="text-align:right">
          <div class="name">${nfmt(val)}</div>
          <div class="muted">unidades</div>
        </div>
      </div>
    `;
  }).join("") : `<div class="muted">—</div>`;

  // Eventos (opcional)
  if (inclEventos.checked){
    eventosCard.style.display = "block";

    const { data: evs, error: eev } = await supabase
      .from("eventos")
      .select("id,type,created_at")
      .gte("created_at", startOfDay(from).toISOString())
      .lte("created_at", endOfDay(now).toISOString())
      .order("created_at", { ascending: true });

    if (eev){
      console.warn("Eventos:", eev);
      if (chart3) { chart3.destroy(); chart3 = null; }
      chart3 = new Chart(ctxEventos, {
        type: "bar",
        data: { labels: [], datasets: [{ label: "Eventos", data: [] }] },
        options: { responsive:true }
      });
      return;
    }

    const byType = new Map();
    (evs || []).forEach(e => {
      const t = (e.type || "unknown");
      byType.set(t, (byType.get(t)||0) + 1);
    });

    const labelsEv = Array.from(byType.keys());
    const dataEv = labelsEv.map(k => byType.get(k) || 0);

    chart3 = new Chart(ctxEventos, {
      type: "bar",
      data: { labels: labelsEv, datasets: [{ label: "Eventos", data: dataEv }] },
      options: { responsive:true, plugins:{ legend:{ display:true } } }
    });
  } else {
    eventosCard.style.display = "none";
  }
}

btnRefresh.addEventListener("click", load);
periodo.addEventListener("change", load);
inclEventos.addEventListener("change", load);

load();
