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
  let fotosByProducto = new Map();
  let tallesByProducto = new Map();
  let categoriasByProducto = new Map();

  let filtered = [];
  let currentCatId = "";
  let currentQuery = "";

  // Helpers
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (m) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[m]));

  const money = (n) => {
    const v = Number(n || 0);
    try {
      return v.toLocaleString("es-AR", { style: "currency", currency: "ARS" });
    } catch {
      return `$ ${v}`;
    }
  };

  const buildWaText = (p, extra = {}) => {
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

    return encodeURIComponent(lines.join("\n"));
  };

  const waLink = (textEncoded) => `${WA_BASE}?text=${textEncoded}`;

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
    if (rel.length) return rel.map((id) => categorias.find((x) => String(x.id) === String(id))?.nombre).filter(Boolean).join(", ");
    const c = categorias.find((x) => String(x.id) === String(p.categoria_id));
    return c?.nombre || c?.titulo || "";
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

  function applyFilters() {
    const qq = currentQuery.trim().toLowerCase();
    const cid = String(currentCatId || "");

    filtered = productos.filter((p) => {
      const titulo = String(p.titulo || p.nombre || "").toLowerCase();
      const desc = String(p.descripcion || "").toLowerCase();
      const matchQ = !qq || titulo.includes(qq) || desc.includes(qq);
      const rel = categoriasByProducto.get(String(p.id)) || [];
      const matchC = !cid || String(p.categoria_id) === cid || rel.some((id) => String(id) === cid);
      return matchQ && matchC;
    });

    renderGrid();
  }

  function renderGrid() {
    if (!grid) return;

    if (!filtered.length) {
      grid.innerHTML = "";
      if (empty) empty.hidden = false;
      return;
    }
    if (empty) empty.hidden = true;

    grid.innerHTML = filtered.map((p) => {
      const catName = getCategoriaNombre(p);
      const precioTxt = money(getPrecio(p));
      const cover = getCoverUrl(p);

      const hasCover = cover && cover.length > 0;
      return `
        <article class="card" data-id="${esc(p.id)}">
          <div class="card__media">
            ${hasCover
              ? `<img src="${esc(cover)}" alt="${esc(p.titulo || p.nombre || "Producto")}" loading="lazy">`
              : `<div class="img-placeholder"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>`
            }
          </div>
          <div class="card__body">
            <div class="card__meta">
              <span class="badge">${esc(catName || "Sin categoría")}</span>
            </div>
            <h3 class="card__title">${esc(p.titulo || p.nombre || `Producto #${p.id}`)}</h3>
            <div class="card__price">${esc(precioTxt)}</div>
            <div class="card__actions">
              <button class="btn btn--ghost btn-detail" type="button" data-id="${esc(p.id)}">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                Ver detalle
              </button>
              <a class="btn btn--primary btn-wa" target="_blank" rel="noopener"
                 href="${waLink(buildWaText(p, { categoria_nombre: catName, precio_txt: precioTxt }))}">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                WhatsApp
              </a>
            </div>
          </div>
        </article>
      `;
    }).join("");

    // bind detail buttons
    grid.querySelectorAll(".btn-detail").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const p = productos.find((x) => String(x.id) === String(id));
        if (p) openProduct(p);
      });
    });
  }

  function renderCategoriasSelect() {
    if (!cat && !catChips) return;
    const base = `<option value="">Todas las categorías</option>`;
    const opts = categorias
      .slice()
      .sort((a, b) => String(a.nombre || "").localeCompare(String(b.nombre || "")))
      .map((c) => `<option value="${esc(c.id)}">${esc(c.nombre || c.titulo || `Cat #${c.id}`)}</option>`)
      .join("");
    if (cat) cat.innerHTML = base + opts;

    if (catChips) {
      const chips = categorias
        .slice()
        .sort((a, b) => String(a.orden ?? a.nombre ?? "").localeCompare(String(b.orden ?? b.nombre ?? ""), "es", { numeric: true }))
        .map((c) => `<button class="catChip" type="button" data-id="${esc(c.id)}">${esc(c.nombre || c.titulo || `Cat #${c.id}`)}</button>`)
        .join("");
      catChips.innerHTML = `<button class="catChip is-active" type="button" data-id="">Todas</button>${chips}`;

      catChips.querySelectorAll(".catChip").forEach((btn) => {
        btn.addEventListener("click", () => {
          currentCatId = btn.dataset.id || "";
          if (cat) cat.value = currentCatId;
          catChips.querySelectorAll(".catChip").forEach((x) => x.classList.remove("is-active"));
          btn.classList.add("is-active");
          if (currentCatId) {
            const c = categorias.find((x) => String(x.id) === String(currentCatId));
            logEvent("view_category", { categoria_id: currentCatId, categoria_nombre: c?.nombre || null });
          }
          applyFilters();
        });
      });
    }
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

    // Sizes
    const talles = (tallesByProducto.get(p.id) || []).filter(Boolean);
    if (talles.length) {
      mSizes.innerHTML = talles.map((t) => `<span class="chip">${esc(t)}</span>`).join("");
    } else {
      mSizes.innerHTML = `<span class="chip chip--muted">Consultar</span>`;
    }

    // WhatsApp link
    mWa.href = waLink(buildWaText(p, { categoria_nombre: catName, precio_txt: precioTxt }));

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
      .order("id", { ascending: false });

    if (e1) {
      console.error("Error cargando productos:", e1);
      productos = [];
    } else {
      productos = prods || [];
    }

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

    // Fotos (si existe tabla producto_fotos).
    try {
      const { data: fotos, error: e3 } = await sb
        .from("producto_fotos")
        .select("*")
        .order("orden", { ascending: true });

      if (!e3 && fotos?.length) {
        fotosByProducto = new Map();
        fotos.forEach((f) => {
          const pid = f.producto_id;
          if (!fotosByProducto.has(pid)) fotosByProducto.set(pid, []);
          fotosByProducto.get(pid).push({ url: f.url });
        });
      }
    } catch (err) {
      // no pasa nada
    }

    // Relaciones producto_categorias para proyectos sin categoria_id directo.
    try {
      const { data: rels, error: eRel } = await sb
        .from("producto_categorias")
        .select("producto_id,categoria_id");

      if (!eRel && rels?.length) {
        categoriasByProducto = new Map();
        rels.forEach((r) => {
          const pid = String(r.producto_id);
          if (!categoriasByProducto.has(pid)) categoriasByProducto.set(pid, []);
          categoriasByProducto.get(pid).push(r.categoria_id);
        });
      }
    } catch (err) {
      // no pasa nada
    }

    // Variantes -> talles (si existe tabla variantes).
    try {
      const { data: vars, error: e4 } = await sb
        .from("variantes")
        .select("*");

      if (!e4 && vars?.length) {
        tallesByProducto = new Map();
        vars.forEach((v) => {
          const pid = v.producto_id;
          const talle = v.talle || v.size || null;
          if (!pid) return;
          if (!tallesByProducto.has(pid)) tallesByProducto.set(pid, []);
          if (talle && !tallesByProducto.get(pid).includes(talle)) {
            tallesByProducto.get(pid).push(talle);
          }
        });
      }
    } catch (err) {
      // no pasa nada
    }

    // Stats
    if (statProductos) statProductos.textContent = String(productos.length || 0);
    if (statCategorias) statCategorias.textContent = String(categorias.length || 0);

    renderCategoriasSelect();
    filtered = productos.slice();
    renderGrid();
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
        if (catChips) {
          catChips.querySelectorAll(".catChip").forEach((btn) => {
            btn.classList.toggle("is-active", String(btn.dataset.id || "") === String(currentCatId));
          });
        }
        // tracking view_category
        if (currentCatId) {
          const c = categorias.find((x) => String(x.id) === String(currentCatId));
          logEvent("view_category", { categoria_id: currentCatId, categoria_nombre: c?.nombre || null });
        }
        applyFilters();
      });
    }
  }

  // Init
  bindModalClose();
  bindLightbox();
  bindFilters();
  loadData();
})();
