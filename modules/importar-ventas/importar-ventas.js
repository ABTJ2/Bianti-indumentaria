(function () {
  window.BiantiAdminModules = window.BiantiAdminModules || {};
  window.BiantiAdminModules["importar-ventas"] = { init };
  let ctx, H;
  let parsedRows = [];
  let fileHash = "";

  async function init(context) {
    ctx = context;
    H = ctx.helpers;
    await Promise.all([H.loadCore(ctx), loadPapa()]);
    document.getElementById("downloadSalesTemplate").addEventListener("click", downloadTemplate);
    document.getElementById("previewSalesImport").addEventListener("click", preview);
    document.getElementById("clearSalesImport").addEventListener("click", clear);
    document.getElementById("confirmSalesImport").addEventListener("click", confirmImport);
  }

  async function loadPapa() { if (!window.Papa) await H.loadScript("https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js"); }
  function downloadTemplate() {
    const csv = "producto_id,nombre_producto,cantidad,precio_unitario,fecha,observacion,cliente,medio_pago\n130,Cancan piel negro,2,5000,13/07/2026,Venta local,,\n121,Mochila infantil Cappuccina con luces,1,18000,13/07/2026,,,\n";
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = "plantilla-importar-ventas-bianti.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function preview() {
    const file = document.getElementById("salesCsvFile").files[0];
    if (!file) { setStatus("Seleccioná un archivo CSV.", "error"); return; }
    try {
      fileHash = await sha256(file);
      const rows = await parseFile(file);
      parsedRows = rows.map((raw, index) => normalizeRow(raw, index + 2)).filter(Boolean);
      recomputeMatches();
      render();
      setStatus("Archivo leído. Revisá la vista previa antes de confirmar.", "");
    } catch (error) { setStatus(error.message || "No se pudo leer el CSV.", "error"); }
  }

  function parseFile(file) {
    return new Promise((resolve, reject) => {
      window.Papa.parse(file, { header: true, skipEmptyLines: true, delimitersToGuess: [",", ";"], transformHeader: canonHeader, complete: (result) => resolve(result.data || []), error: reject });
    });
  }

  function canonHeader(value) {
    const key = normalizeName(value).replace(/\s+/g, "_");
    const map = {
      producto: "nombre_producto", nombre: "nombre_producto", nombre_producto: "nombre_producto", articulo: "nombre_producto",
      producto_id: "producto_id", id_producto: "producto_id",
      cantidad: "cantidad", unidades: "cantidad", cantidad_vendida: "cantidad", unidades_vendidas: "cantidad",
      precio: "precio_unitario", precio_venta: "precio_unitario", precio_unitario: "precio_unitario", valor_unitario: "precio_unitario",
      fecha: "fecha", observacion: "observacion", cliente: "cliente", medio_pago: "medio_pago"
    };
    return map[key] || key;
  }

  function normalizeRow(raw, line) {
    const name = String(raw.nombre_producto || "").trim();
    const productoId = String(raw.producto_id || "").trim();
    const cantidad = parseInt(String(raw.cantidad || "").trim(), 10);
    const precio = parsePrice(raw.precio_unitario);
    return { line, raw, receivedName: name || productoId || "-", producto_id: productoId, selected_id: "", cantidad, precio, fecha: parseDate(raw.fecha), observacion: String(raw.observacion || "").trim(), cliente: String(raw.cliente || "").trim(), medio_pago: String(raw.medio_pago || "").trim(), ignored: false, status: "", statusClass: "", message: "" };
  }

  function recomputeMatches() {
    parsedRows.forEach((row) => {
      if (row.selected_id && productById(row.selected_id)) return;
      const match = findProduct(row);
      row.selected_id = match.autoId || "";
      row.suggested_id = match.suggestedId || "";
      row.status = match.status;
      row.statusClass = match.statusClass;
      row.message = match.message;
    });
    validateRows();
  }

  function findProduct(row) {
    if (row.producto_id) {
      const product = productById(row.producto_id);
      return product ? { autoId: product.id, status: "Coincidencia exacta", statusClass: "tagOk", message: "ID exacto" } : { status: "Producto no encontrado", statusClass: "tagBad", message: "No existe ese ID" };
    }
    const normalized = normalizeName(row.receivedName);
    if (!normalized) return { status: "Revisión necesaria", statusClass: "tagWarn", message: "Falta producto" };
    const exact = ctx.state.productos.filter((p) => normalizeName(p.titulo) === normalized);
    if (exact.length === 1) return { autoId: exact[0].id, status: "Coincidencia exacta", statusClass: "tagOk", message: "Nombre normalizado exacto" };
    if (exact.length > 1) return { status: "Revisión necesaria", statusClass: "tagWarn", message: "Nombre ambiguo" };
    const candidates = probableProducts(normalized);
    if (candidates.length === 1) return { suggestedId: candidates[0].id, status: "Coincidencia probable", statusClass: "tagInfo", message: "Sugerencia, requiere confirmar" };
    if (candidates.length > 1) return { status: "Revisión necesaria", statusClass: "tagWarn", message: "Coincidencias ambiguas" };
    return { status: "Producto no encontrado", statusClass: "tagBad", message: "Sin coincidencias" };
  }

  function probableProducts(normalized) {
    const terms = normalized.split(" ").filter((t) => t.length > 2);
    if (!terms.length) return [];
    return ctx.state.productos.map((p) => ({ p, n: normalizeName(p.titulo) })).filter(({ n }) => terms.every((term) => n.includes(term)) || n.includes(normalized) || normalized.includes(n)).map(({ p }) => p).slice(0, 6);
  }

  function validateRows() {
    const totals = new Map();
    parsedRows.filter((row) => !row.ignored && row.selected_id).forEach((row) => totals.set(String(row.selected_id), (totals.get(String(row.selected_id)) || 0) + Number(row.cantidad || 0)));
    parsedRows.forEach((row) => {
      if (row.ignored) return;
      const product = productById(row.selected_id);
      const stock = product ? stockValue(product) : null;
      const errors = [];
      if (!product) errors.push("producto existente");
      if (!Number.isInteger(row.cantidad) || row.cantidad <= 0) errors.push("cantidad entera mayor que 0");
      if (!Number.isFinite(row.precio) || row.precio <= 0) errors.push("precio mayor que 0");
      if (!row.fecha) errors.push("fecha válida");
      if (product && stock == null) errors.push("stock configurado");
      if (product && stock != null && totals.get(String(row.selected_id)) > stock) errors.push("stock suficiente");
      if (errors.length) { row.valid = false; row.validation = errors.join(", "); }
      else { row.valid = true; row.validation = "Lista para importar"; }
    });
  }

  function render() {
    validateRows();
    document.getElementById("salesImportRows").innerHTML = parsedRows.map(rowHtml).join("") || `<tr><td colspan="12">${H.empty("El CSV no tiene filas.")}</td></tr>`;
    document.getElementById("salesImportCount").textContent = `${parsedRows.length} filas previsualizadas`;
    document.getElementById("salesImportSummary").innerHTML = summaryHtml();
    document.getElementById("confirmSalesImport").disabled = !parsedRows.some((row) => row.valid && !row.ignored) || parsedRows.some((row) => !row.ignored && !row.valid);
    bindPreviewRows();
  }

  function rowHtml(row) {
    const product = productById(row.selected_id);
    const stock = product ? stockValue(product) : null;
    const resulting = stock == null ? "-" : stock - Number(row.cantidad || 0);
    const total = Number(row.cantidad || 0) * Number(row.precio || 0);
    const status = row.ignored ? `<span class="tag tagWarn">Ignorada</span>` : `<span class="tag ${row.valid ? row.statusClass || "tagOk" : "tagBad"}">${H.html(row.valid ? row.status : "Error")}</span><small>${H.html(row.valid ? row.message : row.validation)}</small>`;
    return `<tr class="${row.ignored ? "isIgnored" : ""}">
      <td data-label="Fila">${H.html(row.line)}</td>
      <td data-label="Nombre recibido"><span class="cellEllipsis" title="${H.html(row.receivedName)}">${H.html(row.receivedName)}</span></td>
      <td data-label="Producto seleccionado"><select class="select" data-sales-product="${row.line}"><option value="">Seleccionar</option>${productOptions(row)}</select>${row.suggested_id && !row.selected_id ? `<small>Sugerido: ${H.html(productById(row.suggested_id)?.titulo || "")}</small>` : ""}</td>
      <td data-label="ID">${H.html(row.selected_id || "-")}</td>
      <td data-label="Stock actual">${stock == null ? "No configurado" : H.html(stock)}</td>
      <td data-label="Cantidad"><input class="input inputTiny" data-sales-qty="${row.line}" type="number" min="1" step="1" value="${H.html(row.cantidad || "")}"></td>
      <td data-label="Stock resultante">${H.html(resulting)}</td>
      <td data-label="Precio unitario"><input class="input inputTiny" data-sales-price="${row.line}" value="${H.html(row.precio || "")}"></td>
      <td data-label="Total">${H.money(total)}</td>
      <td data-label="Fecha"><input class="input inputTiny" data-sales-date="${row.line}" type="date" value="${H.html(row.fecha || "")}"></td>
      <td data-label="Estado">${status}</td>
      <td class="actionsCell" data-label="Acciones"><button class="btn btnSmall" data-sales-ignore="${row.line}" type="button">${row.ignored ? "Restaurar" : "Ignorar"}</button></td>
    </tr>`;
  }

  function productOptions(row) {
    const list = ctx.state.productos.slice().sort((a, b) => String(a.titulo || "").localeCompare(String(b.titulo || ""), "es", { numeric: true }));
    return list.map((p) => `<option value="${H.html(p.id)}" ${String(row.selected_id) === String(p.id) ? "selected" : ""}>#${H.html(p.id)} · ${H.html(p.titulo || "Sin nombre")}</option>`).join("");
  }

  function bindPreviewRows() {
    document.querySelectorAll("[data-sales-product]").forEach((el) => el.addEventListener("change", () => updateRow(el.dataset.salesProduct, { selected_id: el.value, status: "Revisión necesaria", statusClass: "tagWarn", message: "Producto elegido manualmente" })));
    document.querySelectorAll("[data-sales-qty]").forEach((el) => el.addEventListener("input", () => updateRow(el.dataset.salesQty, { cantidad: parseInt(el.value, 10) })));
    document.querySelectorAll("[data-sales-price]").forEach((el) => el.addEventListener("input", () => updateRow(el.dataset.salesPrice, { precio: parsePrice(el.value) })));
    document.querySelectorAll("[data-sales-date]").forEach((el) => el.addEventListener("input", () => updateRow(el.dataset.salesDate, { fecha: el.value })));
    document.querySelectorAll("[data-sales-ignore]").forEach((el) => el.addEventListener("click", () => { const row = rowByLine(el.dataset.salesIgnore); row.ignored = !row.ignored; render(); }));
  }

  function updateRow(line, values) { Object.assign(rowByLine(line), values); render(); }
  function rowByLine(line) { return parsedRows.find((row) => String(row.line) === String(line)); }
  function productById(id) { return ctx.state.productos.find((p) => String(p.id) === String(id)); }
  function stockValue(p) { const n = Number(p?.stock_actual); return Number.isInteger(n) && n >= 0 ? n : null; }

  function summaryHtml() {
    const active = parsedRows.filter((row) => !row.ignored);
    const valid = active.filter((row) => row.valid);
    const warnings = active.filter((row) => row.valid && row.status !== "Coincidencia exacta");
    const errors = active.filter((row) => !row.valid);
    const units = valid.reduce((acc, row) => acc + Number(row.cantidad || 0), 0);
    const total = valid.reduce((acc, row) => acc + Number(row.cantidad || 0) * Number(row.precio || 0), 0);
    const products = new Set(valid.map((row) => String(row.selected_id))).size;
    return H.kpi("Filas totales", parsedRows.length) + H.kpi("Válidas", valid.length) + H.kpi("Advertencias", warnings.length) + H.kpi("Errores", errors.length) + H.kpi("Unidades", units) + H.kpi("Importe total", H.money(total)) + H.kpi("Productos diferentes", products);
  }

  async function confirmImport() {
    validateRows();
    const rows = parsedRows.filter((row) => !row.ignored);
    if (!rows.length || rows.some((row) => !row.valid)) { setStatus("Corregí los errores antes de confirmar.", "error"); return; }
    const ok = await ctx.ui.modal({ title: "Importar ventas", message: "Se registrarán las ventas y se descontará el stock. No se puede deshacer desde esta pantalla.", confirmText: "Confirmar" });
    if (!ok) return;
    try {
      const payload = rows.map((row) => ({ fila: row.line, producto_id: row.selected_id, cantidad: row.cantidad, precio_unitario: row.precio, fecha: row.fecha, observacion: row.observacion, cliente: row.cliente, medio_pago: row.medio_pago }));
      const { error } = await ctx.sb.rpc("importar_ventas_masivas", { p_token: sessionStorage.getItem("bianti_admin_token"), p_archivo_sha256: fileHash, p_filas: payload });
      if (error) throw error;
      setStatus("Ventas importadas correctamente.", "ok");
      await Promise.all([H.loadCore(ctx), H.loadVentas(ctx)]);
      clear(false);
    } catch (error) { setStatus(/importar_ventas_masivas|schema cache|function/i.test(error.message || "") ? "La importación de ventas todavía no está habilitada." : H.showRlsError(error), "error"); }
  }

  function clear(resetStatus = true) {
    parsedRows = [];
    fileHash = "";
    document.getElementById("salesCsvFile").value = "";
    document.getElementById("salesImportRows").innerHTML = `<tr><td colspan="12">${H.empty("Seleccioná un CSV para previsualizar ventas. No se registra nada al seleccionar el archivo.")}</td></tr>`;
    document.getElementById("salesImportSummary").innerHTML = "";
    document.getElementById("salesImportCount").textContent = "Sin archivo seleccionado";
    document.getElementById("confirmSalesImport").disabled = true;
    if (resetStatus) setStatus("", "");
  }

  function normalizeName(value) { return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[-_/]+/g, " ").replace(/[^a-z0-9ñ\s]+/g, "").replace(/\s+/g, " ").trim(); }
  function parsePrice(value) { const text = String(value ?? "").trim().replace(/\s/g, ""); if (!text) return NaN; const normalized = text.includes(",") ? text.replace(/\./g, "").replace(",", ".") : text.replace(/,/g, ""); const n = Number(normalized); return Number.isFinite(n) ? n : NaN; }
  function parseDate(value) { const text = String(value || "").trim(); if (!text) return new Date().toISOString().slice(0, 10); const m = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/); if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`; const d = new Date(text); return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10); }
  async function sha256(file) { const hash = await crypto.subtle.digest("SHA-256", await file.arrayBuffer()); return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join(""); }
  function setStatus(message, type) { const el = document.getElementById("salesImportStatus"); el.textContent = message; el.className = `status ${type || ""}`.trim(); el.classList.toggle("hidden", !message); }
})();
