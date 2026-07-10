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
    const aliases = {
      "bazar-y-hogar": "bazar-hogar",
      "cosmetica-y-perfumeria": "cosmetica-perfumeria",
      "gorras-y-accesorios": "gorras-accesorios"
    };
    return `../assets/img/categorias/${aliases[name] || name}.png`;
  }
  function slug(value) { return String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/&/g, " ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
  function tag(ok, yes, no) { return `<span class="tag ${ok ? "tagOk" : "tagWarn"}">${ok ? yes : no}</span>`; }

  function edit(c) {
    const portadaField = ctx.state.categorias.some((cat) => Object.prototype.hasOwnProperty.call(cat, "portada_url")) ? `<label><span class="label">Portada URL</span><input class="input" name="portada_url" value="${H.html(c?.portada_url || "")}"></label>` : "";
    document.getElementById("catFormHost").innerHTML = `<div class="panel"><h2>${c ? "Editar" : "Crear"} categoría</h2><form class="fieldGrid" id="catForm"><label><span class="label">Nombre</span><input class="input" name="nombre" required value="${H.html(c?.nombre || "")}"></label><label><span class="label">Orden</span><input class="input" name="orden" type="number" value="${H.html(c?.orden ?? "")}"></label>${portadaField}<label class="checkLine"><input name="visible" type="checkbox" ${c?.visible !== false ? "checked" : ""}> Visible</label><label class="checkLine"><input name="usa_talles" type="checkbox" ${c?.usa_talles !== false ? "checked" : ""}> Usa talles</label><div class="actionsRow fieldSpan"><button class="btn btnPrimary">Guardar</button><button class="btn" type="button" id="cancelCat">Cancelar</button></div></form></div>`;
    document.getElementById("cancelCat").addEventListener("click", () => document.getElementById("catFormHost").innerHTML = "");
    document.getElementById("catForm").addEventListener("submit", (event) => save(event, c));
  }

  async function save(event, c) { event.preventDefault(); const f = new FormData(event.currentTarget); const payload = { nombre: f.get("nombre").trim(), orden: H.numOrNull(f.get("orden")), visible: f.get("visible") === "on", usa_talles: f.get("usa_talles") === "on" }; if (f.has("portada_url")) payload.portada_url = f.get("portada_url") || null; try { const r = c ? await ctx.sb.from("categorias").update(payload).eq("id", c.id) : await ctx.sb.from("categorias").insert(payload); if (r.error) throw r.error; document.getElementById("catFormHost").innerHTML = ""; await H.loadCore(ctx); draw(); } catch (error) { ctx.ui.notice("No se pudo guardar", H.showRlsError(error), { danger: true }); } }
  async function remove(id) { if (!await ctx.ui.modal({ title: "Eliminar categoría", message: "Si está usada por productos, puede no permitirse la eliminación.", confirmText: "Eliminar", danger: true })) return; const { error } = await ctx.sb.from("categorias").delete().eq("id", id); if (error) return ctx.ui.notice("No se pudo eliminar", H.showRlsError(error), { danger: true }); await H.loadCore(ctx); draw(); }
})();
