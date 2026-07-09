<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex,nofollow">
  <title><?= e($title ?? 'Login | BIANTI') ?></title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@300;500;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="<?= asset_url('css/admin-original.css') ?>">
  <link rel="stylesheet" href="<?= asset_url('css/bianti-ci.css') ?>">
</head>
<body class="auth authBianti"><?= $content ?></body>
</html>
