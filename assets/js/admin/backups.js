// assets/js/admin/backups.js
// Backups/Descargas + limpieza por período (ventas, ventas_manuales, eventos)

const sb = window.supabaseClient;
const $ = (id) => document.getElementById(id);

const range = $("range");
const desde = $("desde");
const hasta = $("hasta");
const q = $("q");
const btnReload = $("btnReload");
const status = $("status");

const kVentas = $("kVentas");
const kManuales = $("kManuales");
const kEventos = $("kEventos");

const btnCsvContabilidad = $("btnCsvContabilidad");
const btnCsvVentas = $("btnCsvVentas");
const btnCsvManuales = $("btnCsvManuales");
const btnCsvEventos = $("btnCsvEventos");

const btnDelVentas = $("btnDelVentas");
const btnDelManuales = $("btnDelManuales");
const btnDelEventos = $("btnDelEventos");

if (!sb) {
  console.error("No existe window.supabaseClient. Revisá assets/js/supabase.js");
}

// ---------- helpers ----------
function ymd(d){
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return "";
  return x.toISOString().slice(0,10);
}

function addDays(ymdStr, days){
  const [Y,M,D] = ymdStr.split("-").map(Number);
  const dt = new Date(Y, M-1, D);
  dt.setDate(dt.getDate() + days);
  return ymd(dt);
}

function setStatus(msg){ if (status) status.textContent = msg || "—"; }

function setRangeDates(){
  const today = new Date();
  const todayStr = ymd(today);
  const r = range.value;

  if (r === "custom") return;

  const days = Number(r);
  const from = new Date(today);
  from.setDate(from.getDate() - (days - 1));

  desde.value = ymd(from);
  hasta.value = todayStr;
}

function getPeriod(){
  const d = desde.value;
  const h = hasta.value;
  if (!d || !h) return null;
  return { from: d, to: h };
}

// rango para timestamptz: [from 00:00, nextDay 00:00)
function tsRange(period){
  const fromTs = `${period.from}T00:00:00.000`;
  const toNext = addDays(period.to, 1);
  const toTsExclusive = `${toNext}T00:00:00.000`;
  return { fromTs, toTsExclusive };
}

function normStr(v){ return String(v ?? "").toLowerCase(); }

// CSV con BOM para Excel (tildes ok)
// Separador ; para Excel (Argentina).
function toCSV(rows, columns){
  const BOM = "\uFEFF";
  const SEP = ";"; // <-- si querés coma: cambialo a ","
  const esc = (val) => {
    const s = val == null ? "" : String(val);
    const safe = s.replaceAll('"', '""');
    return `"${safe}"`;
  };

  const head = columns.map(esc).join(SEP);
  const lines = rows.map(r => columns.map(c => esc(r[c])).join(SEP));
  return BOM + [head, ...lines].join("\n");
}

function downloadCSV(filename, rows) {
  if (!rows.length) return alert("No hay datos para exportar");

  const headers = Object.keys(rows[0]);

  const csv = [
    headers.join(";"),
    ...rows.map(r =>
      headers.map(h => `"${(r[h] ?? "").toString().replace(/"/g, '""')}"`).join(";")
    )
  ].join("\n");

  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}


function applyFilter(rows){
  const needle = (q.value || "").trim().toLowerCase();
  if (!needle) return rows;

  return rows.filter(r => {
    for (const k of Object.keys(r)) {
      const v = r[k];
      if (v == null) continue;
      if (typeof v === "object") continue;
      if (normStr(v).includes(needle)) return true;
    }
    return false;
  });
}

async function countRowsDate(table, dateField, period){
  let query = sb.from(table).select("id", { count: "exact", head: true });
  query = query.gte(dateField, period.from).lte(dateField, period.to);
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

async function countRowsTs(table, tsField, period){
  const { fromTs, toTsExclusive } = tsRange(period);
  let query = sb.from(table).select("id", { count: "exact", head: true });
  query = query.gte(tsField, fromTs).lt(tsField, toTsExclusive);
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

function confirmDanger(label, period){
  const msg =
`Vas a BORRAR "${label}" del período:
Desde: ${period.from}
Hasta: ${period.to}

Escribí BORRAR para confirmar.`;
  const res = prompt(msg);
  return (res || "").trim().toUpperCase() === "BORRAR";
}

// ---------- queries ----------
async function fetchVentas(period){
  const { data, error } = await sb
    .from("ventas")
    .select("*")
    .gte("fecha", period.from)
    .lte("fecha", period.to)
    .order("fecha", { ascending: false });

  if (error) throw error;
  return data || [];
}

async function fetchManuales(period){
  const { data, error } = await sb
    .from("ventas_manuales")
    .select("*")
    .gte("fecha", period.from)
    .lte("fecha", period.to)
    .order("fecha", { ascending: false });

  if (error) throw error;
  return data || [];
}

async function fetchEventos(period){
  const { fromTs, toTsExclusive } = tsRange(period);
  const { data, error } = await sb
    .from("eventos")
    .select("*")
    .gte("created_at", fromTs)
    .lt("created_at", toTsExclusive)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

// ---------- export ----------
function normalizeRows(rows){
  return rows.map(r => {
    const out = {};
    for (const [k, v] of Object.entries(r)) {
      if (v && typeof v === "object") out[k] = JSON.stringify(v);
      else out[k] = v;
    }
    return out;
  });
}

function pickColumns(rows, preferred){
  if (!rows.length) return preferred;
  const keys = new Set();
  rows.forEach(r => Object.keys(r).forEach(k => keys.add(k)));

  const cols = [];
  for (const c of preferred) if (keys.has(c)) cols.push(c);
  [...keys].forEach(k => { if (!cols.includes(k)) cols.push(k); });
  return cols;
}

async function exportVentas(period){
  setStatus("Cargando ventas…");
  const rows = applyFilter(normalizeRows(await fetchVentas(period)));
  const cols = pickColumns(rows, ["id","fecha","producto_id","producto_titulo","cantidad","precio","total","canal","pedido_id","nota","created_at"]);
  const csv = toCSV(rows, cols);
  downloadText(`ventas_${period.from}_a_${period.to}.csv`, csv);
  setStatus(`CSV ventas listo (${rows.length} filas).`);
}

async function exportManuales(period){
  setStatus("Cargando ventas manuales…");
  const rows = applyFilter(normalizeRows(await fetchManuales(period)));
  const cols = pickColumns(rows, ["id","fecha","producto_id","producto_titulo","cantidad","precio_final","total","canal","nota","created_at"]);
  const csv = toCSV(rows, cols);
  downloadText(`ventas_manuales_${period.from}_a_${period.to}.csv`, csv);
  setStatus(`CSV manuales listo (${rows.length} filas).`);
}

async function exportContabilidad(period){
  setStatus("Cargando contabilidad (ventas + manuales)…");
  const [v, m] = await Promise.all([fetchVentas(period), fetchManuales(period)]);
  let rows = normalizeRows([
    ...v.map(x => ({...x, __tipo:"venta"})),
    ...m.map(x => ({...x, __tipo:"manual"}))
  ]);
  rows = applyFilter(rows);

  const cols = pickColumns(rows, ["__tipo","fecha","id","producto_id","producto_titulo","cantidad","precio","precio_final","total","canal","pedido_id","nota","created_at"]);
  const csv = toCSV(rows, cols);
  downloadText(`contabilidad_${period.from}_a_${period.to}.csv`, csv);
  setStatus(`CSV contabilidad listo (${rows.length} filas).`);
}

async function exportEventos(period){
  setStatus("Cargando eventos…");
  const rows = applyFilter(normalizeRows(await fetchEventos(period)));
  const cols = pickColumns(rows, ["id","created_at","type","payload"]);
  const csv = toCSV(rows, cols);
  downloadText(`eventos_${period.from}_a_${period.to}.csv`, csv);
  setStatus(`CSV eventos listo (${rows.length} filas).`);
}

// ---------- delete ----------
async function delVentas(period){
  if (!confirmDanger("ventas", period)) return;
  setStatus("Borrando ventas…");
  const { error } = await sb.from("ventas").delete().gte("fecha", period.from).lte("fecha", period.to);
  if (error) throw error;
  setStatus("Ventas borradas.");
}

async function delManuales(period){
  if (!confirmDanger("ventas_manuales", period)) return;
  setStatus("Borrando manuales…");
  const { error } = await sb.from("ventas_manuales").delete().gte("fecha", period.from).lte("fecha", period.to);
  if (error) throw error;
  setStatus("Manuales borradas.");
}

async function delEventos(period){
  if (!confirmDanger("eventos", period)) return;
  setStatus("Borrando eventos…");
  const { error } = await sb.from("eventos").delete().gte("created_at", `${period.from}T00:00:00.000`).lt("created_at", `${addDays(period.to,1)}T00:00:00.000`);
  if (error) throw error;
  setStatus("Eventos borrados.");
}

// ---------- refresh counts ----------
async function refreshCounts(){
  const period = getPeriod();
  if (!period) { setStatus("Elegí fechas válidas."); return; }

  setStatus("Actualizando conteos…");
  try {
    const [cV, cM, cE] = await Promise.all([
      countRowsDate("ventas", "fecha", period),
      countRowsDate("ventas_manuales", "fecha", period),
      countRowsTs("eventos", "created_at", period),
    ]);

    kVentas.textContent = cV.toLocaleString("es-AR");
    kManuales.textContent = cM.toLocaleString("es-AR");
    kEventos.textContent = cE.toLocaleString("es-AR");

    setStatus(`Listo. Ventas: ${cV} · Manuales: ${cM} · Eventos: ${cE}`);
  } catch (e) {
    console.error(e);
    setStatus("Error actualizando conteos (mirá consola).");
    alert("Error actualizando conteos. Revisá consola.");
  }
}

// ---------- wiring ----------
range.addEventListener("change", () => { setRangeDates(); refreshCounts(); });
btnReload.addEventListener("click", refreshCounts);

btnCsvContabilidad.addEventListener("click", async () => {
  const period = getPeriod(); if (!period) return alert("Falta período.");
  try { await exportContabilidad(period); } catch (e) { console.error(e); alert("Error exportando contabilidad."); }
});
btnCsvVentas.addEventListener("click", async () => {
  const period = getPeriod(); if (!period) return alert("Falta período.");
  try { await exportVentas(period); } catch (e) { console.error(e); alert("Error exportando ventas."); }
});
btnCsvManuales.addEventListener("click", async () => {
  const period = getPeriod(); if (!period) return alert("Falta período.");
  try { await exportManuales(period); } catch (e) { console.error(e); alert("Error exportando manuales."); }
});
btnCsvEventos.addEventListener("click", async () => {
  const period = getPeriod(); if (!period) return alert("Falta período.");
  try { await exportEventos(period); } catch (e) { console.error(e); alert("Error exportando eventos."); }
});

btnDelVentas.addEventListener("click", async () => {
  const period = getPeriod(); if (!period) return alert("Falta período.");
  try { await delVentas(period); await refreshCounts(); } catch (e) { console.error(e); alert("Error borrando ventas. Puede ser RLS/policies."); }
});
btnDelManuales.addEventListener("click", async () => {
  const period = getPeriod(); if (!period) return alert("Falta período.");
  try { await delManuales(period); await refreshCounts(); } catch (e) { console.error(e); alert("Error borrando manuales. Puede ser RLS/policies."); }
});
btnDelEventos.addEventListener("click", async () => {
  const period = getPeriod(); if (!period) return alert("Falta período.");
  try { await delEventos(period); await refreshCounts(); } catch (e) { console.error(e); alert("Error borrando eventos. Puede ser RLS/policies."); }
});

// boot
setRangeDates();
refreshCounts();
