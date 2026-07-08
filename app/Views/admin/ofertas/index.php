<section class="page-head"><div><h1>Ofertas</h1><p>Creá descuentos por porcentaje sin editar el precio original ni cambiar Supabase. Se guardan en JSON local temporal documentado.</p></div></section>
<form class="panel filter-admin" method="get"><input name="q" placeholder="Buscar producto por nombre" value="<?= e($_GET['q']??'') ?>"><select name="categoria"><option value="">Todas las categorías</option><?php foreach($categorias as $c): ?><option value="<?= e($c['id']) ?>" <?= (string)($_GET['categoria']??'')===(string)$c['id']?'selected':'' ?>><?= e($c['nombre']) ?></option><?php endforeach; ?></select><button class="btn primary">Buscar</button><a class="btn outline" href="<?= site_url('admin/ofertas') ?>">Limpiar</a></form>
<div class="offer-grid">
  <?php foreach(array_slice($productos,0,80) as $p): $o=$active[(string)$p['id']]??null; $base=(float)($p['precio_base']??$p['precio']??$p['precio_venta']??0); $desc=(float)($o['descuento']??15); $final=$base*(1-($desc/100)); ?>
    <article class="offer-card">
      <img src="<?= e($p['portada'] ?: asset_url('img/logo.png')) ?>" alt="<?= e($p['titulo']??'Producto') ?>">
      <div class="body">
        <span class="badge-dark">ID #<?= e($p['id']) ?></span>
        <h3><?= e($p['titulo']??'Producto') ?></h3>
        <span class="offer-row">Precio original <strong><?= money_ar($base) ?></strong></span>
        <?php if($o): ?>
          <span class="badge-sale"><?= e($o['descuento']) ?>% OFF</span>
          <span class="price-before"><?= money_ar($base) ?></span>
          <span class="price-final"><?= money_ar($final) ?></span>
          <small>Activa hasta <?= e($o['hasta']) ?></small>
          <form class="offer-actions" method="post" action="<?= site_url('admin/ofertas/eliminar/'.$p['id']) ?>" data-confirm-title="Confirmar eliminación" data-confirm-message="¿Deseás eliminar esta oferta? Esta acción no se puede deshacer."><?= csrf_field() ?><button class="btn small">Eliminar oferta</button></form>
        <?php else: ?>
          <form class="offer-edit-form" method="post" action="<?= site_url('admin/ofertas/guardar') ?>" data-offer-form>
            <?= csrf_field() ?><input type="hidden" name="producto_id" value="<?= e($p['id']) ?>">
            <div class="edit-grid two"><label>% descuento<input name="descuento" data-discount type="number" min="1" max="95" value="15"></label><label>Duración<input name="duracion" type="number" min="1" max="720" value="48"></label></div>
            <label>Unidad<select name="unidad"><option value="horas">Horas</option><option value="dias">Días</option></select></label>
            <small class="offer-final">Precio final calculado: <strong data-final data-base="<?= e($base) ?>"><?= money_ar($base*.85) ?></strong></small>
            <button class="btn small primary">Activar oferta</button>
          </form>
        <?php endif; ?>
      </div>
    </article>
  <?php endforeach; ?>
</div>
