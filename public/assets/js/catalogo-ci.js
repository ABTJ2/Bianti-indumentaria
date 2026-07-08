(() => {
  const DEBUG_PERFORMANCE = false;
  const perfStart = performance.now();
  const perf = {
    time(label) { if (DEBUG_PERFORMANCE) console.time(`[BIANTI perf] ${label}`); },
    timeEnd(label) { if (DEBUG_PERFORMANCE) console.timeEnd(`[BIANTI perf] ${label}`); },
    log(label, start) { if (DEBUG_PERFORMANCE) console.log(`[BIANTI perf] ${label}: ${Math.round((performance.now() - start) * 100) / 100} ms`); }
  };
  const $ = (selector, root = document) => root.querySelector(selector);
  const productsEl = $('#products');
  const emptyEl = $('#empty');
  const search = $('#search');
  const drawer = $('#filterDrawer');
  const btnFilters = $('#btnFilters');
  const quickCategory = $('#quickCategory');
  const clearCategory = $('#clearCategory');
  const dynamicResults = $('#dynamicResults');
  const staticSections = Array.from(document.querySelectorAll('[data-static-section]'));
  const filterCategory = $('#filterCategory');
  const filterTalle = $('#filterTalle');
  const talleFilterWrap = $('#talleFilterWrap');
  const sort = $('#sort');
  const resultsTitle = $('#resultsTitle');
  const resultsCount = $('#resultsCount');
  const modal = $('#productModal');
  const modalImage = $('#modalProductImage');
  const modalTitle = $('#modalProductTitle');
  const modalCategory = $('#modalProductCategory');
  const modalPrice = $('#modalProductPrice');
  const modalDescription = $('#modalProductDescription');
  const modalTalles = $('#modalProductTalles');
  const modalState = $('#modalProductState');
  const modalWhatsapp = $('#modalProductWhatsapp');

  const state = { results: [], byId: new Map(), currentCategory: '', currentTalle: '', ready: true, loading: false };
  let searchTimer = null;

  function api(path) {
    const base = window.BIANTI_BASE || '/';
    return base + path.replace(/^\//, '');
  }

  function money(value) {
    return Number(value || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
  }

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
  }

  function normalizeProduct(product) {
    const id = String(product.id ?? '');
    const price = product.precio_final ?? product.precio_venta ?? product.precio ?? 0;
    return { ...product, id, precio_final: price, portada: product.portada || api('assets/img/logo.png') };
  }

  function addProducts(products, replaceResults = false) {
    const normalized = products.map(normalizeProduct).filter((product) => product.id);
    normalized.forEach((product) => {
      if (!product.id) return;
      state.byId.set(product.id, product);
    });
    if (replaceResults) state.results = normalized;
  }

  function loadStaticProducts() {
    const script = $('#biantiStaticProducts');
    if (!script) return;
    try {
      const products = JSON.parse(script.textContent || '[]');
      if (Array.isArray(products)) addProducts(products);
    } catch (error) {
      console.warn('[BIANTI catálogo] No se pudieron leer productos iniciales.', error);
    }
  }

  async function logEvent(type, payload = {}) {
    try {
      const response = await fetch(api('api/eventos'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, payload })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json().catch(() => ({}));
      if (data.warning) console.warn(`[BIANTI catálogo] ${data.warning}`);
    } catch (error) {
      console.warn(`[BIANTI catálogo] No se pudo registrar evento ${type}.`, error);
    }
  }

  async function createPedido(product) {
    if (!product?.id) return;
    const price = money(product.precio_final ?? product.precio_venta ?? product.precio ?? 0);
    const mensaje = `Consulta WhatsApp desde catálogo: ${product.titulo || 'Producto'} - Precio: ${price}`;
    try {
      const response = await fetch(api('api/pedidos'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ producto_id: product.id, mensaje })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.error || `HTTP ${response.status}`);
    } catch (error) {
      console.warn('[BIANTI catálogo] WhatsApp abrió, pero no se pudo crear el pedido en Supabase.', error);
    }
  }

  function whatsappLink(product) {
    const title = product?.titulo || 'Producto';
    const price = money(product?.precio_final ?? product?.precio_venta ?? product?.precio ?? 0);
    const id = product?.id ? ` - ID interno: #${product.id}` : '';
    const text = `Hola BIANTI, quiero consultar por este producto: ${title} - Precio: ${price}${id}`;
    return `https://wa.me/${window.BIANTI_WA || ''}?text=${encodeURIComponent(text)}`;
  }

  function productCard(product) {
    const cat = (product.categorias && product.categorias[0]) || 'Sin categoría';
    const price = product.precio_final ?? product.precio_venta ?? product.precio ?? 0;
    const before = product.oferta_descuento ? `<small class="price-before">Antes ${money(product.precio_base ?? product.precio ?? price)}</small>` : '';
    const sale = product.oferta_descuento ? `<span class="badge-sale">${esc(product.oferta_descuento)}% OFF</span>` : `<span class="badge-dark">${esc(cat)}</span>`;
    return `<article class="product-card" data-product="${esc(product.id)}">
      <img src="${esc(product.portada)}" alt="${esc(product.titulo || 'Producto')}" loading="lazy" width="360" height="420">
      <div class="product-info">
        ${sale}
        <h3>${esc(product.titulo || 'Producto')}</h3>
        ${before}
        <strong>${money(price)}</strong>
        <div class="product-actions">
          <button class="btn small btn-detail" type="button" data-id="${esc(product.id)}">Ver detalle</button>
          <a class="btn small primary" data-wa="${esc(product.id)}" href="${esc(whatsappLink(product))}" target="_blank" rel="noopener">Consultar</a>
        </div>
      </div>
    </article>`;
  }

  function updateTalleOptions() {
    if (!filterTalle || !talleFilterWrap) return;
    const all = Array.isArray(window.BIANTI_ALL_TALLES) ? window.BIANTI_ALL_TALLES : [];
    const byCategory = window.BIANTI_CATEGORY_TALLES || {};
    const list = state.currentCategory ? (byCategory[state.currentCategory] || []) : all;
    talleFilterWrap.hidden = list.length === 0;
    filterTalle.innerHTML = '<option value="">Todos los talles</option>' + list.map((talle) => `<option value="${esc(talle)}">${esc(talle)}</option>`).join('');
    if (!list.includes(state.currentTalle)) state.currentTalle = '';
    filterTalle.value = state.currentTalle;
  }

  function selectedCategoryName() {
    const value = String(state.currentCategory || '');
    if (!value) return '';
    const options = [...(filterCategory?.options || []), ...(quickCategory?.options || [])];
    const option = options.find((item) => String(item.value) === value);
    return option?.textContent?.trim() || '';
  }

  function syncCategoryControls() {
    if (filterCategory) filterCategory.value = state.currentCategory;
    if (quickCategory) quickCategory.value = state.currentCategory;
    staticSections.forEach((section) => { section.hidden = Boolean(state.currentCategory); });
  }

  function matches(product) {
    const query = (search?.value || '').trim().toLowerCase();
    if (query) {
      const text = `${product.titulo || ''} ${product.descripcion || ''} ${(product.categorias || []).join(' ')} ${(product.talles || []).join(' ')}`.toLowerCase();
      if (!text.includes(query)) return false;
    }
    if (state.currentCategory && !(product.categorias_ids || []).map(String).includes(String(state.currentCategory))) return false;
    if (state.currentTalle && !(product.talles || []).map((t) => String(t).toLowerCase()).includes(state.currentTalle.toLowerCase())) return false;
    return true;
  }

  function hasActiveQuery() {
    return Boolean((search?.value || '').trim() || state.currentCategory || state.currentTalle);
  }

  function sortProducts(products) {
    const mode = sort?.value || 'recientes';
    return [...products].sort((a, b) => {
      const pa = Number(a.precio_final ?? a.precio_venta ?? a.precio ?? 0);
      const pb = Number(b.precio_final ?? b.precio_venta ?? b.precio ?? 0);
      if (mode === 'precio_asc') return pa - pb;
      if (mode === 'precio_desc') return pb - pa;
      if (mode === 'titulo_asc') return String(a.titulo || '').localeCompare(String(b.titulo || ''), 'es');
      if (mode === 'titulo_desc') return String(b.titulo || '').localeCompare(String(a.titulo || ''), 'es');
      return Number(b.id || 0) - Number(a.id || 0);
    });
  }

  function renderProducts() {
    const start = performance.now();
    if (!productsEl) return;
    if (!hasActiveQuery()) {
      if (dynamicResults) dynamicResults.hidden = true;
      staticSections.forEach((section) => { section.hidden = false; });
      productsEl.innerHTML = '';
      if (emptyEl) emptyEl.hidden = true;
      if (resultsTitle) resultsTitle.textContent = 'Productos';
      if (resultsCount) resultsCount.textContent = '';
      perf.log('render productos vacio', start);
      return;
    }
    if (dynamicResults) dynamicResults.hidden = false;
    staticSections.forEach((section) => { section.hidden = Boolean(state.currentCategory); });
    const filtered = sortProducts(state.results.filter(matches));
    productsEl.innerHTML = filtered.map(productCard).join('');
    if (emptyEl) {
      emptyEl.hidden = filtered.length > 0 || state.loading;
      emptyEl.textContent = state.loading ? 'Cargando productos...' : 'No encontramos productos con esos filtros.';
    }
    if (resultsTitle) resultsTitle.textContent = state.currentCategory ? `Categoría: ${selectedCategoryName() || 'seleccionada'}` : 'Productos encontrados';
    if (resultsCount) resultsCount.textContent = filtered.length ? `${filtered.length} producto${filtered.length === 1 ? '' : 's'}` : '';
    perf.log('render productos terminado', start);
  }

  async function fetchProducts() {
    if (!hasActiveQuery()) {
      state.results = [];
      renderProducts();
      return;
    }
    state.loading = true;
    renderProducts();
    let fetchTimerOpen = false;
    try {
      perf.time('fetch catalogo productos');
      fetchTimerOpen = true;
      const params = new URLSearchParams();
      const query = (search?.value || '').trim();
      if (query) params.set('q', query);
      if (state.currentCategory) params.set('categoria', state.currentCategory);
      if (state.currentTalle) params.set('talle', state.currentTalle);
      if (sort?.value) params.set('sort', sort.value);
      const response = await fetch(api(`api/catalogo/productos?${params.toString()}`));
      perf.timeEnd('fetch catalogo productos');
      fetchTimerOpen = false;
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (!data.ok) throw new Error(data.error || 'Respuesta inválida');
      addProducts(Array.isArray(data.productos) ? data.productos : [], true);
      state.ready = true;
      state.loading = false;
      updateTalleOptions();
      syncCategoryControls();
      renderProducts();
    } catch (error) {
      if (fetchTimerOpen) perf.timeEnd('fetch catalogo productos');
      console.error('[BIANTI catálogo] Error cargando productos.', error);
      state.ready = true;
      state.loading = false;
      syncCategoryControls();
      renderProducts();
    }
  }

  function openFilters() {
    if (!drawer) return;
    drawer.hidden = false;
    drawer.setAttribute('aria-hidden', 'false');
    drawer.classList.add('is-open');
    document.body.classList.add('modal-open');
    btnFilters?.setAttribute('aria-expanded', 'true');
  }

  function closeFilters() {
    if (!drawer) return;
    drawer.hidden = true;
    drawer.setAttribute('aria-hidden', 'true');
    drawer.classList.remove('is-open');
    document.body.classList.remove('modal-open');
    btnFilters?.setAttribute('aria-expanded', 'false');
  }

  function openModal(product) {
    if (!modal || !product) return;
    const cat = (product.categorias && product.categorias[0]) || 'Sin categoría';
    modalImage.src = product.portada || api('assets/img/logo.png');
    modalImage.alt = product.titulo || 'Producto BIANTI';
    modalTitle.textContent = product.titulo || 'Producto';
    modalCategory.textContent = cat;
    modalPrice.textContent = money(product.precio_final ?? product.precio_venta ?? product.precio ?? 0);
    modalDescription.textContent = product.descripcion || 'Sin descripción cargada.';
    const talles = product.talles || [];
    modalTalles.innerHTML = talles.length ? talles.map((talle) => `<span class="badge-soft">Talle ${esc(talle)}</span>`).join('') : '<span class="badge-soft">Sin talle especificado</span>';
    modalState.className = `state ${product.disponible === false || product.disponible === 0 ? 'bad' : 'ok'}`;
    modalState.textContent = product.disponible === false || product.disponible === 0 ? 'No disponible' : 'Disponible';
    modalWhatsapp.dataset.wa = product.id;
    modalWhatsapp.href = whatsappLink(product);
    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
    modal.classList.add('is-open');
    document.body.classList.add('modal-open');
    logEvent('view_product', { producto_id: product.id, titulo: product.titulo || '' });
  }

  function closeModal() {
    if (!modal) return;
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
    modal.classList.remove('is-open');
    document.body.classList.remove('modal-open');
  }

  function productByTrigger(trigger) {
    const id = String(trigger?.dataset?.id || trigger?.dataset?.wa || trigger?.closest('[data-product]')?.dataset?.product || '');
    return state.byId.get(id) || null;
  }

  function consultProduct(product, fallbackHref) {
    const href = product ? whatsappLink(product) : fallbackHref;
    if (!href || href === '#') return;
    const opened = window.open(href, '_blank', 'noopener');
    if (opened) opened.opener = null;
    if (product) {
      logEvent('click_whatsapp', { producto_id: product.id, titulo: product.titulo || '', precio: product.precio_final ?? product.precio_venta ?? product.precio ?? 0 });
      createPedido(product);
    }
  }

  document.addEventListener('click', (event) => {
    const detail = event.target.closest('.btn-detail');
    if (detail) {
      event.preventDefault();
      const product = productByTrigger(detail);
      if (!product) return console.warn('[BIANTI catálogo] Producto no encontrado para detalle.', detail.dataset.id);
      openModal(product);
      return;
    }

    const wa = event.target.closest('[data-wa]');
    if (wa) {
      event.preventDefault();
      const product = productByTrigger(wa);
      consultProduct(product, wa.href);
      return;
    }

    const category = event.target.closest('.category-card[data-category]');
    if (category) {
      state.currentCategory = String(category.dataset.category || '');
      updateTalleOptions();
      syncCategoryControls();
      fetchProducts();
      dynamicResults?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      logEvent('view_category', { categoria_id: state.currentCategory });
      return;
    }

    if (event.target.closest('[data-close]')) closeFilters();
    if (event.target.closest('[data-modal-close]') || event.target === modal) closeModal();
  });

  btnFilters?.addEventListener('click', openFilters);
  $('#applyFilters')?.addEventListener('click', () => { syncCategoryControls(); closeFilters(); fetchProducts(); });
  $('#clearFilters')?.addEventListener('click', () => {
    state.currentCategory = '';
    state.currentTalle = '';
    if (filterCategory) filterCategory.value = '';
    if (quickCategory) quickCategory.value = '';
    if (filterTalle) filterTalle.value = '';
    if (search) search.value = '';
    if (sort) sort.value = 'recientes';
    state.results = [];
    updateTalleOptions();
    syncCategoryControls();
    closeFilters();
    renderProducts();
  });
  search?.addEventListener('input', () => {
    window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(fetchProducts, 250);
  });
  filterCategory?.addEventListener('change', () => { state.currentCategory = filterCategory.value; updateTalleOptions(); syncCategoryControls(); });
  quickCategory?.addEventListener('change', () => {
    state.currentCategory = quickCategory.value;
    state.currentTalle = '';
    updateTalleOptions();
    syncCategoryControls();
    fetchProducts();
    dynamicResults?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (state.currentCategory) logEvent('view_category', { categoria_id: state.currentCategory });
  });
  clearCategory?.addEventListener('click', () => {
    state.currentCategory = '';
    state.currentTalle = '';
    state.results = [];
    if (filterCategory) filterCategory.value = '';
    if (quickCategory) quickCategory.value = '';
    if (filterTalle) filterTalle.value = '';
    if (search) search.value = '';
    if (sort) sort.value = 'recientes';
    updateTalleOptions();
    syncCategoryControls();
    renderProducts();
  });
  filterTalle?.addEventListener('change', () => { state.currentTalle = filterTalle.value; });
  sort?.addEventListener('change', fetchProducts);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeFilters();
      closeModal();
    }
  });

  loadStaticProducts();
  updateTalleOptions();
  syncCategoryControls();
  renderProducts();
  document.addEventListener('DOMContentLoaded', () => perf.log('DOMContentLoaded catalogo', perfStart), { once: true });
})();
