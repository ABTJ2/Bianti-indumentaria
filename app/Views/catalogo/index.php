<section class="hero-public"><div><p>Catálogo BIANTI</p><h1>Descubrí tu estilo</h1><span>Elegí una categoría, mirá destacados o buscá por nombre.</span></div></section>
<section class="catalog-benefits" aria-label="Beneficios BIANTI">
  <article><strong>Calidad garantizada</strong><span>Productos seleccionados para uso diario.</span></article>
  <article><strong>Atención personalizada</strong><span>Consultanos por WhatsApp antes de comprar.</span></article>
  <article><strong>Medios de pago seguros</strong><span>Elegí la opción que más te convenga.</span></article>
</section>
<section class="catalog-container">
  <div class="search-panel">
    <input id="search" placeholder="Buscar producto por nombre... Ej: pantalón, calza, perfume">
    <button id="btnFilters" class="btn outline" type="button" aria-controls="filterDrawer" aria-expanded="false">Filtros</button>
  </div>
  <h2>Categorías</h2>
  <div class="category-grid">
    <?php foreach($categorias as $c): ?>
      <article class="category-card" data-category="<?= e($c['id']) ?>">
        <img src="<?= e($c['imagen']) ?>" alt="<?= e($c['nombre']) ?>">
        <div><h3><?= e($c['nombre']) ?></h3><span>Ver productos</span></div>
      </article>
    <?php endforeach; ?>
  </div>
  <?php if(!empty($destacados)): ?>
  <div class="section-head"><h2>Productos destacados</h2><span>Según interés y consultas</span></div>
  <div class="products-grid static-grid">
    <?php foreach($destacados as $p): $cat=$p['categorias'][0]??'Sin categoría'; ?>
      <article class="product-card" data-product="<?= e($p['id']) ?>">
        <img src="<?= e($p['portada'] ?: asset_url('img/logo.png')) ?>" alt="<?= e($p['titulo'] ?? 'Producto') ?>">
        <div class="product-info"><span class="badge-dark"><?= e($cat) ?></span><h3><?= e($p['titulo'] ?? 'Producto') ?></h3><strong><?= money_ar($p['precio_final'] ?? $p['precio_venta'] ?? $p['precio'] ?? 0) ?></strong><?php if(!empty($p['oferta_descuento'])): ?><small class="sale-note">Oferta <?= e($p['oferta_descuento']) ?>% OFF</small><?php endif; ?><div class="product-actions"><button class="btn small btn-detail" data-id="<?= e($p['id']) ?>">Ver detalle</button><a class="btn small primary" data-wa="<?= e($p['id']) ?>" href="https://wa.me/<?= e(env_value('BIANTI_WHATSAPP','')) ?>?text=<?= urlencode('Hola! Quiero consultar por '.$p['titulo']) ?>" target="_blank">Consultar</a></div></div>
      </article>
    <?php endforeach; ?>
  </div>
  <?php endif; ?>
  <?php if(!empty($ofertas)): ?>
  <div class="section-head"><h2>Ofertas</h2><span>Promociones activas</span></div>
  <div class="products-grid static-grid">
    <?php foreach(array_slice($ofertas,0,6) as $p): ?>
      <article class="product-card"><img src="<?= e($p['portada'] ?: asset_url('img/logo.png')) ?>" alt=""><div class="product-info"><span class="badge-sale"><?= e($p['oferta_descuento'] ?? '') ?>% OFF</span><h3><?= e($p['titulo'] ?? 'Producto') ?></h3><small class="price-before">Antes <?= money_ar($p['precio_base'] ?? $p['precio'] ?? 0) ?></small><strong class="price-final"><?= money_ar($p['precio_final'] ?? $p['precio_venta'] ?? 0) ?></strong></div></article>
    <?php endforeach; ?>
  </div>
  <?php endif; ?>
  <div class="section-head"><h2 id="resultsTitle">Productos</h2><span id="resultsCount"></span></div>
  <div id="products" class="products-grid"></div>
  <div id="empty" class="empty" hidden>Elegí una categoría o buscá por nombre para ver productos.</div>
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
<script>window.BIANTI_CATEGORY_TALLES = <?= json_encode($tallesPorCategoria ?? [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) ?>; window.BIANTI_ALL_TALLES = <?= json_encode($talles ?? [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) ?>;</script>
