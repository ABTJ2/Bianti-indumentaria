# Estado real del proyecto BIANTI

## App actual

- La aplicación real usa estructura MVC en `app/` y assets en `public/`.
- Rutas reales: `app/Config/Routes.php`.
- Controladores reales: `app/Controllers/` y `app/Controllers/Admin/`.
- Modelos reales: `app/Models/` contra Supabase REST.
- Vistas reales: `app/Views/`.
- CSS cargado: `public/assets/css/base.css`, `layout.css`, `catalogo.css`, `admin.css`, `responsive.css`.
- JS cargado: `public/assets/js/catalogo-ci.js` y `public/assets/js/admin-ci.js`. El importador usa `public/assets/js/admin/importar-productos.js` solo en su pantalla.

## Legacy / referencia

- `admin/*.html`, `assets/css/*`, `assets/js/*` e `index.html` son referencia visual anterior.
- No son la app principal y no deben mezclarse con el flujo MVC.
- Pueden eliminarse más adelante solo cuando ya no hagan falta como referencia.

## Rutas principales

- Público: `catalogo`, `categoria/(:num)`, `api/catalogo/productos`, `api/eventos`, `api/pedidos`.
- Admin: `admin/dashboard`, `admin/productos`, `admin/productos/nuevo`, `admin/pedidos`, `admin/metricas`, `admin/estadisticas`, `admin/contabilidad`, `admin/importar-productos`.

## Cambios reales aplicados

- El catálogo ya no carga todos los productos dinámicos al entrar. Solo muestra resultados al buscar, tocar categoría o aplicar filtros.
- Los destacados salen de eventos de producto existentes; si no hay eventos suficientes, no se fuerzan productos a mano.
- `Consultar` abre WhatsApp, registra `click_whatsapp` y crea pedido por `POST api/pedidos` sin bloquear WhatsApp si Supabase falla.
- Los eventos de producto validan que `producto_id` exista antes de guardarse.
- Métricas, dashboard y estadísticas filtran eventos huérfanos contra productos existentes.
- La limpieza de métricas huérfanas conserva eventos generales y borra solo eventos asociados a productos inexistentes.
- Alta y edición manual de producto aceptan foto de portada JPG/PNG/WEBP hasta 5 MB y suben al bucket `productos`.
- Contabilidad cuenta ventas reales y pedidos vendidos con precio válido. No inventa ingresos desde productos cargados.
- Importador corregido: `debugLog` ya no es recursivo.
- Ajustes responsive mínimos para cortar textos largos y evitar desbordes en mobile.

## Archivos tocados

- `app/Config/Routes.php`
- `app/Controllers/Api.php`
- `app/Controllers/Catalogo.php`
- `app/Controllers/Admin/Dashboard.php`
- `app/Controllers/Admin/Estadisticas.php`
- `app/Controllers/Admin/Productos.php`
- `app/Models/EventoModel.php`
- `app/Models/PedidoModel.php`
- `app/Models/ProductoModel.php`
- `app/Views/admin/contabilidad/index.php`
- `app/Views/admin/dashboard/index.php`
- `app/Views/admin/estadisticas/index.php`
- `app/Views/admin/pedidos/detalle.php`
- `app/Views/admin/pedidos/index.php`
- `app/Views/admin/productos/nuevo.php`
- `app/Views/admin/productos/editar.php`
- `public/assets/css/admin.css`
- `public/assets/css/responsive.css`
- `public/assets/js/catalogo-ci.js`
- `public/assets/js/admin/importar-productos.js`

## Pendientes reales

- Ejecutar prueba completa en navegador con sesión admin real.
- Confirmar en Supabase si `pedidos` tiene todos los campos recomendados; el código se adapta si faltan campos, pero si la tabla tiene campos obligatorios sin default puede requerir ajuste manual.
- No se agregó borrado físico de imágenes en Storage al cambiar portada porque no hay lógica segura de ownership/ruta previa.
