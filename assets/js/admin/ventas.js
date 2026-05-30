// assets/js/admin/ventas.js
const sb = window.supabaseClient;

const tablaVentas = document.getElementById("tablaVentas");
const totalesEl = document.getElementById("totales");

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

function esc(str){
  return String(str ?? "")
    .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
    .replaceAll('"',"&quot;").replaceAll("'","&#039;");
}

async function loadVentas(){
  const { data, error } = await sb
    .from("ventas")
    .select("*")
    .order("fecha", { ascending: false });

  if (error){
    console.error(error);
    tablaVentas.innerHTML = `<tr><td class="muted">Error cargando ventas.</td></tr>`;
    return;
  }

  const rows = data || [];

  if (!rows.length){
    tablaVentas.innerHTML = `<tr><td class="muted" colspan="6">No hay ventas registradas.</td></tr>`;
    totalesEl.textContent = "$0 total";
    return;
  }

  const head = `
    <tr>
      <th>ID</th>
      <th>Fecha</th>
      <th>Producto</th>
      <th>Cant</th>
      <th>Total</th>
      <th>Nota</th>
    </tr>
  `;

  const body = rows.map(r => {
    const fecha = r.fecha ? new Date(r.fecha + "T00:00:00").toLocaleDateString("es-AR") : "—";
    const total = Number(r.total || r.precio * (r.cantidad || 1) || 0);
    return `
      <tr>
        <td>${r.id}</td>
        <td>${fecha}</td>
        <td><strong>${esc(r.producto_titulo || `Producto #${r.producto_id}`)}</strong></td>
        <td>${r.cantidad ?? 1}</td>
        <td><strong>${money(total)}</strong></td>
        <td class="muted2">${esc(r.nota || "")}</td>
      </tr>
    `;
  }).join("");

  tablaVentas.innerHTML = head + body;

  const totalSum = rows.reduce((s, r) => s + Number(r.total || r.precio * (r.cantidad || 1) || 0), 0);
  totalesEl.textContent = `${money(totalSum)} total · ${nfmt(rows.length)} ventas`;
}

// Export CSV
document.getElementById("btnExport")?.addEventListener("click", async () => {
  const { data, error } = await sb.from("ventas").select("*").order("fecha", { ascending: false });
  if (error) return alert("Error exportando");
  const rows = data || [];
  if (!rows.length) return alert("No hay datos");
  const headers = Object.keys(rows[0]);
  const csv = "\ufeff" + [
    headers.join(";"),
    ...rows.map(r => headers.map(h => `"${(r[h] ?? "").toString().replace(/"/g, '""')}"`).join(";"))
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `ventas_${new Date().toISOString().slice(0,10)}.csv`;
  link.click();
});

// Inline: btnNuevaVenta opens new product page
document.getElementById("btnNuevaVenta")?.addEventListener("click", () => {
  location.href = "./nuevo-producto.html";
});

loadVentas();
