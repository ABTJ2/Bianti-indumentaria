(function () {
  window.BiantiAdminModules = window.BiantiAdminModules || {};
  window.BiantiAdminModules.categorias = { init };
  let ctx, H;

  async function init(context) {
    ctx = context;
    H = ctx.helpers;
    await H.loadCore(ctx);
    document.getElementById("newCat").addEventListener("click", () => edit(null));
    draw();
  }

  function draw() {
    document.getElementById("catRows").innerHTML = ctx.state.categorias.map(row).join("") || `<tr><td colspan="8">${H.empty("Sin categorías.")}</td></tr>`;
    document.getElementById("catCount").textContent = `${ctx.state.categorias.length} categorías`;
    document.querySelectorAll("[data-cat-img]").forEach((img) => img.addEventListener("error", () => { img.closest(".thumbBox").textContent = "Sin foto"; img.remove(); }));
    document.querySelectorAll("[data-edit]").forEach((b) => b.addEventListener("click", () => edit(ctx.state.categorias.find((c) => String(c.id) === String(b.dataset.edit)))));
    document.querySelectorAll("[data-delete]").forEach((b) => b.addEventListener("click", () => remove(b.dataset.delete)));
  }

  function row(c) {
    const name = c.nombre || `Categoría #${c.id}`;
    return `<tr>
      <td data-label="Portada"><div class="thumbBox">${categoryImage(c) ? `<img data-cat-img src="${H.html(categoryImage(c))}" alt="">` : "Sin foto"}</div></td>
      <td data-label="ID">#${H.html(c.id)}</td>
      <td data-label="Nombre"><span class="cellEllipsis" title="${H.html(name)}"><strong>${H.html(name)}</strong></span></td>
      <td data-label="Orden">${H.html(c.orden ?? "-")}</td>
      <td data-label="Visible">${tag(c.visible !== false, "Visible", "Oculta")}</td>
      <td data-label="Usa talles">${tag(c.usa_talles !== false, "Sí", "No")}</td>
      <td data-label="Productos">${ctx.state.rels.filter((r) => String(r.categoria_id) === String(c.id)).length}</td>
      <td class="actionsCell" data-label="Acciones"><div class="categoryActions"><button class="btn btnSmall" title="Editar categoría" aria-label="Editar categoría ${H.html(name)}" data-edit="${c.id}">Editar</button><button class="btn btnDanger btnSmall" title="Eliminar categoría" aria-label="Eliminar categoría ${H.html(name)}" data-delete="${c.id}">Eliminar</button></div></td>
    </tr>`;
  }

  function categoryImage(c) {
    if (c.portada_url) return c.portada_url;
    const name = slug(c.nombre || "");
    if (!name) return "";
    const aliases = { "bazar-y-hogar": "bazar-hogar", "cosmetica-y-perfumeria": "cosmetica-perfumeria", "gorras-y-accesorios": "gorras-accesorios", "bolsos-y-mochilas": "bolsos-mochilas", "ropa-interior": "ropa-interior-full" };
    return `../assets/img/categorias/${aliases[name] || name}.png?v=2026-07-13-stock-ventas-portadas`;
  }
  function slug(value) { return String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/&/g, " ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
  function tag(ok, yes, no) { return `<span class="tag ${ok ? "tagOk" : "tagWarn"}">${ok ? yes : no}</span>`; }
  function hasPortadaColumn() { return ctx.state.categorias.some((cat) => Object.prototype.hasOwnProperty.call(cat, "portada_url")); }

  function edit(c) {
    const current = c ? categoryImage(c) : "";
    const portadaControls = hasPortadaColumn() ? `<div class="fieldSpan coverEditor"><span class="label">Portada</span><div class="coverPreview" id="catCoverPreview">${current ? `<img src="${H.html(current)}" alt="Portada actual">` : "Sin portada"}</div><div class="actionsRow"><label class="btn btnSmall" for="catCoverFile">Cambiar imagen</label><input class="hidden" id="catCoverFile" name="portada_file" type="file" accept="image/jpeg,image/jpg,image/png,image/webp"><button class="btn btnSmall" type="button" id="catRemoveCover">Quitar imagen</button></div><small class="fine">JPG, JPEG, PNG o WEBP. Máximo 5 MB.</small></div>` : `<div class="fieldSpan coverEditor"><span class="label">Portada</span><div class="coverPreview" id="catCoverPreview">${current ? `<img src="${H.html(current)}" alt="Portada actual">` : "Sin portada"}</div><small class="fine">La edición de portada no está disponible por el momento.</small></div>`;
    document.getElementById("catFormHost").innerHTML = `<div class="panel"><h2>${c ? "Editar" : "Crear"} categoría</h2><form class="fieldGrid categoryForm" id="catForm"><label><span class="label">Nombre</span><input class="input" name="nombre" required value="${H.html(c?.nombre || "")}"></label><label><span class="label">Orden</span><input class="input" name="orden" type="number" value="${H.html(c?.orden ?? "")}"></label><div class="categoryChecks"><label class="checkLine"><input name="visible" type="checkbox" ${c?.visible !== false ? "checked" : ""}> Visible</label><label class="checkLine"><input name="usa_talles" type="checkbox" ${c?.usa_talles !== false ? "checked" : ""}> Usa talles</label></div>${portadaControls}<div class="actionsRow fieldSpan"><button class="btn btnPrimary" type="submit">Guardar</button><button class="btn" type="button" id="cancelCat">Cancelar</button></div></form><div class="status hidden" id="catFormStatus"></div></div>`;
    const state = { removeCover: false };
    document.getElementById("cancelCat").addEventListener("click", () => document.getElementById("catFormHost").innerHTML = "");
    document.getElementById("catCoverFile")?.addEventListener("change", previewFile);
    document.getElementById("catRemoveCover")?.addEventListener("click", async () => { if (!await ctx.ui.modal({ title: "Quitar portada", message: "Se quitará la imagen personalizada de esta categoría.", confirmText: "Quitar", danger: true })) return; state.removeCover = true; document.getElementById("catCoverFile").value = ""; document.getElementById("catCoverPreview").textContent = "Se quitará al guardar"; });
    document.getElementById("catForm").addEventListener("submit", (event) => save(event, c, state));
  }

  function previewFile(event) {
    const file = event.currentTarget.files[0];
    if (!file) return;
    const error = validateImage(file);
    if (error) { box("catFormStatus", error, "error"); event.currentTarget.value = ""; return; }
    const url = URL.createObjectURL(file);
    document.getElementById("catCoverPreview").innerHTML = `<img src="${H.html(url)}" alt="Vista previa">`;
  }

  async function save(event, c, state) {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    const payload = { nombre: f.get("nombre").trim(), orden: H.numOrNull(f.get("orden")), visible: f.get("visible") === "on", usa_talles: f.get("usa_talles") === "on" };
    const file = f.get("portada_file");
    let id = c?.id;
    let uploaded = "";
    try {
      if (!id) {
        const r = await ctx.sb.from("categorias").insert(payload).select("id").single();
        if (r.error) throw r.error;
        id = r.data.id;
      } else {
        const r = await ctx.sb.from("categorias").update(payload).eq("id", id);
        if (r.error) throw r.error;
      }
      if (file && file.size) {
        const error = validateImage(file);
        if (error) throw new Error(error);
        uploaded = await uploadCategoryImage(file, id);
        const r = await ctx.sb.from("categorias").update({ portada_url: uploaded }).eq("id", id);
        if (r.error) throw r.error;
        if (c?.portada_url) await removeCoverFromStorage(c.portada_url);
      } else if (state.removeCover) {
        const r = await ctx.sb.from("categorias").update({ portada_url: null }).eq("id", id);
        if (r.error) throw r.error;
        if (c?.portada_url) await removeCoverFromStorage(c.portada_url);
      }
      document.getElementById("catFormHost").innerHTML = "";
      await H.loadCore(ctx);
      draw();
      ctx.ui.toast("Categoría guardada", "ok");
    } catch (error) {
      if (uploaded) await removeCoverFromStorage(uploaded);
      box("catFormStatus", /portada_url|schema cache|column/i.test(error.message || "") ? "La edición de portada no está disponible por el momento." : H.showRlsError(error), "error");
    }
  }

  function validateImage(file) {
    const ok = ["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type);
    if (!file.size) return "El archivo está vacío.";
    if (!ok) return "Formato no permitido. Usá JPG, JPEG, PNG o WEBP.";
    if (file.size > 5 * 1024 * 1024) return "La portada no puede superar 5 MB.";
    return "";
  }

  async function uploadCategoryImage(file, categoryId) {
    const safe = file.name.replace(/[^a-z0-9._-]+/gi, "-");
    const path = `categorias/${categoryId}/${Date.now()}-${safe}`;
    const { error } = await ctx.sb.storage.from("productos").upload(path, file, { upsert: false });
    if (error) throw new Error("No se pudo subir la imagen. Intentá nuevamente.");
    return ctx.sb.storage.from("productos").getPublicUrl(path).data.publicUrl;
  }

  async function removeCoverFromStorage(url) {
    const path = storagePath(url);
    if (!path || !path.startsWith("categorias/")) return;
    const { error } = await ctx.sb.storage.from("productos").remove([path]);
    if (error) {
      const pending = JSON.parse(localStorage.getItem("bianti_storage_pendiente") || "[]");
      localStorage.setItem("bianti_storage_pendiente", JSON.stringify([...new Set([...pending, path])]));
    }
  }

  function storagePath(value) {
    const text = String(value || "").trim();
    const marker = "/storage/v1/object/public/productos/";
    if (text.includes(marker)) return decodeURIComponent(text.split(marker)[1].split("?")[0]);
    return text.includes("/") && !text.startsWith("http") ? text : "";
  }

  async function remove(id) { if (!await ctx.ui.modal({ title: "Eliminar categoría", message: "Si está usada por productos, puede no permitirse la eliminación.", confirmText: "Eliminar", danger: true })) return; const { error } = await ctx.sb.from("categorias").delete().eq("id", id); if (error) return ctx.ui.notice("No se pudo eliminar", H.showRlsError(error), { danger: true }); await H.loadCore(ctx); draw(); }
  function box(id, message, type) { const el = document.getElementById(id); el.textContent = message; el.className = `status ${type}`; el.classList.remove("hidden"); }
})();
