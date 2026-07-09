// Contabilidad BIANTI - FULL (sin columnas que no existen)
// Fix: NO pedimos productos.stock / stock_inicial / etc porque en tu DB no existen.
// Modelo actual: 1 unidad por producto (inversión = SUM(precio_costo))
// Recuperado: SUM(precio_costo * cantidad vendida) (si hay costo) y CAP a inversión total.

const sb = window.supabaseClient;
const $ = (id) => document.getElementById(id);

const range = $("range");
const desde = $("desde");
const hasta = $("hasta");
const q = $("q");
const btnReload = $("btnReload");

const k_inv = $("k_inv");
const k_rec = $("k_rec");
const k_act = $("k_act");
const k_ing = $("k_ing");
const k_gan = $("k_gan");
const k_caja = $("k_caja");
const k_libre = $("k_libre");
const k_ops = $("k_ops");

const tabla = $("tabla");
const top = $("top");
const count = $("count");
const chartInfo = $("chartInfo");

const kpiOverlay = $("kpiOverlay");
const kpiClose = $("kpiClose");
const kpiTitle = $("kpiTitle");
const kpiDesc = $("kpiDesc");
const kpiBody = $("kpiBody");

let productos = [];
let movimientos = [];
let chart = null;
const chartColors = {
  green: "#22c55e",
  cyan: "#22d3ee",
  fuchsia: "#d946ef",
  danger: "#ef4444",
  grid: "rgba(255,255,255,.08)",
  text: "rgba(255,255,255,.72)"
};

function hasUsefulData(values){
  return Array.isArray(values) && values.some(v => Number(v) !== 0);
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

function money(n){
  const v = Number(n);
  if (!Number.isFinite(v)) return "$0";
  return v.toLocaleString("es-AR", { style:"currency", currency:"ARS" });
}
function pct(n){
  const v = Number(n);
  if (!Number.isFinite(v)) return "0%";
  return (v*100).toFixed(1) + "%";
}
function esc(str){
  return String(str ?? "")
    .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
    .replaceAll('"',"&quot;").replaceAll("'","&#039;");
}
function ymd(d){
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return "";
  return x.toISOString().slice(0,10);
}
function toISOStart(dateStr){ return new Date(dateStr + "T00:00:00").toISOString(); }
function toISOEnd(dateStr){ return new Date(dateStr + "T23:59:59").toISOString(); }

function setRangeDates(){
  const today = new Date();
  const todayStr = today.toISOString().slice(0,10);
  const pick = range.value;
  const start = new Date(today);

  if (pick === "hoy") {
    desde.value = todayStr;
    hasta.value = todayStr;
    return;
  }
  if (pick === "7d") start.setDate(today.getDate() - 6);
  if (pick === "30d") start.setDate(today.getDate() - 29);
  if (pick === "6m") start.setMonth(today.getMonth() - 6);
  if (pick === "1y") start.setFullYear(today.getFullYear() - 1);

  if (pick !== "custom"){
    desde.value = start.toISOString().slice(0,10);
    hasta.value = todayStr;
  } else {
    if (!desde.value) desde.value = todayStr;
    if (!hasta.value) hasta.value = todayStr;
  }
}

function getPeriodDays(){
  const d1 = new Date(desde.value + "T00:00:00");
  const d2 = new Date(hasta.value + "T00:00:00");
  const ms = d2.getTime() - d1.getTime();
  return Math.max(1, Math.round(ms / (1000*60*60*24)) + 1);
}
function shiftDate(dateStr, deltaDays){
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + deltaDays);
  return d.toISOString().slice(0,10);
}

function normalizeVenta(v, tipo){
  const cantidad = Number(v.cantidad ?? 1) || 1;
  const total = Number(v.total ?? (Number(v.precio_final ?? 0) * cantidad) ?? 0) || 0;
  const precio = Number(v.precio_final ?? (cantidad ? total/cantidad : total)) || 0;

  return {
    tipo, // "pedido" o "manual"
    id: v.id,
    fecha: v.fecha || v.created_at || null,
    producto_id: v.producto_id ?? null,
    producto_titulo: v.producto_titulo || null,
    cantidad,
    precio_final: precio,
    total,
    nota: v.nota || "",
  };
}

// Inversión: por ahora 1 unidad por producto
function computeInvestment(products){
  let inv = 0;
  for (const p of products){
    inv += Number(p.precio_costo ?? 0) || 0;
  }
  return inv;
}

function mapProducts(products){
  const map = new Map();
  for (const p of products){
    map.set(p.id, {
      id: p.id,
      titulo: p.titulo || `Producto #${p.id}`,
      costo: Number(p.precio_costo ?? 0) || 0
    });
  }
  return map;
}

function calcMovement(m, prodMap){
  let titulo = m.producto_titulo;
  let costoUnit = null;
  let costoTotal = null;

  if (m.producto_id != null && prodMap.has(m.producto_id)){
    const p = prodMap.get(m.producto_id);
    titulo = titulo || p.titulo;
    if (Number.isFinite(p.costo) && p.costo > 0){
      costoUnit = p.costo;
      costoTotal = p.costo * m.cantidad;
    }
  }

  const ganancia = (costoTotal != null) ? (m.total - costoTotal) : null;
  const margen = (ganancia != null && m.total > 0) ? (ganancia / m.total) : null;

  return { ...m, producto_titulo: titulo || "—", costo_unit: costoUnit, costo_total: costoTotal, ganancia, margen };
}

function statsFromMovements(rows, investmentTotal){
  const ingresos = rows.reduce((a,b)=>a+(b.total||0),0);
  const ops = rows.length;
  const ticket = ops ? ingresos/ops : 0;

  let recuperadoRaw = 0;
  for (const r of rows){
    if (r.costo_total != null) recuperadoRaw += r.costo_total;
  }

  const recuperado = Math.min(recuperadoRaw, investmentTotal);
  const activa = Math.max(investmentTotal - recuperado, 0);

  // Ganancia real del negocio (como pediste)
  const gananciaReal = ingresos - investmentTotal;
  const cajaLibre = Math.max(gananciaReal, 0);

  return { investmentTotal, ingresos, recuperado, activa, gananciaReal, cajaLibre, ops, ticket, recuperadoRaw };
}

function buildTopByGain(rows){
  const by = new Map();
  for (const r of rows){
    const key = r.producto_titulo || "—";
    const acc = by.get(key) || { ing:0, gain:0, units:0, hasCost:false };
    acc.ing += (r.total||0);
    acc.units += (r.cantidad||0);
    if (r.ganancia != null){ acc.gain += r.ganancia; acc.hasCost = true; }
    by.set(key, acc);
  }
  return Array.from(by.entries())
    .filter(([,v])=>v.hasCost)
    .sort((a,b)=>b[1].gain - a[1].gain)
    .slice(0, 10);
}

function renderTop(list){
  if (!list.length){
    top.innerHTML = `<div class="muted2">No hay suficientes ventas con costos para calcular ganancia por producto.</div>`;
    return;
  }
  top.innerHTML = list.map(([name,v])=>`
    <div style="border:1px solid rgba(255,255,255,.10);background:rgba(255,255,255,.03);padding:10px;border-radius:12px;margin-bottom:8px">
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start">
        <div>
          <div><strong>${esc(name)}</strong></div>
          <div class="muted2">${v.units} u · ${money(v.ing)} facturación</div>
        </div>
        <div style="text-align:right">
          <div><strong>${money(v.gain)}</strong></div>
          <div class="muted2">ganancia</div>
        </div>
      </div>
    </div>
  `).join("");
}

function renderTable(rows){
  const term = (q.value||"").trim().toLowerCase();
  let filtered = rows.slice();

  if (term){
    filtered = filtered.filter(r =>
      String(r.producto_titulo||"").toLowerCase().includes(term) ||
      String(r.nota||"").toLowerCase().includes(term) ||
      String(r.tipo||"").toLowerCase().includes(term)
    );
  }

  count.textContent = `${filtered.length} movimientos`;

  const head = `
    <tr>
      <th>Fecha</th>
      <th>Producto</th>
      <th class="hideMobile">Tipo</th>
      <th>Cant</th>
      <th class="hideMobile">Precio</th>
      <th>Total</th>
      <th class="hideMobile">Costo</th>
      <th class="hideMobile">Ganancia</th>
      <th class="hideMobile">Nota</th>
    </tr>
  `;

  const body = filtered.map(r=>{
    const d = r.fecha ? new Date(r.fecha) : null;
    const fechaTxt = d && !Number.isNaN(d.getTime())
      ? d.toLocaleString("es-AR",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"})
      : "—";

    const costoTxt = (r.costo_total != null) ? money(r.costo_total) : "—";
    const gainTxt = (r.ganancia != null) ? money(r.ganancia) : "—";

    return `
      <tr>
        <td>${fechaTxt}</td>
        <td>
          <div><strong>${esc(r.producto_titulo||"—")}</strong></div>
          <div class="muted2">${esc(r.tipo)}</div>
        </td>
        <td class="hideMobile">${esc(r.tipo)}</td>
        <td>${r.cantidad}</td>
        <td class="hideMobile">${money(r.precio_final)}</td>
        <td><strong>${money(r.total)}</strong></td>
        <td class="hideMobile">${costoTxt}</td>
        <td class="hideMobile">${gainTxt}</td>
        <td class="hideMobile">${esc(r.nota||"")}</td>
      </tr>
    `;
  }).join("");

  tabla.innerHTML = head + body;
}

function renderKPIs(stats){
  k_inv.textContent = money(stats.investmentTotal);
  k_rec.textContent = money(stats.recuperado);
  k_act.textContent = money(stats.activa);
  k_ing.textContent = money(stats.ingresos);

  k_gan.textContent = money(stats.gananciaReal);
  k_gan.classList.remove("pos","neg");
  k_gan.classList.add(stats.gananciaReal >= 0 ? "pos" : "neg");

  k_caja.textContent = money(stats.ingresos);
  k_libre.textContent = money(stats.cajaLibre);

  k_ops.textContent = `${stats.ops} / ${money(stats.ticket)}`;
}

function groupDaily(rows){
  const map = new Map();
  for (const r of rows){
    const day = ymd(r.fecha || new Date());
    const acc = map.get(day) || { ing:0, rec:0 };
    acc.ing += (r.total||0);
    if (r.costo_total != null) acc.rec += r.costo_total;
    map.set(day, acc);
  }
  return map;
}

function buildDailySeries(rows, investmentTotal){
  const d1 = desde.value;
  const days = getPeriodDays();
  const daily = groupDaily(rows);

  const labels = [];
  const ingresos = [];
  const recuperado = [];
  const ganancia = [];

  for (let i=0;i<days;i++){
    const day = shiftDate(d1, i);
    labels.push(day.slice(5));
    const acc = daily.get(day) || { ing:0, rec:0 };
    ingresos.push(acc.ing);
    recuperado.push(Math.min(acc.rec, investmentTotal));
    ganancia.push(acc.ing - (investmentTotal / days)); // referencia suave
  }

  return { labels, ingresos, recuperado, ganancia };
}

function drawChart(series){
  const ctx = document.getElementById("chartLine");
  if (!ctx) return;

  if (chart) chart.destroy();
  setChartEmpty(ctx, !hasUsefulData(series.ingresos) && !hasUsefulData(series.recuperado) && !hasUsefulData(series.ganancia));

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: series.labels,
      datasets: [
        { label: "Ingresos", data: series.ingresos, tension: 0.35, borderColor: chartColors.green, backgroundColor: "rgba(34,197,94,.12)", pointRadius: 3, fill: true },
        { label: "Recuperado (costo)", data: series.recuperado, tension: 0.35, borderColor: chartColors.cyan, backgroundColor: "rgba(34,211,238,.08)", pointRadius: 3 },
        { label: "Ganancia (referencia)", data: series.ganancia, tension: 0.35, borderColor: chartColors.fuchsia, backgroundColor: "rgba(217,70,239,.08)", pointRadius: 3 },
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { display: true, labels: { color: chartColors.text, usePointStyle: true, boxWidth: 8 } },
        tooltip: {
          backgroundColor: "rgba(10,10,18,.96)",
          borderColor: "rgba(217,70,239,.35)",
          borderWidth: 1,
          padding: 12,
          callbacks: { label: (ctx)=> `${ctx.dataset.label}: ${money(ctx.parsed.y)}` }
        }
      },
      scales: {
        x: { grid: { color: "rgba(255,255,255,.035)" }, ticks: { color: chartColors.text } },
        y: {
          grid: { color: chartColors.grid },
          ticks: { color: chartColors.text, callback: (v)=> money(v).replace("ARS","").trim() }
        }
      }
    }
  });

  chartInfo.textContent = `${desde.value} → ${hasta.value}`;
}

async function fetchProductos(){
  // FIX: solo columnas que EXISTEN en tu esquema actual
  const r = await sb.from("productos").select("id,titulo,precio_costo");
  if (r.error) throw r.error;
  productos = r.data || [];
}

async function fetchMovimientos(fromISO, toISO){
  const [v1, v2] = await Promise.all([
    sb.from("ventas").select("*").gte("fecha", fromISO).lte("fecha", toISO).order("fecha",{ascending:false}),
    sb.from("ventas_manuales").select("*").gte("fecha", fromISO).lte("fecha", toISO).order("fecha",{ascending:false})
  ]);

  if (v1.error) throw v1.error;
  if (v2.error) throw v2.error;

  const m1 = (v1.data || []).map(v => normalizeVenta(v, "pedido"));
  const m2 = (v2.data || []).map(v => normalizeVenta(v, "manual"));

  return m1.concat(m2).sort((a,b)=> new Date(b.fecha) - new Date(a.fecha));
}

function comparisonBlock(curr, prev, label){
  const delta = curr - prev;
  const pctChange = prev !== 0 ? (delta/prev) : (curr !== 0 ? 1 : 0);
  const sign = delta >= 0 ? "+" : "";
  const cls = delta >= 0 ? "pos" : "neg";
  return `
    <div style="border:1px solid rgba(255,255,255,.10);background:rgba(255,255,255,.03);padding:10px;border-radius:12px;margin:8px 0">
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:center">
        <div><strong>${esc(label)}</strong></div>
        <div class="${cls}" style="font-weight:800">${sign}${money(delta)} (${sign}${pct(pctChange)})</div>
      </div>
      <div class="muted2">Actual: <strong>${money(curr)}</strong> · Anterior: <strong>${money(prev)}</strong></div>
    </div>
  `;
}

async function computeComparison(investmentTotal){
  const days = getPeriodDays();
  const prevDesde = shiftDate(desde.value, -days);
  const prevHasta = shiftDate(hasta.value, -days);

  const prevRaw = await fetchMovimientos(toISOStart(prevDesde), toISOEnd(prevHasta));
  const prodMap = mapProducts(productos);
  const prevCalc = prevRaw.map(m => calcMovement(m, prodMap));

  return statsFromMovements(prevCalc, investmentTotal);
}

function openKpi(key, currStats, prevStats){
  kpiOverlay.style.display = "flex";
  kpiOverlay.setAttribute("aria-hidden","false");

  const info = {
    inv: { t:"Inversión total", d:"Capital puesto (sale de costos en productos). Sube cuando cargás costos, aunque no vendas." },
    rec: { t:"Inversión recuperada", d:"Costo recuperado por ventas (costo×cantidad), limitado a la inversión total." },
    act: { t:"Inversión activa", d:"Inversión total que todavía no se recuperó. Capital aún comprometido." },
    ing: { t:"Ingresos", d:"Plata total que entró por ventas del período (catálogo + manual)." },
    gan: { t:"Ganancia real", d:"Ingresos − inversión total. Rojo = recuperando inversión. Verde = ganancia real." },
    caja:{ t:"Caja total", d:"Todo lo vendido del período." },
    libre:{ t:"Caja libre", d:"Si es positivo, es plata libre para reinvertir o sacar." },
    ops: { t:"Operaciones y ticket", d:"Cantidad de ventas y ticket promedio." },
  };

  const it = info[key] || { t:"Detalle", d:"—" };
  kpiTitle.textContent = it.t;
  kpiDesc.textContent = it.d;

  const blocks = [
    comparisonBlock(currStats.ingresos, prevStats.ingresos, "Ingresos"),
    comparisonBlock(currStats.gananciaReal, prevStats.gananciaReal, "Ganancia real"),
    comparisonBlock(currStats.recuperado, prevStats.recuperado, "Recuperación"),
  ].join("");

  const extra = `
    <div style="margin-top:10px">
      <strong>Lectura rápida:</strong><br>
      - Si <strong>Ganancia real</strong> está roja: todavía estás recuperando.<br>
      - Si está verde: el negocio ya está en ganancia.<br>
      - <strong>Inversión activa</strong> = capital que sigue “en juego”.
    </div>
  `;

  kpiBody.innerHTML = blocks + extra;
}

function closeKpi(){
  kpiOverlay.style.display = "none";
  kpiOverlay.setAttribute("aria-hidden","true");
}
kpiClose.addEventListener("click", closeKpi);
kpiOverlay.addEventListener("click", (e)=>{ if (e.target === kpiOverlay) closeKpi(); });

async function reload(){
  try{
    if (!desde.value || !hasta.value) setRangeDates();

    await fetchProductos();
    const investmentTotal = computeInvestment(productos);

    const raw = await fetchMovimientos(toISOStart(desde.value), toISOEnd(hasta.value));
    const prodMap = mapProducts(productos);
    movimientos = raw.map(m => calcMovement(m, prodMap));

    const stats = statsFromMovements(movimientos, investmentTotal);

    renderKPIs(stats);
    renderTable(movimientos);
    renderTop(buildTopByGain(movimientos));

    const series = buildDailySeries(movimientos, investmentTotal);
    drawChart(series);

    document.querySelectorAll(".kpi").forEach(card=>{
      card.onclick = async ()=>{
        const prevStats = await computeComparison(investmentTotal);
        openKpi(card.dataset.k, stats, prevStats);
      };
    });

  } catch (e){
    console.error(e);
    tabla.innerHTML = `<tr><td class="muted2">Error cargando contabilidad. Mirá consola (F12).</td></tr>`;
  }
}

// UI
range.addEventListener("change", ()=>{ if (range.value !== "custom") setRangeDates(); });
btnReload.addEventListener("click", reload);
q.addEventListener("input", ()=> renderTable(movimientos));

// Init
setRangeDates();
reload();
