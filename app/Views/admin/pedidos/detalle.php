<section class="page-head"><div><h1>Detalle de pedido #<?= e($pedido['id'] ?? '') ?></h1><p>Información de la consulta registrada.</p></div><div class="page-actions"><a class="btn outline" href="<?= site_url('admin/pedidos') ?>">Volver</a></div></section>
<div class="panel pedido-detail">
  <div class="stat-list">
    <div class="stat-line"><span>Estado</span><strong><?= e($pedido['estado'] ?? 'en_revision') ?></strong></div>
    <div class="stat-line"><span>Fecha</span><strong><?= e($pedido['created_at'] ?? '-') ?></strong></div>
    <div class="stat-line"><span>Producto</span><strong><?= e($pedido['producto_titulo'] ?? $pedido['titulo'] ?? '-') ?></strong></div>
    <div class="stat-line"><span>ID producto</span><strong><?= e($pedido['producto_id'] ?? '-') ?></strong></div>
    <div class="stat-line"><span>Total</span><strong><?= isset($pedido['vendido_total']) ? money_ar($pedido['vendido_total']) : (isset($pedido['producto_precio']) ? money_ar($pedido['producto_precio']) : '-') ?></strong></div>
    <div class="stat-line"><span>Origen</span><strong><?= e($pedido['origen'] ?? $pedido['source'] ?? 'WhatsApp / catálogo') ?></strong></div>
    <div class="stat-line"><span>Cliente</span><strong><?= e($pedido['cliente_nombre'] ?? $pedido['nombre'] ?? $pedido['cliente'] ?? '-') ?></strong></div>
    <div class="stat-line"><span>Contacto</span><strong><?= e($pedido['cliente_telefono'] ?? $pedido['telefono'] ?? $pedido['whatsapp'] ?? '-') ?></strong></div>
  </div>
  <h2>Mensaje</h2>
  <p class="muted"><?= e($pedido['mensaje'] ?? 'Sin mensaje registrado.') ?></p>
  <div class="actions"><form method="post" action="<?= site_url('admin/pedidos/estado/'.($pedido['id'] ?? 0)) ?>"><?= csrf_field() ?><input type="hidden" name="estado" value="vendido"><button class="btn primary">Marcar vendido</button></form><form method="post" action="<?= site_url('admin/pedidos/estado/'.($pedido['id'] ?? 0)) ?>"><?= csrf_field() ?><input type="hidden" name="estado" value="no_vendido"><button class="btn">Marcar no vendido</button></form><form method="post" action="<?= site_url('admin/pedidos/estado/'.($pedido['id'] ?? 0)) ?>"><?= csrf_field() ?><input type="hidden" name="estado" value="cancelado"><button class="btn">Cancelar pedido</button></form></div>
</div>
