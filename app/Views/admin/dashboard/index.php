<?php $topProduct = $stats['topProduct'] ?? null; ?>
<section class="page-head">
  <div><h1>Panel principal</h1><p>Centro de control del catálogo y flujo de ventas.</p></div>
  <div class="dashboard-actions">
    <a class="btn outline" href="<?= site_url('catalogo') ?>" target="_blank">Ver catálogo</a>
    <button class="btn" type="button" data-copy-catalog="<?= e(site_url('catalogo')) ?>">Copiar link</button>
    <a class="btn primary" target="_blank" href="https://wa.me/?text=<?= urlencode('Mirá el catálogo BIANTI: '.site_url('catalogo')) ?>">Compartir por WhatsApp</a>
  </div>
</section>
<div class="kpi-grid">
  <div class="kpi"><span>Producto más consultado</span><strong data-dashboard-activity="topProduct">Cargando...</strong></div>
  <div class="kpi"><span>Ventas confirmadas</span><strong data-dashboard-summary="vendidos">Cargando...</strong></div>
  <div class="kpi"><span>Tasa de conversión</span><strong data-dashboard-activity="conversion">Cargando...</strong></div>
  <div class="kpi"><span>Consultas WhatsApp en revisión</span><strong data-dashboard-activity="wa">Cargando...</strong></div>
  <div class="kpi"><span>Ingresos del periodo</span><strong data-dashboard-summary="ingresos">Cargando...</strong></div>
  <div class="kpi"><span>No vendidos</span><strong data-dashboard-summary="noVendidos">Cargando...</strong></div>
  <div class="kpi"><span>Productos visibles</span><strong><?= e($stats['visibles']) ?></strong></div>
  <div class="kpi"><span>Productos cargados</span><strong><?= e($stats['productos']) ?></strong></div>
</div>
<div class="dashboard-columns">
  <section class="panel"><h2>Flujo de ventas</h2><div class="stat-list"><div class="stat-line"><span>Consultas recibidas</span><strong data-dashboard-summary="pedidos">Cargando...</strong></div><div class="stat-line"><span>WhatsApp desde catálogo</span><strong data-dashboard-activity="wa">Cargando...</strong></div><div class="stat-line"><span>Pedidos vendidos</span><strong data-dashboard-summary="vendidos">Cargando...</strong></div></div></section>
  <section class="panel"><h2>Operación rápida</h2><div class="quick-grid"><a href="<?= site_url('admin/productos') ?>">Gestionar productos</a><a href="<?= site_url('admin/importar-productos') ?>">Importar productos</a><a href="<?= site_url('admin/ofertas') ?>">Crear ofertas</a><a href="<?= site_url('admin/metricas') ?>">Ver métricas</a></div></section>
</div>
<?php if(!empty($hasStock)): ?>
<section class="panel"><h2>Alertas de stock</h2><?php if(empty($stockAlerts)): ?><p class="muted">No hay productos con bajo stock.</p><?php endif; ?><div class="stat-list"><?php foreach(($stockAlerts ?? []) as $p): ?><div class="bar-row product-metric"><img src="<?= e($p['portada'] ?: asset_url('img/logo.png')) ?>" alt="<?= e($p['titulo'] ?? 'Producto') ?>"><span><?= e($p['titulo'] ?? 'Producto') ?><small>#<?= e($p['id'] ?? '-') ?> · Stock actual: <?= e($p['stock_actual_valor'] ?? 0) ?> · Stock mínimo: <?= e($p['stock_minimo_valor'] ?? 0) ?></small></span><a class="btn small" href="<?= site_url('admin/productos/editar/'.($p['id'] ?? 0)) ?>">Editar</a></div><?php endforeach; ?></div></section>
<?php endif; ?>
<section class="panel"><h2>Últimas consultas</h2><p class="muted">El resumen de ventas carga en segundo plano. Para operar consultas, entrá a Pedidos.</p><a class="btn small" href="<?= site_url('admin/pedidos') ?>">Ver pedidos</a></section>
<script>
(() => {
  const loadSummary = (selector, url) => {
    const nodes = document.querySelectorAll(selector);
    if (!nodes.length) return;
    fetch(url, {headers: {'Accept': 'application/json'}})
    .then(response => response.ok ? response.json() : null)
    .then(data => {
      if (!data) return;
      nodes.forEach(node => {
        const key = node.dataset.dashboardSummary || node.dataset.dashboardActivity;
        if (Object.prototype.hasOwnProperty.call(data, key)) node.textContent = data[key];
      });
    })
    .catch(() => nodes.forEach(node => { node.textContent = 'No disponible'; }));
  };
  loadSummary('[data-dashboard-activity]', '<?= site_url('admin/dashboard/resumen-actividad') ?>');
  loadSummary('[data-dashboard-summary]', '<?= site_url('admin/dashboard/resumen-ventas') ?>');
})();
</script>
