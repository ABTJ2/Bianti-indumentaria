# Destacados, métricas y reset BIANTI

## Productos destacados
Los productos destacados del catálogo muestran como máximo 8 productos. En desktop el grid queda preparado para 2 hileras de 4 cards dentro del ancho actual del catálogo.

El cálculo usa eventos reales del catálogo:
- `view_product` y `product_view` suman 1 punto.
- `click_whatsapp` y `whatsapp_click` suman 3 puntos.

Solo se muestran productos existentes, visibles y disponibles. Si las métricas no alcanzan para completar 8 destacados, se completan con los últimos productos visibles y disponibles hasta llegar al máximo posible.

Después de resetear métricas o estadísticas, los destacados se recalculan desde cero y usan el fallback de últimos productos visibles/disponibles hasta que existan nuevos eventos.

## Reset métricas
El botón `Resetear métricas` está en `/admin/metricas` y usa modal BIANTI.

Limpia solo eventos de métricas del catálogo:
- `view_product`
- `product_view`
- `click_whatsapp`
- `whatsapp_click`
- `view_category`
- `view_catalog`
- `catalog_view`
- `catalogo_view`

## Reset estadísticas
El botón `Resetear estadísticas` está en `/admin/estadisticas` y usa la misma base de limpieza porque métricas y estadísticas se calculan desde la tabla `eventos`.

Después del reset, estadísticas queda sin conteos suficientes hasta que se registren nuevos eventos.

## Seguridad
El reset no borra:
- productos,
- categorías,
- pedidos,
- ventas,
- ventas manuales,
- usuarios,
- contabilidad histórica.

Los eventos desconocidos no se eliminan para evitar borrar datos que puedan servir a otros módulos.
