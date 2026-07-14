# Stock, Ventas, Eliminacion y Portadas

## Esquema encontrado

- `productos`: usa `id`, `titulo`, `precio`, `precio_costo`, `visible`, `disponible`, `portada_url`, `stock_actual` y `stock_minimo`.
- `productos.codigo` y `productos.sku`: no existen, por eso la importacion de ventas no usa codigo/SKU.
- `categorias`: actualmente no tiene `portada_url`; el SQL agrega esa columna.
- `producto_fotos`, `producto_talles`, `producto_categorias` y `variantes`: usan `producto_id`.
- `pedidos` y `pedido_items`: usan `producto_id`.
- `ventas` y `ventas_manuales`: usan `producto_id` y `cantidad`.
- `eventos`: no tiene columna `producto_id`; el producto se identifica desde `payload` JSON cuando existe.
- `ofertas`: no existe como tabla. El modulo actual usa `localStorage` (`bianti_ofertas_static`).

## Stock utilizado

- La columna fisica usada es `productos.stock_actual`.
- El filtro de stock bajo usa `productos.stock_minimo`.
- `disponible` sigue siendo estado comercial y no se modifica automaticamente cuando `stock_actual` llega a 0.

## Importacion de ventas

- Modulo nuevo: `modules/importar-ventas/`.
- El CSV se previsualiza antes de registrar cualquier venta.
- Se calcula SHA-256 del archivo para bloquear importaciones duplicadas.
- Se aceptan separadores coma y punto y coma mediante PapaParse.
- Se aceptan precios argentinos como `15000`, `15.000`, `15000,50` y `15.000,50`.
- La identificacion se hace por `producto_id` exacto o nombre normalizado.
- Las coincidencias probables solo se sugieren y requieren seleccion manual.
- Las coincidencias ambiguas quedan en revision necesaria.

## Formato CSV

Plantilla generada desde el panel:

```csv
producto_id,nombre_producto,cantidad,precio_unitario,fecha,observacion,cliente,medio_pago
130,Cancan piel negro,2,5000,13/07/2026,Venta local,,
121,Mochila infantil Cappuccina con luces,1,18000,13/07/2026,,,
```

## RPC de ventas

- RPC: `importar_ventas_masivas`.
- Valida token administrativo contra `admin_sessions` y `usuarios.activo`.
- Bloquea productos con `FOR UPDATE`.
- Revalida stock agrupado por producto.
- Inserta ventas en `ventas`.
- Inserta detalle en `ventas_importacion_items`.
- Guarda lote en `ventas_importaciones` con `origen = 'importacion_csv'`.
- Descuenta `stock_actual` de forma transaccional.
- Si algo falla, PostgreSQL revierte toda la funcion.

## Eliminacion masiva

- Productos no inicia en modo seleccion. La seleccion solo aparece al activar `Eliminar varios productos`.
- Productos permite seleccionar uno, varios, los visibles de la pagina o todos los resultados filtrados.
- La seleccion se conserva al buscar, filtrar y cambiar de pagina porque se guarda por `producto.id`.
- La previsualizacion usa `previsualizar_eliminacion_productos_masiva`.
- La eliminacion se confirma con modal BIANTI, casilla de entendimiento y texto exacto `ELIMINAR TODO`.
- RPC: `eliminar_productos_masivo`.

## Eliminacion total y contabilidad

- El flujo actual elimina totalmente los productos seleccionados y sus relaciones identificables.
- Se eliminan `ventas`, `ventas_manuales`, `pedidos`, `pedido_items` y detalles de importacion relacionados por `producto_id`.
- El modal muestra cantidad de ventas, unidades vendidas e importe de ventas que desaparecera.
- La contabilidad se recalcula desde ventas, ventas manuales, pedidos vendidos y productos restantes; al borrar esas fuentes, los totales cambian.
- No se eliminan categorias aunque queden vacias.

## Eventos y metricas

- `eventos` no tiene `producto_id` confirmado.
- `assets/js/catalogo.js` intenta guardar `producto_id` directo, pero si la columna no existe guarda el ID dentro de `payload`.
- Metricas y estadisticas leen el producto con `payload.producto_id`, `payload.product_id` o `payload.id`.
- La RPC solo borra eventos cuando puede identificar el producto dentro de `payload` JSON con `producto_id`, `product_id` o `id`.
- Si un evento no tiene relacion identificable, no se borra para evitar eliminar metricas ajenas.
- Vistas y clicks se calculan por `eventos.type` y se eliminan solo cuando tambien hay relacion segura al producto.

## Storage

- La RPC devuelve rutas/URLs autorizadas de `producto_fotos.url` y `productos.portada_url`.
- El frontend elimina solamente esas rutas del bucket `productos`.
- Si una eliminacion de Storage falla, la ruta queda registrada en `localStorage.bianti_storage_pendiente`.
- No se borran carpetas completas.
- Las portadas de categorias usan el mismo bucket `productos` bajo `categorias/{categoria_id}/...`.

## Ofertas locales

- La tabla `ofertas` no existe.
- El modulo de ofertas guarda promociones en `localStorage.bianti_ofertas_static`.
- Al eliminar productos, el frontend elimina solo las ofertas locales cuyo `producto_id` esta en la seleccion.
- Este almacenamiento es local al navegador actual.

## Portadas de categorias

- El catalogo prioriza `categorias.portada_url` cuando exista.
- Si `portada_url` esta vacio o no existe, usa fallback local por slug normalizado.
- Se verificaron visualmente las portadas de referencia de `Bianti-indumentaria-main (1).zip`.
- Los hashes SHA-256 de las cinco portadas requeridas coinciden con los archivos actuales, por lo que no se reemplazaron binarios iguales.

## Pasos para aplicar SQL

1. Abrir Supabase SQL Editor.
2. Revisar `docs/sql/STOCK_VENTAS_ELIMINACION_Y_PORTADAS.sql`.
3. Ejecutar el SQL manualmente.
4. Recargar el panel admin.
5. Probar con productos temporales, CSV temporal y categorias temporales.
6. Antes de probar eliminacion, crear productos temporales con fotos, talles, categorias, pedidos y ventas de prueba.
7. Verificar que la previsualizacion muestre el impacto antes de confirmar.
8. Confirmar que las rutas pendientes de imagen queden registradas si una limpieza falla.

## Limitaciones

- No se ejecuta SQL desde el proyecto.
- La carga de portadas administrables requiere aplicar primero `categorias.portada_url`.
- Las ofertas siguen usando el almacenamiento actual del modulo (`localStorage`) porque la tabla `ofertas` no existe.
- Los eventos sin relacion segura al producto dentro de `payload` no se eliminan automaticamente.
