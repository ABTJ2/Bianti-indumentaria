const sb = window.supabaseClient;

const range = document.getElementById("range");
const btnReload = document.getElementById("btnReload");
const kView = document.getElementById("kpi_view");
const kClick = document.getElementById("kpi_click");
const kScroll = document.getElementById("kpi_scroll");
const kWa = document.getElementById("kpi_wa");
const tablaTop = document.getElementById("tablaTop");
let chart;

function isoDaysAgo(n){
  const d = new Date();
  d.setDate(d.getDate()-n);
  return d.toISOString();
}

btnReload.addEventListener("click", load);
load();

async function load(){
  const n = Number(range.value||30);
  const since = isoDaysAgo(n);

  const { data, error } = await sb.from("eventos")
    .select("tipo,producto_id,created_at")
    .gte("created_at", since)
    .order("created_at",{ascending:true});
  if(error) return console.error(error);

  const counts = { view:0, click:0, scroll:0, whatsapp:0 };
  const byDay = new Map();
  const byProd = new Map();

  (data||[]).forEach(e=>{
    counts[e.tipo] = (counts[e.tipo]||0)+1;
    const day = String(e.created_at).slice(0,10);
    byDay.set(day, (byDay.get(day)||0)+1);
    if(e.tipo==="view" && e.producto_id){
      byProd.set(e.producto_id, (byProd.get(e.producto_id)||0)+1);
    }
  });

  kView.textContent = counts.view||0;
  kClick.textContent = counts.click||0;
  kScroll.textContent = counts.scroll||0;
  kWa.textContent = counts.whatsapp||0;

  const top = Array.from(byProd.entries()).sort((a,b)=>b[1]-a[1]).slice(0,10);
  const ids = top.map(([id])=>id);

  let titles = new Map();
  if(ids.length){
    const r = await sb.from("productos").select("id,titulo").in("id", ids);
    (r.data||[]).forEach(p=>titles.set(p.id,p.titulo));
  }

  tablaTop.innerHTML = `
    <tr><th>Producto</th><th>Vistas</th></tr>
    ${top.map(([id,c])=>`<tr><td><b>${titles.get(id) || ("ID "+id)}</b></td><td>${c}</td></tr>`).join("") || `<tr><td class="muted">Sin datos</td><td></td></tr>`}
  `;

  const labels = Array.from(byDay.keys()).sort();
  const values = labels.map(l=>byDay.get(l));

  const canvas = document.getElementById("chart");
  if(!canvas || !window.Chart) return;

  if(chart) chart.destroy();
  chart = new Chart(canvas, {
    type:"line",
    data:{ labels, datasets:[{ label:"Eventos", data:values, tension:0.25 }] },
    options:{ plugins:{ legend:{ display:false } }, responsive:true }
  });
}
