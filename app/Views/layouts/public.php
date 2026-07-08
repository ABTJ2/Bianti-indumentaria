<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
  <title>BIANTI Indumentaria | Catálogo</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="<?= asset_url('css/base.css') ?>">
  <link rel="stylesheet" href="<?= asset_url('css/layout.css') ?>">
  <link rel="stylesheet" href="<?= asset_url('css/catalogo.css') ?>">
  <link rel="stylesheet" href="<?= asset_url('css/responsive.css') ?>">
</head>
<body class="catalog-body">
<header class="topbar-public">
  <a class="brand" href="<?= site_url('catalogo') ?>"><img src="<?= asset_url('img/logo.png') ?>" alt="BIANTI"><span>BIANTI INDUMENTARIA</span></a>
  <nav><a href="<?= site_url('catalogo') ?>">Catálogo</a><a href="#contacto">Contacto</a><a class="wa" target="_blank" href="https://wa.me/<?= e(env_value('BIANTI_WHATSAPP','')) ?>">Consultar por WhatsApp</a></nav>
</header>
<?= $content ?>
<footer id="contacto" class="footer-public footer-rich">
  <div class="footer-columns">
    <div class="footer-brand"><img src="<?= asset_url('img/logo.png') ?>" alt="BIANTI"><div><strong>BIANTI INDUMENTARIA</strong><span>Moda para todos los días</span></div></div>
    <div class="footer-copy"><strong>Catálogo online</strong><span>Productos seleccionados, atención personalizada y medios de pago seguros.</span><a href="<?= site_url('catalogo') ?>">Ver catálogo</a></div>
    <div class="footer-contact"><strong>Contacto</strong><a target="_blank" rel="noopener" href="https://wa.me/<?= e(env_value('BIANTI_WHATSAPP','')) ?>">WhatsApp <?= e(env_value('BIANTI_WHATSAPP','')) ?></a><span>Caucete, San Juan</span></div>
  </div>
  <div class="footer-rights"><span>© 2026 BIANTI INDUMENTARIA. Todos los derechos reservados.</span><a class="private-access" href="<?= site_url('admin/login') ?>" title="Acceso privado" aria-label="Acceso privado">•</a></div>
</footer>
<script>window.BIANTI_BASE='<?= site_url('') ?>'; window.BIANTI_WA='<?= e(env_value('BIANTI_WHATSAPP','')) ?>';</script>
<script src="<?= asset_url('js/catalogo-ci.js') ?>"></script>
</body></html>
