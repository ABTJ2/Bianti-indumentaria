<!doctype html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Admin | BIANTI</title><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800;900&display=swap" rel="stylesheet"><link rel="stylesheet" href="<?= asset_url('css/bianti-ci.css') ?>"></head>
<body class="admin-body">
<aside class="admin-sidebar" id="sidebar"><div class="admin-brand"><img src="<?= asset_url('img/logo.png') ?>" alt="BIANTI"><strong>BIANTI</strong><span>Admin MVC</span></div><nav class="admin-nav">
<?php $links=['admin/dashboard'=>['Panel principal','▦'],'admin/productos'=>['Productos','□'],'admin/importar-productos'=>['Importar productos','⇧'],'admin/categorias'=>['Categorías','▦'],'admin/pedidos'=>['Pedidos','▣'],'admin/ofertas'=>['Ofertas','%'],'admin/metricas'=>['Métricas','↗'],'admin/estadisticas'=>['Estadísticas','▥'],'admin/contabilidad'=>['Contabilidad','$']]; $cur=current_path(); foreach($links as $url=>$info): [$txt,$ico]=$info; ?>
<a class="<?= str_starts_with($cur,$url)?'active':'' ?>" href="<?= site_url($url) ?>"><span class="nav-icon"><?= e($ico) ?></span><span><?= e($txt) ?></span></a>
<?php endforeach; ?></nav><a class="logout-link" href="<?= site_url('admin/logout') ?>"><span class="nav-icon">↩</span><span>Cerrar sesión</span></a></aside>
<main class="admin-main"><header class="admin-top"><button class="menu-btn" data-menu>☰</button><div class="admin-user"><strong><?= e($_SESSION['bianti_user']['username'] ?? 'Administrador') ?></strong><span><?= e($_SESSION['bianti_user']['rol'] ?? 'Admin') ?></span></div></header>
<?php if(!empty($_SESSION['flash_ok'])): ?><div class="alert ok"><?= e($_SESSION['flash_ok']); unset($_SESSION['flash_ok']); ?></div><?php endif; ?>
<?php if(!empty($_SESSION['flash_error'])): ?><div class="alert error"><?= e($_SESSION['flash_error']); unset($_SESSION['flash_error']); ?></div><?php endif; ?>
<?= $content ?></main><script src="<?= asset_url('js/admin-ci.js') ?>"></script></body></html>
