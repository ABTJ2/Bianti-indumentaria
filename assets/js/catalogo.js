(async function () {
  const sb = window.supabaseClient;
  const ui = window.BiantiUI;
  const $ = (id) => document.getElementById(id);
  const state = { productos: [], categorias: [], rels: [], fotos: [], talles: [], eventos: [], ofertas: [], query: '', category: '', talle: '', minPrice: '', maxPrice: '', offer: '', sort: 'recientes' };
  let lastDetailTrigger = null;
  let galleryImages = [];
  let galleryIndex = 0;

  const els = {
    status: $('catalogStatus'), search: $('search'), quickCategory: $('quickCategory'), clearCategory: $('clearCategory'),
    featured: $('featuredGrid'), offers: $('offersGrid'), visualCategories: $('visualCategories'), dynamic: $('dynamicResults'),
    products: $('products'), empty: $('empty'), resultsTitle: $('resultsTitle'), resultsCount: $('resultsCount'), drawer: $('filterDrawer'),
    filterCategory: $('filterCategory'), filterTalle: $('filterTalle'), talleFilterWrap: $('talleFilterWrap'), filterMinPrice: $('filterMinPrice'), filterMaxPrice: $('filterMaxPrice'), filterOffer: $('filterOffer'), sort: $('sort'),
    btnFilters: $('btnFilters'), btnOpenFilters: $('btnOpenFilters'), btnWaTop: $('btnWaTop'), btnWaBottom: $('btnWaBottom'), modal: $('productModal'),
    mobileCategory: $('mobileCategory'), mobileSearch: $('mobileSearch'), mobileFilters: $('mobileFilters'), mobileSearchInput: $('mobileSearchInput'), mobileCurrentCategory: $('mobileCurrentCategory'),
    modalImage: $('modalProductImage'), modalCategory: $('modalProductCategory'), modalTitle: $('modalProductTitle'), modalPrice: $('modalProductPrice'),
    modalDescription: $('modalProductDescription'), modalTalles: $('modalProductTalles'), modalState: $('modalProductState'), modalWhatsapp: $('modalProductWhatsapp'),
    galleryPrev: $('galleryPrev'), galleryNext: $('galleryNext'), galleryCount: $('galleryCount'), galleryThumbs: $('galleryThumbs'), lightbox: $('imageLightbox'), lightboxImg: $('imageLightboxImg'), lightboxClose: $('imageLightboxClose'),
    catalogMenuBtn: $('catalogMenuBtn'), catalogMenuList: $('catalogMenuList')
  };

  function resetInitialOverlays() {
    els.modal?.classList.remove('is-open');
    els.drawer?.classList.remove('is-open');
    if (els.modal) {
      els.modal.hidden = true;
      els.modal.setAttribute('aria-hidden', 'true');
    }
    if (els.drawer) {
      els.drawer.hidden = true;
      els.drawer.setAttribute('aria-hidden', 'true');
    }
    els.btnFilters?.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('modal-open');
  }

  resetInitialOverlays();

  const categoryImages = {
    'gorras-y-accesorios': 'gorras-accesorios.png',
    'cosmetica-y-perfumeria': 'cosmetica-perfumeria.png',
    'cosmetica-perfumeria': 'cosmetica-perfumeria.png',
    electrodomesticos: 'electrodomesticos.png',
    'bazar-y-hogar': 'bazar-hogar.png',
    'bazar-hogar': 'bazar-hogar.png',
    libreria: 'libreria.png',
    indumentaria: 'indumentaria.png',
    'indumentaria-superior': 'indumentaria.png',
    'indumentaria-inferior': 'indumentaria-inferior.png',
    'bolsos-y-mochilas': 'bolsos-mochilas.png',
    jugueteria: 'jugueteria.png',
    'ropa-interior': 'ropa-interior-full.png',
    varios: 'varios.png'
  };

  function setStatus(message, type = '') {
    if (!els.status) return;
    els.status.textContent = message;
    els.status.className = `status ${type}`.trim();
    els.status.classList.toggle('hidden', !message);
  }

  function normalizeText(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
  }

  function slug(value) {
    return normalizeText(value).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'varios';
  }

  function waNumber() {
    return String(window.BIANTI?.WHATSAPP || '').replace(/\D/g, '');
  }

  function waUrl(text) {
    const encoded = encodeURIComponent(text);
    return waNumber() ? `https://wa.me/${waNumber()}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
  }

  function title(product) {
    return String(product?.titulo || product?.nombre || '').trim();
  }

  function price(product) {
    return Number(product?.precio_final ?? product?.precio_venta ?? product?.precio ?? 0) || 0;
  }

  function isVisible(product) {
    return product && product.visible !== false && product.visible !== 0 && product.disponible !== false && product.disponible !== 0;
  }

  function productCats(id) {
    const relIds = state.rels.filter((row) => String(row.producto_id) === String(id)).map((row) => String(row.categoria_id)).filter(Boolean);
    const product = state.productos.find((row) => String(row.id) === String(id));
    if (!relIds.length && product?.categoria_id) relIds.push(String(product.categoria_id));
    return Array.from(new Set(relIds));
  }

  function productTalles(id) {
    return Array.from(new Set(state.talles.filter((row) => String(row.producto_id) === String(id)).map((row) => String(row.talle || '').trim()).filter(Boolean)));
  }

  function categoryName(product) {
    const names = productCats(product.id).map((id) => state.categorias.find((cat) => String(cat.id) === id)?.nombre).filter(Boolean);
    return names.join(', ') || 'Sin categoría';
  }

  function cover(product) {
    const direct = String(product?.portada_url || '').trim();
    if (direct) return direct;
    return String(state.fotos.find((foto) => String(foto.producto_id) === String(product?.id))?.url || '').trim();
  }

  function imagesFor(product) {
    const urls = [];
    const add = (url) => {
      const clean = String(url || '').trim();
      if (clean && !urls.includes(clean)) urls.push(clean);
    };
    add(product?.portada_url);
    state.fotos.filter((foto) => String(foto.producto_id) === String(product?.id)).sort((a, b) => Number(a.orden || 0) - Number(b.orden || 0)).forEach((foto) => add(foto.url));
    return urls.length ? urls : ['./assets/img/placeholder-product.svg'];
  }

  function productImage(product) {
    const src = cover(product);
    if (!src) return '<div class="product-image-placeholder"><span>Sin imagen</span></div>';
    return `<img src="${ui.html(src)}" alt="${ui.html(title(product))}" loading="lazy" width="360" height="420">`;
  }

  function getLocalOffers() {
    try { return JSON.parse(localStorage.getItem('bianti_ofertas_static') || '[]'); } catch { return []; }
  }

  function offerDate(value) {
    const date = value ? new Date(value) : null;
    return date && !Number.isNaN(date.getTime()) ? date : null;
  }

  function normalizeOffer(offer) {
    const pct = Number(offer.porcentaje ?? offer.descuento ?? offer.discount ?? 0) || 0;
    const start = offerDate(offer.inicio ?? offer.desde ?? offer.starts_at ?? offer.created_at);
    const end = offerDate(offer.fin ?? offer.hasta ?? offer.ends_at ?? offer.expires_at);
    return {
      ...offer,
      producto_id: offer.producto_id ?? offer.product_id,
      porcentaje: pct,
      precio_anterior: Number(offer.precio_anterior ?? offer.precio_base ?? offer.original_price ?? 0) || 0,
      precio_final: Number(offer.precio_final ?? offer.final_price ?? 0) || 0,
      inicio: start,
      fin: end,
      activa: offer.activa ?? offer.active ?? offer.habilitada ?? offer.enabled
    };
  }

  function isActiveOffer(offer, product) {
    const normalized = normalizeOffer(offer);
    const now = Date.now();
    if (String(normalized.producto_id) !== String(product?.id)) return false;
    if (normalized.activa === false || normalized.activa === 0) return false;
    if (normalized.inicio && normalized.inicio.getTime() > now) return false;
    if (normalized.fin && normalized.fin.getTime() < now) return false;
    return isVisible(product);
  }

  function offerFor(id) {
    const now = Date.now();
    const product = state.productos.find((row) => String(row.id) === String(id));
    return state.ofertas.map(normalizeOffer).find((offer) => isActiveOffer(offer, product));
  }

  function withOffer(product) {
    const offer = offerFor(product.id);
    if (!offer) return product;
    const discount = Number(offer.porcentaje ?? offer.descuento ?? 0) || 0;
    const base = price(product);
    const finalPrice = Number(offer.precio_final || 0) || (discount > 0 && base > 0 ? Math.round(base * (1 - discount / 100) * 100) / 100 : base);
    return { ...product, oferta_descuento: discount, precio_base: base, precio_final: finalPrice, oferta_fin: offer.fin };
  }

  function whatsappMessage(product) {
    const item = withOffer(product);
    const name = title(item);
    const talle = state.talle ? `\nTalle: ${state.talle}` : '';
    if (item.oferta_descuento) {
      return `Hola BIANTI, quiero consultar por este producto en oferta:\n\nProducto: ${name}\nPrecio anterior: ${ui.money(item.precio_base)}\nPrecio de oferta: ${ui.money(price(item))}\nDescuento: ${item.oferta_descuento}%${talle}\n\n¿Sigue disponible la oferta?`;
    }
    return `Hola BIANTI, quiero consultar por este producto:\n\nProducto: ${name}\nPrecio: ${ui.money(price(item))}${talle}\n\n¿Está disponible?`;
  }

  async function logEvent(type, product = null, payload = {}) {
    if (!sb) return;
    const productoId = product?.id ? String(product.id) : '';
    const row = {
      type,
      ...(productoId ? { producto_id: product.id } : {}),
      payload: { ...payload, ...(productoId ? { producto_id: productoId, id: productoId } : {}) },
      created_at: new Date().toISOString()
    };
    try {
      const { error } = await sb.from('eventos').insert(row);
      if (error && productoId && /producto_id|schema cache|column/i.test(error.message || '')) {
        const { producto_id, ...fallback } = row;
        const retry = await sb.from('eventos').insert(fallback);
        if (retry.error) throw retry.error;
        return;
      }
      if (error) throw error;
    } catch (error) {
      console.warn('Evento no guardado:', error?.message || error);
    }
  }

  async function createPedido(product) {
    if (!sb || !product?.id) return;
    try {
      await sb.from('pedidos').insert({
        producto_id: product.id,
        producto_titulo: title(product),
        producto_precio: price(withOffer(product)),
        mensaje: whatsappMessage(product),
        estado: 'en_revision',
        origen: 'catalogo',
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.warn('Pedido no guardado:', error?.message || error);
    }
  }

  function card(product) {
    const item = withOffer(product);
    const name = title(item);
    if (!name) return '';
    const hasOffer = !!item.oferta_descuento;
    return `<article class="product-card" data-product="${ui.html(item.id)}">
      ${productImage(item)}
      <div class="product-info">
        <span class="${hasOffer ? 'badge-sale' : 'badge-dark'}">${hasOffer ? `OFERTA · ${ui.html(item.oferta_descuento)}% OFF` : ui.html(categoryName(item))}</span>
        <h3>${ui.html(name)}</h3>
        ${hasOffer ? `<small class="price-before">Antes ${ui.money(item.precio_base)}</small>` : ''}
        <strong class="${hasOffer ? 'price-final' : ''}">${ui.money(price(item))}</strong>
        ${hasOffer ? '<small class="sale-note">Oferta activa</small>' : ''}
        <div class="product-actions">
          <button class="btn btn-outline btn-detail" type="button" data-id="${ui.html(item.id)}">Ver detalle</button>
          <a class="btn btn-primary btn-wa" data-wa="${ui.html(item.id)}" href="${ui.html(waUrl(whatsappMessage(item)))}" target="_blank" rel="noopener">Consultar</a>
        </div>
      </div>
    </article>`;
  }

  function bindProductActions(root = document) {
    root.querySelectorAll('.btn-detail').forEach((btn) => btn.addEventListener('click', () => openDetail(btn.dataset.id, btn)));
    root.querySelectorAll('.btn-wa').forEach((link) => link.addEventListener('click', async () => {
      const product = state.productos.find((row) => String(row.id) === String(link.dataset.wa));
      if (!product) return;
      await Promise.all([createPedido(product), logEvent('click_whatsapp', product, { titulo: title(product), precio: price(withOffer(product)), talle: state.talle || null })]);
    }));
  }

  function scoreMap() {
    const map = new Map();
    state.eventos.forEach((event) => {
      let payload = event.payload || {};
      if (typeof payload === 'string') {
        try { payload = JSON.parse(payload || '{}'); } catch { payload = {}; }
      }
      const id = String(event.producto_id || payload.producto_id || payload.id || payload.product_id || '').trim();
      if (!id) return;
      const type = String(event.type || '');
      const score = type.includes('whatsapp') ? 3 : (['view_product', 'product_view'].includes(type) ? 1 : 0);
      if (score) map.set(id, (map.get(id) || 0) + score);
    });
    return map;
  }

  function categoryImage(category) {
    const src = String(category.portada_url || '').trim();
    if (src) return src;
    return `./assets/img/categorias/${categoryImages[slug(category.nombre)] || 'varios.png'}`;
  }

  function renderHome() {
    const visible = state.productos.filter(isVisible).filter(title).map(withOffer);
    const scores = scoreMap();
    const featured = visible.slice().sort((a, b) => (scores.get(String(b.id)) || 0) - (scores.get(String(a.id)) || 0) || Number(b.id || 0) - Number(a.id || 0)).slice(0, 8);
    const offers = visible.filter((product) => product.oferta_descuento).sort((a, b) => Number(b.oferta_descuento || 0) - Number(a.oferta_descuento || 0)).slice(0, 6);
    els.featured.innerHTML = featured.length ? featured.map(card).join('') : ui.empty('No hay productos visibles para mostrar.');
    els.offers.innerHTML = offers.length ? offers.map(card).join('') : ui.empty('No hay ofertas activas.');
    els.visualCategories.innerHTML = state.categorias.length ? state.categorias.map((category) => `<article class="category-card" data-category="${ui.html(category.id)}"><img src="${ui.html(categoryImage(category))}" alt="Categoría ${ui.html(category.nombre)}" loading="lazy"><div><h3>${ui.html(category.nombre)}</h3><span>Ver productos</span></div></article>`).join('') : ui.empty('No hay categorías visibles.');
    bindProductActions(document);
    els.visualCategories.querySelectorAll('[data-category]').forEach((cardEl) => cardEl.addEventListener('click', () => {
      state.category = cardEl.dataset.category;
      state.talle = '';
      syncControls();
      updateTalleOptions();
      renderCatalogMenu();
      logEvent('view_category', null, { categoria_id: state.category });
      renderResults(true);
      els.dynamic?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }));
  }

  function renderSelects() {
    const opts = state.categorias.map((category) => `<option value="${ui.html(category.id)}">${ui.html(category.nombre)}</option>`).join('');
    els.quickCategory.innerHTML = `<option value="">Elegir categoría</option>${opts}`;
    els.filterCategory.innerHTML = `<option value="">Todas</option>${opts}`;
    if (els.mobileCategory) els.mobileCategory.innerHTML = `<option value="">Todas las categorías</option>${opts}`;
    renderCatalogMenu();
    updateTalleOptions();
    syncControls();
  }

  function renderCatalogMenu() {
    if (!els.catalogMenuList) return;
    const rows = [{ id: '', nombre: 'Todos los productos' }, ...state.categorias];
    els.catalogMenuList.innerHTML = rows.map((category) => `<button type="button" role="menuitem" data-catalog-category="${ui.html(category.id)}" class="${String(state.category) === String(category.id) ? 'is-active' : ''}">${ui.html(category.nombre)}${String(state.category) === String(category.id) ? '<span>Activo</span>' : ''}</button>`).join('');
  }

  function closeCatalogMenu() {
    if (!els.catalogMenuList) return;
    els.catalogMenuList.hidden = true;
    els.catalogMenuBtn?.setAttribute('aria-expanded', 'false');
  }

  function openCatalogMenu() {
    if (!els.catalogMenuList) return;
    els.catalogMenuList.hidden = false;
    els.catalogMenuBtn?.setAttribute('aria-expanded', 'true');
    renderCatalogMenu();
    els.catalogMenuList.querySelector('.is-active, [data-catalog-category]')?.focus({ preventScroll: true });
  }

  function toggleCatalogMenu() {
    if (els.catalogMenuList?.hidden) openCatalogMenu(); else closeCatalogMenu();
  }

  function applyCatalogCategory(categoryId) {
    state.category = categoryId || '';
    state.talle = '';
    syncControls();
    updateTalleOptions();
    renderCatalogMenu();
    closeCatalogMenu();
    if (state.category) logEvent('view_category', null, { categoria_id: state.category });
    renderResults(true);
    els.dynamic?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function updateTalleOptions() {
    const ids = state.category ? new Set(state.productos.filter((product) => productCats(product.id).includes(String(state.category))).map((product) => String(product.id))) : null;
    const talles = Array.from(new Set(state.talles.filter((row) => !ids || ids.has(String(row.producto_id))).map((row) => String(row.talle || '').trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'es', { numeric: true }));
    els.talleFilterWrap.hidden = !talles.length;
    els.filterTalle.innerHTML = `<option value="">Todos los talles</option>${talles.map((talle) => `<option value="${ui.html(talle)}">${ui.html(talle)}</option>`).join('')}`;
    if (state.talle && !talles.includes(state.talle)) state.talle = '';
    els.filterTalle.value = state.talle;
  }

  function currentCategoryName() {
    if (!state.category) return 'Todas las categorías';
    return state.categorias.find((category) => String(category.id) === String(state.category))?.nombre || 'Categoría seleccionada';
  }

  function matchesQuery(product, query) {
    if (!query) return true;
    const synonyms = {
      pantalon: 'pantalones jogging jogger jean calza calzas short shorts bermuda',
      calza: 'calzas pantalon pantalones',
      remera: 'camiseta chomba musculosa blusa top',
      perfume: 'perfumes fragancia roll on cosmetica crema',
      mochila: 'mochilas bolso bolsos cartera carteras',
      bazar: 'hogar taza vaso mate termo cocina',
      juguete: 'jugueteria infantil niño niña'
    };
    const haystack = normalizeText(`${title(product)} ${product.descripcion || ''} ${categoryName(product)} ${productTalles(product.id).join(' ')}`);
    return `${query} ${synonyms[query] || ''}`.split(' ').filter(Boolean).some((word) => haystack.includes(word));
  }

  function filteredProducts() {
    const q = normalizeText(state.query);
    const min = Number(state.minPrice);
    const max = Number(state.maxPrice);
    const hasMin = Number.isFinite(min) && state.minPrice !== '';
    const hasMax = Number.isFinite(max) && state.maxPrice !== '';
    const rows = state.productos.filter((product) => isVisible(product) && title(product) && matchesQuery(product, q) && (!state.category || productCats(product.id).includes(String(state.category))) && (!state.talle || productTalles(product.id).includes(state.talle))).map(withOffer).filter((product) => {
      const productPrice = price(product);
      return (!hasMin || productPrice >= min) && (!hasMax || productPrice <= max) && (state.offer !== 'activas' || !!product.oferta_descuento);
    });
    rows.sort((a, b) => state.sort === 'titulo_asc' ? title(a).localeCompare(title(b), 'es') : state.sort === 'titulo_desc' ? title(b).localeCompare(title(a), 'es') : state.sort === 'precio_asc' ? price(a) - price(b) : state.sort === 'precio_desc' ? price(b) - price(a) : Number(b.id || 0) - Number(a.id || 0));
    return rows;
  }

  function hasActiveFilters(force = false) {
    return Boolean(force || state.query || state.category || state.talle || state.minPrice || state.maxPrice || state.offer || state.sort !== 'recientes');
  }

  function renderResults(force = false) {
    const active = hasActiveFilters(force);
    document.querySelectorAll('[data-static-section]').forEach((el) => { el.hidden = active; });
    els.dynamic.hidden = !active;
    if (!active) {
      els.products.innerHTML = '';
      els.empty.hidden = true;
      return;
    }
    const rows = filteredProducts();
    const catName = state.category ? state.categorias.find((category) => String(category.id) === String(state.category))?.nombre : '';
    els.resultsTitle.textContent = catName ? `Categoría: ${catName}` : 'Productos encontrados';
    els.resultsCount.textContent = rows.length ? `${rows.length} producto${rows.length === 1 ? '' : 's'}` : '';
    els.empty.hidden = rows.length > 0;
    els.products.innerHTML = rows.map(card).join('');
    bindProductActions(els.products);
  }

  function renderGallery() {
    const src = galleryImages[galleryIndex] || './assets/img/placeholder-product.svg';
    const isPlaceholder = src.includes('placeholder-product.svg');
    els.modalImage.hidden = false;
    els.modalImage.src = src;
    els.modalImage.alt = isPlaceholder ? 'Producto sin imagen' : `${els.modalTitle.textContent || 'Producto'} - imagen ${galleryIndex + 1}`;
    els.modalImage.classList.toggle('is-placeholder', isPlaceholder);
    els.galleryCount.textContent = `${galleryIndex + 1} de ${galleryImages.length}`;
    const hasMany = galleryImages.length > 1;
    els.galleryPrev.hidden = !hasMany;
    els.galleryNext.hidden = !hasMany;
    els.galleryThumbs.innerHTML = hasMany ? galleryImages.map((url, index) => `<button class="gallery-thumb ${index === galleryIndex ? 'is-active' : ''}" type="button" data-gallery-index="${index}" aria-label="Ver imagen ${index + 1}"><img src="${ui.html(url)}" alt="Miniatura ${index + 1}"></button>`).join('') : '';
    els.galleryThumbs.querySelectorAll('[data-gallery-index]').forEach((btn) => btn.addEventListener('click', () => setGalleryIndex(Number(btn.dataset.galleryIndex))));
  }

  function setGalleryIndex(index) {
    if (!galleryImages.length) return;
    galleryIndex = (index + galleryImages.length) % galleryImages.length;
    renderGallery();
  }

  function openLightbox() {
    const src = galleryImages[galleryIndex];
    if (!src || src.includes('placeholder-product.svg')) return;
    els.lightboxImg.src = src;
    els.lightboxImg.alt = els.modalImage.alt || 'Imagen ampliada del producto';
    els.lightbox.hidden = false;
    els.lightbox.setAttribute('aria-hidden', 'false');
    els.lightbox.classList.add('is-open');
  }

  function closeLightbox() {
    els.lightbox.hidden = true;
    els.lightbox.setAttribute('aria-hidden', 'true');
    els.lightbox.classList.remove('is-open');
    els.lightboxImg.src = '';
    els.lightboxImg.alt = '';
  }

  function openDetail(id, trigger = null) {
    const product = state.productos.find((row) => String(row.id) === String(id));
    if (!product || !title(product)) {
      ui.toast('No se pudo cargar el producto.', 'error');
      return;
    }
    closeDrawer();
    lastDetailTrigger = trigger;
    const item = withOffer(product);
    els.modalCategory.textContent = item.oferta_descuento ? `OFERTA · ${item.oferta_descuento}% OFF · ${categoryName(item)}` : categoryName(item);
    els.modalTitle.textContent = title(item);
    els.modalPrice.innerHTML = item.oferta_descuento ? `<span class="price-before">Antes ${ui.money(item.precio_base)}</span>${ui.money(price(item))}` : ui.money(price(item));
    els.modalDescription.textContent = item.descripcion || 'Sin descripción adicional';
    const talles = productTalles(item.id);
    els.modalTalles.innerHTML = talles.length ? talles.map((talle) => `<span class="badge-soft">Talle ${ui.html(talle)}</span>`).join('') : '<span class="badge-soft">Sin talle especificado</span>';
    const available = item.disponible !== false && item.disponible !== 0;
    els.modalState.textContent = available ? 'Disponible para consultar' : 'No disponible';
    els.modalState.className = `state ${available ? 'ok' : 'bad'}`;
    els.modalWhatsapp.href = waUrl(whatsappMessage(item));
    els.modalWhatsapp.dataset.wa = item.id;
    els.modal.hidden = false;
    els.modal.setAttribute('aria-hidden', 'false');
    els.modal.classList.add('is-open');
    document.body.classList.add('modal-open');
    galleryImages = imagesFor(product);
    galleryIndex = 0;
    renderGallery();
    els.modal.querySelector('[data-modal-close]')?.focus({ preventScroll: true });
    logEvent('view_product', item, { titulo: title(item) });
  }

  function closeDetail() {
    els.modal.hidden = true;
    els.modal.setAttribute('aria-hidden', 'true');
    els.modal.classList.remove('is-open');
    els.modalImage.src = '';
    els.modalImage.alt = '';
    els.modalImage.hidden = true;
    els.modalWhatsapp.dataset.wa = '';
    galleryImages = [];
    galleryIndex = 0;
    closeLightbox();
    document.body.classList.remove('modal-open');
    lastDetailTrigger?.focus?.({ preventScroll: true });
    lastDetailTrigger = null;
  }

  function openDrawer() {
    closeDetail();
    els.drawer.hidden = false;
    els.drawer.setAttribute('aria-hidden', 'false');
    els.drawer.classList.add('is-open');
    els.btnFilters?.setAttribute('aria-expanded', 'true');
    els.mobileFilters?.setAttribute('aria-expanded', 'true');
    document.body.classList.add('modal-open');
  }

  function closeDrawer() {
    els.drawer.hidden = true;
    els.drawer.setAttribute('aria-hidden', 'true');
    els.drawer.classList.remove('is-open');
    els.btnFilters?.setAttribute('aria-expanded', 'false');
    els.mobileFilters?.setAttribute('aria-expanded', 'false');
    if (els.modal.hidden) document.body.classList.remove('modal-open');
  }

  function syncControls() {
    els.quickCategory.value = state.category;
    els.filterCategory.value = state.category;
    els.filterTalle.value = state.talle;
    if (els.filterMinPrice) els.filterMinPrice.value = state.minPrice;
    if (els.filterMaxPrice) els.filterMaxPrice.value = state.maxPrice;
    if (els.filterOffer) els.filterOffer.value = state.offer;
    els.sort.value = state.sort;
    if (els.mobileCategory) els.mobileCategory.value = state.category;
    if (els.mobileSearchInput) els.mobileSearchInput.value = state.query;
    if (els.mobileCurrentCategory) els.mobileCurrentCategory.textContent = currentCategoryName();
  }

  async function safeSelect(label, query, required = false) {
    try {
      const result = await query;
      if (result.error) throw result.error;
      return result.data || [];
    } catch (error) {
      const message = `No se pudo cargar ${label}: ${error.message || error}`;
      if (required) throw new Error(message);
      console.warn(message);
      return [];
    }
  }

  async function loadCatalogEvents() {
    const withProductId = await safeSelect('métricas', sb.from('eventos').select('type,payload,producto_id,created_at').order('created_at', { ascending: false }).limit(600));
    if (withProductId.length) return withProductId;
    return safeSelect('métricas', sb.from('eventos').select('type,payload,created_at').order('created_at', { ascending: false }).limit(600));
  }

  async function load() {
    if (!sb) {
      setStatus(window.BIANTI_CONFIG_ERROR || 'No se pudo cargar la información. Intentá nuevamente.', 'error');
      return;
    }
    setStatus('Cargando catálogo...');
    try {
      const [productos, categorias, rels, fotos, talles, eventos, ofertas] = await Promise.all([
        safeSelect('productos', sb.from('productos').select('*').order('id', { ascending: false }).limit(500), true),
        safeSelect('categorías', sb.from('categorias').select('*').order('orden', { ascending: true }).order('id', { ascending: true }), true),
        safeSelect('relaciones de categorías', sb.from('producto_categorias').select('producto_id,categoria_id')),
        safeSelect('fotos de productos', sb.from('producto_fotos').select('producto_id,url,orden').order('orden', { ascending: true })),
        safeSelect('talles', sb.from('producto_talles').select('producto_id,talle')),
        loadCatalogEvents(),
        safeSelect('ofertas', sb.from('ofertas').select('*'))
      ]);
      state.productos = productos;
      state.categorias = categorias.filter((category) => category.visible !== false && category.visible !== 0 && String(category.nombre || '').trim());
      state.rels = rels;
      state.fotos = fotos;
      state.talles = talles;
      state.eventos = eventos;
      state.ofertas = ofertas.length ? ofertas : getLocalOffers();
      renderSelects();
      renderHome();
      setStatus(state.productos.length ? '' : 'No hay productos cargados por el momento.', state.productos.length ? '' : 'ok');
    } catch (error) {
      setStatus('No se pudo cargar el catálogo. Intentá nuevamente.', 'error');
      console.warn(error.message || error);
    }
  }

  [els.btnFilters, els.btnOpenFilters, els.mobileFilters].forEach((btn) => btn?.addEventListener('click', openDrawer));
  document.querySelectorAll('[data-close-filter]').forEach((btn) => btn.addEventListener('click', closeDrawer));
  els.drawer?.addEventListener('click', (event) => { if (event.target === els.drawer) closeDrawer(); });
  document.querySelectorAll('[data-modal-close]').forEach((btn) => btn.addEventListener('click', closeDetail));
  els.modal?.addEventListener('click', (event) => { if (event.target === els.modal) closeDetail(); });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (!els.lightbox?.hidden) { closeLightbox(); return; }
      closeDrawer(); closeDetail(); closeCatalogMenu();
    }
    if (!els.modal?.hidden && els.lightbox?.hidden && event.key === 'ArrowLeft') setGalleryIndex(galleryIndex - 1);
    if (!els.modal?.hidden && els.lightbox?.hidden && event.key === 'ArrowRight') setGalleryIndex(galleryIndex + 1);
  });
  document.addEventListener('click', (event) => { if (!event.target.closest('.catalog-menu')) closeCatalogMenu(); });
  els.catalogMenuBtn?.addEventListener('click', (event) => { event.stopPropagation(); toggleCatalogMenu(); });
  els.catalogMenuList?.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-catalog-category]');
    if (!btn) return;
    applyCatalogCategory(btn.dataset.catalogCategory || '');
  });
  els.catalogMenuList?.addEventListener('keydown', (event) => {
    const items = [...els.catalogMenuList.querySelectorAll('[data-catalog-category]')];
    const index = items.indexOf(document.activeElement);
    if (event.key === 'ArrowDown') { event.preventDefault(); items[(index + 1 + items.length) % items.length]?.focus(); }
    if (event.key === 'ArrowUp') { event.preventDefault(); items[(index - 1 + items.length) % items.length]?.focus(); }
    if (event.key === 'Home') { event.preventDefault(); items[0]?.focus(); }
    if (event.key === 'End') { event.preventDefault(); items[items.length - 1]?.focus(); }
  });
  els.galleryPrev?.addEventListener('click', () => setGalleryIndex(galleryIndex - 1));
  els.galleryNext?.addEventListener('click', () => setGalleryIndex(galleryIndex + 1));
  els.modalImage?.addEventListener('click', openLightbox);
  els.lightboxClose?.addEventListener('click', closeLightbox);
  els.lightbox?.addEventListener('click', (event) => { if (event.target === els.lightbox) closeLightbox(); });
  els.search?.addEventListener('input', () => { state.query = els.search.value.trim(); syncControls(); renderResults(); });
  els.mobileSearchInput?.addEventListener('input', () => { state.query = els.mobileSearchInput.value.trim(); els.search.value = state.query; renderResults(); });
  els.mobileSearch?.addEventListener('click', () => {
    if (els.mobileSearchInput?.hidden) {
      els.mobileSearchInput.hidden = false;
      els.mobileSearchInput.focus({ preventScroll: true });
      return;
    }
    state.query = els.mobileSearchInput?.value.trim() || '';
    els.search.value = state.query;
    syncControls();
    renderResults(hasActiveFilters());
    (els.dynamic && !els.dynamic.hidden ? els.dynamic : document.querySelector('[data-static-section]'))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  els.quickCategory?.addEventListener('change', () => { state.category = els.quickCategory.value; state.talle = ''; syncControls(); updateTalleOptions(); renderCatalogMenu(); if (state.category) logEvent('view_category', null, { categoria_id: state.category }); renderResults(true); });
  els.mobileCategory?.addEventListener('change', () => { state.category = els.mobileCategory.value; state.talle = ''; syncControls(); updateTalleOptions(); renderCatalogMenu(); if (state.category) logEvent('view_category', null, { categoria_id: state.category }); renderResults(!!state.category || !!state.query); });
  els.clearCategory?.addEventListener('click', () => { state.query = ''; state.category = ''; state.talle = ''; state.minPrice = ''; state.maxPrice = ''; state.offer = ''; state.sort = 'recientes'; els.search.value = ''; syncControls(); updateTalleOptions(); renderCatalogMenu(); renderResults(false); });
  $('applyFilters')?.addEventListener('click', () => { state.category = els.filterCategory.value; state.talle = els.filterTalle.value; state.minPrice = els.filterMinPrice?.value.trim() || ''; state.maxPrice = els.filterMaxPrice?.value.trim() || ''; state.offer = els.filterOffer?.value || ''; state.sort = els.sort.value; syncControls(); updateTalleOptions(); renderCatalogMenu(); closeDrawer(); if (state.category) logEvent('view_category', null, { categoria_id: state.category }); renderResults(true); });
  $('clearFilters')?.addEventListener('click', () => { state.category = ''; state.talle = ''; state.minPrice = ''; state.maxPrice = ''; state.offer = ''; state.sort = 'recientes'; syncControls(); updateTalleOptions(); renderCatalogMenu(); closeDrawer(); renderResults(!!state.query); });
  els.filterCategory?.addEventListener('change', () => { state.category = els.filterCategory.value; state.talle = ''; updateTalleOptions(); syncControls(); });
  els.filterTalle?.addEventListener('change', () => { state.talle = els.filterTalle.value; });
  els.filterMinPrice?.addEventListener('input', () => { state.minPrice = els.filterMinPrice.value.trim(); });
  els.filterMaxPrice?.addEventListener('input', () => { state.maxPrice = els.filterMaxPrice.value.trim(); });
  els.filterOffer?.addEventListener('change', () => { state.offer = els.filterOffer.value; });
  els.sort?.addEventListener('change', () => { state.sort = els.sort.value; renderResults(hasActiveFilters()); });
  [els.btnWaTop, els.btnWaBottom].forEach((link) => { if (link) link.href = waUrl('Hola BIANTI, quiero hacer una consulta.'); });
  els.modalWhatsapp?.addEventListener('click', async () => {
    const product = state.productos.find((row) => String(row.id) === String(els.modalWhatsapp.dataset.wa));
    if (product) await Promise.all([createPedido(product), logEvent('click_whatsapp', product, { titulo: title(product), precio: price(withOffer(product)), talle: state.talle || null })]);
  });

  $('footerYear').textContent = String(new Date().getFullYear());

  await load();
})();
