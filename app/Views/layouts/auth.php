<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex,nofollow">
  <title><?= e($title ?? 'Login | BIANTI') ?></title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="<?= asset_url('css/base.css') ?>">
  <link rel="stylesheet" href="<?= asset_url('css/auth.css') ?>">
  <link rel="stylesheet" href="<?= asset_url('css/responsive.css') ?>">
</head>
<body class="auth authBianti"><?= $content ?></body>
</html>
