<?php
$inversion = 0;
$valorVenta = 0;
$sinCosto = 0;
foreach ($productos as $p) {
  $costo = (float)($p['precio_costo'] ?? 0);
  if ($costo <= 0) $sinCosto++;
  $inversion += $costo;
  $valorVenta += (float)($p['precio_final'] ?? $p['precio_venta'] ?? $p['precio'] ?? 0);
}

$ingresos = 0;
$ventasCount = 0;
$porMes = [];
$sinPrecio = 0;
$sumVenta = function(array $row, array $fields, string $dateField = 'fecha') use (&$ingresos, &$ventasCount, &$porMes, &$sinPrecio) {
  $total = 0;
  foreach ($fields as $field) {
    if (isset($row[$field]) && is_numeric($row[$field])) { $total = (float)$row[$field]; break; }
  }
  if ($total <= 0) { $sinPrecio++; return; }
  $ingresos += $total;
  $ventasCount++;
  $mes = substr((string)($row[$dateField] ?? $row['created_at'] ?? date('Y-m')), 0, 7);
  $porMes[$mes] = ($porMes[$mes] ?? 0) + $total;
};

foreach ($ventas as $v) $sumVenta($v, ['total']);
foreach ($manuales as $m) $sumVenta($m, ['total']);
foreach (($pedidos ?? []) as $p) {
  if (($p['estado'] ?? '') === 'vendido') $sumVenta($p, ['vendido_total', 'vendido_precio_final', 'producto_precio', 'total', 'precio_final'], 'vendido_at');
}

ksort($porMes);
$recuperado = min($ingresos, $inversion);
$activa = max(0, $inversion - $recuperado);
$ganancia = $ingresos - $inversion;
$cajaTotal = $ingresos;
$cajaLibre = max(0, $ingresos - $activa);
$ticket = $ventasCount ? ($ingresos / $ventasCount) : 0;
?>
<section class="page-head"><div><h1>Contabilidad</h1><p>Inversión, recuperación, ingresos, ganancia real y caja disponible.</p></div></section>
<?php if($sinCosto || $sinPrecio): ?><div class="alert warn">Hay <?= e($sinCosto) ?> productos sin costo y <?= e($sinPrecio) ?> operaciones/pedidos sin precio válido. No se inventaron importes para esos casos.</div><?php endif; ?>
<div class="kpi-grid"><div class="kpi"><span>Inversión total</span><strong><?= money_ar($inversion) ?></strong></div><div class="kpi"><span>Inversión recuperada</span><strong><?= money_ar($recuperado) ?></strong></div><div class="kpi"><span>Inversión activa</span><strong><?= money_ar($activa) ?></strong></div><div class="kpi"><span>Ingresos</span><strong><?= money_ar($ingresos) ?></strong></div><div class="kpi"><span>Ganancia real</span><strong><?= money_ar($ganancia) ?></strong></div><div class="kpi"><span>Caja total</span><strong><?= money_ar($cajaTotal) ?></strong></div><div class="kpi"><span>Caja libre</span><strong><?= money_ar($cajaLibre) ?></strong></div><div class="kpi"><span>Operaciones</span><strong><?= e($ventasCount) ?></strong></div><div class="kpi"><span>Ticket promedio</span><strong><?= money_ar($ticket) ?></strong></div></div>
<?php if(!$ventasCount): ?><div class="empty-state">Todavía no hay ventas reales registradas. Los productos cargados no se cuentan como ingresos.</div><?php else: ?><div class="chart-panel"><div class="panel"><h2>Inversión recuperada vs pendiente</h2><div class="stat-list"><div class="stat-line"><span>Recuperada</span><strong><?= money_ar($recuperado) ?></strong></div><div class="stat-line"><span>Pendiente</span><strong><?= money_ar($activa) ?></strong></div><div class="stat-line"><span>Ganancia</span><strong><?= money_ar($ganancia) ?></strong></div></div></div><div class="panel"><h2>Operaciones</h2><div class="stat-list"><div class="stat-line"><span>Ventas registradas</span><strong><?= e($ventasCount) ?></strong></div><div class="stat-line"><span>Ticket promedio</span><strong><?= money_ar($ticket) ?></strong></div><div class="stat-line"><span>Valor de venta cargado</span><strong><?= money_ar($valorVenta) ?></strong></div></div></div></div><div class="panel"><h2>Ingresos por mes</h2><?php foreach($porMes as $mes=>$total): ?><div class="stat-line"><span><?= e($mes) ?></span><strong><?= money_ar($total) ?></strong></div><?php endforeach; ?></div><?php endif; ?>
