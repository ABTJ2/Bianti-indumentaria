const supabase = window.supabaseClient;
const STORAGE_BUCKET = "productos";

const zipFile = document.getElementById("zipFile");
const btnImportar = document.getElementById("btnImportar");
const btnLimpiar = document.getElementById("btnLimpiar");
const statusEl = document.getElementById("status");
const summaryPanel = document.getElementById("summaryPanel");
const previewPanel = document.getElementById("previewPanel");
const resultPanel = document.getElementById("resultPanel");
const previewTable = document.getElementById("previewTable");
const csvInfo = document.getElementById("csvInfo");
const resultSummary = document.getElementById("resultSummary");
const resultErrors = document.getElementById("resultErrors");
const btnDescargarErrores = document.getElementById("btnDescargarErrores");

const countValidos = document.getElementById("countValidos");
const countErrores = document.getElementById("countErrores");
const countOmitidos = document.getElementById("countOmitidos");
const countImagenes = document.getElementById("countImagenes");

let previewRows = [];
let imageFiles = new Map();
let csvName = "";
let categoriasCache = [];
let lastErrorReport = [];

const IMAGE_COLUMNS = ["imagen", "foto", "archivo", "nombre_imagen", "imagen_url"];

function setStatus(message, type = "") {
  statusEl.textContent = message || "";
  statusEl.style.color = type === "error" ? "var(--danger)" : type === "success" ? "var(--success)" : "";
}

function esc(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    "\"": "&quot;"
  }[ch]));
}

function normalizeKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function clean(value) {
  return String(value ?? "").trim();
}

function isBlankPrice(value) {
  const text = clean(value).toLowerCase();
  return !text || text === "-" || text === "null" || text === "undefined";
}

function limpiarPrecio(value) {
  if (isBlankPrice(value)) return 0;
  let text = clean(value).replace(/[$\s]/g, "");
  if (text.includes(".") && text.includes(",")) {
    text = text.lastIndexOf(",") > text.lastIndexOf(".")
      ? text.replace(/\./g, "").replace(",", ".")
      : text.replace(/,/g, "");
  } else if (text.includes(",")) {
    text = text.replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(text)) {
    text = text.replace(/\./g, "");
  }
  const n = Number(text);
  return Number.isFinite(n) ? n : NaN;
}

function parseBoolean(value, defaultValue = true) {
  const text = normalizeKey(value);
  if (!text) return defaultValue;
  if (["1", "true", "si", "s", "yes", "y", "x"].includes(text)) return true;
  if (["0", "false", "no", "n"].includes(text)) return false;
  return defaultValue;
}

function splitTalles(value) {
  return clean(value)
    .split(/[;,|]/)
    .map((t) => t.trim())
    .filter(Boolean);
}

function normalizeRow(raw) {
  const row = {};
  Object.entries(raw || {}).forEach(([key, value]) => {
    row[normalizeKey(key)] = value;
  });
  return row;
}

function imageKey(path) {
  return String(path || "").replace(/\\/g, "/").split("/").pop().split(/[?#]/)[0].trim().toLowerCase();
}

function findImage(name) {
  const key = imageKey(name);
  const found = key ? imageFiles.get(key) || null : null;
  console.log("[BIANTI import] Resultado búsqueda imagen", { imagenCsv: name, clave: key, encontrada: found?.name || null });
  return found;
}

function getImageName(row) {
  for (const col of IMAGE_COLUMNS) {
    const value = clean(row[col]);
    if (value) return value;
  }
  return "";
}

function safeFileName(name) {
  return imageKey(name)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9.\-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "producto.jpg";
}

function normalizeStorageError(error) {
  const message = String(error?.message || error?.error || "");
  const statusCode = String(error?.statusCode || error?.status || "");
  if (message.toLowerCase().includes("bucket not found") || statusCode === "404") {
    return new Error("Falta crear el bucket productos en Supabase Storage.");
  }
  return new Error(`Error de Storage: ${message || "no se pudo subir la imagen."}`);
}

async function uploadImage(file, productoId) {
  const filename = safeFileName(file.name);
  const path = `productos/${productoId}/${Date.now()}-${filename}`;

  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || undefined
  });

  if (error) {
    console.error("[BIANTI import] Error subiendo a Storage", { bucket: STORAGE_BUCKET, path, error });
    throw normalizeStorageError(error);
  }

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  console.log("[BIANTI import] URL pública generada", data.publicUrl);
  console.log("[BIANTI import] Subida a Storage OK", { bucket: STORAGE_BUCKET, path, publicUrl: data.publicUrl });
  return data.publicUrl;
}

async function loadCategorias() {
  const { data, error } = await supabase
    .from("categorias")
    .select("id,nombre,orden,visible,usa_talles")
    .order("orden", { ascending: true })
    .order("id", { ascending: true });

  if (error) throw new Error(`Error cargando categorías: ${error.message}`);
  categoriasCache = data || [];
}

async function getOrCreateCategoria(nombre) {
  const catName = clean(nombre);
  if (!catName) return null;

  const found = categoriasCache.find((cat) => normalizeKey(cat.nombre) === normalizeKey(catName));
  if (found) {
    console.log("[BIANTI import] Categoría encontrada", found);
    return found.id;
  }

  const { data, error } = await supabase
    .from("categorias")
    .insert({ nombre: catName, orden: 999, visible: true, usa_talles: true })
    .select("id,nombre,orden,visible,usa_talles")
    .single();

  if (error) throw new Error(`No se pudo crear la categoría "${catName}": ${error.message}`);
  categoriasCache.push(data);
  console.log("[BIANTI import] Categoría creada", data);
  return data.id;
}

function resetImport() {
  previewRows = [];
  imageFiles = new Map();
  csvName = "";
  zipFile.value = "";
  btnImportar.disabled = true;
  previewTable.innerHTML = "";
  resultSummary.innerHTML = "";
  resultErrors.innerHTML = "";
  lastErrorReport = [];
  btnDescargarErrores.style.display = "none";
  summaryPanel.style.display = "none";
  previewPanel.style.display = "none";
  resultPanel.style.display = "none";
  setStatus("");
}

function validateAndBuildRows(rows) {
  return rows.map((raw, index) => {
    const row = normalizeRow(raw);
    const titulo = clean(row.titulo);
    const descripcion = clean(row.descripcion);
    const precioCosto = limpiarPrecio(row.precio_costo);
    const precioVenta = limpiarPrecio(row.precio_venta);
    let precio = limpiarPrecio(row.precio);
    if (!precio || precio <= 0) precio = precioVenta > 0 ? precioVenta : 0;
    const categoria = clean(row.categoria);
    const talles = splitTalles(row.talles);
    const imagen = getImageName(row);
    console.log("[BIANTI import] Imagen leída desde fila CSV", { fila: index + 2, imagen });
    const imageFile = findImage(imagen);
    const errors = [];
    const warnings = [];
    const omitted = !titulo && !descripcion && !categoria && !imagen && !clean(row.precio_venta) && !clean(row.precio) && !clean(row.precio_costo);

    if (!omitted && !titulo) errors.push("Título obligatorio.");
    if (!isBlankPrice(row.precio_venta) && !Number.isFinite(precioVenta)) errors.push("precio_venta debe ser numérico.");
    if (!isBlankPrice(row.precio) && !Number.isFinite(precio)) errors.push("precio debe ser numérico.");
    if (!isBlankPrice(row.precio_costo) && !Number.isFinite(precioCosto)) errors.push("precio_costo debe ser numérico.");
    if (!omitted && Number.isFinite(precioVenta) && precioVenta <= 0) warnings.push("Revisar precio.");
    if (!omitted && Number.isFinite(precioCosto) && precioCosto <= 0) warnings.push("Costo en 0.");
    if (imagen && !imageFile) warnings.push("Imagen no encontrada en el ZIP.");

    return {
      rowNumber: index + 2,
      raw: row,
      titulo,
      descripcion,
      precio,
      precioCosto,
      precioVenta,
      visible: parseBoolean(row.visible, true),
      disponible: parseBoolean(row.disponible, true),
      categoria,
      talles,
      imagen,
      imageFile,
      omitted,
      errors,
      warnings,
      imported: false,
      importError: "",
      uploadedImage: false
    };
  });
}

function renderSummary() {
  const validos = previewRows.filter((r) => !r.omitted && !r.errors.length).length;
  const errores = previewRows.filter((r) => !r.omitted && r.errors.length).length;
  const omitidos = previewRows.filter((r) => r.omitted).length;
  const imagenes = previewRows.filter((r) => r.imageFile).length;

  countValidos.textContent = validos;
  countErrores.textContent = errores;
  countOmitidos.textContent = omitidos;
  countImagenes.textContent = imagenes;
  btnImportar.disabled = validos === 0;
  summaryPanel.style.display = "";
}

function renderPreview() {
  previewTable.innerHTML = `
    <thead>
      <tr>
        <th>Fila</th>
        <th>Título</th>
        <th>Categoría</th>
        <th>Talles</th>
        <th>Precio venta</th>
        <th>Precio costo</th>
        <th>Imagen</th>
        <th>Errores</th>
      </tr>
    </thead>
    <tbody>
      ${previewRows.map((row) => {
        const badge = row.omitted
          ? `<span class="tag tag-warning">Omitida</span>`
          : row.errors.length
            ? `<span class="tag tag-danger">Con error</span>`
            : `<span class="tag tag-success">Lista</span>`;
        const imageStatus = row.imageFile
          ? `<span class="tag tag-success">Encontrada</span><div class="tiny">${esc(row.imageFile.name)}</div>`
          : `<span class="tag tag-info">SIN IMAGEN</span>${row.imagen ? `<div class="tiny">CSV: ${esc(row.imagen)}</div>` : ""}`;
        const issues = [...row.errors, ...row.warnings];

        return `
          <tr>
            <td>${row.rowNumber}</td>
            <td><b>${esc(row.titulo || "-")}</b><div style="margin-top:4px;">${badge}</div></td>
            <td>${esc(row.categoria || "-")}</td>
            <td>${esc(row.talles.join(", ") || "-")}</td>
            <td>${row.precioVenta <= 0 ? "0 / revisar" : esc(row.precioVenta)}</td>
            <td>${row.precioCosto <= 0 ? "0 / revisar" : esc(row.precioCosto)}</td>
            <td>${imageStatus}</td>
            <td>${issues.length ? `<span style="color:${row.errors.length ? "var(--danger)" : "var(--warning)"}">${esc(issues.join(" "))}</span>` : `<span class="muted tiny">Sin errores</span>`}</td>
          </tr>
        `;
      }).join("")}
    </tbody>
  `;

  csvInfo.textContent = `${csvName} - ${previewRows.length} filas leídas.`;
  previewPanel.style.display = "";
  renderSummary();
}

async function readZip(file) {
  if (!window.JSZip) throw new Error("No se pudo cargar JSZip.");
  if (!window.Papa) throw new Error("No se pudo cargar PapaParse.");

  setStatus("Leyendo ZIP...");
  const zip = await window.JSZip.loadAsync(file);
  const entries = Object.values(zip.files).filter((entry) => !entry.dir);
  console.log("[BIANTI import] Archivos encontrados en ZIP", entries.map((entry) => entry.name));
  const csvEntry = entries.find((entry) => entry.name.toLowerCase().endsWith(".csv"));
  if (!csvEntry) throw new Error("El ZIP no contiene un archivo CSV.");

  imageFiles = new Map();
  entries.forEach((entry) => {
    if (/\.(jpe?g|png|webp)$/i.test(entry.name.trim())) {
      const key = imageKey(entry.name);
      if (key && !imageFiles.has(key)) imageFiles.set(key, entry);
    }
  });
  console.log("[BIANTI import] Imágenes detectadas", Array.from(imageFiles.values()).map((entry) => entry.name));

  csvName = csvEntry.name;
  const csvText = await csvEntry.async("string");
  const parsed = window.Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => normalizeKey(header)
  });

  if (parsed.errors?.length) {
    const firstError = parsed.errors[0];
    throw new Error(`Error leyendo CSV: ${firstError.message || "formato inválido"}.`);
  }

  previewRows = validateAndBuildRows(parsed.data || []);
  renderPreview();
  resultPanel.style.display = "none";
  setStatus("Vista previa lista.", "success");
}

async function fileFromZipEntry(entry) {
  const blob = await entry.async("blob");
  const name = imageKey(entry.name) || "producto.jpg";
  const type = blob.type || `image/${name.split(".").pop() || "jpeg"}`;
  return new File([blob], name, { type });
}

async function importRow(row) {
  let portadaUrl = null;
  const rowErrors = [];

  const productPayload = {
    titulo: row.titulo,
    descripcion: row.descripcion || null,
    precio: row.precio,
    precio_costo: row.precioCosto,
    precio_venta: row.precioVenta,
    visible: row.visible,
    disponible: row.disponible,
    portada_url: null
  };

  console.log("Producto a insertar:", productPayload);
  const { data: productoCreado, error: productoError } = await supabase
    .from("productos")
    .insert(productPayload)
    .select()
    .single();

  console.log("[BIANTI import] Respuesta insert producto", { productoCreado, productoError });

  if (productoError) {
    console.error("[BIANTI import] Error insert producto", productoError);
    throw new Error(`Error insertando producto: ${productoError.message || JSON.stringify(productoError)}`);
  }

  console.log("Producto creado:", productoCreado);
  const productoId = productoCreado.id;

  if (row.categoria) {
    try {
      const categoriaId = await getOrCreateCategoria(row.categoria);
      if (categoriaId) {
        const rel = await supabase.from("producto_categorias").insert({ producto_id: productoId, categoria_id: categoriaId });
        console.log("[BIANTI import] Relación producto_categorias", { productoId, categoriaId, error: rel.error });
        if (rel.error) throw rel.error;
      }
    } catch (error) {
      console.error("[BIANTI import] Error categoría/relación", error);
      rowErrors.push(`Producto creado, pero falló categoría: ${error.message || JSON.stringify(error)}`);
    }
  }

  if (row.talles.length) {
    try {
      const rows = row.talles.map((talle) => ({ producto_id: productoId, talle }));
      const talles = await supabase.from("producto_talles").insert(rows);
      console.log("[BIANTI import] Talles insertados", { rows, error: talles.error });
      if (talles.error) throw talles.error;
    } catch (error) {
      console.error("[BIANTI import] Error talles", error);
      rowErrors.push(`Producto creado, pero fallaron talles: ${error.message || JSON.stringify(error)}`);
    }
  }

  if (row.imageFile) {
    try {
      const file = await fileFromZipEntry(row.imageFile);
      portadaUrl = await uploadImage(file, productoId);
      console.log("[BIANTI import] Imagen subida", { productoId, portadaUrl });

      const foto = await supabase.from("producto_fotos").insert({ producto_id: productoId, url: portadaUrl, orden: 0 });
      console.log("[BIANTI import] producto_fotos insertado", { productoId, portadaUrl, error: foto.error });
      if (foto.error) throw foto.error;

      const upd = await supabase.from("productos").update({ portada_url: portadaUrl }).eq("id", productoId);
      console.log("[BIANTI import] portada_url actualizado", { productoId, portadaUrl, error: upd.error });
      if (upd.error) throw upd.error;
    } catch (error) {
      console.error("[BIANTI import] Error imagen", error);
      portadaUrl = null;
      rowErrors.push(`Producto creado, pero falló imagen: ${error.message || JSON.stringify(error)}`);
    }
  }

  row.imported = true;
  row.uploadedImage = !!portadaUrl;
  return { productoId, productoCreado, uploadedImage: !!portadaUrl, rowErrors };
}

function renderResult(stats, errores) {
  resultPanel.style.display = "";
  btnDescargarErrores.style.display = errores.length ? "" : "none";
  resultSummary.innerHTML = `
    <span class="tag tag-info">${stats.total} filas leídas</span>
    <span class="tag tag-success" style="margin-left:8px;">${stats.importados} importados</span>
    <span class="tag tag-success" style="margin-left:8px;">${stats.conImagen} con imagen</span>
    <span class="tag tag-warning" style="margin-left:8px;">${stats.sinImagen} sin imagen</span>
    <span class="tag tag-warning" style="margin-left:8px;">${stats.precioVentaCero} venta en 0</span>
    <span class="tag tag-warning" style="margin-left:8px;">${stats.precioCostoCero} costo en 0</span>
    <span class="tag tag-danger" style="margin-left:8px;">${errores.length} con error</span>
    <span class="tag tag-warning" style="margin-left:8px;">${stats.omitidos} omitidos</span>
  `;

  resultErrors.innerHTML = errores.length
    ? errores.map((item) => `
      <div class="itemLine">
        <div>
          <div class="name">Fila ${item.rowNumber}: ${esc(item.titulo || "Sin título")}</div>
          <div class="tiny" style="color:var(--danger)">${esc(item.error)}</div>
        </div>
      </div>
    `).join("")
    : `<div class="muted tiny">No hubo errores durante la importación.</div>`;
}

async function importar() {
  console.log("Iniciando importación masiva...");
  const importables = previewRows.filter((row) => !row.omitted && !row.errors.length && !row.imported);
  if (!importables.length) return setStatus("No hay filas válidas para importar.", "error");

  btnImportar.disabled = true;
  zipFile.disabled = true;
  resultPanel.style.display = "none";

  let importados = 0;
  let conImagen = 0;
  let sinImagen = 0;
  let precioVentaCero = 0;
  let precioCostoCero = 0;
  const errores = [];
  previewRows
    .filter((row) => !row.omitted && row.errors.length)
    .forEach((row) => errores.push({ rowNumber: row.rowNumber, titulo: row.titulo, imagen: row.imagen, error: row.errors.join(" ") }));
  const omitidos = previewRows.filter((row) => row.omitted).length;

  try {
    await loadCategorias();

    for (let i = 0; i < importables.length; i++) {
      const row = importables[i];
      console.log("[BIANTI import] Fila actual", row);
      setStatus(`Importando ${i + 1} de ${importables.length}: ${row.titulo}`);

      try {
        const result = await importRow(row);
        importados += 1;
        if (result.uploadedImage) conImagen += 1;
        else sinImagen += 1;
        if (row.precioVenta <= 0) precioVentaCero += 1;
        if (row.precioCosto <= 0) precioCostoCero += 1;
        result.rowErrors.forEach((error) => errores.push({ rowNumber: row.rowNumber, titulo: row.titulo, imagen: row.imagen, error }));
      } catch (error) {
        console.error(error);
        row.importError = error?.message || "No se pudo importar.";
        errores.push({ rowNumber: row.rowNumber, titulo: row.titulo, imagen: row.imagen, error: row.importError });
      }
    }

    lastErrorReport = errores;
    const stats = { total: previewRows.length, importados, conImagen, sinImagen, precioVentaCero, precioCostoCero, omitidos };
    console.log("[BIANTI import] Resumen final", { ...stats, errores });
    renderResult(stats, errores);
    setStatus("Importación finalizada.", errores.length ? "" : "success");
  } catch (error) {
    console.error(error);
    setStatus(`Error: ${error.message || "No se pudo importar."}`, "error");
  } finally {
    zipFile.disabled = false;
    btnImportar.disabled = importables.every((row) => row.imported);
  }
}

zipFile.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  if (!file.name.toLowerCase().endsWith(".zip")) {
    resetImport();
    setStatus("Subí un archivo .zip válido.", "error");
    return;
  }

  try {
    await readZip(file);
  } catch (error) {
    console.error(error);
    resetImport();
    setStatus(`Error: ${error.message || "No se pudo leer el ZIP."}`, "error");
  }
});

btnImportar.addEventListener("click", importar);
btnLimpiar.addEventListener("click", resetImport);

btnDescargarErrores.addEventListener("click", () => {
  const header = ["fila", "titulo", "imagen", "error"];
  const rows = lastErrorReport.map((item) => [item.rowNumber, item.titulo || "", item.imagen || "", item.error || ""]);
  const csv = window.Papa.unparse([header, ...rows]);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "errores-importacion-bianti.csv";
  a.click();
  URL.revokeObjectURL(url);
});
