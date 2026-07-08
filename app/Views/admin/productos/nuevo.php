<section class="page-head"><div><h1>Nuevo producto</h1><p>Alta manual básica sin cambiar la estructura de Supabase.</p></div></section>
<form class="panel edit-product" method="post" action="<?= site_url('admin/productos/guardar') ?>" enctype="multipart/form-data">
  <?= csrf_field() ?>
  <div class="edit-grid two">
    <label>Título<input name="titulo" required placeholder="Ej: TEST BIANTI NO USAR"></label>
    <label>Precio venta<input name="precio" type="number" step="0.01" min="0" required></label>
  </div>
  <div class="edit-grid two">
    <label>Precio costo<input name="precio_costo" type="number" step="0.01" min="0" value="0"></label>
    <label>Talles <small>Separados por coma. Ej: M, L, XL</small><input name="talles" placeholder="M, L, XL"></label>
  </div>
  <?php if(!empty($hasStock)): ?>
  <div class="edit-grid two">
    <label>Stock actual<input name="stock_actual" type="number" min="0" step="1" value="0"></label>
    <label>Stock mínimo<input name="stock_minimo" type="number" min="0" step="1" value="0"></label>
  </div>
  <?php endif; ?>
  <label>Descripción<textarea name="descripcion" placeholder="Descripción corta del producto"></textarea></label>
  <div class="panel-soft"><strong>Categorías</strong><div class="check-grid category-checks"><?php foreach($categorias as $c): ?><label><input type="checkbox" name="categorias[]" value="<?= e($c['id']) ?>"> <?= e($c['nombre']) ?></label><?php endforeach; ?></div></div>
  <label>Foto / portada <small>JPG, PNG o WEBP. Máximo 5 MB.</small><input name="portada" type="file" accept="image/jpeg,image/png,image/webp"></label>
  <div class="check-grid"><label><input type="checkbox" name="visible" checked> Visible en catálogo</label><label><input type="checkbox" name="disponible" checked> Disponible</label></div>
  <div class="alert ok">La foto se sube al bucket <strong>productos</strong> de Supabase Storage y queda como portada.</div>
  <div class="actions"><button class="btn primary">Guardar producto</button><a class="btn outline" href="<?= site_url('admin/productos') ?>">Cancelar</a></div>
</form>
