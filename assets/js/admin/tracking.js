// assets/js/admin/tracking.js
const sb = window.supabaseClient;
const $ = (id) => document.getElementById(id);

const periodo = $("periodo");
const desde = $("desde");
const hasta = $("hasta");
const btnRefresh = $("btnRefresh");
const lastUpdate = $("lastUpdate");

// KPIs
const kTotal = $("kTotal");
const kProd = $("kProd");
const kCat = $("kCat");
const kWsp = $("kWsp");

// Charts
const elDia = $("chartPorDia");
const elTipo = $("chartPorTipo");

// Top lists
const topProductos = $("topProductos");
const topCategorias = $("topCategorias");

// Full tables
const qProd = $("qProd");
const qCat = $("qCat");
const tbProd = $("tbProd");
const tbCat = $("tbCat");
const prodCount = $("prodCount");
const catCount = $("catCount");

let prodRows = []; // {id, nombre, clicks}
let catRows  = []; // {id, nombre, clicks}

const chartColors = {
  purple: "#a78bfa",
  fuchsia: "#d946ef",
  cyan: "#22d3ee",
  grid: "rgba(255,255,255,.08)",
  text: "rgba(255,255,255,.72)"
};

function nfmt(n){
  const v = Number(n);
  if (!Number.isFinite(v)) return "0";
  return v.toLocaleString("es-AR");
}
function hasUsefulData(values){
  return Array.isArray(values) && values.some(v => Number(v) > 0);
}
function setChartEmpty(canvas, show){
  const box = canvas?.closest(".chartBox");
  if (!box) return;
  let empty = box.querySelector(".chartEmpty");
  if (show){
    canvas.style.display = "none";
    if (!empty){
      empty = document.createElement("div");
      empty.className = "chartEmpty";
      empty.textContent = "No hay datos suficientes para mostrar este gráfico.";
      box.appendChild(empty);
    }
  } else {
    canvas.style.display = "";
    empty?.remove();
  }
}
function chartOptions(){
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, labels: { color: chartColors.text, usePointStyle: true, boxWidth: 8 } },
      tooltip: { backgroundColor: "rgba(10,10,18,.96)", borderColor: "rgba(217,70,239,.35)", borderWidth: 1, padding: 12 }
    },
    scales: {
      x: { grid: { color: "rgba(255,255,255,.035)" }, ticks: { color: chartColors.text, maxRotation: 0 } },
      y: { beginAtZero: true, grid: { color: chartColors.grid }, ticks: { color: chartColors.text, callback: (v) => nfmt(v) } }
    }
  };
}
function isoDate(d){ return d.toISOString().slice(0,10); }
function startOfDay(d){ const x = new Date(d); x.setHours(0,0,0,0); return x; }
function endOfDay(d){ const x = new Date(d); x.setHours(23,59,59,999); return x; }

function setDefaultDatesByPeriod(){
  const now = new Date();
  const p = periodo.value;

  let from = new Date(now);
  if (p === "0") from = new Date(now);
  else if (p === "7") from = new Date(now.getTime() - 7*86400000);
  else if (p === "30") from = new Date(now.getTime() - 30*86400000);
  else if (p === "180") from = new Date(now.getTime() - 180*86400000);
  else if (p === "365") from = new Date(now.getTime() - 365*86400000);
  else return;

  desde.value = isoDate(from);
  hasta.value = isoDate(now);
}

function getRange(){
  const from = new Date(desde.value + "T00:00:00");
  const to   = new Date(hasta.value + "T23:59:59");
  return {
    fromISO: startOfDay(from).toISOString(),
    toISO: endOfDay(to).toISOString(),
    from,
    to
  };
}

// Destruye charts por canvas para que Chart.js no rompa.
function killChartFor(canvasEl){
  try{
    if (!canvasEl) return;
    const existing = Chart.getChart(canvasEl);
    if (existing) existing.destroy();
  }catch(_){}
}

function renderTop(container, rows){
  const top = rows.slice(0, 10);
  container.innerHTML = top.length
    ? top.map(r => `
      <div class="rowItem">
        <div>
          <div class="name">${r.nombre}</div>
          <div class="muted">ID ${r.id ?? "—"}</div>
        </div>
        <div class="val">${nfmt(r.clicks)}</div>
      </div>
    `).join("")
    : `<div class="muted">Todavía no hay datos en este período.</div>`;
}

function renderTableProducts(){
  const term = (qProd?.value || "").trim().toLowerCase();
  const filtered = term
    ? prodRows.filter(r => String(r.nombre||"").toLowerCase().includes(term) || String(r.id||"").includes(term))
    : prodRows;

  if (prodCount) prodCount.textContent = `${filtered.length} item(s)`;
  if (!tbProd) return;

  tbProd.innerHTML = filtered.map(r => `
    <tr>
      <td><strong>${nfmt(r.clicks)}</strong></td>
      <td>${r.nombre}</td>
      <td>${r.id ?? "—"}</td>
    </tr>
  `).join("");
}

function renderTableCategories(){
  const term = (qCat?.value || "").trim().toLowerCase();
  const filtered = term
    ? catRows.filter(r => String(r.nombre||"").toLowerCase().includes(term) || String(r.id||"").includes(term))
    : catRows;

  if (catCount) catCount.textContent = `${filtered.length} item(s)`;
  if (!tbCat) return;

  tbCat.innerHTML = filtered.map(r => `
    <tr>
      <td><strong>${nfmt(r.clicks)}</strong></td>
      <td>${r.nombre}</td>
      <td>${r.id ?? "—"}</td>
    </tr>
  `).join("");
}

// Intenta resolver títulos reales sin depender 100% de productos (fallback a pedidos).
async function hydrateProductNames(){
  const ids = [...new Set(
    prodRows
      .map(r => r.id)
      .filter(id => id != null && String(id).match(/^\d+$/))
      .map(Number)
  )];

  if (!ids.length) return;

  // 1) intento directo: productos (ideal)
  let prodMap = new Map();
  try{
    const r = await sb.from("productos").select("id,titulo").in("id", ids);
    if (!r.error && Array.isArray(r.data)){
      r.data.forEach(p => prodMap.set(p.id, p.titulo));
    } else {
      // si falla, lo dejamos para fallback
      console.warn("No pude leer productos (puede ser RLS). Sigo con fallback a pedidos.", r.error);
    }
  }catch(e){
    console.warn("Falló lectura productos. Sigo con fallback a pedidos.", e);
  }

  // 2) fallback: pedidos (muchas veces guarda producto_titulo)
  if (prodMap.size === 0){
    try{
      const r2 = await sb
        .from("pedidos")
        .select("producto_id,producto_titulo,created_at")
        .in("producto_id", ids)
        .order("created_at", { ascending: false });

      if (!r2.error && Array.isArray(r2.data)){
        for (const row of r2.data){
          if (row.producto_id != null && row.producto_titulo){
            if (!prodMap.has(row.producto_id)) prodMap.set(row.producto_id, row.producto_titulo);
          }
        }
      } else {
        console.warn("No pude leer pedidos para fallback.", r2.error);
      }
    }catch(e){
      console.warn("Falló fallback pedidos.", e);
    }
  }

  // aplica nombres
  prodRows = prodRows.map(r => {
    const t = prodMap.get(Number(r.id));
    return t ? { ...r, nombre: t } : r;
  });

  prodRows.sort((a,b)=>b.clicks-a.clicks);
}

async function load(){
  if (!sb){
    console.error("No existe window.supabaseClient. Revisá assets/js/supabase.js");
    return;
  }

  // Evita bug de Chart.js.
  killChartFor(elDia);
  killChartFor(elTipo);

  if (lastUpdate) lastUpdate.textContent = `Actualizado: ${new Date().toLocaleString("es-AR")}`;

  const { fromISO, toISO, from, to } = getRange();

  const { data: evs, error } = await sb
    .from("eventos")
    .select("id,type,created_at,payload")
    .gte("created_at", fromISO)
    .lte("created_at", toISO)
    .order("created_at", { ascending: true });

  if (error){
    console.error("Error eventos:", error);
    if (kTotal) kTotal.textContent = "—";
    if (kProd) kProd.textContent = "—";
    if (kCat)  kCat.textContent  = "—";
    if (kWsp)  kWsp.textContent  = "—";
    if (topProductos) topProductos.innerHTML = `<div class="muted">Error cargando eventos.</div>`;
    if (topCategorias) topCategorias.innerHTML = `<div class="muted">Error cargando eventos.</div>`;
    if (tbProd) tbProd.innerHTML = "";
    if (tbCat) tbCat.innerHTML = "";
    return;
  }

  const list = evs || [];

  // tipos reales
  const PRODUCT_TYPES  = new Set(["click_producto","view_product","view_producto"]);
  const CATEGORY_TYPES = new Set(["click_categoria","view_category","view_categoria"]);
  const WHATSAPP_TYPES = new Set(["click_whatsapp","whatsapp_click"]);

  if (kTotal) kTotal.textContent = nfmt(list.length);
  if (kProd)  kProd.textContent  = nfmt(list.filter(e => PRODUCT_TYPES.has(e.type)).length);
  if (kCat)   kCat.textContent   = nfmt(list.filter(e => CATEGORY_TYPES.has(e.type)).length);
  if (kWsp)   kWsp.textContent   = nfmt(list.filter(e => WHATSAPP_TYPES.has(e.type)).length);

  // clics por día
  const byDay = new Map();
  list.forEach(e => {
    const day = String(e.created_at || "").slice(0,10);
    if (!day) return;
    byDay.set(day, (byDay.get(day) || 0) + 1);
  });

  const cur = new Date(from);
  cur.setHours(0,0,0,0);
  while (cur <= to){
    const key = isoDate(cur);
    if (!byDay.has(key)) byDay.set(key, 0);
    cur.setDate(cur.getDate() + 1);
  }

  const labelsDia = Array.from(byDay.keys()).sort();
  const dataDia = labelsDia.map(k => byDay.get(k) || 0);

  if (elDia){
    setChartEmpty(elDia, !hasUsefulData(dataDia));
    new Chart(elDia, {
      type: "line",
      data: {
        labels: labelsDia,
        datasets: [{
          label: "Interacciones",
          data: dataDia,
          tension: 0.35,
          borderColor: chartColors.fuchsia,
          backgroundColor: "rgba(217,70,239,.16)",
          pointBackgroundColor: "#fff",
          pointBorderColor: chartColors.fuchsia,
          pointRadius: 3,
          fill: true
        }]
      },
      options: chartOptions()
    });
  }

  // eventos por tipo
  const byType = new Map();
  list.forEach(e => byType.set(e.type || "unknown", (byType.get(e.type || "unknown") || 0) + 1));
  const labelsType = Array.from(byType.keys());
  const dataType = labelsType.map(k => byType.get(k) || 0);

  if (elTipo){
    setChartEmpty(elTipo, !hasUsefulData(dataType));
    new Chart(elTipo, {
      type: "bar",
      data: {
        labels: labelsType,
        datasets: [{
          label: "Eventos por tipo",
          data: dataType,
          borderRadius: 8,
          backgroundColor: "rgba(34,211,238,.52)",
          borderColor: chartColors.cyan,
          borderWidth: 1
        }]
      },
      options: chartOptions()
    });
  }

  // tablas “TODOS”
  const prodMap = new Map();
  const catMap  = new Map();

  list.forEach(e => {
    const p = e.payload || {};

    if (PRODUCT_TYPES.has(e.type)){
      const id = p.producto_id ?? p.id ?? null;
      const nombre = p.producto_titulo ?? p.titulo ?? p.nombre ?? (id ? `Producto #${id}` : "Producto (sin título)");
      const key = String(id ?? nombre);
      const prev = prodMap.get(key) || { id, nombre, clicks: 0 };
      prev.clicks += 1;
      prodMap.set(key, prev);
    }

    if (CATEGORY_TYPES.has(e.type)){
      const id = p.categoria_id ?? p.id ?? null;
      const nombre = p.categoria_nombre ?? p.nombre ?? (id ? `Categoría #${id}` : "Categoría (sin nombre)");
      const key = String(id ?? nombre);
      const prev = catMap.get(key) || { id, nombre, clicks: 0 };
      prev.clicks += 1;
      catMap.set(key, prev);
    }
  });

  prodRows = Array.from(prodMap.values()).sort((a,b)=>b.clicks-a.clicks);
  catRows  = Array.from(catMap.values()).sort((a,b)=>b.clicks-a.clicks);

  // Mejora el nombre mostrado usando productos o fallback a pedidos.
  await hydrateProductNames();

  renderTop(topProductos, prodRows);
  renderTop(topCategorias, catRows);
  renderTableProducts();
  renderTableCategories();
}

periodo?.addEventListener("change", ()=>{
  if (periodo.value !== "custom") setDefaultDatesByPeriod();
  load();
});
btnRefresh?.addEventListener("click", load);

qProd?.addEventListener("input", renderTableProducts);
qCat?.addEventListener("input", renderTableCategories);

setDefaultDatesByPeriod();
load();
