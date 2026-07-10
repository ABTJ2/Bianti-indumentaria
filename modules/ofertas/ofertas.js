(function () {
  window.BiantiAdminModules = window.BiantiAdminModules || {};
  window.BiantiAdminModules.ofertas = { init };
  let ctx, H;
  let page = 1;

  async function init(context) {
    ctx = context;
    H = ctx.helpers;
    await H.loadCore(ctx);
    fill();
    bind();
    draw();
  }

  function fill() {
    document.getElementById("offerCat").innerHTML += ctx.state.categorias.map((c) => `<option value="${H.html(c.id)}">${H.html(c.nombre)}</option>`).join("");
  }

  function bind() {
    ["offerQ", "offerCat", "offerState", "offerMin", "offerMax", "offerPageSize"].forEach((id) => document.getElementById(id).addEventListener("input", () => { page = 1; draw(); }));
    document.getElementById("offerClear").addEventListener("click", () => { ["offerQ", "offerCat", "offerState", "offerMin", "offerMax"].forEach((id) => document.getElementById(id).value = ""); page = 1; draw(); });
    document.getElementById("offerPrev").addEventListener("click", () => { page = Math.max(1, page - 1); draw(); });
    document.getElementById("offerNext").addEventListener("click", () => { page += 1; draw(); });
  }

  function currentOffer(productId) { return H.getOffers().find((o) => String(o.producto_id) === String(productId)); }
  function activeOffer(o) { return o && o.activa !== false && (!o.fin || new Date(o.fin).getTime() > Date.now()); }
  function cover(p) { return p.portada_url || ctx.state.fotos.find((foto) => String(foto.producto_id) === String(p.id))?.url || ""; }

  function filteredProducts() {
    const q = document.getElementById("offerQ").value.trim().toLowerCase();
    const cat = document.getElementById("offerCat").value;
    const state = document.getElementById("offerState").value;
    const min = H.numOrNull(document.getElementById("offerMin").value);
    const max = H.numOrNull(document.getElementById("offerMax").value);
    return ctx.state.productos.filter((p) => {
      const offer = currentOffer(p.id);
      const isActive = activeOffer(offer);
      const price = Number(p.precio || 0);
      return (!q || `${p.id} ${p.titulo || ""}`.toLowerCase().includes(q))
        && (!cat || H.catsOf(ctx, p.id).includes(cat))
        && (state !== "con" || !!offer)
        && (state !== "sin" || !offer)
        && (state !== "activa" || isActive)
        && (state !== "inactiva" || (offer && !isActive))
        && (min == null || price >= min)
        && (max == null || price <= max);
    });
  }

  function draw() {
    const rows = filteredProducts();
    const size = Number(document.getElementById("offerPageSize").value || 24);
    const totalPages = Math.max(1, Math.ceil(rows.length / size));
    page = Math.min(page, totalPages);
    const chunk = rows.slice((page - 1) * size, page * size);
    document.getElementById("offerCards").innerHTML = chunk.map(card).join("") || H.empty("No hay productos para esos filtros.");
    document.getElementById("offerCount").textContent = `${rows.length} productos encontrados`;
    document.getElementById("offerPageInfo").textContent = `Página ${page} de ${totalPages}`;
    document.getElementById("offerPrev").disabled = page <= 1;
    document.getElementById("offerNext").disabled = page >= totalPages;
    bindCards();
  }

  function card(p) {
    const offer = currentOffer(p.id);
    const img = cover(p);
    const pct = offer?.porcentaje ?? "";
    const final = pct !== "" ? finalPrice(p, Number(pct)) : "";
    const cats = H.catNames(ctx, p.id) || "Sin categoría";
    const status = offer ? (activeOffer(offer) ? "Oferta activa" : "Oferta inactiva") : "Sin oferta";
    const duration = offer?.fin ? H.dateTime(offer.fin) : "Sin duración";
    const name = p.titulo || `Producto #${p.id}`;
    return `<article class="offerCard" data-offer-card="${H.html(p.id)}">
      <div class="offerCardTop"><div class="offerCardMedia">${offer ? `<span class="tag ${activeOffer(offer) ? "tagOk" : "tagWarn"} offerCardBadge">${H.html(offer.porcentaje)}% OFF</span>` : `<span class="tag tagInfo offerCardBadge">Sin oferta</span>`}${img ? `<img src="${H.html(img)}" alt="${H.html(name)}">` : `<div class="thumbBox">Sin foto</div>`}</div>
      <div class="offerCardBody">
        <h3 title="${H.html(name)}">${H.html(name)}</h3>
        <div class="offerMeta"><span>ID #${H.html(p.id)}</span><span title="${H.html(cats)}">${H.html(cats)}</span><span>${H.html(status)} · ${H.html(duration)}</span></div>
        <div class="offerPrices"><div><small>Precio actual</small><strong>${H.money(p.precio)}</strong></div><div><small>Precio final</small><strong data-final-label="${H.html(p.id)}">${final === "" ? "-" : H.money(final)}</strong></div></div>
      </div></div>
      <div class="offerControls">
          <label>Descuento %<input class="input" data-offer-pct="${H.html(p.id)}" type="number" min="0" max="100" step="1" value="${H.html(pct)}"></label>
          <label>Duración<input class="input" data-offer-duration="${H.html(p.id)}" type="number" min="1" step="1" value="24"></label>
          <label>Unidad<select class="select" data-offer-unit="${H.html(p.id)}"><option value="horas">Horas</option><option value="dias">Días</option></select></label>
          <label class="checkLine"><input data-offer-active="${H.html(p.id)}" type="checkbox" ${offer?.activa !== false ? "checked" : ""}> Activa</label>
      </div>
      <div class="offerError" data-offer-error="${H.html(p.id)}" aria-live="polite"></div>
      <div class="offerCardActions"><button class="btn btnPrimary" type="button" data-save-offer="${H.html(p.id)}">Guardar</button><button class="btn" type="button" data-clear-offer="${H.html(p.id)}">Limpiar</button>${offer ? `<button class="btn btnDanger" type="button" data-delete-offer="${H.html(offer.id)}">Eliminar oferta</button>` : ""}</div>
    </article>`;
  }

  function bindCards() {
    document.querySelectorAll("[data-offer-pct]").forEach((input) => input.addEventListener("input", () => updateCardCalc(input.dataset.offerPct)));
    document.querySelectorAll("[data-save-offer]").forEach((btn) => btn.addEventListener("click", () => save(btn.dataset.saveOffer)));
    document.querySelectorAll("[data-clear-offer]").forEach((btn) => btn.addEventListener("click", () => clearCard(btn.dataset.clearOffer)));
    document.querySelectorAll("[data-delete-offer]").forEach((btn) => btn.addEventListener("click", () => deleteOffer(btn.dataset.deleteOffer)));
  }

  function productById(id) { return ctx.state.productos.find((p) => String(p.id) === String(id)); }
  function finalPrice(product, pct) { return Math.round(Number(product.precio || 0) * (1 - pct / 100) * 100) / 100; }
  function setError(id, message) { const el = document.querySelector(`[data-offer-error="${CSS.escape(String(id))}"]`); if (el) el.textContent = message || ""; }

  function validate(id) {
    const product = productById(id);
    const pct = Number(document.querySelector(`[data-offer-pct="${CSS.escape(String(id))}"]`)?.value || 0);
    const duration = Number(document.querySelector(`[data-offer-duration="${CSS.escape(String(id))}"]`)?.value || 0);
    if (!product) return { error: "No se encontró el producto." };
    if (!Number.isFinite(pct) || pct < 0) return { error: "El descuento no puede ser negativo." };
    if (pct > 100) return { error: "El descuento no puede superar 100%." };
    if (!Number.isFinite(duration) || duration < 1) return { error: "La duración debe ser mayor a cero." };
    return { product, pct, duration };
  }

  function updateCardCalc(id) {
    const result = validate(id);
    const label = document.querySelector(`[data-final-label="${CSS.escape(String(id))}"]`);
    if (result.error) {
      setError(id, result.error);
      if (label) label.textContent = "-";
      return;
    }
    setError(id, "");
    if (label) label.textContent = H.money(finalPrice(result.product, result.pct));
  }

  function save(id) {
    const result = validate(id);
    if (result.error) { setError(id, result.error); return; }
    const unit = document.querySelector(`[data-offer-unit="${CSS.escape(String(id))}"]`)?.value || "horas";
    const active = document.querySelector(`[data-offer-active="${CSS.escape(String(id))}"]`)?.checked !== false;
    const hours = unit === "dias" ? result.duration * 24 : result.duration;
    const offer = { id: currentOffer(id)?.id || `${Date.now()}`, producto_id: result.product.id, porcentaje: result.pct, precio_anterior: Number(result.product.precio || 0), precio_final: finalPrice(result.product, result.pct), inicio: new Date().toISOString(), fin: H.nowPlus(hours), activa: active };
    H.setOffers([offer, ...H.getOffers().filter((o) => String(o.producto_id) !== String(id))]);
    ctx.ui.toast("Oferta guardada", "ok");
    draw();
  }

  function clearCard(id) {
    const pct = document.querySelector(`[data-offer-pct="${CSS.escape(String(id))}"]`);
    const duration = document.querySelector(`[data-offer-duration="${CSS.escape(String(id))}"]`);
    const unit = document.querySelector(`[data-offer-unit="${CSS.escape(String(id))}"]`);
    const active = document.querySelector(`[data-offer-active="${CSS.escape(String(id))}"]`);
    if (pct) pct.value = "";
    if (duration) duration.value = "24";
    if (unit) unit.value = "horas";
    if (active) active.checked = true;
    setError(id, "");
    const label = document.querySelector(`[data-final-label="${CSS.escape(String(id))}"]`);
    if (label) label.textContent = "-";
  }

  async function deleteOffer(id) {
    if (!await ctx.ui.modal({ title: "Eliminar oferta", message: "Se eliminará la promoción temporal guardada para este producto. No elimina el producto.", confirmText: "Eliminar", danger: true })) return;
    H.setOffers(H.getOffers().filter((o) => String(o.id) !== String(id)));
    ctx.ui.toast("Oferta eliminada", "ok");
    draw();
  }
})();
