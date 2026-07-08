<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <title>Admin | BIANTI</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="<?= asset_url('css/base.css') ?>">
  <link rel="stylesheet" href="<?= asset_url('css/layout.css') ?>">
  <link rel="stylesheet" href="<?= asset_url('css/admin.css') ?>">
  <link rel="stylesheet" href="<?= asset_url('css/responsive.css') ?>">
</head>
<body class="admin-body">
<?php
$links = [
  'admin/dashboard' => ['Panel principal', '▦'],
  'admin/productos' => ['Productos', '□'],
  'admin/importar-productos' => ['Importar productos', '⇧'],
  'admin/categorias' => ['Categorías', '▤'],
  'admin/pedidos' => ['Pedidos', '▣'],
  'admin/ofertas' => ['Ofertas', '%'],
  'admin/metricas' => ['Métricas', '↗'],
  'admin/estadisticas' => ['Estadísticas', '▥'],
  'admin/contabilidad' => ['Contabilidad', '$'],
];
$cur = current_path();
?>
<div class="admin-overlay" data-menu-close></div>
<aside class="admin-sidebar" id="sidebar" aria-label="Menú de administración">
  <div class="admin-brand">
    <img src="<?= asset_url('img/logo.png') ?>" alt="BIANTI">
    <div><strong>BIANTI</strong><span>INDUMENTARIA</span></div>
  </div>
  <button class="sidebar-toggle" type="button" data-sidebar-toggle aria-label="Contraer o expandir menú">‹</button>
  <nav class="admin-nav">
    <?php foreach($links as $url => $info): [$txt, $ico] = $info; ?>
      <a class="<?= str_starts_with($cur, $url) ? 'active' : '' ?>" href="<?= site_url($url) ?>">
        <span class="nav-icon" aria-hidden="true"><?= e($ico) ?></span><span class="nav-label"><?= e($txt) ?></span>
      </a>
    <?php endforeach; ?>
  </nav>
  <a class="logout-link" href="<?= site_url('admin/logout') ?>"><span class="nav-icon" aria-hidden="true">↩</span><span class="nav-label">Cerrar sesión</span></a>
</aside>
<main class="admin-main">
  <header class="admin-top">
    <button class="menu-btn" data-menu type="button" aria-label="Abrir menú">☰</button>
    <div class="topbar-title"><strong>BIANTI Admin</strong><span>Panel privado</span></div>
    <div class="admin-user"><strong><?= e($_SESSION['bianti_user']['username'] ?? 'Administrador') ?></strong><span><?= e($_SESSION['bianti_user']['rol'] ?? 'Admin') ?></span></div>
  </header>
  <?php if(!empty($_SESSION['flash_ok'])): ?><div class="alert ok"><?= e($_SESSION['flash_ok']); unset($_SESSION['flash_ok']); ?></div><?php endif; ?>
  <?php if(!empty($_SESSION['flash_error'])): ?><div class="alert error"><?= e($_SESSION['flash_error']); unset($_SESSION['flash_error']); ?></div><?php endif; ?>
  <?= $content ?>
</main>
<script src="<?= asset_url('js/admin-ci.js') ?>"></script>
</body>
</html>
