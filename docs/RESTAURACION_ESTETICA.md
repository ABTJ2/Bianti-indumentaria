# Restauración Estética BIANTI

## CSS Eliminado O Desactivado

- `public/assets/css/bianti-ci.css` dejó de ser el CSS principal cargado por layouts MVC.
- `public/assets/css/admin-original.css` dejó de cargarse en login para evitar pisadas.
- Se retiraron estilos inline fijos de `app/Views/admin/importar/index.php`.

## CSS Fusionado / Ordenado

- `base.css`: variables, reset mínimo, tipografía, botones, inputs, cards, chips y estados.
- `layout.css`: estructura compartida, headers de página, KPI, paneles, barras y estados vacíos.
- `admin.css`: sidebar negro, topbar negra, tablas, cards mobile, importador, categorías, ofertas y métricas.
- `catalogo.css`: header público, hero, buscador, categorías, productos, filtros y footer.
- `auth.css`: login BIANTI con fondo claro, ilustración, logo, card e inputs con íconos.
- `responsive.css`: breakpoints mobile/tablet sin scroll horizontal como solución principal.

## Archivos Modificados

- `app/Views/layouts/admin.php`
- `app/Views/layouts/public.php`
- `app/Views/layouts/auth.php`
- `app/Views/auth/login.php`
- `app/Views/catalogo/index.php`
- `app/Views/admin/dashboard/index.php`
- `app/Views/admin/productos/index.php`
- `app/Views/admin/importar/index.php`
- `app/Views/admin/ofertas/index.php`
- `app/Views/admin/metricas/index.php`
- `app/Views/admin/estadisticas/index.php`
- `app/Views/admin/contabilidad/index.php`
- `app/Controllers/Admin/Dashboard.php`
- `app/Controllers/Admin/Ofertas.php`
- `app/Services/OfferService.php`
- `public/assets/js/admin-ci.js`
- `public/assets/js/admin/importar-productos.js`
- `public/assets/css/*.css`

## Clases Importantes

- `admin-body`, `admin-sidebar`, `admin-top`, `menu-open`, `sidebar-collapsed`
- `page-head`, `page-actions`, `kpi-grid`, `panel`, `chart-panel`
- `filter-admin`, `admin-table`, `product-admin-cards`, `admin-product-card`
- `category-card`, `products-grid`, `product-card`, `filter-drawer`, `footer-public`
- `authStage`, `authHero`, `authAccess`, `login-box`

## Pendiente

- La ruta MVC de alta manual de producto no existe; el botón `Nuevo producto` apunta al importador para no inventar rutas.
- El JS público `catalogo-ci.js` sigue minificado; conviene formatearlo en una tarea posterior antes de tocar más comportamiento.
- Algunos HTML legacy siguen existiendo como referencia visual y no se eliminaron para no mezclar la app MVC con archivos estáticos antiguos.

## Cómo Probar Catálogo

- Abrir `/public/catalogo`.
- Verificar header negro, logo, navegación, hero oscuro, buscador y beneficios.
- Confirmar que primero se ven categorías y destacados/ofertas, no una tabla ni listado crudo.
- Abrir filtros en mobile y cerrar con el botón `×`.
- Revisar footer con logo, contacto, WhatsApp, derechos y punto de acceso admin.

## Cómo Probar Admin

- Abrir `/public/admin/login` e iniciar sesión con credenciales existentes.
- Revisar login con fondo claro, ilustración BIANTI, logo, card blanca y botón violeta.
- Abrir `/public/admin/dashboard` y verificar sidebar negro, topbar negra, KPIs y accesos rápidos.
- Probar contraer/expandir sidebar en desktop.
- Abrir Productos, Importar, Categorías, Ofertas, Métricas, Estadísticas y Contabilidad.

## Cómo Probar Responsive

- En mobile, abrir admin y verificar botón hamburguesa.
- Confirmar que productos usa cards y no tabla horizontal.
- Confirmar que el menú mobile abre/cierra por link, overlay y tecla Escape.
- En catálogo mobile, verificar header compacto, buscador visible, categorías 1 columna y productos en cards.
