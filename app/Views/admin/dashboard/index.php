<?php
$views = array_filter($eventos, fn($e) => ($e['type'] ?? '') === 'view_product');
$wa = array_filter($eventos, fn($e) => ($e['type'] ?? '') === 'click_whatsapp');
$productMap = [];
foreach ($productos as $p) $productMap[(string)($p['id'] ?? '')] = $p;
$top = [];
foreach ($views as $e) {
  $payload = is_array($e['payload'] ?? null) ? $e['payload'] : json_decode((string)($e['payload'] ?? '{}'), true);
  $id = (string)($payload['producto_id'] ?? '');
  if ($id !== '') $top[$id] = ($top[$id] ?? 0) + 1;
}
arsort($top);
$topId = array_key_first($top);
$topProduct = $topId ? ($productMap[$topId] ?? null) : null;
$vendidos = count(array_filter($pedidos ?? [], fn($p) => ($p['estado'] ?? '') === 'vendido'));
$conversion = count($views) ? round((count($wa) / count($views)) * 100, 1) : 0;
$ingresos = 0;
foreach (($pedidos ?? []) as $pedido) if (($pedido['estado'] ?? '') === 'vendido') $ingresos += (float)($pedido['vendido_total'] ?? $pedido['vendido_precio_final'] ?? $pedido['producto_precio'] ?? 0);
$noVendidos = count(array_filter($pedidos ?? [], fn($p) => ($p['estado'] ?? '') === 'no_vendido'));
?>
<section class="page-head">
  <div><h1>Panel principal</h1><p>Centro de control del catálogo y flujo de ventas.</p></div>
  <div class="dashboard-actions">
    <a class="btn outline" href="<?= site_url('catalogo') ?>" target="_blank">Ver catálogo</a>
    <button class="btn" type="button" data-copy-catalog="<?= e(site_url('catalogo')) ?>">Copiar link</button>
    <a class="btn primary" target="_blank" href="https://wa.me/?text=<?= urlencode('Mirá el catálogo BIANTI: '.site_url('catalogo')) ?>">Compartir por WhatsApp</a>
  </div>
</section>
<div class="kpi-grid">
  <div class="kpi"><span>Producto más consultado</span><strong><?= e($topProduct['titulo'] ?? 'Sin datos') ?></strong></div>
  <div class="kpi"><span>Ventas confirmadas</span><strong><?= e($vendidos) ?></strong></div>
  <div class="kpi"><span>Tasa de conversión</span><strong><?= e($conversion) ?>%</strong></div>
  <div class="kpi"><span>Consultas WhatsApp en revisión</span><strong><?= e(count($wa)) ?></strong></div>
  <div class="kpi"><span>Ingresos del periodo</span><strong><?= money_ar($ingresos) ?></strong></div>
  <div class="kpi"><span>No vendidos</span><strong><?= e($noVendidos) ?></strong></div>
  <div class="kpi"><span>Productos visibles</span><strong><?= e($stats['visibles']) ?></strong></div>
  <div class="kpi"><span>Productos cargados</span><strong><?= e($stats['productos']) ?></strong></div>
</div>
<div class="dashboard-columns">
  <section class="panel"><h2>Flujo de ventas</h2><div class="stat-list"><div class="stat-line"><span>Consultas recibidas</span><strong><?= e($stats['pedidos']) ?></strong></div><div class="stat-line"><span>WhatsApp desde catálogo</span><strong><?= e(count($wa)) ?></strong></div><div class="stat-line"><span>Pedidos vendidos</span><strong><?= e($vendidos) ?></strong></div></div></section>
  <section class="panel"><h2>Operación rápida</h2><div class="quick-grid"><a href="<?= site_url('admin/productos') ?>">Gestionar productos</a><a href="<?= site_url('admin/importar-productos') ?>">Importar productos</a><a href="<?= site_url('admin/ofertas') ?>">Crear ofertas</a><a href="<?= site_url('admin/metricas') ?>">Ver métricas</a></div></section>
</div>
<section class="panel"><h2>Últimas consultas</h2><?php if(empty($pedidos)): ?><p class="muted">No hay consultas recientes.</p><?php endif; ?><div class="stat-list"><?php foreach(array_slice($pedidos ?? [], 0, 6) as $p): ?><div class="stat-line"><span><?= e($p['producto_titulo'] ?? 'Producto') ?> <small>#<?= e($p['producto_id'] ?? '-') ?></small></span><strong><?= e($p['estado'] ?? 'pendiente') ?></strong></div><?php endforeach; ?></div></section>
