<section class="hero-public"><div><p>Catálogo BIANTI</p><h1>Descubrí tu estilo</h1><span>Elegí una categoría, mirá destacados o buscá por nombre.</span></div></section>
<section class="catalog-container">
  <div class="search-panel">
    <input id="search" placeholder="Buscar producto por nombre... Ej: pantalón, calza, perfume">
    <button id="btnFilters" class="btn outline" type="button" aria-controls="filterDrawer" aria-expanded="false">Filtros</button>
  </div>

  <div class="quick-categories" aria-label="Acceso rápido a categorías">
    <label for="quickCategory">Categorías</label>
    <select id="quickCategory">
      <option value="">Elegir categoría</option>
      <?php foreach($categorias as $c): ?><option value="<?= e($c['id']) ?>"><?= e($c['nombre']) ?></option><?php endforeach; ?>
    </select>
    <button id="clearCategory" class="btn outline" type="button">Ver inicio</button>
  </div>

  <section id="dynamicResults" class="catalog-results" hidden>
    <div class="section-head"><h2 id="resultsTitle">Productos</h2><span id="resultsCount"></span></div>
    <div id="products" class="products-grid"></div>
    <div id="empty" class="empty" hidden>No encontramos productos con esos filtros.</div>
  </section>

  <?php if(!empty($destacados)): ?>
  <div class="catalog-static" data-static-section>
    <div class="section-head"><h2>Productos destacados</h2><span>Según interés y consultas</span></div>
    <div class="products-grid static-grid">
      <?php foreach($destacados as $p): $cat=$p['categorias'][0]??'Sin categoría'; ?>
        <article class="product-card" data-product="<?= e($p['id']) ?>">
          <img src="<?= e($p['portada'] ?: asset_url('img/logo.png')) ?>" alt="<?= e($p['titulo'] ?? 'Producto') ?>" loading="lazy" width="360" height="420">
          <div class="product-info"><span class="badge-dark"><?= e($cat) ?></span><h3><?= e($p['titulo'] ?? 'Producto') ?></h3><strong><?= money_ar($p['precio_final'] ?? $p['precio_venta'] ?? $p['precio'] ?? 0) ?></strong><?php if(!empty($p['oferta_descuento'])): ?><small class="sale-note">Oferta <?= e($p['oferta_descuento']) ?>% OFF</small><?php endif; ?><div class="product-actions"><button class="btn small btn-detail" type="button" data-id="<?= e($p['id']) ?>">Ver detalle</button><a class="btn small primary" data-wa="<?= e($p['id']) ?>" href="https://wa.me/<?= e(env_value('BIANTI_WHATSAPP','')) ?>?text=<?= urlencode('Hola BIANTI, quiero consultar por este producto: '.($p['titulo'] ?? 'Producto').' - Precio: '.money_ar($p['precio_final'] ?? $p['precio_venta'] ?? $p['precio'] ?? 0)) ?>" target="_blank" rel="noopener">Consultar</a></div></div>
        </article>
      <?php endforeach; ?>
    </div>
  </div>
  <?php endif; ?>

  <?php if(!empty($ofertas)): ?>
  <div class="catalog-static" data-static-section>
    <div class="section-head"><h2>Ofertas activas</h2><span>Promociones disponibles</span></div>
    <div class="products-grid static-grid">
      <?php foreach(array_slice($ofertas,0,6) as $p): ?>
        <article class="product-card" data-product="<?= e($p['id']) ?>"><img src="<?= e($p['portada'] ?: asset_url('img/logo.png')) ?>" alt="<?= e($p['titulo'] ?? 'Producto en oferta') ?>" loading="lazy" width="360" height="420"><div class="product-info"><span class="badge-sale"><?= e($p['oferta_descuento'] ?? '') ?>% OFF</span><h3><?= e($p['titulo'] ?? 'Producto') ?></h3><small class="price-before">Antes <?= money_ar($p['precio_base'] ?? $p['precio'] ?? 0) ?></small><strong class="price-final"><?= money_ar($p['precio_final'] ?? $p['precio_venta'] ?? 0) ?></strong><div class="product-actions"><button class="btn small btn-detail" type="button" data-id="<?= e($p['id']) ?>">Ver detalle</button><a class="btn small primary" data-wa="<?= e($p['id']) ?>" href="https://wa.me/<?= e(env_value('BIANTI_WHATSAPP','')) ?>?text=<?= urlencode('Hola BIANTI, quiero consultar por este producto: '.($p['titulo'] ?? 'Producto').' - Precio: '.money_ar($p['precio_final'] ?? $p['precio_venta'] ?? 0)) ?>" target="_blank" rel="noopener">Consultar</a></div></div></article>
      <?php endforeach; ?>
    </div>
  </div>
  <?php endif; ?>

  <div class="catalog-static" data-static-section>
    <div class="section-head"><h2>Categorías visuales</h2><span>Entrá directo a una familia de productos</span></div>
    <div class="category-grid">
      <?php foreach($categorias as $c): ?>
        <article class="category-card" data-category="<?= e($c['id']) ?>">
          <img src="<?= e($c['imagen']) ?>" alt="Categoría <?= e($c['nombre']) ?>" loading="lazy" width="360" height="240">
          <div><h3><?= e($c['nombre']) ?></h3><span>Ver productos</span></div>
        </article>
      <?php endforeach; ?>
    </div>
  </div>

  <section class="catalog-benefits catalog-static" data-static-section aria-label="Beneficios BIANTI">
    <article><strong>Calidad garantizada</strong><span>Productos seleccionados para uso diario.</span></article>
    <article><strong>Atención personalizada</strong><span>Consultanos por WhatsApp antes de comprar.</span></article>
    <article><strong>Medios de pago seguros</strong><span>Elegí la opción que más te convenga.</span></article>
  </section>
</section>

<div class="filter-drawer" id="filterDrawer" hidden aria-hidden="true">
  <div class="filter-box" role="dialog" aria-modal="true" aria-label="Filtros del catálogo">
    <button class="x" type="button" data-close aria-label="Cerrar filtros">×</button>
    <h2>Filtros</h2><p class="filter-help">Usá categorías y talles cuando correspondan. Para buscar por nombre usá el buscador.</p>
    <label>Categoría<select id="filterCategory"><option value="">Todas</option><?php foreach($categorias as $c): ?><option value="<?= e($c['id']) ?>"><?= e($c['nombre']) ?></option><?php endforeach; ?></select></label>
    <label id="talleFilterWrap">Talle<select id="filterTalle"><option value="">Todos los talles</option><?php foreach(($talles ?? []) as $t): ?><option value="<?= e($t) ?>"><?= e($t) ?></option><?php endforeach; ?></select></label>
    <label>Orden<select id="sort"><option value="recientes">Más recientes</option><option value="titulo_asc">Nombre A-Z</option><option value="titulo_desc">Nombre Z-A</option><option value="precio_asc">Precio menor a mayor</option><option value="precio_desc">Precio mayor a menor</option></select></label>
    <div class="filter-actions"><button class="btn primary" id="applyFilters" type="button">Aplicar filtros</button><button class="btn outline" id="clearFilters" type="button">Limpiar</button></div>
  </div>
</div>
<div class="product-modal" id="productModal" hidden aria-hidden="true">
  <div class="product-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="modalProductTitle">
    <button class="product-modal__close" type="button" data-modal-close aria-label="Cerrar detalle">×</button>
    <img id="modalProductImage" class="product-modal__image" src="<?= asset_url('img/logo.png') ?>" alt="">
    <div class="product-modal__content">
      <span id="modalProductCategory" class="badge-dark">Categoría</span>
      <h2 id="modalProductTitle">Producto</h2>
      <strong id="modalProductPrice" class="product-modal__price"></strong>
      <p id="modalProductDescription" class="product-modal__description"></p>
      <div id="modalProductTalles" class="product-modal__chips"></div>
      <span id="modalProductState" class="state ok"></span>
      <a id="modalProductWhatsapp" class="btn primary" data-wa="" href="#" target="_blank" rel="noopener">Consultar por WhatsApp</a>
    </div>
  </div>
</div>
<script type="application/json" id="biantiStaticProducts"><?= json_encode(array_values(array_merge($destacados ?? [], $ofertas ?? [])), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) ?></script>
<script>window.BIANTI_CATEGORY_TALLES = <?= json_encode($tallesPorCategoria ?? [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) ?>; window.BIANTI_ALL_TALLES = <?= json_encode($talles ?? [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) ?>;</script>
