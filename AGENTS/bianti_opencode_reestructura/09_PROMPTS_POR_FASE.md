# Prompts cortos para usar en OpenCode por fases

## Prompt 1 - Auditoría

Revisá todo el proyecto BIANTI. No modifiques nada. Detectá estructura, archivos admin, JS, CSS, conexión Supabase, tablas usadas y problemas actuales. Entregame un informe con archivos afectados y orden recomendado de modificación.

## Prompt 2 - Sidebar y layout

Reestructurá el sidebar admin usando `admin/_sidebar.html`. Debe quedar con este orden exacto: Panel principal, Métricas, Categorías, Pedidos, Contabilidad, Estadísticas. Eliminá Configuración, Backups, Tracking, Clientes, Consultas, Productos y Nuevo producto del sidebar. No elimines la gestión de productos del sistema, solo sacala del menú principal. Actualizá `assets/css/admin.css` para mantener el diseño aprobado, sidebar oscuro, cards claras, acento violeta y layout 16:9.

## Prompt 3 - Panel principal

Actualizá `admin/dashboard.html` y su JS para convertirlo en Panel principal. Debe mostrar resumen general: consultas WhatsApp en revisión, ventas confirmadas, no vendidos, ingresos del período, producto más consultado, tasa de conversión, flujo de ventas, accesos rápidos y últimas consultas. Usá las tablas actuales de Supabase.

## Prompt 4 - Categorías

Actualizá la pantalla Categorías con tabla y modal profesional. Usar tabla `categorias`. Campos: id, nombre, orden, visible, usa_talles. Debe permitir crear, editar y listar. No usar prompt() ni alert visual feo si se puede evitar.

## Prompt 5 - Pedidos

Reestructurá Pedidos como pantalla de consultas WhatsApp. Usar tabla `pedidos`. Estados: en_revision, vendido, no_vendido. Crear modal para editar pedido/consulta. Debe tener botones Marcar vendido y Marcar no vendido. Solo vendido impacta contabilidad.

## Prompt 6 - Contabilidad

Actualizá Contabilidad para que solo cuente ventas confirmadas. Usar ventas, ventas_manuales y pedidos vendidos si corresponde. Mostrar ingresos, ventas confirmadas, consultas no vendidas, ticket promedio, caja del período, conversión, gráficos y movimientos recientes.

## Prompt 7 - Métricas

Actualizá Métricas para medir rendimiento: consultas WhatsApp, ventas confirmadas, tasa de conversión, facturación, ticket promedio, productos consultados, gráficos y rankings.

## Prompt 8 - Estadísticas

Actualizá Estadísticas para analizar lo vendido y lo más buscado. Mostrar más vendido, más consultado, top categoría buscada, unidades vendidas, conversión, destacados y gráfico de consultas/ventas/conversión.

## Prompt 9 - Pruebas

Probá login, navegación, sidebar, modales, carga de datos Supabase, catálogo público y consola del navegador. No hagas cambios grandes. Solo corregí errores detectados y entregá informe.
