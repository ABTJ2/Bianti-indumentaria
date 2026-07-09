const sb = window.supabaseClient;
const STORAGE_BUCKET = "productos";

// inputs
const titulo = document.getElementById("titulo");
const precioVenta = document.getElementById("precio_venta");
const precioCosto = document.getElementById("precio_costo");
const descripcion = document.getElementById("descripcion");
const visible = document.getElementById("visible");
const disponible = document.getElementById("disponible");

// categorias
const catsWrap = document.getElementById("catsWrap");
const catSearch = document.getElementById("catSearch");
const btnNuevaCategoria = document.getElementById("btnNuevaCategoria");

// talles
const tallesSection = document.getElementById("tallesSection");
const tallesQuick = document.getElementById("tallesQuick");
const talleManual = document.getElementById("talleManual");
const btnAddTalle = document.getElementById("btnAddTalle");
const btnClearTalles = document.getElementById("btnClearTalles");

// fotos
const portadaFile = document.getElementById("portadaFile");
const extrasFiles = document.getElementById("extrasFiles");
const btnClearPortada = document.getElementById("btnClearPortada");
const btnClearExtras = document.getElementById("btnClearExtras");
const thumbs = document.getElementById("thumbs");

// guardar
const statusEl = document.getElementById("status");
const btnGuardar = document.getElementById("btnGuardar");

let categorias = [];
let selectedCats = new Set();

let selectedTalles = new Set();
const PRESET_TALLES = ["XS","S","M","L","XL","XXL"];

let portada = null;           // File
let extras = [];              // File[]

function setStatus(msg, type){
  statusEl.textContent = msg || "";
  statusEl.className = "muted tiny";
  if(type === "success") statusEl.className = "muted tiny", statusEl.style.color = "var(--success)";
  else if(type === "error") statusEl.className = "muted tiny", statusEl.style.color = "var(--danger)";
  else statusEl.style.color = "";
}

function safeNumber(v){
  if(v === "" || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function normalizeStorageError(error){
  const message = String(error?.message || error?.error || "");
  const statusCode = String(error?.statusCode || error?.status || "");
  if(message.toLowerCase().includes("bucket not found") || statusCode === "404"){
    return new Error("Falta crear el bucket productos en Supabase Storage.");
  }
  return new Error(`Error de Storage: ${message || "no se pudo subir la imagen."}`);
}

function renderCategorias(){
  const term = (catSearch.value || "").toLowerCase().trim();
  const list = categorias
    .filter(c => c.visible !== false)
    .filter(c => !term || (c.nombre || "").toLowerCase().includes(term))
    .sort((a,b)=> (a.orden??999) - (b.orden??999));

  catsWrap.innerHTML = list.map(c=>{
    const checked = selectedCats.has(Number(c.id)) ? "checked" : "";
    const hint = c.usa_talles ? " (usa talles)" : " (sin talles)";
    return `
      <label class="chipBtn">
        <input type="checkbox" data-catid="${c.id}" ${checked}>
        <span>${c.nombre}${hint}</span>
      </label>
    `;
  }).join("") || `<div class="muted">No hay categorías.</div>`;
}

function renderTalles(){
  tallesQuick.innerHTML = PRESET_TALLES.map(t=>{
    const checked = selectedTalles.has(t) ? "checked" : "";
    return `
      <label class="chipBtn">
        <input type="checkbox" data-talle="${t}" ${checked}>
        <span>${t}</span>
      </label>
    `;
  }).join("");
}

function shouldShowTalles(){
  const ids = Array.from(selectedCats.values());
  if(!ids.length) return true; // por defecto mostramos, hasta que elija categoría

  // si alguna categoria seleccionada usa talles => mostrar
  for(const id of ids){
    const cat = categorias.find(c => Number(c.id) === Number(id));
    if(cat && cat.usa_talles === true) return true;
  }
  return false;
}

function syncTallesVisibility(){
  const show = shouldShowTalles();
  tallesSection.style.display = show ? "" : "none";

  if(!show){
    selectedTalles = new Set();
    renderTalles();
  }
}

function renderThumbs(){
  const all = [];
  if(portada) all.push({ file: portada, label: "Portada" });
  extras.forEach((f,i)=> all.push({ file:f, label:`Extra #${i+1}` }));

  thumbs.innerHTML = all.map(item=>{
    const url = URL.createObjectURL(item.file);
    return `
      <div class="thumb">
        <img src="${url}" alt="">
        <div>
          <div class="name">${item.file.name}</div>
          <div class="sub">${item.label}</div>
        </div>
      </div>
    `;
  }).join("");
}

async function loadCategorias(){
  const { data, error } = await sb
    .from("categorias")
    .select("id,nombre,orden,visible,usa_talles")
    .order("orden",{ascending:true});

  if(error){
    console.error(error);
    setStatus("Error cargando categorías.");
    categorias = [];
    renderCategorias();
    return;
  }

  categorias = data || [];
  renderCategorias();
  syncTallesVisibility();
}

const catOverlay = document.getElementById("catOverlay");
const catModalInput = document.getElementById("catModalInput");
const catModalSave = document.getElementById("catModalSave");
const catModalClose = document.getElementById("catModalClose");
const catModalStatus = document.getElementById("catModalStatus");

function openCatModal(){
  catOverlay.setAttribute("aria-hidden", "false");
  catModalInput.value = "";
  catModalStatus.textContent = "";
  catModalInput.focus();
}
function closeCatModal(){
  catOverlay.setAttribute("aria-hidden", "true");
}

catModalClose.addEventListener("click", closeCatModal);
catOverlay.addEventListener("click", (e) => {
  if(e.target === catOverlay) closeCatModal();
});

async function crearCategoria(){
  const nombre = (catModalInput.value || "").trim();
  if(!nombre){
    catModalStatus.textContent = "Ingresá un nombre.";
    catModalStatus.style.color = "var(--danger)";
    return;
  }

  catModalSave.disabled = true;
  catModalStatus.textContent = "Guardando...";
  catModalStatus.style.color = "";

  const payload = { nombre, orden: 999, visible: true, usa_talles: true };

  const { data, error } = await sb.from("categorias").insert(payload).select("id,nombre,orden,visible,usa_talles").single();
  if(error){
    console.error(error);
    catModalStatus.textContent = "Error al crear.";
    catModalStatus.style.color = "var(--danger)";
    catModalSave.disabled = false;
    return;
  }

  categorias.push(data);
  renderCategorias();
  closeCatModal();
  setStatus(`Categoría "${nombre}" creada.`, "success");
  catModalSave.disabled = false;
}

function resetForm(){
  titulo.value = "";
  precioVenta.value = "";
  precioCosto.value = "";
  descripcion.value = "";
  visible.checked = true;
  disponible.checked = true;

  selectedCats = new Set();
  catSearch.value = "";
  renderCategorias();

  selectedTalles = new Set();
  renderTalles();
  syncTallesVisibility();

  portada = null;
  extras = [];
  portadaFile.value = "";
  extrasFiles.value = "";
  renderThumbs();
}

async function uploadToBucket(file, folder){
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const name = `${crypto.randomUUID()}.${ext}`;
  const path = `${folder}/${name}`;

  const { error } = await sb
    .storage
    .from(STORAGE_BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type });

  if(error) throw normalizeStorageError(error);

  const { data } = sb.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

async function guardar(){
  setStatus("");

  const t = (titulo.value || "").trim();
  const pv = safeNumber(precioVenta.value);
  const pc = safeNumber(precioCosto.value);
  const desc = (descripcion.value || "").trim();

  if(!t) return setStatus("Falta el nombre del producto.", "error");
  if(pv == null || pv < 0) return setStatus("Precio de venta inválido.", "error");
  if(pc != null && pc < 0) return setStatus("Precio de costo inválido.", "error");
  if(!portada) return setStatus("Falta la portada (archivo).", "error");

  btnGuardar.disabled = true;
  setStatus("Subiendo imágenes...");

  try{
    const cats = Array.from(selectedCats.values());

    // 1) subir todas las imágenes antes de insertar el producto.
    // Si falta el bucket, no queda un producto creado a medias.
    const portadaUrl = await uploadToBucket(portada, "portadas");
    const extraUrls = [];
    if(extras.length){
      setStatus("Subiendo fotos extra...");
      for(let i=0;i<extras.length;i++){
        extraUrls.push(await uploadToBucket(extras[i], "extras"));
      }
    }

    // 2) crear producto
    setStatus("Guardando producto...");
    const prodPayload = {
      categoria_id: cats[0] ?? null,
      titulo: t,
      descripcion: desc || null,
      precio: pv,
      precio_costo: pc,
      precio_venta: pv,
      visible: !!visible.checked,
      disponible: !!disponible.checked,
      portada_url: portadaUrl
    };

    const ins = await sb.from("productos").insert(prodPayload).select("id").single();
    if(ins.error) throw new Error(`Error guardando producto: ${ins.error.message || "no se pudo insertar en productos."}`);
    const productoId = ins.data.id;

    // 3) categorías
    if(cats.length){
      const rows = cats.map(cid => ({ producto_id: productoId, categoria_id: cid }));
      const r = await sb.from("producto_categorias").insert(rows);
      if(r.error) throw new Error(`Producto creado, pero falló producto_categorias: ${r.error.message || "no se pudieron guardar las categorías."}`);
    }

    // 4) talles (solo si aplica)
    if(shouldShowTalles()){
      const talles = Array.from(selectedTalles.values());
      if(talles.length){
        const rows = talles.map(talle => ({ producto_id: productoId, talle }));
        const r = await sb.from("producto_talles").insert(rows);
        if(r.error) throw new Error(`Producto creado, pero falló producto_talles: ${r.error.message || "no se pudieron guardar los talles."}`);
      }
    }

    // 5) fotos en producto_fotos
    // portada como orden 0
    const fotos = [{ producto_id: productoId, url: portadaUrl, orden: 0 }];

    extraUrls.forEach((url, i) => fotos.push({ producto_id: productoId, url, orden: i+1 }));

    const pf = await sb.from("producto_fotos").insert(fotos);
    if(pf.error) throw new Error(`Producto creado, pero falló producto_fotos: ${pf.error.message || "no se pudieron guardar las fotos."}`);

    setStatus("Producto guardado con éxito. Formulario listo para el siguiente.", "success");
    resetForm();
  }catch(err){
    console.error(err);
    setStatus(`Error: ${err.message || "No se pudo guardar."}`, "error");
  }finally{
    btnGuardar.disabled = false;
  }
}

/* EVENTS */
catsWrap.addEventListener("change",(e)=>{
  const el = e.target;
  if(!(el instanceof HTMLInputElement)) return;
  const id = el.dataset.catid;
  if(!id) return;

  const cid = Number(id);
  if(el.checked) selectedCats.add(cid);
  else selectedCats.delete(cid);

  syncTallesVisibility();
});

catSearch.addEventListener("input", renderCategorias);

tallesQuick.addEventListener("change",(e)=>{
  const el = e.target;
  if(!(el instanceof HTMLInputElement)) return;
  const t = el.dataset.talle;
  if(!t) return;

  if(el.checked) selectedTalles.add(t);
  else selectedTalles.delete(t);
});

btnAddTalle.addEventListener("click",()=>{
  const t = (talleManual.value || "").trim();
  if(!t) return;
  selectedTalles.add(t.toUpperCase());
  talleManual.value = "";
  renderTalles();
});

btnClearTalles.addEventListener("click",()=>{
  selectedTalles = new Set();
  renderTalles();
});

btnNuevaCategoria.addEventListener("click", openCatModal);
catModalSave.addEventListener("click", crearCategoria);
catModalInput.addEventListener("keydown", (e) => {
  if(e.key === "Enter") crearCategoria();
});

portadaFile.addEventListener("change",(e)=>{
  const f = e.target.files && e.target.files[0];
  portada = f || null;
  renderThumbs();
});

extrasFiles.addEventListener("change",(e)=>{
  const files = Array.from(e.target.files || []);
  extras = files;
  renderThumbs();
});

btnClearPortada.addEventListener("click",()=>{
  portada = null;
  portadaFile.value = "";
  renderThumbs();
});

btnClearExtras.addEventListener("click",()=>{
  extras = [];
  extrasFiles.value = "";
  renderThumbs();
});

btnGuardar.addEventListener("click", guardar);

/* INIT */
(async function init(){
  renderTalles();
  await loadCategorias();
  renderThumbs();
})();
