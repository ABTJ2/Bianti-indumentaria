# Funciones de módulos BIANTI

## Dashboard

Muestra KPIs reales desde Supabase: producto más consultado, ventas confirmadas, tasa de conversión, consultas WhatsApp en revisión, ingresos y no vendidos. También muestra flujo de ventas, operación rápida, últimas consultas y alertas de stock solo si existen columnas reales.

## Productos

Lista productos, busca, filtra por categoría, visibilidad y disponibilidad. Permite crear, editar título, descripción, precio venta, precio costo, categorías, talles, portada, visible y disponible. Elimina con modal BIANTI y evita borrar si hay venta o pedido vendido asociado.

## Categorías

Lista categorías en cards, permite crear, editar, eliminar con modal, ordenar, marcar visible, marcar usa talles y usar portada si la columna existe.

## Pedidos

Lista pedidos, muestra detalle, fecha, producto, precio, estado, origen, mensaje y contacto si existe. Permite marcar vendido, no vendido, cancelado y eliminar con modal. Solo `vendido` cuenta para contabilidad.

## Ofertas

Gestiona descuentos temporales por producto con porcentaje, precio final calculado, duración en horas/días, activar/desactivar y eliminar con modal. Usa `localStorage` mientras no exista tabla Supabase aprobada.

## Métricas

Muestra vistas de productos, clicks WhatsApp, categorías vistas, eventos totales, top productos y productos con más WhatsApp. Limpia huérfanas y resetea solo eventos conocidos, sin borrar productos, pedidos ni ventas.

## Estadísticas

Muestra productos totales, visibles, ocultos, sin foto, categorías activas, productos por categoría, más consultados y más WhatsApp. El reset usa modal y borra solo eventos conocidos.

## Contabilidad

Calcula inversión total, recuperada, activa, ingresos, ganancia real, caja total, caja libre, operaciones y ticket promedio desde ventas, ventas manuales, pedidos vendidos y productos con `precio_costo`. No cuenta pedidos en revisión, no vendidos ni cancelados.

## Importar

Carga PapaParse y JSZip solo al entrar al módulo. Permite CSV, ZIP de imágenes, vista previa, validaciones básicas, importación por lotes, subida a Storage `productos` y creación de relaciones categorías/talles/fotos si RLS lo permite.
