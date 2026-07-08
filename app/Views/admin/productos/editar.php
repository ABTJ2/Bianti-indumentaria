<section class="page-head"><h1>Editar producto #<?= e($producto['id']) ?></h1><p>Podés modificar datos, categorías, talles, visibilidad y disponibilidad.</p></section>
<form class="panel edit-product" method="post" action="<?= site_url('admin/productos/guardar/'.$producto['id']) ?>" enctype="multipart/form-data"><?= csrf_field() ?>
  <div class="edit-grid two"><label>Título<input name="titulo" value="<?= e($producto['titulo'] ?? '') ?>" required></label><label>Precio venta<input name="precio" type="number" step="0.01" value="<?= e($producto['precio'] ?? $producto['precio_venta'] ?? 0) ?>"></label></div>
  <div class="edit-grid two"><label>Precio costo<input name="precio_costo" type="number" step="0.01" value="<?= e($producto['precio_costo'] ?? 0) ?>"></label><label>Talles <small>Separados por coma. Ej: M, L, XL</small><input name="talles" value="<?= e(implode(', ', $producto['talles'] ?? [])) ?>"></label></div>
  <?php if(!empty($hasStock)): ?>
  <div class="edit-grid two"><label>Stock actual<input name="stock_actual" type="number" min="0" step="1" value="<?= e($producto['stock_actual_valor'] ?? 0) ?>"></label><label>Stock mínimo<input name="stock_minimo" type="number" min="0" step="1" value="<?= e($producto['stock_minimo_valor'] ?? 0) ?>"></label></div>
  <?php endif; ?>
  <label>Descripción<textarea name="descripcion"><?= e($producto['descripcion'] ?? '') ?></textarea></label>
  <div class="panel-soft"><strong>Categorías</strong><div class="check-grid category-checks"><?php foreach($categorias as $c): $checked=in_array((string)$c['id'], array_map('strval',$producto['categorias_ids']??[]), true); ?><label><input type="checkbox" name="categorias[]" value="<?= e($c['id']) ?>" <?= $checked?'checked':'' ?>> <?= e($c['nombre']) ?></label><?php endforeach; ?></div></div>
  <div class="check-grid"><label><input type="checkbox" name="visible" <?= !empty($producto['visible'])?'checked':'' ?>> Visible en catálogo</label><label><input type="checkbox" name="disponible" <?= !empty($producto['disponible'])?'checked':'' ?>> Disponible</label></div>
  <div class="edit-preview"><img src="<?= e($producto['portada'] ?: asset_url('img/logo.png')) ?>" alt=""></div>
  <label>Cambiar foto / portada <small>JPG, PNG o WEBP. Máximo 5 MB. Si no elegís archivo, se conserva la actual.</small><input name="portada" type="file" accept="image/jpeg,image/png,image/webp"></label>
  <div class="actions"><button class="btn primary">Guardar cambios</button><a class="btn outline" href="<?= site_url('admin/productos') ?>">Volver</a></div>
</form>
