// ./assets/js/catalogo.js
(() => {
  // Tomamos el cliente ya creado en supabase.js (NO redeclarar "supabase")
  const sb = window.supabaseClient;
  if (!sb) {
    console.error("No existe window.supabaseClient. Revisá ./assets/js/supabase.js");
    return;
  }

  // Config (ideal: que constants.js defina esto)
  const WA_NUMBER =
    window.BIANTI?.WHATSAPP_NUMBER ||
    window.WHATSAPP_NUMBER ||
    window.WA_NUMBER ||
    "";

  const WA_BASE = `https://wa.me/${WA_NUMBER}`;

  // UI refs
  const $ = (q) => document.querySelector(q);
  const grid = $("#grid");
  const empty = $("#empty");
  const q = $("#q");
  const cat = $("#cat");
  const catChips = $("#cat-chips");
  const activeFilters = $("#active-filters");
  const btnOpenFilters = $("#btn-open-filters");
  const filtersCount = $("#filters-count");
  const filterModal = $("#filter-modal");
  const filterCat = $("#filter-cat");
  const filterPriceMin = $("#filter-price-min");
  const filterPriceMax = $("#filter-price-max");
  const filterSort = $("#filter-sort");
  const filterOnlyAvailable = $("#filter-only-available");
  const btnApplyFilters = $("#btn-apply-filters");
  const btnClearFilters = $("#btn-clear-filters");

  const statProductos = $("#stat-productos");
  const statCategorias = $("#stat-categorias");

  const btnWaTop = $("#btn-wa-top");
  const btnWaBottom = $("#btn-wa-bottom");
  const footerWaLink = $("#footer-wa-link");

  // Modal refs
  const modal = $("#modal");
  const mImg = $("#m-img");
  const mZoom = $("#m-zoom");
  const mThumbs = $("#m-thumbs");
  const mCat = $("#m-cat");
  const mTitle = $("#m-title");
  const mPrice = $("#m-price");
  const mDesc = $("#m-desc");
  const mSizes = $("#m-sizes");
  const mWa = $("#m-wa");
  const lightbox = $("#lightbox");
  const lightboxImg = $("#lightbox-img");

  // Carousel
  const carouselTrack = $("#carousel-track");
  const carouselDots = $("#carousel-dots");

  // State
  let productos = [];
  let categorias = [];
  let displayCategorias = [];
  let categoryAliases = new Map();
  let fotosByProducto = new Map();
  let tallesByProducto = new Map();
  let categoriasByProducto = new Map();

  let filtered = [];
  let currentCatId = "";
  let currentQuery = "";
  let currentPriceMin = "";
  let currentPriceMax = "";
  let currentSort = "relevancia";
  let currentOnlyAvailable = false;

  // Helpers
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (m) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[m]));

  const normalizeText = (value) => String(value || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

  const uniqBy = (items, keyFn) => {
    const seen = new Set();
    return (items || []).filter((item) => {
      const key = keyFn(item);
      if (!key || seen.has(key)) return false
      seen.add(key);
      return True;
    });
  };

  const money = (n) => {
    const v = Number(n || 0);
    try {
      return v.toLocaleString("es-AR", { style: "currency", currency: "ARS" });
    } catch {
      return `$ ${v}`;
    }
  };

  const buildWaMessage = (p, extra = {}) => {
    const titulo = p?.titulo || p?.nombre || `Producto #${p?.id ?? ""}`;
    const catName = extra?.categoria_nombre || "";
    const precio = extra?.precio_txt || "";

    // Mensaje de consulta profesional.
    const lines = [
      "!Hola!",
      "Quiero consultar por este producto:",
      `• ${titulo}${catName ? ` (${catName})` : ""}`,
      precio ? `• Precio: ${precio}` : null,
      "¿Esta disponible?",
    ].filter(Boolean);

    return lines.join("\n");
  };

  const buildWaText = (p, extra = {}) => encodeURIComponent(buildWaMessage(p, extra));

  const waLink = (textEncoded) => `${WA_BASE}?text=${textEncoded}`;

  async function crearPedidoWhatsapp(p, extra = {}) {
    const precio = getPrecio(p);
    const mensaje = buildWaMessage(p, extra);

    const { error } = await sb.from("pedidos").insert([{
      producto_id: p?.id ?? null,
      producto_titulo: p?.titulo || p?.nombre || null,
      producto_precio: Number.isFinite(Number(precio)) ? Number(precio) : null,
      producto_imagen: getCoverUrl(p) || null,
      estado: "en_revision",
      mensaje,
      origen: "catalogo_whatsapp",
      created_at: new Date().toISOString(),
    }]);

    if (error) throw error;
  }

  async function handleWhatsappClick(e, p, extra = {}) {
    e.preventDefault();
    const url = waLink(buildWaText(p, extra));
    const waWindow = window.open("", "_blank");
    if (waWindow) waWindow.opener = null;

    try {
      await crearPedidoWhatsapp(p, extra);
    } catch (err) {
      console.error("No se pudo guardar la consulta de WhatsApp:", err);
    } finally {
      if (waWindow) {
        waWindow.location.href = url;
      } else {
        window.location.href = url;
      }
    }
  }

  const formatPhone = (value) => {
    const digits = String(value || "").replace(/\D/g, "");
    if (digits === "5492645694047") return "+54 9 264 569 4047";
    return digits ? `+${digits}` : "";
  };

  async function logEvent(type, payload) {
    try {
      // Tabla eventos: id, created_at, type, payload
      await sb.from("eventos").insert([{ type, payload }]);
    } catch (e) {
      // no rompemos UX por tracking
      console.warn("Tracking falló:", e?.message || e);
    }
  }

  function setGlobalWaButtons() {
    if (!WA_NUMBER) {
      [btnWaTop, btnWaBottom, footerWaLink].forEach((el) => {
        if (!el) return;
        el.hidden = true;
        el.removeAttribute("href");
      });
      return;
    }
    const text = encodeURIComponent("Hola! Quiero hacer una consulta.");
    const url = waLink(text);
    if (btnWaTop) btnWaTop.href = url;
    if (btnWaBottom) btnWaBottom.href = url;
    if (footerWaLink) {
      footerWaLink.href = url;
      footerWaLink.textContent = formatPhone(WA_NUMBER);
      footerWaLink.hidden = false;
    }
  }

  function openModal() {
    modal?.setAttribute("aria-hidden", "false");
    modal?.classList.add("is-open");
    document.documentElement.classList.add("modal-open");
  }

  function closeModal() {
    modal?.setAttribute("aria-hidden", "true");
    modal?.classList.remove("is-open");
    closeLightbox();
    document.documentElement.classList.remove("modal-open");
  }

  function openLightbox() {
    const src = mImg?.getAttribute("src") || "";
    if (!lightbox || !lightboxImg || !src) return;
    lightboxImg.src = src;
    lightboxImg.alt = mImg.alt || "Imagen de producto";
    lightbox.setAttribute("aria-hidden", "false");
    lightbox.classList.add("is-open");
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.setAttribute("aria-hidden", "true");
    lightbox.classList.remove("is-open");
    if (lightboxImg) {
      lightboxImg.src = "";
      lightboxImg.alt = "";
    }
  }

  function bindModalClose() {
    if (!modal) return;
    modal.addEventListener("click", (e) => {
      const t = e.target;
      if (t?.closest?.("[data-close]")) closeModal();
    });
    window.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      if (lightbox?.classList.contains("is-open")) {
        closeLightbox();
        return;
      }
      if (filterModal?.classList.contains("is-open")) {
        closeFilterModal();
        return;
      }
      if (modal.classList.contains("is-open")) closeModal();
    });
  }

  function bindLightbox() {
    lightbox?.addEventListener("click", (e) => {
      const t = e.target;
      if (t?.closest?.("[data-lightbox-close]")) closeLightbox();
    });
    mImg?.addEventListener("click", openLightbox);
    mZoom?.addEventListener("click", openLightbox);
  }

  function getCategoriaNombre(p) {
    const rel = categoriasByProducto.get(String(p.id)) || [];
    const names = rel.length
      ? rel.map((id) => categorias.find((x) => String(x.id) === String(id))?.nombre || categorias.find((x) => String(x.id) === String(id))?.titulo)
      : [categorias.find((x) => String(x.id) === String(p.categoria_id))?.nombre || categorias.find((x) => String(x.id) === String(p.categoria_id))?.titulo];

    const clean = [];
    const seen = new Set();
    names.filter(Boolean).forEach((name) => {
      const key = normalizeText(name);
      if (!key || seen.has(key)) return;
      seen.add(key);
      clean.push(String(name).trim());
    });
    return clean.join(", ");
  }

  function getProductCategoryNames(p) {
    return getCategoriaNombre(p).split(",").map((v) => v.trim()).filter(Boolean);
  }

  function getPrimaryCategoryName(p) {
    const names = getProductCategoryNames(p);
    return names[0] || "Sin categoría";
  }

  function getPrecio(p) {
    // No explota si no existe precio_final.
    return p.precio_final ?? p.precio ?? p.price ?? 0;
  }

  function getCoverUrl(p) {
    return p.portada_url || p.imagen_url || p.foto_url || "";
  }

  function getGalleryUrls(p) {
    const urls = [];
    const seen = new Set();
    const addUrl = (url) => {
      const value = String(url || "").trim();
      if (!value || seen.has(value)) return;
      seen.add(value);
      urls.push(value);
    };

    addUrl(p.portada_url);
    (fotosByProducto.get(p.id) || []).forEach((foto) => addUrl(foto.url));
    return urls;
  }

  function buildDisplayCategorias() {
    const usedIds = new Set();
    productos.forEach((p) => {
      const rel = categoriasByProducto.get(String(p.id)) || [];
      if (rel.length) rel.forEach((id) => usedIds.add(String(id)));
      else if (p.categoria_id != null) usedIds.add(String(p.categoria_id));
    });

    const groups = new Map();
    categorias
      .filter((c) => usedIds.has(String(c.id)))
      .forEach((c) => {
        const name = String(c.nombre || c.titulo || "").trim();
        if (!name) return;
        const key = normalizeText(name);
        if (!groups.has(key)) {
          groups.set(key, { id: String(c.id), nombre: name, aliasIds: [String(c.id)] });
        } else {
          const g = groups.get(key);
          if (!g.aliasIds.includes(String(c.id))) g.aliasIds.push(String(c.id));
        }
      });

    displayCategorias = Array.from(groups.values())
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" }));
    categoryAliases = new Map(displayCategorias.map((c) => [String(c.id), c.aliasIds.slice()]));
  }

  function syncCategoryUI() {
    if (cat) cat.value = currentCatId;
    if (filterCat) filterCat.value = currentCatId;
    if (catChips) {
      catChips.querySelectorAll(".catChip").forEach((btn) => {
        btn.classList.toggle("is-active", String(btn.dataset.id || "") === String(currentCatId || ""));
      });
    }
  }

  function getActiveFiltersData() {
    const items = [];
    if (currentCatId) {
      const c = displayCategorias.find((x) => String(x.id) === String(currentCatId)) || categorias.find((x) => String(x.id) === String(currentCatId));
      if (c?.nombre) items.push({ label: `Categoría: ${c.nombre}` });
    }
    if (currentPriceMin) items.push({ label: `Desde ${money(currentPriceMin)}` });
    if (currentPriceMax) items.push({ label: `Hasta ${money(currentPriceMax)}` });
    if (currentOnlyAvailable) items.push({ label: "Solo disponibles" });
    if (currentSort && currentSort !== "relevancia") {
      const sortLabels = { precio_asc: "Precio ↑", precio_desc: "Precio ↓", titulo_asc: "Nombre A-Z", titulo_desc: "Nombre Z-A", nuevos: "Más nuevos" };
      items.push({ label: sortLabels[currentSort] || currentSort });
    }
    return items;
  }

  function renderActiveFilters() {
    if (!activeFilters) return;
    const items = getActiveFiltersData();
    activeFilters.hidden = items.length === 0;
    activeFilters.innerHTML = items.map((item) => `<span class="activeFilterTag">${esc(item.label)}</span>`).join("");
    if (filtersCount) {
      filtersCount.hidden = items.length === 0;
      filtersCount.textContent = String(items.length);
    }
  }

  function openFilterModal() {
    if (!filterModal) return;
    if (filterCat) filterCat.value = currentCatId;
    if (filterPriceMin) filterPriceMin.value = currentPriceMin;
    if (filterPriceMax) filterPriceMax.value = currentPriceMax;
    if (filterSort) filterSort.value = currentSort;
    if (filterOnlyAvailable) filterOnlyAvailable.checked = currentOnlyAvailable;
    filterModal.setAttribute("aria-hidden", "false");
    filterModal.classList.add("is-open");
    document.documentElement.classList.add("modal-open");
  }

  function closeFilterModal() {
    if (!filterModal) return;
    filterModal.setAttribute("aria-hidden", "true");
    filterModal.classList.remove("is-open");
    document.documentElement.classList.remove("modal-open");
  }

  function applyFilters() {
    const qq = currentQuery.trim().toLowerCase();
    const cid = String(currentCatId || "");
    const priceMin = currentPriceMin !== "" ? Number(currentPriceMin) : null;
    const priceMax = currentPriceMax !== "" ? Number(currentPriceMax) : null;

    filtered = productos.filter((p) => {
      const titulo = String(p.titulo || p.nombre || "").toLowerCase();
      const desc = String(p.descripcion || "").toLowerCase();
      const catText = String(getCategoriaNombre(p) || "").toLowerCase();
      const precio = Number(getPrecio(p) || 0);
      const matchQ = !qq || titulo.includes(qq) || desc.includes(qq) || catText.includes(qq) || String(p.id || "").includes(qq);
      const rel = categoriasByProducto.get(String(p.id)) || [];
      const aliasIds = categoryAliases.get(cid) || [cid];
      const matchC = !cid || aliasIds.includes(String(p.categoria_id)) || rel.some((id) => aliasIds.includes(String(id)));
      const matchMin = priceMin == null || precio >= priceMin;
      const matchMax = priceMax == null || precio <= priceMax;
      const matchAvailable = !currentOnlyAvailable || !!p.disponible;
      return matchQ && matchC && matchMin && matchMax && matchAvailable;
    });

    filtered.sort((a, b) => {
      if (currentSort === "precio_asc") return Number(getPrecio(a) || 0) - Number(getPrecio(b) || 0);
      if (currentSort === "precio_desc") return Number(getPrecio(b) || 0) - Number(getPrecio(a) || 0);
      if (currentSort === "titulo_asc") return String(a.titulo || a.nombre || "").localeCompare(String(b.titulo || b.nombre || ""), "es", { sensitivity: "base" });
      if (currentSort === "titulo_desc") return String(b.titulo || b.nombre || "").localeCompare(String(a.titulo || a.nombre || ""), "es", { sensitivity: "base" });
      if (currentSort === "nuevos") return Number(b.id || 0) - Number(a.id || 0);
      return 0;
    });

    renderActiveFilters();
    syncCategoryUI();
    renderGrid();
  }

  function renderProductCard(p) {
    const catName = getPrimaryCategoryName(p);
    const precioTxt = money(getPrecio(p));
    const cover = getCoverUrl(p);
    const talles = (tallesByProducto.get(p.id) || []).slice(0, 3);
    const hasCover = cover && cover.length > 0;
    return `
      <article class="card card--catalog" data-id="${esc(p.id)}">
        <div class="card__media">
          ${hasCover
            ? `<img src="${esc(cover)}" alt="${esc(p.titulo || p.nombre || "Producto")}" loading="lazy">`
            : `<div class="img-placeholder"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>`
          }
        </div>
        <div class="card__body">
          <div class="card__meta">
            <span class="badge badge--category">${esc(catName || "Sin categoría")}</span>
            ${p.disponible ? `<span class="badge badge--availability">Disponible</span>` : ``}
          </div>
          <h3 class="card__title">${esc(p.titulo || p.nombre || `Producto #${p.id}`)}</h3>
          <div class="card__price">${esc(precioTxt)}</div>
          ${talles.length ? `<div class="card__sizes">${talles.map((t) => `<span class="sizePill">${esc(t)}</span>`).join("")}</div>` : ``}
          <div class="card__actions">
            <button class="btn btn--ghost btn-detail" type="button" data-id="${esc(p.id)}">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              Ver detalle
            </button>
            <a class="btn btn--primary btn-wa" target="_blank" rel="noopener" data-id="${esc(p.id)}" href="${waLink(buildWaText(p, { categoria_nombre: catName, precio_txt: precioTxt }))}">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
              Consultar
            </a>
          </div>
        </div>
      </article>
    `;
  }

  function shouldGroupByCategory() {
    return !currentQuery.trim() && !currentCatId && currentPriceMin === "" && currentPriceMax === "" && !currentOnlyAvailable;
  }

  function renderGrid() {
    if (!grid) return;

    if (!filtered.length) {
      grid.innerHTML = "";
      if (empty) empty.hidden = false;
      return;
    }
    if (empty) empty.hidden = true;

    if (shouldGroupByCategory()) {
      const sectionHtml = [];
      const assigned = new Set();

      displayCategorias.forEach((catItem) => {
        const aliasIds = catItem.aliasIds || [String(catItem.id)];
        const items = filtered.filter((p) => {
          if (assigned.has(String(p.id))) return false;
          const rel = categoriasByProducto.get(String(p.id)) || [];
          const match = aliasIds.includes(String(p.categoria_id)) || rel.some((id) => aliasIds.includes(String(id)));
          if (match) assigned.add(String(p.id));
          return match;
        });
        if (!items.length) return;
        sectionHtml.push(`
          <section class="catalogCategoryBlock">
            <div class="catalogCategoryHead">
              <h3>${esc(catItem.nombre)}</h3>
              <span>${items.length} producto(s)</span>
            </div>
            <div class="grid grid--category">
              ${items.map(renderProductCard).join("")}
            </div>
          </section>
        `);
      });

      const sinCategoria = filtered.filter((p) => !assigned.has(String(p.id)));
      if (sinCategoria.length) {
        sectionHtml.push(`
          <section class="catalogCategoryBlock">
            <div class="catalogCategoryHead">
              <h3>Otros productos</h3>
              <span>${sinCategoria.length} producto(s)</span>
            </div>
            <div class="grid grid--category">
              ${sinCategoria.map(renderProductCard).join("")}
            </div>
          </section>
        `);
      }

      grid.innerHTML = `<div class="catalogSections">${sectionHtml.join("")}</div>`;
    } else {
      grid.innerHTML = filtered.map(renderProductCard).join("");
    }

    grid.querySelectorAll(".btn-detail").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const p = productos.find((x) => String(x.id) === String(id));
        if (p) openProduct(p);
      });
    });
  }

  function renderCategoriasSelect() {
    if (!cat && !catChips && !filterCat) return;
    const base = `<option value="">Todas las categorías</option>`;
    const opts = displayCategorias
      .slice()
      .sort((a, b) => String(a.nombre || "").localeCompare(String(b.nombre || ""), "es", { sensitivity: "base" }))
      .map((c) => `<option value="${esc(c.id)}">${esc(c.nombre || `Cat #${c.id}`)}</option>`)
      .join("");
    if (cat) cat.innerHTML = base + opts;
    if (filterCat) filterCat.innerHTML = base + opts;

    if (catChips) {
      const chips = displayCategorias
        .slice()
        .sort((a, b) => String(a.nombre || "").localeCompare(String(b.nombre || ""), "es", { sensitivity: "base" }))
        .map((c) => `<button class="catChip" type="button" data-id="${esc(c.id)}">${esc(c.nombre || `Cat #${c.id}`)}</button>`)
        .join("");
      catChips.innerHTML = `<button class="catChip is-active" type="button" data-id="">Todas</button>${chips}`;

      catChips.querySelectorAll(".catChip").forEach((btn) => {
        btn.addEventListener("click", () => {
          currentCatId = btn.dataset.id || "";
          syncCategoryUI();
          if (currentCatId) {
            const c = displayCategorias.find((x) => String(x.id) === String(currentCatId)) || categorias.find((x) => String(x.id) === String(currentCatId));
            logEvent("view_category", { categoria_id: currentCatId, categoria_nombre: c?.nombre || null });
          }
          applyFilters();
        });
      });
    }

    syncCategoryUI();
  }

  function renderCarousel() {
    if (!carouselTrack || !carouselDots) return;

    const items = productos.slice(0, 6);
    if (!items.length) {
      carouselTrack.innerHTML = "";
      carouselDots.innerHTML = "";
      return;
    }

    carouselTrack.innerHTML = items.map((p, idx) => {
      const cover = getCoverUrl(p);
      const catName = getCategoriaNombre(p);
      return `
        <div class="carousel__item ${idx === 0 ? "is-active" : ""}" data-idx="${idx}">
          <img src="${esc(cover)}" alt="${esc(p.titulo || p.nombre || "")}" loading="lazy">
          <div class="carousel__cap">
            <div class="carousel__capTitle">${esc(p.titulo || p.nombre || "")}</div>
            <div class="carousel__capSub">${esc(catName || "")}</div>
          </div>
        </div>
      `;
    }).join("");

    carouselDots.innerHTML = items.map((_, idx) =>
      `<button class="dot ${idx === 0 ? "is-active" : ""}" data-idx="${idx}" aria-label="Slide ${idx + 1}"></button>`
    ).join("");

    const setIdx = (n) => {
      carouselTrack.querySelectorAll(".carousel__item").forEach((el) => {
        el.classList.toggle("is-active", Number(el.dataset.idx) === n);
      });
      carouselDots.querySelectorAll(".dot").forEach((el) => {
        el.classList.toggle("is-active", Number(el.dataset.idx) === n);
      });
    };

    carouselDots.querySelectorAll(".dot").forEach((b) => {
      b.addEventListener("click", () => setIdx(Number(b.dataset.idx)));
    });

    let idx = 0;
    setInterval(() => {
      idx = (idx + 1) % items.length;
      setIdx(idx);
    }, 5000);
  }

  function openProduct(p) {
    const catName = getCategoriaNombre(p);
    const precioTxt = money(getPrecio(p));

    mCat.textContent = catName || "—";
    mTitle.textContent = p.titulo || p.nombre || `Producto #${p.id}`;
    mPrice.textContent = precioTxt;
    mDesc.textContent = p.descripcion || "Consultá por WhatsApp para más detalles.";

    // Gallery
    const list = getGalleryUrls(p);
    const hasModalImg = list[0] && list[0].length > 0;
    mImg.style.display = hasModalImg ? "block" : "none";
    if (mZoom) mZoom.hidden = !hasModalImg;
    if (hasModalImg) {
      mImg.src = list[0];
      mImg.alt = p.titulo || p.nombre || "Producto";
    } else {
      mImg.src = "";
      mImg.alt = "";
      mImg.style.display = "none";
    }

    mThumbs.innerHTML = list.length
      ? list.map((u, idx) => `
        <button class="thumb ${idx === 0 ? "is-active" : ""}" type="button" data-url="${esc(u)}">
          <img src="${esc(u)}" alt="Foto ${idx + 1}">
        </button>
      `).join("")
      : `<span class="muted">Sin imagen</span>`;

    mThumbs.querySelectorAll(".thumb").forEach((t) => {
      t.addEventListener("click", () => {
        mThumbs.querySelectorAll(".thumb").forEach((x) => x.classList.remove("is-active"));
        t.classList.add("is-active");
        mImg.src = t.dataset.url;
        mImg.alt = p.titulo || p.nombre || "Producto";
      });
    });

    grid.querySelectorAll(".btn-wa").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const id = btn.dataset.id;
        const p = productos.find((x) => String(x.id) === String(id));
        if (!p) return;
        handleWhatsappClick(e, p, { categoria_nombre: getCategoriaNombre(p), precio_txt: money(getPrecio(p)) });
      });
    });

    // Sizes
    const talles = (tallesByProducto.get(p.id) || []).filter(Boolean);
    if (talles.length) {
      mSizes.innerHTML = talles.map((t) => `<span class="chip">${esc(t)}</span>`).join("");
    } else {
      mSizes.innerHTML = `<span class="chip chip--muted">Consultar</span>`;
    }

    // WhatsApp link
    mWa.href = waLink(buildWaText(p, { categoria_nombre: catName, precio_txt: precioTxt }));
    mWa.onclick = (e) => handleWhatsappClick(e, p, { categoria_nombre: catName, precio_txt: precioTxt });

    // Tracking
    logEvent("view_product", {
      producto_id: p.id,
      producto_titulo: p.titulo || p.nombre || null,
      categoria_id: p.categoria_id || null,
      categoria_nombre: catName || null,
    });

    openModal();
  }

  async function loadData() {
    setGlobalWaButtons();

    // Productos (select * para NO romper por columnas faltantes).
    const { data: prods, error: e1 } = await sb
      .from("productos")
      .select("*")
      .eq("visible", true)
      .order("id", { ascending: false });

    if (e1) {
      console.error("Error cargando productos:", e1);
      productos = [];
    } else {
      productos = prods || [];
    }

    const productoIds = productos.map((p) => p.id).filter((id) => id !== undefined && id !== null);

    // Categorías.
    const { data: cats, error: e2 } = await sb
      .from("categorias")
      .select("*")
      .order("id", { ascending: true });

    if (e2) {
      console.error("Error cargando categorías:", e2);
      categorias = [];
    } else {
      categorias = cats || [];
    }

    // Fotos, categorías y talles solo de productos visibles. Esto acelera bastante cuando hay muchos productos.
    fotosByProducto = new Map();
    categoriasByProducto = new Map();
    tallesByProducto = new Map();

    if (productoIds.length) {
      try {
        const { data: fotos, error: e3 } = await sb
          .from("producto_fotos")
          .select("producto_id,url,orden")
          .in("producto_id", productoIds)
          .order("orden", { ascending: true });

        if (!e3 && fotos?.length) {
          fotos.forEach((f) => {
            const pid = f.producto_id;
            if (!fotosByProducto.has(pid)) fotosByProducto.set(pid, []);
            fotosByProducto.get(pid).push({ url: f.url });
          });
        }
      } catch (err) {
        // no pasa nada
      }

      try {
        const { data: rels, error: eRel } = await sb
          .from("producto_categorias")
          .select("producto_id,categoria_id")
          .in("producto_id", productoIds);

        if (!eRel && rels?.length) {
          rels.forEach((r) => {
            const pid = String(r.producto_id);
            if (!categoriasByProducto.has(pid)) categoriasByProducto.set(pid, []);
            categoriasByProducto.get(pid).push(r.categoria_id);
          });
        }
      } catch (err) {
        // no pasa nada
      }

      try {
        const { data: talles, error: eTalles } = await sb
          .from("producto_talles")
          .select("producto_id,talle")
          .in("producto_id", productoIds);

        if (!eTalles && talles?.length) {
          talles.forEach((v) => {
            const pid = v.producto_id;
            const talle = v.talle || null;
            if (!pid || !talle) return;
            if (!tallesByProducto.has(pid)) tallesByProducto.set(pid, []);
            if (!tallesByProducto.get(pid).includes(talle)) tallesByProducto.get(pid).push(talle);
          });
        }
      } catch (err) {
        // no pasa nada
      }
    }

    buildDisplayCategorias();

    // Stats
    if (statProductos) statProductos.textContent = String(productos.length || 0);
    if (statCategorias) statCategorias.textContent = String(displayCategorias.length || 0);

    renderCategoriasSelect();
    applyFilters();
    renderCarousel();
  }

  function bindFilters() {
    if (q) {
      q.addEventListener("input", () => {
        currentQuery = q.value || "";
        applyFilters();
      });
    }
    if (cat) {
      cat.addEventListener("change", () => {
        currentCatId = cat.value || "";
        syncCategoryUI();
        if (currentCatId) {
          const c = displayCategorias.find((x) => String(x.id) === String(currentCatId)) || categorias.find((x) => String(x.id) === String(currentCatId));
          logEvent("view_category", { categoria_id: currentCatId, categoria_nombre: c?.nombre || null });
        }
        applyFilters();
      });
    }

    btnOpenFilters?.addEventListener("click", openFilterModal);
    btnApplyFilters?.addEventListener("click", () => {
      currentCatId = filterCat?.value || "";
      currentPriceMin = filterPriceMin?.value || "";
      currentPriceMax = filterPriceMax?.value || "";
      currentSort = filterSort?.value || "relevancia";
      currentOnlyAvailable = !!filterOnlyAvailable?.checked;
      closeFilterModal();
      applyFilters();
    });
    btnClearFilters?.addEventListener("click", () => {
      currentCatId = "";
      currentPriceMin = "";
      currentPriceMax = "";
      currentSort = "relevancia";
      currentOnlyAvailable = false;
      if (filterCat) filterCat.value = "";
      if (filterPriceMin) filterPriceMin.value = "";
      if (filterPriceMax) filterPriceMax.value = "";
      if (filterSort) filterSort.value = "relevancia";
      if (filterOnlyAvailable) filterOnlyAvailable.checked = false;
      syncCategoryUI();
      applyFilters();
    });

    filterModal?.addEventListener("click", (e) => {
      if (e.target === filterModal || e.target.closest("[data-filter-close]")) closeFilterModal();
    });
  }

  // Init
  bindModalClose();
  bindLightbox();
  bindFilters();
  loadData();
})();
