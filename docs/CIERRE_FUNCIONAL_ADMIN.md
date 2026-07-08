# Cierre funcional admin BIANTI

## Pruebas manuales realizadas

- Catálogo público `/`: cargó con HTTP `200` y Chrome headless renderizó productos dinámicos.
- API `/public/api/catalogo/productos`: respondió `200`, `ok=true` y productos.
- Login `/public/admin/login`: respondió `200`.
- Rutas protegidas admin sin sesión: respondieron `302` a login.
- Sintaxis PHP: validada en rutas, modelos, controladores y vistas tocadas.
- Sintaxis JS: validada en `catalogo-ci.js` y `admin-ci.js`.

No se pudieron probar POST autenticados con sesión admin real porque no se recibieron credenciales.

## Nuevo producto

El botón `Nuevo producto` ya no manda al importador.

Nueva ruta:

- `GET /public/admin/productos/nuevo`
- `POST /public/admin/productos/guardar`

La pantalla permite cargar:

- título obligatorio,
- descripción,
- precio venta numérico,
- precio costo,
- categorías existentes,
- talles separados por coma o línea,
- visible,
- disponible.

El guardado usa tablas existentes:

- `productos`,
- `producto_categorias`,
- `producto_talles`.

No se agregó carga manual de fotos porque el flujo de Storage/bucket está acoplado al importador JS y conviene integrarlo en una tarea aparte sin riesgo.

## Pedidos

Acciones disponibles:

- `Ver detalle`,
- `Vendido`,
- `No vendido`,
- `Cancelar`,
- `Eliminar` con confirmación.

Estados permitidos:

- `en_revision`,
- `vendido`,
- `no_vendido`,
- `cancelado`.

La contabilidad existente sigue tomando solo pedidos con estado `vendido`.

## Métricas huérfanas

Se corrigió la vista de métricas para mostrar solo eventos asociados a productos existentes.

Se agregó botón seguro:

- `Limpiar métricas huérfanas`

La limpieza:

- busca eventos con `producto_id`, `id_producto`, `product_id` o `id`,
- compara contra productos existentes,
- elimina solo eventos asociados a productos inexistentes,
- no borra eventos generales sin producto,
- no considera producto oculto como huérfano.

## Supabase

Se mantuvieron tablas y campos existentes.

No se cambió:

- DER,
- nombres de tablas,
- credenciales,
- conexión Supabase.

POST reales autenticados no ejecutados por falta de credenciales admin. Las rutas y formularios quedaron preparados para probarlos con sesión real.

## Pendientes

## Crítico

- Probar POST reales con credenciales admin reales antes de dar por cerrado el circuito operativo en producción.

## Importante

- Agregar carga manual de fotos al alta de producto usando el bucket `productos`, replicando con cuidado la lógica del importador.
- Confirmar con datos reales si `cancelado` ya se usa históricamente o si hay reportes externos que esperen otro nombre de estado.

## Mejora posterior

- Agregar vista modal de detalle de pedido en la misma pantalla, si se prefiere no navegar a otra ruta.
- Agregar toast visual para acciones de admin.
- Agregar prueba automatizada básica de rutas públicas.

## Cómo probar

1. Entrar a `/public/admin/login` con credenciales admin.
2. Ir a Productos.
3. Click en `Nuevo producto`.
4. Crear producto `TEST BIANTI NO USAR` con precio, categoría, visible y disponible.
5. Verificar que aparece en `/public/admin/productos`.
6. Abrir catálogo y buscar `TEST BIANTI NO USAR`.
7. Click en `Ver detalle` y luego `Consultar`.
8. Entrar a Pedidos.
9. Abrir `Ver detalle` de un pedido.
10. Cambiar estado a `vendido`, `no_vendido` y `cancelado` según corresponda.
11. Entrar a Métricas.
12. Revisar que no aparezcan `Producto #ID` inexistentes.
13. Si aparece el botón, ejecutar `Limpiar métricas huérfanas`.
14. Volver a Productos y eliminar el producto de prueba.
15. Confirmar que sus métricas/oferta temporal se limpian y que pedidos/ventas históricas no se borran.
