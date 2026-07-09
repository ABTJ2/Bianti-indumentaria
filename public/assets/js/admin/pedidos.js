import { trackEvent } from "./events.js";

const sb = window.supabaseClient;

const $ = (id) => document.getElementById(id);
const tabla = $("tabla");
const count = $("count");

const fEstado = $("fEstado");
const q = $("q");
const desde = $("desde");
const hasta = $("hasta");
const btnReload = $("btnReload");
const btnVentaManual = $("btnVentaManual");

// modal pedido
const overlay = $("overlay");
const mClose = $("mClose");
const mTitle = $("mTitle");
const mSub = $("mSub");
const mEstado = $("mEstado");
const mProducto = $("mProducto");
const mCliente = $("mCliente");
const mTel = $("mTel");
const mCant = $("mCant");
const mPrecio = $("mPrecio");
const mNota = $("mNota");
const mHint = $("mHint");
const mDelete = $("mDelete");
const mSave = $("mSave");
const mVender = $("mVender");

// modal manual
const overlayManual = $("overlayManual");
const mCloseManual = $("mCloseManual");
const vmProducto = $("vmProducto");
const vmCant = $("vmCant");
const vmPrecio = $("vmPrecio");
const vmNota = $("vmNota");
const vmGuardar = $("vmGuardar");

let rows = [];
let editingId = null;
const estadoLabels = {
  en_revision: "En revisión",
  vendido: "Vendido",
  no_vendido: "No vendido",
  cancelado: "Cancelado",
};

function esc(s){
  return String(s ?? "")
    .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
    .replaceAll('"',"&quot;").replaceAll("'","&#039;");
}
function money(n){
  const v = Number(n);
  if (!Number.isFinite(v)) return "$0";
  return v.toLocaleString("es-AR",{style:"currency",currency:"ARS"});
}
function labelEstado(estado){ return estadoLabels[estado] || estado || "—"; }
function getPrecioPedido(p){ return p.producto_precio ?? p.precio_final ?? p.precio ?? p.total ?? null; }
function toISOStart(d){ return new Date(d + "T00:00:00").toISOString(); }
function toISOEnd(d){ return new Date(d + "T23:59:59").toISOString(); }

function setDefaultDates(){
  const today = new Date();
  const todayStr = today.toISOString().slice(0,10);
  const start = new Date(today);
  start.setDate(today.getDate() - 29);
  desde.value = start.toISOString().slice(0,10);
  hasta.value = todayStr;
}

function openModalPedido(p){
  editingId = p.id;

  overlay.style.display = "flex";
  overlay.setAttribute("aria-hidden","false");

  mTitle.textContent = `Pedido #${p.id}`;
  const d = new Date(p.created_at || p.fecha || Date.now());
  mSub.textContent = `Creado: ${d.toLocaleString("es-AR")} · Origen: ${p.origen || p.canal || "—"}`;

  mEstado.value = p.estado || "en_revision";
  mProducto.value = p.producto_titulo || "";
  mCliente.value = p.cliente_nombre || "";
  mTel.value = p.cliente_telefono || "";
  mCant.value = p.cantidad ?? 1;
  mPrecio.value = getPrecioPedido(p) ?? "";
  mNota.value = p.nota || p.mensaje || "";

  mHint.textContent = `Si marcás “Vendido” + cantidad/precio, se crea una venta y entra en contabilidad.`;

  // TRACKING (no afecta lógica)
  trackEvent("pedido_abierto", { pedido_id: p.id, estado: p.estado || null }, p.producto_id ?? null, p.canal || "admin");
}

function closeModalPedido(){
  overlay.style.display = "none";
  overlay.setAttribute("aria-hidden","true");
  editingId = null;
}

function openModalManual(){
  overlayManual.style.display = "flex";
  overlayManual.setAttribute("aria-hidden","false");
  vmProducto.value = "";
  vmCant.value = 1;
  vmPrecio.value = "";
  vmNota.value = "";
}
function closeModalManual(){
  overlayManual.style.display = "none";
  overlayManual.setAttribute("aria-hidden","true");
}

mClose.addEventListener("click", closeModalPedido);
overlay.addEventListener("click", (e)=>{ if(e.target === overlay) closeModalPedido(); });

mCloseManual.addEventListener("click", closeModalManual);
overlayManual.addEventListener("click", (e)=>{ if(e.target === overlayManual) closeModalManual(); });

btnVentaManual.addEventListener("click", openModalManual);

async function load(){
  try{
    const term = (q.value || "").trim().toLowerCase();
    const estado = fEstado.value;

    let query = sb.from("pedidos")
      .select("*")
      .gte("created_at", toISOStart(desde.value))
      .lte("created_at", toISOEnd(hasta.value))
      .order("id",{ascending:false});

    if (estado) query = query.eq("estado", estado);

    const { data, error } = await query;
    if (error) throw error;

    rows = (data || []);

    if (term){
      rows = rows.filter(p =>
        String(p.producto_titulo||"").toLowerCase().includes(term) ||
        String(p.cliente_nombre||"").toLowerCase().includes(term) ||
        String(p.cliente_telefono||"").toLowerCase().includes(term) ||
        String(p.nota||"").toLowerCase().includes(term) ||
        String(p.mensaje||"").toLowerCase().includes(term) ||
        String(p.origen||"").toLowerCase().includes(term) ||
        String(p.estado||"").toLowerCase().includes(term)
      );
    }

    render();
  } catch (e){
    console.error(e);
    tabla.innerHTML = `<tr><td style="opacity:.8">Error cargando pedidos. Mirá consola (F12).</td></tr>`;
    count.textContent = "—";
  }
}

function render(){
  count.textContent = `${rows.length} consulta(s)`;

  const head = `
    <tr>
      <th>Fecha</th>
      <th>Producto</th>
      <th>Precio</th>
      <th>Estado</th>
      <th>Origen</th>
      <th>Acciones</th>
    </tr>
  `;

  const body = rows.map(p=>{
    const d = new Date(p.created_at || Date.now());
    const fecha = d.toLocaleString("es-AR",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"});
    const precio = getPrecioPedido(p);
    return `
      <tr>
        <td>${fecha}</td>
        <td>${esc(p.producto_titulo || `Producto ${p.producto_id ?? "—"}`)}</td>
        <td><strong>${precio != null ? money(precio) : "—"}</strong></td>
        <td><span class="tag tag-${esc(p.estado || "")}">${esc(labelEstado(p.estado))}</span></td>
        <td>${esc(p.origen || p.canal || "—")}</td>
        <td>
          <button class="btn btnMini primary" data-act="estado" data-estado="vendido" data-id="${p.id}">Marcar como vendido</button>
          <button class="btn btnMini" data-act="estado" data-estado="no_vendido" data-id="${p.id}">Marcar como no vendido</button>
          <button class="btn btnMini" data-act="estado" data-estado="cancelado" data-id="${p.id}">Marcar como cancelado</button>
          <button class="btn btnMini bad" data-act="delete" data-id="${p.id}">Eliminar</button>
        </td>
      </tr>
    `;
  }).join("");

  tabla.innerHTML = head + body;

  tabla.querySelectorAll("button[data-act]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const id = Number(btn.dataset.id);
      const p = rows.find(x=>x.id===id);
      if (!p) return;

      if (btn.dataset.act === "estado") updateEstado(id, btn.dataset.estado);
      if (btn.dataset.act === "delete") deletePedido(id);
    });
  });
}

async function updateEstado(id, estado){
  try{
    const { error } = await sb.from("pedidos").update({ estado }).eq("id", id);
    if (error) throw error;
    if (fEstado.value && fEstado.value !== estado) {
      rows = rows.filter(x=>x.id!==id);
    } else {
      const p = rows.find(x=>x.id===id);
      if (p) p.estado = estado;
    }
    render();
    trackEvent("pedido_estado", { pedido_id: id, estado }, null, "admin");
  } catch (e){
    console.error(e);
    console.warn(e.message || "Error actualizando estado");
  }
}

async function deletePedido(id){
  console.warn("Eliminación legacy cancelada. Usá el panel MVC con modal BIANTI.");
}

async function savePedidoBasic(){
  if (!editingId) return;

  const patch = {
    estado: mEstado.value,
    producto_titulo: mProducto.value.trim() || null,
    cliente_nombre: mCliente.value.trim() || null,
    cliente_telefono: mTel.value.trim() || null,
    cantidad: Number(mCant.value || 1),
    precio_final: (mPrecio.value === "" ? null : Number(mPrecio.value)),
    nota: mNota.value.trim() || null,
    mensaje: mNota.value.trim() || null,
  };

  const { error } = await sb.from("pedidos").update(patch).eq("id", editingId);
  if (error) throw error;

  // TRACKING
  trackEvent("pedido_editado", { pedido_id: editingId, estado: patch.estado }, null, "admin");
}

async function registrarVentaDesdePedido(pedidoId){
  // 1) Traigo pedido fresco
  const { data: pArr, error: e1 } = await sb.from("pedidos").select("*").eq("id", pedidoId).limit(1);
  if (e1) throw e1;
  const p = pArr?.[0];
  if (!p) throw new Error("Pedido no encontrado");

  const cantidad = Number(mCant.value || p.cantidad || 1) || 1;
  const precio = Number(mPrecio.value || p.precio_final || 0) || 0;
  if (precio <= 0) throw new Error("Poné un precio_final válido para vender.");

  const total = precio * cantidad;

  // 2) Update pedido a vendido + totals
  const { error: e2 } = await sb.from("pedidos").update({
    estado: "vendido",
    cantidad,
    precio_final: precio,
    total,
    producto_titulo: mProducto.value.trim() || p.producto_titulo || null,
    cliente_nombre: mCliente.value.trim() || p.cliente_nombre || null,
    cliente_telefono: mTel.value.trim() || p.cliente_telefono || null,
    nota: mNota.value.trim() || p.nota || null,
  }).eq("id", pedidoId);
  if (e2) throw e2;

  // 3) Insert venta (para contabilidad)
  if (p.producto_id != null){
    const insVenta = await sb.from("ventas").insert([{
      producto_id: p.producto_id,
      cantidad,
      precio: precio,
      total,
      fecha: new Date().toISOString(),
      nota: `Pedido #${pedidoId}${mNota.value?.trim() ? " · " + mNota.value.trim() : ""}`
    }]);
    if (insVenta.error){
      const insVenta2 = await sb.from("ventas").insert([{
        producto_id: p.producto_id,
        cantidad,
        precio_final: precio,
        total,
        fecha: new Date().toISOString(),
        nota: `Pedido #${pedidoId}${mNota.value?.trim() ? " · " + mNota.value.trim() : ""}`
      }]);
      if (insVenta2.error) throw insVenta.error;
    }
  } else {
    const { error: e3 } = await sb.from("ventas_manuales").insert([{
      producto_titulo: mProducto.value.trim() || p.producto_titulo || `Pedido #${pedidoId}`,
      cantidad,
      precio_final: precio,
      total,
      fecha: new Date().toISOString(),
      nota: `Venta desde pedido sin producto_id #${pedidoId}${mNota.value?.trim() ? " · " + mNota.value.trim() : ""}`
    }]);
    if (e3) throw e3;
  }

  // TRACKING (acá sí vale oro)
  trackEvent("pedido_vendido", {
    pedido_id: pedidoId,
    producto_id: p.producto_id ?? null,
    cantidad,
    precio_final: precio,
    total
  }, p.producto_id ?? null, p.canal || "admin");
}

mSave.addEventListener("click", async ()=>{
  try{
    await savePedidoBasic();
    closeModalPedido();
    await load();
  } catch (e){
    console.error(e);
    console.warn(e.message || "Error guardando pedido");
  }
});

mVender.addEventListener("click", async ()=>{
  try{
    if (!editingId) return;
    await registrarVentaDesdePedido(editingId);
    closeModalPedido();
    await load();
    console.info("Vendido y registrado en ventas (impacta en contabilidad).");
  } catch (e){
    console.error(e);
    console.warn(e.message || "Error vendiendo");
  }
});

mDelete.addEventListener("click", async ()=>{
  console.warn("Eliminación legacy cancelada. Usá el panel MVC con modal BIANTI.");
});

// Venta manual
vmGuardar.addEventListener("click", async ()=>{
  try{
    const titulo = vmProducto.value.trim();
    const cant = Number(vmCant.value || 1) || 1;
    const precio = Number(vmPrecio.value || 0) || 0;
    if (!titulo) throw new Error("Poné un nombre de producto.");
    if (precio <= 0) throw new Error("Poné un precio válido.");

    const total = precio * cant;

    const { error } = await sb.from("ventas_manuales").insert([{
      producto_titulo: titulo,
      cantidad: cant,
      precio_final: precio,
      total,
      fecha: new Date().toISOString(),
      nota: vmNota.value.trim() || null
    }]);

    if (error) throw error;

    // TRACKING
    trackEvent("venta_manual", { producto_titulo: titulo, cantidad: cant, precio_final: precio, total }, null, "manual");

    closeModalManual();
    console.info("Venta manual guardada (impacta en contabilidad).");
  } catch (e){
    console.error(e);
    console.warn(e.message || "Error guardando venta manual");
  }
});

btnReload.addEventListener("click", load);
q.addEventListener("input", load);
fEstado.addEventListener("change", load);

setDefaultDates();
load();
