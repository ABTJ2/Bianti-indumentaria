# Prueba manual admin y catálogo BIANTI

## Pantallas probadas

- Catálogo público: `http://localhost/programacion3/proyectos/Bianti-indumentaria-main/`
- JS público: `/public/assets/js/catalogo-ci.js`
- API de productos: `/public/api/catalogo/productos`
- Login admin: `/public/admin/login`
- Rutas protegidas admin sin sesión:
  - `/public/admin/productos/nuevo`
  - `/public/admin/pedidos/detalle/1`
  - `/public/admin/metricas`

## Qué funcionó

- La entrada principal responde `200`.
- Chrome headless cargó el catálogo y ejecutó JS suficiente para renderizar productos en `#products`.
- El HTML cargado contiene `productModal`, `biantiStaticProducts`, botones `btn-detail` y links `data-wa`.
- `api/catalogo/productos` responde `200`, `ok=true` y devuelve productos.
- `catalogo-ci.js` responde `200`.
- `/public/admin/login` responde `200`.
- Las rutas admin protegidas responden `302` hacia login cuando no hay sesión, comportamiento esperado.
- `php -l` no detectó errores en vistas, controladores, modelos y rutas tocadas.
- `node --check` no detectó errores en `catalogo-ci.js` ni `admin-ci.js`.

## Qué falló

- No se pudo completar una prueba manual interactiva autenticada del admin porque no hay credenciales admin disponibles en la conversación.
- No se ejecutaron POST reales autenticados contra Supabase desde sesión admin por la misma razón.

## Errores encontrados

- Chrome headless emitió errores de GCM/Google (`PHONE_REGISTRATION_ERROR`, `Authentication Failed: wrong_secret`). Son errores internos de servicios Google de Chrome y no del código BIANTI.
- No aparecieron errores PHP ni errores HTTP 500 en las rutas probadas.

## Correcciones aplicadas

- Se agregó alta manual de producto en `/public/admin/productos/nuevo`.
- Se cambió el botón `Nuevo producto` para que ya no apunte al importador.
- Se agregó detalle de pedido en `/public/admin/pedidos/detalle/:id`.
- Se agregó estado `cancelado` a pedidos usando la misma ruta de cambio de estado.
- Se agregaron métricas filtradas para mostrar solo productos existentes.
- Se agregó limpieza segura de eventos huérfanos en `/public/admin/metricas`.
- Al eliminar producto se limpian relaciones, eventos y oferta temporal asociada, sin tocar pedidos ni ventas históricas.

## Pendiente operativo

- Probar con credenciales admin reales: crear producto `TEST BIANTI NO USAR`, editarlo, alternar visible/disponible, verlo en catálogo y eliminarlo.
