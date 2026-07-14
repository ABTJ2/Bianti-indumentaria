(function () {
  window.BiantiAdminModules = window.BiantiAdminModules || {};
  window.BiantiAdminModules.productos = { init };

  // Estado
  let ctx, H;
  let page = 1;
  let modoEliminacionMasiva = false;
  const selectedProductIds = new Set();

  // Inicialización
  async function init(context) {
    ctx = context;
    H = ctx.helpers;
    page = 1;
    modoEliminacionMasiva = false;
    selectedProductIds.clear();
    await H.loadCore(ctx);
    ctx.state.productos = deduplicarProductosPorId(ctx.state.productos);
    fillFilters();
    bind();
    draw();
  }

  // Referencias UI y eventos
  function fillFilters() {
    document.getElementById("prodCat").innerHTML += ctx.state.categorias.map((c) => `<option value="${H.html(c.id)}">${H.html(c.nombre)}</option>`).join("");
  }

  function bind() {
    ["prodQ", "prodCat", "prodVisible", "prodAvail", "prodStock", "prodMin", "prodMax", "prodPageSize"].forEach((id) => document.getElementById(id).addEventListener("input", () => { page = 1; draw(); }));
    document.getElementById("prodClear").addEventListener("click", () => { ["prodQ", "prodCat", "prodVisible", "prodAvail", "prodStock", "prodMin", "prodMax"].forEach((id) => document.getElementById(id).value = ""); page = 1; draw(); });
    document.getElementById("prodPrev").addEventListener("click", () => { page = Math.max(1, page - 1); draw(); });
    document.getElementById("prodNext").addEventListener("click", () => { page += 1; draw(); });
    document.getElementById("newProduct").addEventListener("click", () => edit(null));
    document.getElementById("bulkDeleteMode").addEventListener("click", enterBulkMode);
    document.getElementById("prodSelectAllResults").addEventListener("click", selectAllFiltered);
    document.getElementById("prodBulkClear").addEventListener("click", () => { selectedProductIds.clear(); draw(); });
    document.getElementById("prodBulkCancel").addEventListener("click", exitBulkMode);
    document.getElementById("prodDeleteSelected").addEventListener("click", removeSelected);
    document.getElementById("prodMasterCheck").addEventListener("change", (event) => toggleVisibleSelection(event.currentTarget.checked));
  }

  // Normalización y validaciones
  function deduplicarProductosPorId(productos) {
    const map = new Map();
    (productos || []).forEach((product) => { if (product?.id != null && !map.has(String(product.id))) map.set(String(product.id), product); });
    return Array.from(map.values());
  }

  function stockValue(p) { const n = Number(p?.stock_actual); return Number.isInteger(n) && n >= 0 ? n : null; }
  function minStockValue(p) { const n = Number(p?.stock_minimo); return Number.isInteger(n) && n >= 0 ? n : 0; }
  function validNonNegativeInteger(value) { const n = Number(value); return Number.isInteger(n) && n >= 0 ? n : null; }

  function filteredRows() {
    const q = document.getElementById("prodQ").value.trim().toLowerCase();
    const cat = document.getElementById("prodCat").value;
    const vis = document.getElementById("prodVisible").value;
    const av = document.getElementById("prodAvail").value;
    const stock = document.getElementById("prodStock").value;
    const min = H.numOrNull(document.getElementById("prodMin").value);
    const max = H.numOrNull(document.getElementById("prodMax").value);
    return deduplicarProductosPorId(ctx.state.productos).filter((p) => {
      const currentStock = stockValue(p);
      return (!q || `${p.id} ${p.titulo || ""}`.toLowerCase().includes(q))
        && (!cat || H.catsOf(ctx, p.id).includes(cat))
        && (vis === "" || String(p.visible !== false ? 1 : 0) === vis)
        && (av === "" || String(p.disponible !== false ? 1 : 0) === av)
        && (stock === "" || (stock === "con" && currentStock != null && currentStock > 0) || (stock === "sin" && currentStock === 0) || (stock === "bajo" && currentStock != null && currentStock <= minStockValue(p)))
        && (min == null || Number(p.precio || 0) >= min)
        && (max == null || Number(p.precio || 0) <= max);
    });
  }

  function hasActiveFilters() {
    return ["prodQ", "prodCat", "prodVisible", "prodAvail", "prodStock", "prodMin", "prodMax"].some((id) => document.getElementById(id).value !== "");
  }

  function currentPage(rows) {
    const size = Number(document.getElementById("prodPageSize").value || 25);
    const totalPages = Math.max(1, Math.ceil(rows.length / size));
    page = Math.min(page, totalPages);
    const start = rows.length ? (page - 1) * size + 1 : 0;
    const end = Math.min(page * size, rows.length);
    return { chunk: rows.slice((page - 1) * size, page * size), totalPages, start, end };
  }

  // Renderizado
  function draw() {
    ctx.state.productos = deduplicarProductosPorId(ctx.state.productos);
    const totalGeneral = ctx.state.productos.length;
    const rows = filteredRows();
    const { chunk, totalPages, start, end } = currentPage(rows);
    const colspan = modoEliminacionMasiva ? 11 : 10;
    document.getElementById("prodRows").innerHTML = chunk.map(row).join("") || `<tr><td colspan="${colspan}">${H.empty("Sin productos para los filtros seleccionados.")}</td></tr>`;
    document.getElementById("prodCount").textContent = hasActiveFilters() ? `${rows.length} resultados de ${totalGeneral} productos` : `${totalGeneral} productos`;
    document.getElementById("prodPageRange").textContent = `Mostrando ${start}${end ? `-${end}` : ""} de ${rows.length}`;
    document.getElementById("prodPageInfo").textContent = `Página ${page} de ${totalPages}`;
    document.getElementById("prodPrev").disabled = page <= 1;
    document.getElementById("prodNext").disabled = page >= totalPages;
    renderBulkState(chunk);
    bindRows(chunk);
  }

  function row(p) {
    const img = cover(p);
    const cats = H.catNames(ctx, p.id);
    const talles = H.tallesOf(ctx, p.id);
    const name = p.titulo || `Producto #${p.id}`;
    const description = p.descripcion || "";
    const selectCell = modoEliminacionMasiva ? `<td data-label="Seleccionar"><input type="checkbox" data-select-product value="${H.html(p.id)}" aria-label="Seleccionar ${H.html(name)}" ${selectedProductIds.has(String(p.id)) ? "checked" : ""}></td>` : "";
    return `<tr>
      ${selectCell}
      <td data-label="Foto">${img ? `<img class="thumbSmall" src="${H.html(img)}" alt="">` : `<div class="thumbBox">Sin foto</div>`}</td>
      <td data-label="ID">#${H.html(p.id)}</td>
      <td data-label="Nombre"><div class="rowTitle"><strong title="${H.html(name)}">${H.html(name)}</strong><small title="${H.html(description)}">${H.html(description.slice(0, 70))}</small></div></td>
      <td data-label="Categoría"><span class="cellEllipsis" title="${H.html(cats || "Sin categoría")}">${H.html(cats || "Sin categoría")}</span></td>
      <td data-label="Talles"><span class="chipList" title="${H.html(talles.join(", ") || "Sin talles")}">${tags(talles)}</span></td>
      <td data-label="Stock">${stockLabel(p)}</td>
      <td data-label="Precio">${H.money(p.precio)}</td>
      <td data-label="Visible">${stateTag(p.visible !== false, "Visible", "Oculto")}</td>
      <td data-label="Disponible">${stateTag(p.disponible !== false, "Disponible", "No disponible")}</td>
      <td class="actionsCell" data-label="Acciones"><div class="productActionsGrid"><button class="btn btnSmall" title="Editar producto" data-edit="${p.id}">Editar</button><button class="btn btnSmall ${p.visible !== false ? "btnStateOn" : "btnStateOff"}" data-toggle="visible" data-id="${p.id}">${p.visible !== false ? "Visible" : "Oculto"}</button><button class="btn btnSmall ${p.disponible !== false ? "btnStateOn" : "btnStateOff"}" data-toggle="disponible" data-id="${p.id}">${p.disponible !== false ? "Disponible" : "No disp."}</button><button class="btn btnDanger btnSmall" title="Eliminar producto" data-delete="${p.id}">Eliminar</button></div></td>
    </tr>`;
  }

  function cover(p) { return p.portada_url || ctx.state.fotos.find((foto) => String(foto.producto_id) === String(p.id))?.url || ""; }
  function tags(values) { return values.length ? values.map((value) => `<span class="chip">${H.html(value)}</span>`).join("") : "-"; }
  function stateTag(ok, yes, no) { return `<span class="tag ${ok ? "tagOk" : "tagWarn"}">${ok ? yes : no}</span>`; }
  function stockLabel(p) {
    const value = stockValue(p);
    if (value == null) return `<span class="tag tagInfo">No configurado</span>`;
    const min = minStockValue(p);
    const low = value <= min;
    const text = value === 0 ? "Sin stock" : `${value} unidade${value === 1 ? "" : "s"}`;
    return `<span class="tag ${low ? "tagBad" : "tagOk"}" title="Stock mínimo: ${H.html(min)}">${H.html(text)}</span>`;
  }

  // Selección masiva
  function enterBulkMode() { modoEliminacionMasiva = true; selectedProductIds.clear(); draw(); }
  function exitBulkMode() { modoEliminacionMasiva = false; selectedProductIds.clear(); draw(); }
  function selectAllFiltered() { filteredRows().forEach((p) => selectedProductIds.add(String(p.id))); draw(); }
  function toggleVisibleSelection(checked) { currentPage(filteredRows()).chunk.forEach((p) => checked ? selectedProductIds.add(String(p.id)) : selectedProductIds.delete(String(p.id))); draw(); }

  function renderBulkState(chunk) {
    const bulkBar = document.getElementById("prodBulkBar");
    const master = document.getElementById("prodMasterCheck");
    document.querySelectorAll(".bulkOnly").forEach((el) => el.classList.toggle("hidden", !modoEliminacionMasiva));
    bulkBar.classList.toggle("hidden", !modoEliminacionMasiva);
    document.getElementById("bulkDeleteMode").disabled = modoEliminacionMasiva;
    document.getElementById("prodSelectedCount").textContent = `${selectedProductIds.size} producto${selectedProductIds.size === 1 ? "" : "s"} seleccionado${selectedProductIds.size === 1 ? "" : "s"}`;
    document.getElementById("prodDeleteSelected").disabled = selectedProductIds.size === 0;
    const pageIds = chunk.map((p) => String(p.id));
    const pageSelected = pageIds.filter((id) => selectedProductIds.has(id)).length;
    master.checked = modoEliminacionMasiva && pageIds.length > 0 && pageSelected === pageIds.length;
    master.indeterminate = modoEliminacionMasiva && pageSelected > 0 && pageSelected < pageIds.length;
  }

  function bindRows(chunk) {
    document.querySelectorAll("[data-edit]").forEach((b) => b.addEventListener("click", () => edit(ctx.state.productos.find((p) => String(p.id) === String(b.dataset.edit)))));
    document.querySelectorAll("[data-toggle]").forEach((b) => b.addEventListener("click", () => toggle(b.dataset.id, b.dataset.toggle)));
    document.querySelectorAll("[data-delete]").forEach((b) => b.addEventListener("click", () => removeOne(b.dataset.delete)));
    if (!modoEliminacionMasiva) return;
    document.querySelectorAll("[data-select-product]").forEach((input) => input.addEventListener("change", () => { input.checked ? selectedProductIds.add(String(input.value)) : selectedProductIds.delete(String(input.value)); renderBulkState(chunk); }));
  }

  // CRUD
  function edit(product) {
    const selectedCats = new Set(product ? H.catsOf(ctx, product.id) : []);
    const selectedTalles = product ? H.tallesOf(ctx, product.id).join(", ") : "";
    document.getElementById("productFormHost").innerHTML = `<div class="panel"><h2>${product ? "Editar" : "Crear"} producto</h2><form class="fieldGrid" id="productForm"><label><span class="label">Título</span><input class="input" name="titulo" required value="${H.html(product?.titulo || "")}"></label><label><span class="label">Precio venta</span><input class="input" name="precio" type="number" step="0.01" value="${H.html(product?.precio || "")}"></label><label><span class="label">Precio costo</span><input class="input" name="precio_costo" type="number" step="0.01" value="${H.html(product?.precio_costo || "")}"></label><label><span class="label">Stock actual</span><input class="input" name="stock_actual" type="number" min="0" step="1" inputmode="numeric" value="${H.html(stockValue(product) ?? 0)}"></label><label><span class="label">Stock mínimo</span><input class="input" name="stock_minimo" type="number" min="0" step="1" inputmode="numeric" value="${H.html(minStockValue(product))}"></label><label><span class="label">Talles</span><input class="input" name="talles" placeholder="S, M, L" value="${H.html(selectedTalles)}"></label><label class="fieldSpan"><span class="label">Descripción</span><textarea class="textarea" name="descripcion">${H.html(product?.descripcion || "")}</textarea></label><label><span class="label">Portada</span><input class="input" name="foto" type="file" accept="image/*"></label><label class="checkLine"><input name="visible" type="checkbox" ${product?.visible !== false ? "checked" : ""}> Visible</label><label class="checkLine"><input name="disponible" type="checkbox" ${product?.disponible !== false ? "checked" : ""}> Disponible</label><div class="fieldSpan"><span class="label">Categorías</span><div class="checkGrid">${ctx.state.categorias.map((c) => `<label class="checkLine"><input type="checkbox" name="categoria" value="${H.html(c.id)}" ${selectedCats.has(String(c.id)) ? "checked" : ""}> ${H.html(c.nombre)}</label>`).join("")}</div></div><div class="actionsRow fieldSpan"><button class="btn btnPrimary" type="submit">Guardar</button><button class="btn" type="button" id="cancelProductForm">Cancelar</button></div></form><div class="status hidden" id="productFormStatus"></div></div>`;
    document.getElementById("cancelProductForm").addEventListener("click", () => document.getElementById("productFormHost").innerHTML = "");
    document.getElementById("productForm").addEventListener("submit", (event) => save(event, product));
  }

  async function save(event, product) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const stock = validNonNegativeInteger(form.get("stock_actual"));
    const stockMinimo = validNonNegativeInteger(form.get("stock_minimo"));
    if (stock == null) { box("productFormStatus", "El stock actual debe ser un número entero mayor o igual a 0.", "error"); return; }
    if (stockMinimo == null) { box("productFormStatus", "El stock mínimo debe ser un número entero mayor o igual a 0.", "error"); return; }
    let portadaUrl = product?.portada_url || null;
    const file = form.get("foto");
    try {
      if (file && file.size) portadaUrl = await H.uploadProductImage(ctx, file, product?.id || "nuevo");
      const payload = { titulo: form.get("titulo").trim(), descripcion: form.get("descripcion").trim() || null, precio: H.numOrNull(form.get("precio")), precio_costo: H.numOrNull(form.get("precio_costo")), stock_actual: stock, stock_minimo: stockMinimo, visible: form.get("visible") === "on", disponible: form.get("disponible") === "on", portada_url: portadaUrl };
      let id = product?.id;
      if (id) { const { error } = await ctx.sb.from("productos").update(payload).eq("id", id); if (error) throw error; } else { const { data, error } = await ctx.sb.from("productos").insert(payload).select("id").single(); if (error) throw error; id = data.id; }
      await syncRelations(id, [...event.currentTarget.querySelectorAll("input[name=categoria]:checked")].map((x) => x.value), String(form.get("talles") || "").split(",").map((x) => x.trim()).filter(Boolean));
      ctx.ui.toast("Producto guardado", "ok");
      document.getElementById("productFormHost").innerHTML = "";
      await H.loadCore(ctx);
      draw();
    } catch (error) { box("productFormStatus", H.showRlsError(error), "error"); }
  }

  async function syncRelations(productId, cats, sizes) { await ctx.sb.from("producto_categorias").delete().eq("producto_id", productId); if (cats.length) { const { error } = await ctx.sb.from("producto_categorias").insert(cats.map((categoria_id) => ({ producto_id: productId, categoria_id }))); if (error) throw error; } await ctx.sb.from("producto_talles").delete().eq("producto_id", productId); if (sizes.length) { const { error } = await ctx.sb.from("producto_talles").insert(sizes.map((talle) => ({ producto_id: productId, talle }))); if (error) throw error; } }
  async function toggle(id, field) { try { const p = ctx.state.productos.find((x) => String(x.id) === String(id)); const { error } = await ctx.sb.from("productos").update({ [field]: !(p[field] !== false) }).eq("id", id); if (error) throw error; await H.loadCore(ctx); draw(); } catch (error) { ctx.ui.notice("No se pudo actualizar", H.showRlsError(error), { danger: true }); } }
  async function removeOne(id) { selectedProductIds.clear(); selectedProductIds.add(String(id)); await removeSelected(false); }

  // Eliminación
  async function removeSelected(fromBulk = true) {
    const ids = [...selectedProductIds];
    if (!ids.length) return;
    const preview = await previewDeletion(ids);
    const completed = await deletionModal(preview, ids, fromBulk);
    if (!completed && !fromBulk) selectedProductIds.clear();
  }

  async function executeDeletion(ids, preview, fromBulk) {
    try {
      const { data, error } = await ctx.sb.rpc("eliminar_productos_masivo", { p_token: sessionStorage.getItem("bianti_admin_token"), p_producto_ids: ids, p_modo: "total" });
      if (error) throw error;
      H.setOffers(H.getOffers().filter((o) => !ids.includes(String(o.producto_id))));
      const pendingCount = await removeStoragePaths(data?.storage_paths || preview.storage_paths || []);
      selectedProductIds.clear();
      modoEliminacionMasiva = false;
      await Promise.all([H.loadCore(ctx), H.loadPedidos(ctx), H.loadEventos(ctx), H.loadVentas(ctx)]);
      ctx.state.productos = deduplicarProductosPorId(ctx.state.productos);
      ctx.ui.toast(pendingCount ? `Los productos fueron eliminados, pero quedaron ${pendingCount} archivos pendientes de limpieza.` : "Los productos y sus datos relacionados fueron eliminados.", pendingCount ? "error" : "ok");
      draw();
      return { ok: true };
    } catch (error) {
      console.error(error);
      return { ok: false, message: H.showRlsError(error) };
    }
  }

  async function previewDeletion(ids) {
    try {
      const { data, error } = await ctx.sb.rpc("previsualizar_eliminacion_productos_masiva", { p_token: sessionStorage.getItem("bianti_admin_token"), p_producto_ids: ids });
      if (error) throw error;
      return normalizePreview(data, ids);
    } catch (error) {
      console.warn(error?.message || error);
      return localPreview(ids);
    }
  }

  function normalizePreview(data, ids) {
    const products = ctx.state.productos.filter((p) => ids.includes(String(p.id)));
    return { products, cantidad_productos: Number(data?.cantidad_productos ?? products.length), fotos: Number(data?.fotos ?? 0), talles: Number(data?.talles ?? 0), categorias: Number(data?.categorias ?? 0), variantes: Number(data?.variantes ?? 0), eventos: Number(data?.eventos ?? 0), vistas: Number(data?.vistas ?? 0), clicks: Number(data?.clicks ?? 0), pedidos: Number(data?.pedidos ?? 0), pedido_items: Number(data?.pedido_items ?? 0), ventas: Number(data?.ventas ?? 0), ventas_manuales: Number(data?.ventas_manuales ?? 0), unidades_vendidas: Number(data?.unidades_vendidas ?? 0), importe_ventas: Number(data?.importe_ventas ?? 0), storage_paths: data?.storage_paths || [] };
  }

  async function localPreview(ids) {
    const products = ctx.state.productos.filter((p) => ids.includes(String(p.id)));
    const [variantes, pedidos, pedidoItems, ventas, ventasManuales] = await Promise.all([
      H.safeQuery("variantes vinculadas", ctx.sb.from("variantes").select("id,producto_id").in("producto_id", ids)),
      H.safeQuery("pedidos vinculados", ctx.sb.from("pedidos").select("id,estado,producto_id").in("producto_id", ids)),
      H.safeQuery("items vinculados", ctx.sb.from("pedido_items").select("id,producto_id").in("producto_id", ids)),
      H.safeQuery("ventas vinculadas", ctx.sb.from("ventas").select("id,producto_id,cantidad,total,precio").in("producto_id", ids)),
      H.safeQuery("ventas manuales vinculadas", ctx.sb.from("ventas_manuales").select("id,producto_id,cantidad,total,precio_final").in("producto_id", ids))
    ]);
    await H.loadEventos(ctx);
    const fotos = ctx.state.fotos.filter((foto) => ids.includes(String(foto.producto_id)));
    const talles = ctx.state.talles.filter((t) => ids.includes(String(t.producto_id)));
    const rels = ctx.state.rels.filter((r) => ids.includes(String(r.producto_id)));
    const eventos = ctx.state.eventos.filter((event) => ids.includes(String(H.eventProductId(event))));
    const ventasRows = [...ventas, ...ventasManuales];
    const importe = ventasRows.reduce((acc, row) => acc + Number(row.total ?? Number(row.precio || row.precio_final || 0) * Number(row.cantidad || 1)), 0);
    const unidades = ventasRows.reduce((acc, row) => acc + Number(row.cantidad || 0), 0);
    return { products, cantidad_productos: products.length, fotos: fotos.length, talles: talles.length, categorias: rels.length, variantes: variantes.length, eventos: eventos.length, vistas: eventos.filter((e) => String(e.type || "").includes("view") || String(e.type || "").includes("visto")).length, clicks: eventos.filter((e) => String(e.type || "").includes("whatsapp")).length, pedidos: pedidos.length, pedido_items: pedidoItems.length, ventas: ventas.length, ventas_manuales: ventasManuales.length, unidades_vendidas: unidades, importe_ventas: importe, storage_paths: [...fotos.map((f) => f.url), ...products.map((p) => p.portada_url)].filter(Boolean) };
  }

  function deletionModal(preview, ids, fromBulk) {
    return new Promise((resolve) => {
      const returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : document.getElementById("prodDeleteSelected");
      const overlay = document.createElement("div");
      overlay.className = "bianti-modal-overlay";
      overlay.innerHTML = `<div class="bianti-modal deleteModal" role="dialog" aria-modal="true" aria-labelledby="deleteModalTitle" aria-describedby="deleteModalDescription"><div class="deleteModalHead"><div class="modal-brand"><img src="../assets/img/logo.png" alt=""><strong>BIANTI INDUMENTARIA</strong></div><h2 id="deleteModalTitle" tabindex="-1">Eliminar productos seleccionados</h2><p id="deleteModalDescription">Revisá los productos y la información relacionada que se eliminará. Esta acción no se puede deshacer.</p></div><div class="modal-body deleteModalBody"><section class="deleteProductsBlock"><strong>Productos a eliminar</strong><div class="deleteProductsList">${selectedProductsHtml(preview.products)}</div>${extraProductsHtml(preview.products)}</section><section class="deleteImpactGrid">${impactHtml(preview)}</section>${emptyImpactHtml(preview)}<div class="deleteWarning"><strong>Advertencia</strong><p>Al eliminar estos productos también se eliminarán sus fotos, talles, relaciones, pedidos, ventas, métricas, vistas, clics y datos estadísticos relacionados. La contabilidad puede cambiar si existen ventas asociadas.</p><p>Esta acción no se puede deshacer.</p></div><label class="deleteAccept" for="deleteUnderstand"><input type="checkbox" id="deleteUnderstand"> <span>Entiendo que se eliminarán definitivamente estos productos y toda su información relacionada.</span></label><div class="status error hidden" id="deleteModalError"></div></div><div class="modal-actions deleteModalActions"><button class="btn btn-outline" type="button" data-cancel>Cancelar</button><button class="btn btnDanger" type="button" data-ok disabled>Eliminar de todos modos</button></div></div>`;
      const ok = overlay.querySelector("[data-ok]");
      const cancel = overlay.querySelector("[data-cancel]");
      let processing = false;
      const focusable = () => [...overlay.querySelectorAll('button, [href], input, select, textarea, details summary, [tabindex]:not([tabindex="-1"])')].filter((el) => !el.disabled && el.offsetParent !== null);
      const checkReady = () => { ok.disabled = processing || !overlay.querySelector("#deleteUnderstand").checked; };
      const close = (value) => { document.removeEventListener("keydown", onKey); overlay.remove(); returnFocus?.focus?.(); resolve(value); };
      const setProcessing = (value) => { processing = value; ok.disabled = true; cancel.disabled = value; ok.innerHTML = value ? `<span class="btnSpinner" aria-hidden="true"></span>Eliminando...` : "Eliminar de todos modos"; overlay.querySelector(".deleteModal").classList.toggle("is-processing", value); };
      const showError = (message) => { const el = overlay.querySelector("#deleteModalError"); el.textContent = message || "No se pudo eliminar. Intentá nuevamente."; el.classList.remove("hidden"); };
      const onKey = (event) => {
        if (event.key === "Escape" && !processing) close(false);
        if (event.key !== "Tab") return;
        const nodes = focusable();
        if (!nodes.length) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      };
      overlay.addEventListener("change", checkReady);
      overlay.addEventListener("click", async (event) => {
        if (!processing && (event.target === overlay || event.target.closest("[data-cancel]"))) close(false);
        if (!event.target.closest("[data-ok]") || ok.disabled || processing) return;
        setProcessing(true);
        const result = await executeDeletion(ids, preview, fromBulk);
        if (result.ok) close(true);
        else { setProcessing(false); showError(result.message); checkReady(); }
      });
      document.addEventListener("keydown", onKey);
      document.body.appendChild(overlay);
      overlay.querySelector("#deleteModalTitle").focus();
    });
  }

  function selectedProductsHtml(products) {
    return products.slice(0, 5).map(productSummary).join("");
  }

  function extraProductsHtml(products) {
    const extra = products.slice(5);
    if (!extra.length) return "";
    return `<details class="deleteProductsMore"><summary>Y ${extra.length} producto${extra.length === 1 ? "" : "s"} más · Ver todos los productos</summary><div class="deleteProductsList deleteProductsListAll">${extra.map(productSummary).join("")}</div></details>`;
  }

  function productSummary(p) {
    return `<div class="deleteProductRow">${cover(p) ? `<img class="thumbSmall" src="${H.html(cover(p))}" alt="">` : `<div class="thumbBox">Sin foto</div>`}<div><strong>${H.html(p.titulo || `Producto #${p.id}`)}</strong><small>ID ${H.html(p.id)} · ${H.html(primaryCatName(p.id))}</small></div></div>`;
  }

  function primaryCatName(productId) {
    return H.catNames(ctx, productId).split(",").map((name) => name.trim()).filter(Boolean)[0] || "Sin categoría";
  }

  function impactHtml(preview) {
    const items = [
      ["Productos", preview.cantidad_productos], ["Fotos", preview.fotos], ["Talles", preview.talles], ["Categorías relacionadas", preview.categorias], ["Variantes", preview.variantes], ["Pedidos", preview.pedidos], ["Ítems de pedidos", preview.pedido_items], ["Ventas", preview.ventas], ["Ventas manuales", preview.ventas_manuales], ["Unidades vendidas", preview.unidades_vendidas], ["Vistas", preview.vistas], ["Clics de WhatsApp", preview.clicks], ["Eventos o métricas", preview.eventos], ["Importe contable", H.money(preview.importe_ventas), preview.importe_ventas]
    ];
    return items.filter(([, value, raw]) => Number(raw ?? value) !== 0).map(([label, value]) => `<div class="deleteImpactItem"><span>${H.html(label)}</span><strong>${H.html(value)}</strong></div>`).join("");
  }

  function emptyImpactHtml(preview) {
    const notes = [];
    if (!preview.ventas && !preview.ventas_manuales) notes.push("Sin ventas relacionadas");
    if (!preview.pedidos && !preview.pedido_items) notes.push("Sin pedidos relacionados");
    return notes.length ? `<div class="deleteEmptyImpact">${notes.map((note) => `<span>${H.html(note)}</span>`).join("")}</div>` : "";
  }

  async function removeStoragePaths(paths) {
    const clean = [...new Set((paths || []).map(storagePath).filter(Boolean))];
    if (!clean.length) return 0;
    const { error } = await ctx.sb.storage.from("productos").remove(clean);
    if (!error) return 0;
    const pending = JSON.parse(localStorage.getItem("bianti_storage_pendiente") || "[]");
    localStorage.setItem("bianti_storage_pendiente", JSON.stringify([...new Set([...pending, ...clean])]));
    return clean.length;
  }

  function storagePath(value) {
    const text = String(value || "").trim();
    if (!text) return "";
    const marker = "/storage/v1/object/public/productos/";
    if (text.includes(marker)) return decodeURIComponent(text.split(marker)[1].split("?")[0]);
    return text.includes("/") && !text.startsWith("http") ? text : "";
  }

  function box(id, message, type) { const el = document.getElementById(id); el.textContent = message; el.className = `status ${type}`; el.classList.remove("hidden"); }
})();
