(function () {
  window.BiantiAdminModules = window.BiantiAdminModules || {};
  window.BiantiAdminModules.productos = { init };
  let ctx, H;
  let page = 1;

  async function init(context) {
    ctx = context;
    H = ctx.helpers;
    await H.loadCore(ctx);
    fillFilters();
    bind();
    draw();
  }

  function fillFilters() {
    document.getElementById("prodCat").innerHTML += ctx.state.categorias.map((c) => `<option value="${H.html(c.id)}">${H.html(c.nombre)}</option>`).join("");
  }

  function bind() {
    ["prodQ", "prodCat", "prodVisible", "prodAvail", "prodMin", "prodMax", "prodPageSize"].forEach((id) => document.getElementById(id).addEventListener("input", () => { page = 1; draw(); }));
    document.getElementById("prodClear").addEventListener("click", () => { ["prodQ", "prodCat", "prodVisible", "prodAvail", "prodMin", "prodMax"].forEach((id) => document.getElementById(id).value = ""); page = 1; draw(); });
    document.getElementById("prodPrev").addEventListener("click", () => { page = Math.max(1, page - 1); draw(); });
    document.getElementById("prodNext").addEventListener("click", () => { page += 1; draw(); });
    document.getElementById("newProduct").addEventListener("click", () => edit(null));
  }

  function filteredRows() {
    const q = document.getElementById("prodQ").value.trim().toLowerCase();
    const cat = document.getElementById("prodCat").value;
    const vis = document.getElementById("prodVisible").value;
    const av = document.getElementById("prodAvail").value;
    const min = H.numOrNull(document.getElementById("prodMin").value);
    const max = H.numOrNull(document.getElementById("prodMax").value);
    return ctx.state.productos.filter((p) => {
      const matchesQ = !q || `${p.id} ${p.titulo || ""}`.toLowerCase().includes(q);
      const matchesCat = !cat || H.catsOf(ctx, p.id).includes(cat);
      const matchesVisible = vis === "" || String(p.visible !== false ? 1 : 0) === vis;
      const matchesAvailable = av === "" || String(p.disponible !== false ? 1 : 0) === av;
      const matchesPrice = (min == null || Number(p.precio || 0) >= min) && (max == null || Number(p.precio || 0) <= max);
      return matchesQ && matchesCat && matchesVisible && matchesAvailable && matchesPrice;
    });
  }

  function draw() {
    const rows = filteredRows();
    const size = Number(document.getElementById("prodPageSize").value || 25);
    const totalPages = Math.max(1, Math.ceil(rows.length / size));
    page = Math.min(page, totalPages);
    const chunk = rows.slice((page - 1) * size, page * size);
    document.getElementById("prodRows").innerHTML = chunk.map(row).join("") || `<tr><td colspan="9">${H.empty("Sin productos para los filtros seleccionados.")}</td></tr>`;
    document.getElementById("prodCount").textContent = `${rows.length} encontrados · ${ctx.state.productos.length} totales`;
    document.getElementById("prodPageInfo").textContent = `Página ${page} de ${totalPages}`;
    document.getElementById("prodPrev").disabled = page <= 1;
    document.getElementById("prodNext").disabled = page >= totalPages;
    document.querySelectorAll("[data-edit]").forEach((b) => b.addEventListener("click", () => edit(ctx.state.productos.find((p) => String(p.id) === String(b.dataset.edit)))));
    document.querySelectorAll("[data-toggle]").forEach((b) => b.addEventListener("click", () => toggle(b.dataset.id, b.dataset.toggle)));
    document.querySelectorAll("[data-delete]").forEach((b) => b.addEventListener("click", () => remove(b.dataset.delete)));
  }

  function cover(p) { return p.portada_url || ctx.state.fotos.find((foto) => String(foto.producto_id) === String(p.id))?.url || ""; }
  function tags(values) { return values.length ? values.map((value) => `<span class="chip">${H.html(value)}</span>`).join("") : "-"; }
  function stateTag(ok, yes, no) { return `<span class="tag ${ok ? "tagOk" : "tagWarn"}">${ok ? yes : no}</span>`; }

  function row(p) {
    const img = cover(p);
    const cats = H.catNames(ctx, p.id);
    const talles = H.tallesOf(ctx, p.id);
    const name = p.titulo || `Producto #${p.id}`;
    const description = p.descripcion || "";
    const catsText = cats || "Sin categoría";
    const tallesText = talles.join(", ") || "Sin talles";
    return `<tr>
      <td data-label="Foto">${img ? `<img class="thumbSmall" src="${H.html(img)}" alt="">` : `<div class="thumbBox">Sin foto</div>`}</td>
      <td data-label="ID">#${H.html(p.id)}</td>
      <td data-label="Nombre"><div class="rowTitle"><strong title="${H.html(name)}">${H.html(name)}</strong><small title="${H.html(description)}">${H.html(description.slice(0, 70))}</small></div></td>
      <td data-label="Categoría"><span class="cellEllipsis" title="${H.html(catsText)}">${H.html(catsText)}</span></td>
      <td data-label="Talles"><span class="chipList" title="${H.html(tallesText)}">${tags(talles)}</span></td>
      <td data-label="Precio">${H.money(p.precio)}</td>
      <td data-label="Visible">${stateTag(p.visible !== false, "Visible", "Oculto")}</td>
      <td data-label="Disponible">${stateTag(p.disponible !== false, "Disponible", "No disponible")}</td>
      <td class="actionsCell" data-label="Acciones"><div class="productActionsGrid"><button class="btn btnSmall" title="Editar producto" aria-label="Editar producto ${H.html(name)}" data-edit="${p.id}">Editar</button><button class="btn btnSmall ${p.visible !== false ? "btnStateOn" : "btnStateOff"}" title="${p.visible !== false ? "Ocultar producto" : "Mostrar producto"}" aria-label="${p.visible !== false ? "Ocultar" : "Mostrar"} producto ${H.html(name)}" data-toggle="visible" data-id="${p.id}">${p.visible !== false ? "Visible" : "Oculto"}</button><button class="btn btnSmall ${p.disponible !== false ? "btnStateOn" : "btnStateOff"}" title="${p.disponible !== false ? "Marcar no disponible" : "Marcar disponible"}" aria-label="${p.disponible !== false ? "Marcar no disponible" : "Marcar disponible"} ${H.html(name)}" data-toggle="disponible" data-id="${p.id}">${p.disponible !== false ? "Stock" : "Sin stock"}</button><button class="btn btnDanger btnSmall" title="Eliminar producto" aria-label="Eliminar producto ${H.html(name)}" data-delete="${p.id}">Eliminar</button></div></td>
    </tr>`;
  }

  function edit(product) {
    const selectedCats = new Set(product ? H.catsOf(ctx, product.id) : []);
    const selectedTalles = product ? H.tallesOf(ctx, product.id).join(", ") : "";
    document.getElementById("productFormHost").innerHTML = `<div class="panel"><h2>${product ? "Editar" : "Crear"} producto</h2><form class="fieldGrid" id="productForm"><label><span class="label">Título</span><input class="input" name="titulo" required value="${H.html(product?.titulo || "")}"></label><label><span class="label">Precio venta</span><input class="input" name="precio" type="number" step="0.01" value="${H.html(product?.precio || "")}"></label><label><span class="label">Precio costo</span><input class="input" name="precio_costo" type="number" step="0.01" value="${H.html(product?.precio_costo || "")}"></label><label><span class="label">Talles</span><input class="input" name="talles" placeholder="S, M, L" value="${H.html(selectedTalles)}"></label><label class="fieldSpan"><span class="label">Descripción</span><textarea class="textarea" name="descripcion">${H.html(product?.descripcion || "")}</textarea></label><label><span class="label">Portada</span><input class="input" name="foto" type="file" accept="image/*"></label><label class="checkLine"><input name="visible" type="checkbox" ${product?.visible !== false ? "checked" : ""}> Visible</label><label class="checkLine"><input name="disponible" type="checkbox" ${product?.disponible !== false ? "checked" : ""}> Disponible</label><div class="fieldSpan"><span class="label">Categorías</span><div class="checkGrid">${ctx.state.categorias.map((c) => `<label class="checkLine"><input type="checkbox" name="categoria" value="${H.html(c.id)}" ${selectedCats.has(String(c.id)) ? "checked" : ""}> ${H.html(c.nombre)}</label>`).join("")}</div></div><div class="actionsRow fieldSpan"><button class="btn btnPrimary" type="submit">Guardar</button><button class="btn" type="button" id="cancelProductForm">Cancelar</button></div></form><div class="status hidden" id="productFormStatus"></div></div>`;
    document.getElementById("cancelProductForm").addEventListener("click", () => document.getElementById("productFormHost").innerHTML = "");
    document.getElementById("productForm").addEventListener("submit", (event) => save(event, product));
  }

  async function save(event, product) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    let portadaUrl = product?.portada_url || null;
    const file = form.get("foto");
    try {
      if (file && file.size) portadaUrl = await H.uploadProductImage(ctx, file, product?.id || "nuevo");
      const payload = { titulo: form.get("titulo").trim(), descripcion: form.get("descripcion").trim() || null, precio: H.numOrNull(form.get("precio")), precio_costo: H.numOrNull(form.get("precio_costo")), visible: form.get("visible") === "on", disponible: form.get("disponible") === "on", portada_url: portadaUrl };
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
  async function remove(id) { const [pedidos, ventas] = await Promise.all([H.safeQuery("pedidos vinculados", ctx.sb.from("pedidos").select("id,estado").eq("producto_id", id)), H.safeQuery("ventas vinculadas", ctx.sb.from("ventas").select("id").eq("producto_id", id))]); if (pedidos.some((p) => p.estado === "vendido") || ventas.length) { ctx.ui.notice("No se elimina", "El producto tiene venta o pedido vendido asociado. Se conserva el historial.", { danger: true }); return; } if (!await ctx.ui.modal({ title: "Eliminar producto", message: "Se limpiarán relaciones directas, eventos y ofertas temporales si la operación está permitida.", confirmText: "Eliminar", danger: true })) return; try { await ctx.sb.from("producto_categorias").delete().eq("producto_id", id); await ctx.sb.from("producto_talles").delete().eq("producto_id", id); await ctx.sb.from("producto_fotos").delete().eq("producto_id", id); await ctx.sb.from("eventos").delete().eq("producto_id", id); H.setOffers(H.getOffers().filter((o) => String(o.producto_id) !== String(id))); const { error } = await ctx.sb.from("productos").delete().eq("id", id); if (error) throw error; await H.loadCore(ctx); draw(); } catch (error) { ctx.ui.notice("No se pudo eliminar", H.showRlsError(error), { danger: true }); } }
  function box(id, message, type) { const el = document.getElementById(id); el.textContent = message; el.className = `status ${type}`; el.classList.remove("hidden"); }
})();
