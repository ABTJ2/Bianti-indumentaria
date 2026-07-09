<main class="authStage" aria-label="Ingreso privado BIANTI">
  <section class="authHero" aria-hidden="true">
    <div class="authRack"><span></span><span></span><span></span><span></span><span></span></div>
    <div class="authBag"><img src="<?= asset_url('img/logo.png') ?>" alt=""></div>
    <div class="authFolded"><img src="<?= asset_url('img/logo.png') ?>" alt=""></div>
  </section>
  <section class="authAccess">
    <div class="authIdentity">
      <img src="<?= asset_url('img/logo.png') ?>" alt="Bianti Indumentaria">
      <h1>BIANTI INDUMENTARIA</h1>
      <div class="authPrivate"><span></span>Panel privado<span></span></div>
      <p>Acceso para administrar el catálogo</p>
    </div>
    <form class="login-box" method="post" action="<?= site_url('admin/login') ?>">
      <?= csrf_field() ?>
      <?php if(!empty($_SESSION['flash_error'])): ?><div class="alert error"><?= e($_SESSION['flash_error']); unset($_SESSION['flash_error']); ?></div><?php endif; ?>
      <label class="login-field" for="user"><span>Usuario o correo</span><div class="login-input"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="7" r="4"/></svg><input name="user" id="user" placeholder="Ingresa tu usuario o correo" autocomplete="username" required></div></label>
      <label class="login-field" for="pass"><span>Contraseña</span><div class="login-input"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg><input name="pass" id="pass" type="password" placeholder="Ingresa tu contraseña" autocomplete="current-password" required></div></label>
      <button type="submit">Ingresar</button>
      <p class="authOnly"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>Solo personal autorizado</p>
    </form>
  </section>
  <div class="authWatermark" aria-hidden="true"><img src="<?= asset_url('img/logo.png') ?>" alt=""></div>
</main>
<footer class="authFooter"><div><span>Seguro</span><small>Acceso protegido y monitoreado</small></div><div><span>Gestión eficiente</span><small>Administrá productos, pedidos y categorías</small></div><div><span>Control total</span><small>Información clave siempre actualizada</small></div></footer>
<div class="authCopy">© <?= date('Y') ?> BIANTI INDUMENTARIA. Todos los derechos reservados.</div>
