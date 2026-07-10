# Supabase RLS requerido

La app Cloudflare usa solo anon/public key desde el navegador. Nunca debe usar `service_role`.

## Público puede

- Leer `productos` visibles y disponibles.
- Leer `categorias` visibles.
- Leer `producto_categorias`, `producto_talles` y `producto_fotos` necesarios para mostrar catálogo.
- Crear `pedidos` con estado inicial `en_revision`.
- Crear `eventos` de catálogo, producto, categoría y WhatsApp.

## Público NO puede

- Editar productos.
- Borrar productos.
- Resetear métricas.
- Ver contabilidad.
- Administrar pedidos.
- Leer datos privados no necesarios para catálogo.

## Admin puede

- Gestionar `productos`.
- Gestionar `categorias`.
- Gestionar `pedidos`.
- Gestionar relaciones `producto_categorias`, `producto_talles`, `producto_fotos`.
- Leer `ventas` y `ventas_manuales`.
- Leer pedidos vendidos para contabilidad.
- Leer `productos.precio_costo`.
- Leer, limpiar y resetear eventos conocidos de métricas/catálogo.
- Subir imágenes al bucket Storage `productos`.

## Storage

El bucket `productos` debe permitir subida para usuarios admin autenticados. Si RLS o Storage bloquean, la UI muestra un error claro y no usa claves secretas.

## Login

El admin usa RPCs `login_admin`, `validar_sesion_admin` y `logout_admin` contra `public.usuarios` y `public.admin_sessions`. Ejecutar `docs/sql/LOGIN_USUARIOS_HASH.sql` antes de probar el acceso.

## Reset seguro

Reset de métricas/estadísticas borra solo tipos conocidos de `eventos`. No borra productos, pedidos, ventas ni contabilidad.
