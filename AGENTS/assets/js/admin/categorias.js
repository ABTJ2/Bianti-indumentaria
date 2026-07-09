// assets/js/admin/categorias.js
// CRUD: categorias (id, nombre, orden, visible)

const supabase = window.supabaseClient;
const tabla = document.getElementById("tablaCats");
const btnNueva = document.getElementById("btnNuevaCat");

if (!supabase) {
  console.error("No existe window.supabaseClient. Revisá assets/js/supabase.js");
}

// ---- Render tabla ----
function renderTabla(rows) {
  const head = `
    <thead>
      <tr>
        <th style="width: 80px">ID</th>
        <th>Nombre</th>
        <th style="width: 120px">Orden</th>
        <th style="width: 120px">Visible</th>
        <th style="width: 220px">Acciones</th>
      </tr>
    </thead>
  `;

  if (!rows || rows.length === 0) {
    tabla.innerHTML = head + `
      <tbody>
        <tr>
          <td colspan="5" class="muted" style="padding:16px;">
            No hay categorías todavía. Tocá <strong>Nueva</strong> para crear la primera.
          </td>
        </tr>
      </tbody>
    `;
    return;
  }

  const body = rows.map(r => `
    <tr>
      <td>${r.id}</td>
      <td><strong>${escapeHtml(r.nombre ?? "")}</strong></td>
      <td>${r.orden ?? ""}</td>
      <td>${r.visible ? "Sí" : "No"}</td>
      <td>
        <button class="btn" data-action="edit" data-id="${r.id}">Editar</button>
        <button class="btn danger" data-action="del" data-id="${r.id}">Eliminar</button>
      </td>
    </tr>
  `).join("");

  tabla.innerHTML = head + `<tbody>${body}</tbody>`;
}

// ---- Cargar ----
async function cargar() {
  const { data, error } = await supabase
    .from("categorias")
    .select("*")
    .order("orden", { ascending: true })
    .order("id", { ascending: true });

  if (error) {
    console.error(error);
    alert("Error cargando categorías");
    return;
  }

  renderTabla(data);
}

// ---- Crear / Editar (prompts simples) ----
async function upsertCategoria({ id = null, nombre, orden, visible }) {
  const payload = {
    nombre: nombre?.trim() || null,
    orden: Number.isFinite(orden) ? orden : null,
    visible: !!visible,
  };

  if (!payload.nombre) {
    alert("El nombre es obligatorio.");
    return;
  }

  let q = supabase.from("categorias");

  let resp;
  if (id) {
    resp = await q.update(payload).eq("id", id);
  } else {
    resp = await q.insert(payload);
  }

  if (resp.error) {
    console.error(resp.error);
    alert("No se pudo guardar la categoría");
    return;
  }

  await cargar();
}

// ---- Eliminar ----
async function eliminarCategoria(id) {
  const ok = confirm("¿Eliminar esta categoría? Esto no se puede deshacer.");
  if (!ok) return;

  const { error } = await supabase.from("categorias").delete().eq("id", id);
  if (error) {
    console.error(error);
    alert("No se pudo eliminar. Si está usada por productos, primero reasigná esos productos.");
    return;
  }

  await cargar();
}

// ---- UI acciones ----
btnNueva?.addEventListener("click", async () => {
  const nombre = prompt("Nombre de la categoría:");
  if (nombre === null) return;

  const ordenStr = prompt("Orden (número). Ej: 1, 2, 3:", "1");
  if (ordenStr === null) return;

  const visibleOk = confirm("¿Visible en el catálogo?");
  const orden = parseInt(ordenStr, 10);

  await upsertCategoria({ nombre, orden: Number.isNaN(orden) ? null : orden, visible: visibleOk });
});

tabla?.addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;

  const action = btn.dataset.action;
  const id = Number(btn.dataset.id);

  if (action === "del") {
    await eliminarCategoria(id);
    return;
  }

  if (action === "edit") {
    // Traemos la categoría actual
    const { data, error } = await supabase
      .from("categorias")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error(error);
      alert("No se pudo cargar la categoría para editar");
      return;
    }

    const nombre = prompt("Editar nombre:", data.nombre ?? "");
    if (nombre === null) return;

    const ordenStr = prompt("Editar orden (número):", String(data.orden ?? ""));
    if (ordenStr === null) return;

    const visibleOk = confirm(`¿Visible en el catálogo?\n\nOK = Sí | Cancelar = No`);
    const orden = parseInt(ordenStr, 10);

    await upsertCategoria({
      id,
      nombre,
      orden: Number.isNaN(orden) ? null : orden,
      visible: visibleOk,
    });
  }
});

// ---- utils ----
function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Init
cargar();
