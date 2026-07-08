# Reparación post Codex BIANTI

## Error encontrado
El catálogo fallaba con Supabase 400 porque una consulta a `productos` pedía la columna inexistente `productos.imagen_url`.

## Causa
Una optimización de rendimiento cambió consultas resumidas de productos para pedir una lista fija de columnas. Esa lista incluía `imagen_url` y `foto_url`, que no existen en la tabla real de Supabase.

## Archivos corregidos
- `app/Models/ProductoModel.php`
- `app/Core/Cache.php`
- `app/Core/functions.php`
- `app/Views/catalogo/index.php`
- `app/Views/layouts/public.php`
- `app/Views/layouts/admin.php`
- `app/Views/admin/productos/index.php`
- `app/Views/admin/categorias/index.php`
- `app/Views/admin/metricas/index.php`
- `app/Views/admin/ofertas/index.php`
- `app/Views/admin/pedidos/index.php`
- `app/Views/admin/pedidos/detalle.php`
- `public/assets/js/catalogo-ci.js`
- `public/assets/js/admin-ci.js`
- `public/assets/css/catalogo.css`
- `public/assets/css/admin.css`
- `public/assets/css/responsive.css`

## Código duplicado corregido
No se encontraron `return` duplicados ni inserciones inalcanzables en los modelos, servicios y controladores revisados. La vista del catálogo no tenía imágenes/cards duplicadas reales, pero se reordenó para separar resultados dinámicos de secciones estáticas.

## Verificaciones
- `/` carga OK.
- `/public/catalogo` carga OK.
- `/api/catalogo/productos` OK.
- `/api/pedidos` inválido devuelve 422 con `producto_id es obligatorio`.
- `/api/pedidos` válido creó pedido de prueba `id=6` para `producto_id=130`.
- Pedido de prueba `id=6` eliminado luego de verificar que estaba `en_revision`, sin datos de venta y con mensaje `Prueba tecnica API BIANTI post Codex`.
- Ver detalle OK desde las cards iniciales y resultados.
- Consultar WhatsApp mantiene apertura aunque falle la creación del pedido.
