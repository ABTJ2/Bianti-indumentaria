<?php
$kpis = $contabilidad['kpis'] ?? [];
$warnings = $contabilidad['warnings'] ?? [];
$charts = $contabilidad['charts'] ?? [];
$operaciones = (int)($kpis['operaciones'] ?? 0);
$barChart = function(string $title, array $items, callable $format, string $empty = 'No hay datos suficientes para generar este gráfico todavía.') {
  $max = 0;
  foreach ($items as $item) $max = max($max, (float)($item['value'] ?? 0));
  ?>
  <section class="panel accounting-chart"><h2><?= e($title) ?></h2><?php if($max <= 0): ?><p class="muted"><?= e($empty) ?></p><?php else: ?><div class="accounting-bars"><?php foreach($items as $item): $value=(float)($item['value']??0); $width=$max>0?max(4,($value/$max)*100):0; ?><div class="accounting-bar"><div class="accounting-bar__head"><span><?= e($item['label'] ?? '-') ?></span><strong><?= e($format($value)) ?></strong></div><div class="accounting-bar__track"><i style="width: <?= e(round($width, 2)) ?>%"></i></div></div><?php endforeach; ?></div><?php endif; ?></section>
  <?php
};
?>
<section class="page-head"><div><h1>Contabilidad</h1><p>Inversión, recuperación, ingresos, ganancia real y caja disponible.</p></div></section>

<form class="panel filter-admin accounting-filter" method="get">
  <select name="periodo">
    <option value="mes" <?= ($periodo['tipo'] ?? '')==='mes'?'selected':'' ?>>Mes actual</option>
    <option value="trimestre" <?= ($periodo['tipo'] ?? '')==='trimestre'?'selected':'' ?>>Trimestre</option>
    <option value="semestre" <?= ($periodo['tipo'] ?? '')==='semestre'?'selected':'' ?>>Semestre</option>
    <option value="anio" <?= ($periodo['tipo'] ?? '')==='anio'?'selected':'' ?>>Últimos 12 meses</option>
    <option value="todo" <?= ($periodo['tipo'] ?? '')==='todo'?'selected':'' ?>>Todo</option>
    <option value="rango" <?= ($periodo['tipo'] ?? '')==='rango'?'selected':'' ?>>Rango personalizado</option>
  </select>
  <input name="desde" type="date" value="<?= e($periodo['from'] ?? '') ?>">
  <input name="hasta" type="date" value="<?= e($periodo['to'] ?? '') ?>">
  <button class="btn primary">Aplicar</button>
  <a class="btn outline" href="<?= site_url('admin/contabilidad') ?>">Limpiar</a>
</form>

<?php if(!empty($warnings['productos_sin_costo']) || !empty($warnings['operaciones_sin_costo'])): ?>
  <div class="alert warn">Hay <?= e($warnings['productos_sin_costo'] ?? 0) ?> productos sin costo y <?= e($warnings['operaciones_sin_costo'] ?? 0) ?> operaciones vendidas sin costo calculable. No se inventó ganancia para esos casos.</div>
<?php endif; ?>

<div class="kpi-grid">
  <div class="kpi"><span>Inversión total</span><strong><?= money_ar($kpis['inversion_total'] ?? 0) ?></strong></div>
  <div class="kpi"><span>Inversión recuperada</span><strong><?= money_ar($kpis['inversion_recuperada'] ?? 0) ?></strong></div>
  <div class="kpi"><span>Inversión activa</span><strong><?= money_ar($kpis['inversion_activa'] ?? 0) ?></strong></div>
  <div class="kpi"><span>Ingresos</span><strong><?= money_ar($kpis['ingresos'] ?? 0) ?></strong></div>
  <div class="kpi"><span>Ganancia real</span><strong><?= money_ar($kpis['ganancia_real'] ?? 0) ?></strong></div>
  <div class="kpi"><span>Caja total</span><strong><?= money_ar($kpis['caja_total'] ?? 0) ?></strong></div>
  <div class="kpi"><span>Caja libre</span><strong><?= money_ar($kpis['caja_libre'] ?? 0) ?></strong></div>
  <div class="kpi"><span>Operaciones</span><strong><?= e($operaciones) ?></strong></div>
  <div class="kpi"><span>Ticket promedio</span><strong><?= money_ar($kpis['ticket_promedio'] ?? 0) ?></strong></div>
</div>

<?php if(!$operaciones): ?>
  <section class="panel empty-accounting"><h2>Todavía no hay ventas suficientes</h2><p>Cuando marques pedidos como vendidos o cargues ventas manuales, acá vas a ver ingresos, ganancias y evolución mensual.</p></section>
<?php else: ?>
  <div class="accounting-grid">
    <?php $barChart('Ingresos por mes', $charts['ingresos_mes'] ?? [], fn($v) => money_ar($v)); ?>
    <?php $barChart('Ventas por mes', $charts['ventas_mes'] ?? [], fn($v) => (int)$v . ' op.'); ?>
    <section class="panel accounting-chart"><h2>Inversión recuperada vs pendiente</h2><?php $inv=$charts['inversion']??[]; $totalInv=array_sum(array_map(fn($i)=>(float)($i['value']??0),$inv)); if($totalInv<=0): ?><p class="muted">No hay datos de costo suficientes para comparar inversión.</p><?php else: ?><div class="investment-split"><?php foreach($inv as $idx=>$item): $value=(float)($item['value']??0); $width=$totalInv>0?($value/$totalInv)*100:0; ?><div><span><?= e($item['label'] ?? '-') ?></span><strong><?= money_ar($value) ?></strong><i class="<?= $idx===0?'recovered':'pending' ?>" style="width: <?= e(round($width,2)) ?>%"></i></div><?php endforeach; ?></div><?php endif; ?></section>
    <?php $barChart('Ganancia por periodo', $charts['ganancia_mes'] ?? [], fn($v) => money_ar($v), 'No hay costos registrados suficientes para calcular ganancia real.'); ?>
  </div>
  <section class="panel accounting-chart"><h2>Top productos por ganancia</h2><?php if(empty($charts['top_ganancia'])): ?><p class="muted">No hay productos con costo e ingresos suficientes para calcular ganancia.</p><?php else: $max=max(array_map(fn($i)=>(float)($i['ganancia']??0),$charts['top_ganancia'])); ?><div class="accounting-bars"><?php foreach($charts['top_ganancia'] as $item): $value=(float)($item['ganancia']??0); $width=$max>0?max(4,($value/$max)*100):4; ?><div class="accounting-bar"><div class="accounting-bar__head"><span><?= e($item['titulo'] ?? 'Producto') ?> <small><?= e($item['cantidad'] ?? 0) ?> vendido(s)</small></span><strong><?= money_ar($value) ?></strong></div><div class="accounting-bar__track"><i style="width: <?= e(round($width, 2)) ?>%"></i></div></div><?php endforeach; ?></div><?php endif; ?></section>
<?php endif; ?>
