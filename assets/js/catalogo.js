// ./assets/js/catalogo.js
(() => {
  // ✅ Tomamos el cliente ya creado en supabase.js (NO redeclarar "supabase")
  const sb = window.supabaseClient;
  if (!sb) {
    console.error("No existe window.supabaseClient. Revisá ./assets/js/supabase.js");
    return;
  }

  // ✅ Config (ideal: que constants.js defina esto)
  const WA_NUMBER =
    window.WHATSAPP_NUMBER ||
    window.WA_NUMBER ||
    "5490000000000"; // <- poné tu número si no lo tenés en constants.js

  const WA_BASE = `https://wa.me/${WA_NUMBER}`;

  // UI refs
  const $ = (q) => document.querySelector(q);
  const grid = $("#grid");
  const empty = $("#empty");
  const q = $("#q");
  const cat = $("#cat");

  const statProductos = $("#stat-productos");
  const statCategorias = $("#stat-categorias");

  const btnWaTop = $("#btn-wa-top");
  const btnWaBottom = $("#btn-wa-bottom");

  // Modal refs
  const modal = $("#modal");
  const mImg = $("#m-img");
  const mThumbs = $("#m-thumbs");
  const mCat = $("#m-cat");
  const mTitle = $("#m-title");
  const mPrice = $("#m-price");
  const mDesc = $("#m-desc");
  const mSizes = $("#m-sizes");
  const mWa = $("#m-wa");

  // Carousel
  const carouselTrack = $("#carousel-track");
  const carouselDots = $("#carousel-dots");

  // State
  let productos = [];
  let categorias = [];
  let fotosByProducto = new Map();
  let tallesByProducto = new Map();

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

    // ✅ Mensaje más “pro” (y no el que no te gustaba)
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
    const text = encodeURIComponent("Hola! Quiero hacer una consulta 🙂");
    const url = waLink(text);
    if (btnWaTop) btnWaTop.href = url;
    if (btnWaBottom) btnWaBottom.href = url;
  }

  function openModal() {
    modal?.setAttribute("aria-hidden", "false");
    modal?.classList.add("is-open");
    document.documentElement.classList.add("modal-open");
  }

  function closeModal() {
    modal?.setAttribute("aria-hidden", "true");
    modal?.classList.remove("is-open");
    document.documentElement.classList.remove("modal-open");
  }

  function bindModalClose() {
    if (!modal) return;
    modal.addEventListener("click", (e) => {
      const t = e.target;
      if (t?.dataset?.close != null) closeModal();
    });
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal.classList.contains("is-open")) closeModal();
    });
  }

  function getCategoriaNombre(p) {
    const c = categorias.find((x) => String(x.id) === String(p.categoria_id));
    return c?.nombre || c?.titulo || "";
  }

  function getPrecio(p) {
    // ✅ No explota si no existe precio_final
    return p.precio_final ?? p.precio ?? p.price ?? 0;
  }

  function getCoverUrl(p) {
    const arr = fotosByProducto.get(p.id) || [];
    const first = arr[0];
    return first?.url || p.imagen_url || p.foto_url || "./assets/img/placeholder.jpg";
  }

  function applyFilters() {
    const qq = currentQuery.trim().toLowerCase();
    const cid = String(currentCatId || "");

    filtered = productos.filter((p) => {
      const titulo = String(p.titulo || p.nombre || "").toLowerCase();
      const desc = String(p.descripcion || "").toLowerCase();
      const matchQ = !qq || titulo.includes(qq) || desc.includes(qq);
      const matchC = !cid || String(p.categoria_id) === cid;
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

      return `
        <article class="card" data-id="${esc(p.id)}">
          <div class="card__media">
            <img src="${esc(cover)}" alt="${esc(p.titulo || p.nombre || "Producto")}" loading="lazy">
          </div>
          <div class="card__body">
            <div class="card__meta">
              <span class="badge">${esc(catName || "Sin categoría")}</span>
            </div>
            <h3 class="card__title">${esc(p.titulo || p.nombre || `Producto #${p.id}`)}</h3>
            <div class="card__price">${esc(precioTxt)}</div>
            <div class="card__actions">
              <button class="btn btn--ghost btn-detail" type="button" data-id="${esc(p.id)}">Ver detalle</button>
              <a class="btn btn--primary btn-wa" target="_blank" rel="noopener"
                 href="${waLink(buildWaText(p, { categoria_nombre: catName, precio_txt: precioTxt }))}">
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
    if (!cat) return;
    const base = `<option value="">Todas las categorías</option>`;
    const opts = categorias
      .slice()
      .sort((a, b) => String(a.nombre || "").localeCompare(String(b.nombre || "")))
      .map((c) => `<option value="${esc(c.id)}">${esc(c.nombre || c.titulo || `Cat #${c.id}`)}</option>`)
      .join("");
    cat.innerHTML = base + opts;
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
    const arr = fotosByProducto.get(p.id) || [];
    const list = arr.length ? arr.map((x) => x.url) : [getCoverUrl(p)];
    mImg.src = list[0] || "./assets/img/placeholder.jpg";
    mImg.alt = p.titulo || p.nombre || "Producto";

    mThumbs.innerHTML = list.map((u, idx) => `
      <button class="thumb ${idx === 0 ? "is-active" : ""}" type="button" data-url="${esc(u)}">
        <img src="${esc(u)}" alt="Foto ${idx + 1}">
      </button>
    `).join("");

    mThumbs.querySelectorAll(".thumb").forEach((t) => {
      t.addEventListener("click", () => {
        mThumbs.querySelectorAll(".thumb").forEach((x) => x.classList.remove("is-active"));
        t.classList.add("is-active");
        mImg.src = t.dataset.url;
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

    // ✅ Productos (select * para NO romper por columnas faltantes)
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

    // ✅ Categorías
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

    // ✅ Fotos (si existe tabla producto_fotos)
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

    // ✅ Variantes -> talles (si existe tabla variantes)
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
  bindFilters();
  loadData();
})();
