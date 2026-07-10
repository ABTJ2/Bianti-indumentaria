(function () {
  window.BiantiAdminModules = window.BiantiAdminModules || {};
  window.BiantiAdminModules.importar = { init };
  let ctx, H;

  async function init(context) {
    ctx = context;
    H = ctx.helpers;
    await loadImporterLibs();
    ["csvFile", "zipFile"].forEach((id) => document.getElementById(id).addEventListener("change", updateNames));
    document.getElementById("previewImport").addEventListener("click", preview);
    document.getElementById("runImport").addEventListener("click", run);
    updateNames();
  }

  async function loadImporterLibs() { if (window.Papa && window.JSZip) return; await H.loadScript("https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js"); await H.loadScript("https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js"); }
  function updateNames() { document.getElementById("csvName").textContent = document.getElementById("csvFile").files[0]?.name || "Sin seleccionar"; document.getElementById("zipName").textContent = document.getElementById("zipFile").files[0]?.name || "Sin seleccionar"; }
  async function parseCsvFile() { const file = document.getElementById("csvFile").files[0]; if (!file) throw new Error("Seleccioná un CSV."); return new Promise((resolve, reject) => window.Papa.parse(file, { header: true, skipEmptyLines: true, complete: (r) => resolve(r.data || []), error: reject })); }

  async function preview() {
    try {
      const rows = await parseCsvFile();
      const zipFile = document.getElementById("zipFile").files[0];
      document.getElementById("importPreview").innerHTML = `<div class="noteBox">CSV detectado: ${rows.length} filas. ZIP: ${zipFile ? H.html(zipFile.name) : "no seleccionado"}.</div>${previewTable(rows.slice(0, 8))}`;
    } catch (error) { document.getElementById("importPreview").innerHTML = `<pre>${H.html(error.message)}</pre>`; }
  }

  function previewTable(rows) {
    if (!rows.length) return H.empty("El CSV no tiene filas para previsualizar.");
    return `<div class="tableWrap"><table class="compactTable mobileCards"><thead><tr><th>Título</th><th>Categoría</th><th>Precio</th><th>Costo</th><th>Talles</th><th>Imagen</th></tr></thead><tbody>${rows.map((row) => `<tr><td data-label="Título">${H.html(row.titulo || row.nombre || "-")}</td><td data-label="Categoría">${H.html(row.categoria || "-")}</td><td data-label="Precio">${H.html(row.precio_venta || row.precio || "-")}</td><td data-label="Costo">${H.html(row.precio_costo || "-")}</td><td data-label="Talles">${H.html(row.talles || "-")}</td><td data-label="Imagen">${H.html(row.imagen || "-")}</td></tr>`).join("")}</tbody></table></div>`;
  }

  async function run() {
    try {
      const rows = await parseCsvFile();
      let zip = null;
      const zipFile = document.getElementById("zipFile").files[0];
      if (zipFile) zip = await window.JSZip.loadAsync(zipFile);
      await H.loadCore(ctx);
      let ok = 0;
      for (const row of rows) {
        const title = row.titulo || row.nombre;
        if (!title) continue;
        const payload = { titulo: title, descripcion: row.descripcion || null, precio: H.numOrNull(row.precio_venta || row.precio), precio_costo: H.numOrNull(row.precio_costo), visible: true, disponible: true, portada_url: null };
        const { data, error } = await ctx.sb.from("productos").insert(payload).select("id").single();
        if (error) throw error;
        if (row.categoria) await ensureCategory(data.id, row.categoria);
        if (row.talles) await ctx.sb.from("producto_talles").insert(String(row.talles).split(/[|,;]/).map((talle) => ({ producto_id: data.id, talle: talle.trim() })).filter((x) => x.talle));
        if (zip && row.imagen) await uploadZipImage(zip, row.imagen, data.id);
        ok++;
      }
      document.getElementById("importPreview").innerHTML = `<pre>Importados: ${ok}\nSi alguna imagen no subió, revisá permisos de carga y nombres dentro del ZIP.</pre>`;
    } catch (error) { document.getElementById("importPreview").innerHTML = `<pre>${H.html(H.showRlsError(error))}</pre>`; }
  }

  async function ensureCategory(productoId, name) { let cat = ctx.state.categorias.find((c) => String(c.nombre).toLowerCase() === String(name).toLowerCase()); if (!cat) { const cr = await ctx.sb.from("categorias").insert({ nombre: name, visible: true, usa_talles: true, orden: 999 }).select("id,nombre").single(); if (cr.error) throw cr.error; cat = cr.data; ctx.state.categorias.push(cat); } const rel = await ctx.sb.from("producto_categorias").insert({ producto_id: productoId, categoria_id: cat.id }); if (rel.error) throw rel.error; }
  async function uploadZipImage(zip, filename, productoId) { const zf = zip.file(filename); if (!zf) return; const blob = await zf.async("blob"); const file = new File([blob], filename); const url = await H.uploadProductImage(ctx, file, productoId); await ctx.sb.from("productos").update({ portada_url: url }).eq("id", productoId); await ctx.sb.from("producto_fotos").insert({ producto_id: productoId, url, orden: 0 }); }
})();
