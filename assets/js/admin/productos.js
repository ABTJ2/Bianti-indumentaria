// assets/js/admin/productos.js
// ✅ Lista de productos + buscador
// ✅ Acciones: editar (MODAL overlay), visible/oculto, disponible/no, eliminar
// ✅ Editar completo: título, precio, descripción, categorías multi, talles, portada, agregar fotos, borrar fotos
// Requiere bucket Storage "productos" PUBLIC y tablas sin RLS bloqueando.

const supabase = window.supabaseClient;
const BUCKET = "productos";

const $ = (id) => document.getElementById(id);

// List UI
const tabla = $("tabla");
const status = $("status");
const q = $("q");
const soloVisibles = $("soloVisibles");
const soloDisponibles = $("soloDisponibles");
const count = $("count");

// Modal UI
const overlay = $("editOverlay");
const mClose = $("mClose");
const mSave = $("mSave");
const mSub = $("mSub");
const mStatus = $("mStatus");

const mTitulo = $("mTitulo");
const mPrecio = $("mPrecio");
const mDescripcion = $("mDescripcion");
const mVisible = $("mVisible");
const mDisponible = $("mDisponible");

const mBuscarCat = $("mBuscarCat");
const mCatsBox = $("mCatsBox");

const mTallesSection = $("mTallesSection");
const mTallesBox = $("mTallesBox");
const mTalleCustom = $("mTalleCustom");
const mBtnAddTalle = $("mBtnAddTalle");

const mPortadaFile = $("mPortadaFile");
const mBtnLimpiarPortada = $("mBtnLimpiarPortada");
const mPortadaPreview = $("mPortadaPreview");

const mExtrasFiles = $("mExtrasFiles");
const mBtnLimpiarExtras = $("mBtnLimpiarExtras");
const mExtrasPreview = $("mExtrasPreview");

const mFotosExistentes = $("mFotosExistentes");

// ---------------- Helpers ----------------
function showStatus(msg, isError=false){
  status.style.display = "block";
  status.textContent = msg;
  status.style.borderColor = isError ? "rgba(255,0,0,.25)" : "rgba(255,255,255,.12)";
}
function clearStatus(){
  status.style.display = "none";
  status.textContent = "";
}
function showMStatus(msg, isError=false){
  mStatus.style.display = "block";
  mStatus.textContent = msg;
  mStatus.style.borderColor = isError ? "rgba(255,0,0,.25)" : "rgba(255,255,255,.12)";
}
function clearMStatus(){
  mStatus.style.display = "none";
  mStatus.textContent = "";
}
function esc(str){
  return String(str ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}
function money(n){
  const v = Number(n);
  if (!Number.isFinite(v)) return "-";
  return v.toLocaleString("es-AR", { style:"currency", currency:"ARS" });
}
function toNumber(val){
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
}
function uniq(arr){
  return Array.from(new Set(arr || []));
}
function safeFileName(name) {
  return String(name || "img")
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
function extFromName(name) {
  const m = String(name || "").match(/\.(\w+)$/);
  return m ? m[1].toLowerCase() : "jpg";
}
function nowSlug() {
  const d = new Date();
  const pad = (x) => String(x).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}
async function uploadImage(file, productoId, kind, order = 0) {
  const ext = extFromName(file.name);
  const base = safeFileName(file.name) || `${kind}.${ext}`;
  const filename = `${nowSlug()}_${kind}_${order}_${base}`;
  const path = `${productoId}/${filename}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

// ---------------- State ----------------
let cache = [];              // productos (enriquecidos)
let categoriasAll = [];      // categorias para multi-select
let catMap = new Map();      // id -> categoria
const defaultTalles = ["XS","S","M","L","XL","XXL"];

// Modal state
let editId = null;
let selectedCatIds = new Set();
let selectedTalles = new Set();
let portadaActualUrl = "";
let portadaFile = null;
let extrasFiles = [];          // File[]
let extrasPreview = [];        // {name, blobUrl, file}
let fotosExistentes = [];      // [{id,url,orden}]
let tallesEnabled = true;

// ---------------- Load data ----------------
async function loadCategorias(){
  const { data, error } = await supabase
    .from("categorias")
    .select("id,nombre,orden,visible,usa_talles")
    .order("orden", { ascending:true })
    .order("id", { ascending:true });

  if (error) throw error;
  categoriasAll = data || [];
  catMap = new Map(categoriasAll.map(c => [c.id, c]));
}

async function load(){
  clearStatus();
  tabla.innerHTML = `<tr><td class="muted">Cargando…</td></tr>`;

  await loadCategorias();

  const { data: prods, error } = await supabase
    .from("productos")
    .select("id,titulo,descripcion,precio,visible,disponible,portada_url,created_at")
    .order("id", { ascending:false });

  if (error){
    console.error(error);
    showStatus("❌ Error cargando productos. Mirá consola (F12).", true);
    tabla.innerHTML = "";
    return;
  }

  const ids = (prods || []).map(p => p.id);

  let catLinks = [];
  let talles = [];
  let fotos = [];

  if (ids.length){
    const r1 = await supabase
      .from("producto_categorias")
      .select("producto_id,categoria_id")
      .in("producto_id", ids);
    if (!r1.error) catLinks = r1.data || [];

    const r2 = await supabase
      .from("producto_talles")
      .select("producto_id,talle")
      .in("producto_id", ids);
    if (!r2.error) talles = r2.data || [];

    const r3 = await supabase
      .from("producto_fotos")
      .select("id,producto_id,url,orden")
      .in("producto_id", ids);
    if (!r3.error) fotos = r3.data || [];
  }

  const catsIdsByProd = new Map();
  catLinks.forEach(x => {
    const arr = catsIdsByProd.get(x.producto_id) || [];
    if (x.categoria_id != null) arr.push(x.categoria_id);
    catsIdsByProd.set(x.producto_id, arr);
  });

  const catsNamesByProd = new Map();
  catLinks.forEach(x => {
    const arr = catsNamesByProd.get(x.producto_id) || [];
    const c = catMap.get(x.categoria_id);
    if (c?.nombre) arr.push(c.nombre);
    catsNamesByProd.set(x.producto_id, arr);
  });

  const tallesByProd = new Map();
  talles.forEach(x => {
    const arr = tallesByProd.get(x.producto_id) || [];
    if (x.talle) arr.push(x.talle);
    tallesByProd.set(x.producto_id, arr);
  });

  const fotosByProd = new Map();
  fotos.forEach(f => {
    const arr = fotosByProd.get(f.producto_id) || [];
    arr.push(f);
    fotosByProd.set(f.producto_id, arr);
  });

  cache = (prods || []).map(p => ({
    ...p,
    categorias: uniq(catsNamesByProd.get(p.id) || []),
    categorias_ids: uniq(catsIdsByProd.get(p.id) || []),
    talles: uniq(tallesByProd.get(p.id) || []),
    fotos: (fotosByProd.get(p.id) || []).slice(),
  }));

  render();
}

// ---------------- Render list ----------------
function render(){
  const term = (q.value || "").trim().toLowerCase();

  let rows = cache.slice();
  if (soloVisibles.checked) rows = rows.filter(x => x.visible);
  if (soloDisponibles.checked) rows = rows.filter(x => x.disponible);

  if (term){
    rows = rows.filter(x => {
      const t = (x.titulo || "").toLowerCase();
      const c = (x.categorias || []).join(" ").toLowerCase();
      return t.includes(term) || c.includes(term);
    });
  }

  count.textContent = `${rows.length} producto(s)`;

  const head = `
    <tr>
      <th style="width:64px"></th>
      <th>ID</th>
      <th>Producto</th>
      <th class="hideMobile">Categorías</th>
      <th class="hideMobile">Talles</th>
      <th>Precio</th>
      <th>Estado</th>
      <th style="width:300px;text-align:right">Acciones</th>
    </tr>
  `;

  const body = rows.map(p => {
    const cats = (p.categorias || []).slice(0,4).map(n => `<span class="chip">${esc(n)}</span>`).join("");
    const moreCats = (p.categorias || []).length > 4 ? `<span class="chip">+${(p.categorias.length-4)}</span>` : "";

    const ts = (p.talles || []).slice(0,6).map(n => `<span class="chip">${esc(n)}</span>`).join("");
    const moreT = (p.talles || []).length > 6 ? `<span class="chip">+${(p.talles.length-6)}</span>` : "";

    const estado = `
      <div class="chips">
        <span class="chip">${p.visible ? "Visible" : "Oculto"}</span>
        <span class="chip">${p.disponible ? "Disponible" : "No disp."}</span>
      </div>
    `;

    return `
      <tr>
        <td>${p.portada_url ? `<img class="thumb" src="${esc(p.portada_url)}" alt="">` : ""}</td>
        <td>${p.id}</td>
        <td>
          <div><strong>${esc(p.titulo || "-")}</strong></div>
          <div class="muted2">#${p.id}</div>
        </td>
        <td class="hideMobile"><div class="chips">${cats}${moreCats}</div></td>
        <td class="hideMobile"><div class="chips">${ts}${moreT}</div></td>
        <td><strong>${money(p.precio)}</strong></td>
        <td>${estado}</td>
        <td>
          <div class="actionsRow">
            <button class="btn btnMini" data-edit="${p.id}">Editar</button>
            <button class="btn btnMini" data-toggle-visible="${p.id}">${p.visible ? "Ocultar" : "Mostrar"}</button>
            <button class="btn btnMini" data-toggle-disp="${p.id}">${p.disponible ? "No disp." : "Disponible"}</button>
            <button class="btn btnMini danger" data-del="${p.id}">Eliminar</button>
          </div>
        </td>
      </tr>
    `;
  }).join("");

  tabla.innerHTML = head + body;

  // listeners
  tabla.querySelectorAll("button[data-edit]").forEach(btn => {
    btn.addEventListener("click", () => openEditModal(Number(btn.dataset.edit)));
  });

  tabla.querySelectorAll("button[data-del]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = Number(btn.dataset.del);
      if (!confirm(`¿Eliminar producto #${id}? Esto borra también sus fotos/talles/categorías.`)) return;
      await eliminarProducto(id);
    });
  });

  tabla.querySelectorAll("button[data-toggle-visible]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = Number(btn.dataset.toggleVisible);
      const prod = cache.find(x => x.id === id);
      if (!prod) return;
      await toggleCampo(id, "visible", !prod.visible);
    });
  });

  tabla.querySelectorAll("button[data-toggle-disp]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = Number(btn.dataset.toggleDisp);
      const prod = cache.find(x => x.id === id);
      if (!prod) return;
      await toggleCampo(id, "disponible", !prod.disponible);
    });
  });
}

// ---------------- Simple actions ----------------
async function toggleCampo(id, campo, valor){
  clearStatus();
  const { error } = await supabase.from("productos").update({ [campo]: valor }).eq("id", id);
  if (error){
    console.error(error);
    return showStatus("❌ No se pudo actualizar. Mirá consola.", true);
  }
  const p = cache.find(x => x.id === id);
  if (p) p[campo] = valor;
  render();
}

async function eliminarProducto(id){
  clearStatus();

  await supabase.from("producto_categorias").delete().eq("producto_id", id);
  await supabase.from("producto_talles").delete().eq("producto_id", id);
  await supabase.from("producto_fotos").delete().eq("producto_id", id);

  const { error } = await supabase.from("productos").delete().eq("id", id);
  if (error){
    console.error(error);
    return showStatus("❌ No se pudo eliminar. Mirá consola.", true);
  }

  showStatus("✅ Producto eliminado.");
  cache = cache.filter(x => x.id !== id);
  render();
}

// ---------------- Modal: open/close ----------------
function resetModalState(){
  editId = null;
  selectedCatIds = new Set();
  selectedTalles = new Set();
  portadaActualUrl = "";
  portadaFile = null;
  extrasFiles = [];
  extrasPreview.forEach(x => x.blobUrl && URL.revokeObjectURL(x.blobUrl));
  extrasPreview = [];
  fotosExistentes = [];
  tallesEnabled = true;

  mTitulo.value = "";
  mPrecio.value = "";
  mDescripcion.value = "";
  mVisible.checked = true;
  mDisponible.checked = true;

  mBuscarCat.value = "";
  mCatsBox.innerHTML = "";
  mTallesBox.innerHTML = "";
  mTalleCustom.value = "";

  mPortadaPreview.src = "";
  mPortadaFile.value = "";
  mExtrasFiles.value = "";
  mExtrasPreview.innerHTML = "";
  mFotosExistentes.innerHTML = "";

  clearMStatus();
}

function openOverlay(){
  overlay.style.display = "flex";
  overlay.setAttribute("aria-hidden", "false");
}
function closeOverlay(){
  overlay.style.display = "none";
  overlay.setAttribute("aria-hidden", "true");
  resetModalState();
}

// click fuera cierra
overlay.addEventListener("click", (e) => {
  if (e.target === overlay) closeOverlay();
});
mClose.addEventListener("click", closeOverlay);

// ---------------- Modal: categories/talles UI ----------------
function computeTallesEnabled(){
  // si alguna categoría usa_talles => true, sino false
  const cats = Array.from(selectedCatIds).map(id => catMap.get(id)).filter(Boolean);
  tallesEnabled = cats.some(c => !!c.usa_talles);

  if (!tallesEnabled){
    selectedTalles = new Set(); // limpia talles si no aplica
  }

  mTallesSection.style.display = tallesEnabled ? "" : "none";
}

function renderCats(){
  const term = (mBuscarCat.value || "").trim().toLowerCase();

  const list = categoriasAll.filter(c => !term || (c.nombre || "").toLowerCase().includes(term));

  mCatsBox.innerHTML = list.map(c => {
    const checked = selectedCatIds.has(c.id) ? "checked" : "";
    return `
      <label class="chip">
        <input type="checkbox" data-cid="${c.id}" ${checked} />
        <span>${esc(c.nombre)}</span>
      </label>
    `;
  }).join("");

  mCatsBox.querySelectorAll("input[data-cid]").forEach(inp => {
    inp.addEventListener("change", () => {
      const id = Number(inp.dataset.cid);
      if (inp.checked) selectedCatIds.add(id);
      else selectedCatIds.delete(id);

      computeTallesEnabled();
      renderTalles();
    });
  });
}

function renderTalles(){
  if (!tallesEnabled) return;

  const chips = [];
  for (const t of defaultTalles){
    const active = selectedTalles.has(t);
    chips.push(`
      <label class="chip">
        <input type="checkbox" data-t="${esc(t)}" ${active ? "checked" : ""} />
        <span>${esc(t)}</span>
      </label>
    `);
  }

  // talles custom ya marcados
  const customs = Array.from(selectedTalles).filter(t => !defaultTalles.includes(t));
  customs.forEach(t => {
    chips.push(`
      <span class="chip">
        <strong>${esc(t)}</strong>
        <button class="btn btnMini danger" type="button" data-tx="${esc(t)}" style="padding:4px 8px;border-radius:999px">x</button>
      </span>
    `);
  });

  mTallesBox.innerHTML = chips.join("");

  mTallesBox.querySelectorAll("input[data-t]").forEach(inp => {
    inp.addEventListener("change", () => {
      const t = inp.dataset.t;
      if (inp.checked) selectedTalles.add(t);
      else selectedTalles.delete(t);
    });
  });

  mTallesBox.querySelectorAll("button[data-tx]").forEach(btn => {
    btn.addEventListener("click", () => {
      selectedTalles.delete(btn.dataset.tx);
      renderTalles();
    });
  });
}

mBuscarCat.addEventListener("input", renderCats);

mBtnAddTalle.addEventListener("click", () => {
  const t = (mTalleCustom.value || "").trim();
  if (!t) return;
  selectedTalles.add(t);
  mTalleCustom.value = "";
  renderTalles();
});
mTalleCustom.addEventListener("keydown", (e) => {
  if (e.key === "Enter"){
    e.preventDefault();
    mBtnAddTalle.click();
  }
});

// ---------------- Modal: photos UI ----------------
mPortadaFile.addEventListener("change", () => {
  portadaFile = mPortadaFile.files?.[0] || null;
  if (portadaFile){
    const url = URL.createObjectURL(portadaFile);
    mPortadaPreview.src = url;
  } else {
    mPortadaPreview.src = portadaActualUrl || "";
  }
});
mBtnLimpiarPortada.addEventListener("click", () => {
  mPortadaFile.value = "";
  portadaFile = null;
  mPortadaPreview.src = portadaActualUrl || "";
});

mExtrasFiles.addEventListener("change", () => {
  extrasFiles = Array.from(mExtrasFiles.files || []);
  extrasPreview.forEach(x => x.blobUrl && URL.revokeObjectURL(x.blobUrl));
  extrasPreview = extrasFiles.map(f => ({ name: f.name, blobUrl: URL.createObjectURL(f), file: f }));
  renderExtrasPreview();
});
mBtnLimpiarExtras.addEventListener("click", () => {
  mExtrasFiles.value = "";
  extrasFiles = [];
  extrasPreview.forEach(x => x.blobUrl && URL.revokeObjectURL(x.blobUrl));
  extrasPreview = [];
  renderExtrasPreview();
});

function renderExtrasPreview(){
  if (!extrasPreview.length){
    mExtrasPreview.innerHTML = `<div class="help">Sin nuevas fotos seleccionadas.</div>`;
    return;
  }
  mExtrasPreview.innerHTML = extrasPreview.map(x => `
    <div class="itemLine">
      <img class="thumbBig" src="${x.blobUrl}" alt="">
      <div class="grow">
        <div><strong>${esc(x.name)}</strong></div>
        <div class="help">Nueva foto para agregar</div>
      </div>
    </div>
  `).join("");
}

async function deleteFotoExistente(fotoId){
  showMStatus("Eliminando foto…");
  const { error } = await supabase.from("producto_fotos").delete().eq("id", fotoId);
  if (error){
    console.error(error);
    return showMStatus("❌ No se pudo eliminar la foto. Mirá consola.", true);
  }
  fotosExistentes = fotosExistentes.filter(f => f.id !== fotoId);
  renderFotosExistentes();
  showMStatus("✅ Foto eliminada.");
}

function renderFotosExistentes(){
  const list = (fotosExistentes || []).slice().sort((a,b)=> (a.orden ?? 0) - (b.orden ?? 0));
  if (!list.length){
    mFotosExistentes.innerHTML = `<div class="help">No hay fotos extra guardadas.</div>`;
    return;
  }
  mFotosExistentes.innerHTML = list.map(f => `
    <div class="itemLine">
      <img class="thumbBig" src="${esc(f.url)}" alt="">
      <div class="grow">
        <div><strong>Orden ${f.orden ?? "-"}</strong></div>
        <div class="help">Foto ID: ${f.id}</div>
      </div>
      <button class="btn danger" type="button" data-fdel="${f.id}">Eliminar</button>
    </div>
  `).join("");

  mFotosExistentes.querySelectorAll("button[data-fdel]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = Number(btn.dataset.fdel);
      if (!confirm("¿Eliminar esta foto?")) return;
      await deleteFotoExistente(id);
    });
  });
}

// ---------------- Modal: open with product ----------------
async function openEditModal(id){
  resetModalState();

  const prod = cache.find(x => x.id === id);
  if (!prod){
    showStatus("❌ No se encontró el producto en memoria.", true);
    return;
  }

  editId = id;
  mSub.textContent = `Editando #${id}`;

  // precarga campos
  mTitulo.value = prod.titulo || "";
  mPrecio.value = prod.precio ?? "";
  mDescripcion.value = prod.descripcion || "";
  mVisible.checked = !!prod.visible;
  mDisponible.checked = !!prod.disponible;

  // categorías
  selectedCatIds = new Set(prod.categorias_ids || []);
  renderCats();

  // talles
  selectedTalles = new Set(prod.talles || []);

  // porta
  portadaActualUrl = prod.portada_url || "";
  mPortadaPreview.src = portadaActualUrl || "";

  // fotos existentes (producto_fotos)
  fotosExistentes = (prod.fotos || []).slice();
  renderFotosExistentes();

  // aplica regla usa_talles
  computeTallesEnabled();
  renderTalles();

  // extras
  renderExtrasPreview();

  openOverlay();
}

// ---------------- Modal: save ----------------
mSave.addEventListener("click", saveEdit);

async function saveEdit(){
  if (!editId) return;

  const titulo = (mTitulo.value || "").trim();
  const precio = toNumber(mPrecio.value);
  const descripcion = (mDescripcion.value || "").trim();
  const visible = !!mVisible.checked;
  const disponible = !!mDisponible.checked;

  if (!titulo) return showMStatus("⚠️ El título es obligatorio.", true);
  if (precio === null || precio < 0) return showMStatus("⚠️ Precio inválido.", true);

  try{
    clearMStatus();
    showMStatus("Guardando cambios…");

    // 1) Portada: si subieron nueva, sube y actualiza portada_url
    let portadaFinalUrl = portadaActualUrl;
    if (portadaFile){
      showMStatus("Subiendo nueva portada…");
      portadaFinalUrl = await uploadImage(portadaFile, editId, "portada", 0);
    }

    // 2) Update producto
    const { error: e1 } = await supabase
      .from("productos")
      .update({
        titulo,
        precio,
        descripcion: descripcion || null,
        visible,
        disponible,
        portada_url: portadaFinalUrl || null
      })
      .eq("id", editId);

    if (e1) throw e1;

    // 3) Categorías (multi)
    showMStatus("Actualizando categorías…");
    await supabase.from("producto_categorias").delete().eq("producto_id", editId);

    const catsIds = Array.from(selectedCatIds);
    if (catsIds.length){
      const rows = catsIds.map(cid => ({ producto_id: editId, categoria_id: cid }));
      const { error } = await supabase.from("producto_categorias").insert(rows);
      if (error) throw error;
    }

    // 4) Talles
    showMStatus("Actualizando talles…");
    await supabase.from("producto_talles").delete().eq("producto_id", editId);

    if (tallesEnabled){
      const tList = Array.from(selectedTalles).map(t => String(t).trim()).filter(Boolean);
      if (tList.length){
        const rows = tList.map(t => ({ producto_id: editId, talle: t }));
        const { error } = await supabase.from("producto_talles").insert(rows);
        if (error) throw error;
      }
    }

    // 5) Fotos extra nuevas
    if (extrasFiles.length){
      showMStatus(`Subiendo ${extrasFiles.length} fotos extra…`);
      const maxOrden = (fotosExistentes || []).reduce((m,f)=> Math.max(m, Number(f.orden)||0), 0);
      let start = Math.max(maxOrden, 0) + 1;

      const newRows = [];
      for (let i = 0; i < extrasFiles.length; i++){
        const url = await uploadImage(extrasFiles[i], editId, "extra", start + i);
        newRows.push({ producto_id: editId, url, orden: start + i });
      }
      const { error } = await supabase.from("producto_fotos").insert(newRows);
      if (error) throw error;
    }

    showMStatus("✅ Guardado. Actualizando listado…");

    // 6) recargar todo para refrescar cache y fotos
    await load();
    showMStatus("✅ Listo.");
    closeOverlay();

  }catch(e){
    console.error(e);
    showMStatus(`❌ Error: ${e?.message || "No se pudo guardar"}`, true);
  }
}

// ---------------- Events ----------------
q.addEventListener("input", render);
soloVisibles.addEventListener("change", render);
soloDisponibles.addEventListener("change", render);

// Init
load().catch(err => {
  console.error(err);
  showStatus("❌ Error general al iniciar. Mirá consola.", true);
});
