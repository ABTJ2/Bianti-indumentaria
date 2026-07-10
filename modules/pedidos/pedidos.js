(function () {
  window.BiantiAdminModules = window.BiantiAdminModules || {};
  window.BiantiAdminModules.pedidos = { init };
  let ctx, H;

  async function init(context) {
    ctx = context;
    H = ctx.helpers;
    await Promise.all([H.loadCore(ctx), H.loadPedidos(ctx)]);
    ["pedidoQ", "pedidoEstado", "pedidoOrigen"].forEach((id) => document.getElementById(id).addEventListener("input", draw));
    document.getElementById("pedidoClear").addEventListener("click", () => { document.getElementById("pedidoQ").value = ""; document.getElementById("pedidoEstado").value = ""; document.getElementById("pedidoOrigen").value = ""; draw(); });
    draw();
  }

  function draw() {
    const q = document.getElementById("pedidoQ").value.toLowerCase();
    const estado = document.getElementById("pedidoEstado").value;
    const origen = document.getElementById("pedidoOrigen").value.toLowerCase();
    const rows = ctx.state.pedidos.filter((p) => {
      const haystack = `${p.producto_titulo || ""} ${H.titleOf(ctx, p.producto_id)} ${p.cliente_nombre || ""} ${p.cliente_telefono || ""} ${p.mensaje || ""} ${p.nota || ""} ${p.origen || ""} ${p.canal || ""}`.toLowerCase();
      return (!estado || p.estado === estado) && (!q || haystack.includes(q)) && (!origen || String(p.origen || p.canal || "").toLowerCase().includes(origen));
    });
    document.getElementById("pedidoRows").innerHTML = rows.map(row).join("") || `<tr><td colspan="8">${H.empty("Todavía no hay consultas. Aparecerán cuando un cliente use WhatsApp desde un producto del catálogo.")}</td></tr>`;
    document.getElementById("pedidoCount").textContent = `${rows.length} consultas encontradas`;
    document.querySelectorAll("[data-state]").forEach((b) => b.addEventListener("click", () => updateState(b.dataset.id, b.dataset.state)));
    document.querySelectorAll("[data-delete]").forEach((b) => b.addEventListener("click", () => remove(b.dataset.delete)));
    document.querySelectorAll("[data-detail]").forEach((b) => b.addEventListener("click", () => detail(b.dataset.detail)));
  }

  function row(p) {
    const estado = p.estado || "en_revision";
    const contacto = p.cliente_nombre || p.cliente_telefono || "-";
    return `<tr>
      <td data-label="Producto"><div class="rowTitle"><strong>${H.html(p.producto_titulo || H.titleOf(ctx, p.producto_id))}</strong><small>ID ${H.html(p.producto_id || "-")}</small></div></td>
      <td data-label="Contacto">${H.html(contacto)}</td>
      <td data-label="Fecha">${H.dateTime(p.created_at || p.fecha)}</td>
      <td data-label="Mensaje">${H.html((p.mensaje || p.nota || "-").slice(0, 120))}</td>
      <td data-label="Origen">${H.html(p.origen || p.canal || "Catálogo")}</td>
      <td data-label="Total">${H.money(H.getPedidoTotal(p))}</td>
      <td data-label="Estado">${stateTag(estado)}</td>
      <td class="actionsCell" data-label="Acciones"><div class="actionsRow actionsRight"><button class="btn btnSmall" data-detail="${p.id}">Detalle</button><button class="btn btnPrimary btnSmall" data-state="vendido" data-id="${p.id}">Vendido</button><button class="btn btnSmall" data-state="no_vendido" data-id="${p.id}">No vendido</button><button class="btn btnSmall" data-state="cancelado" data-id="${p.id}">Cancelar</button><button class="btn btnDanger btnSmall" data-delete="${p.id}">Eliminar</button></div></td>
    </tr>`;
  }

  function stateTag(estado) {
    const labels = { en_revision: "En revisión", vendido: "Vendido", no_vendido: "No vendido", cancelado: "Cancelado" };
    const cls = estado === "vendido" ? "tagOk" : estado === "cancelado" || estado === "no_vendido" ? "tagBad" : "tagInfo";
    return `<span class="tag ${cls}">${labels[estado] || H.html(estado || "Sin estado")}</span>`;
  }

  function detail(id) { const p = ctx.state.pedidos.find((x) => String(x.id) === String(id)); ctx.ui.notice(`Consulta #${p.id}`, `${p.producto_titulo || H.titleOf(ctx, p.producto_id)}\nEstado: ${statePlain(p.estado)}\nContacto: ${p.cliente_nombre || p.cliente_telefono || "-"}\nMensaje: ${p.mensaje || p.nota || "Sin mensaje"}`); }
  function statePlain(estado) { return ({ en_revision: "En revisión", vendido: "Vendido", no_vendido: "No vendido", cancelado: "Cancelado" }[estado] || estado || "Sin estado"); }
  async function updateState(id, estado) { const { error } = await ctx.sb.from("pedidos").update({ estado }).eq("id", id); if (error) return ctx.ui.notice("No se pudo cambiar estado", H.showRlsError(error), { danger: true }); await H.loadPedidos(ctx); draw(); }
  async function remove(id) { if (!await ctx.ui.modal({ title: "Eliminar consulta", message: "Se eliminará esta consulta de WhatsApp. No se borran ventas históricas ni contabilidad.", confirmText: "Eliminar", danger: true })) return; const { error } = await ctx.sb.from("pedidos").delete().eq("id", id); if (error) return ctx.ui.notice("No se pudo eliminar", H.showRlsError(error), { danger: true }); await H.loadPedidos(ctx); draw(); }
})();
