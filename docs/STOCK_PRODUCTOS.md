# Stock de productos BIANTI

## Estado actual
Se revisó la respuesta real de Supabase para `productos` y actualmente no existen columnas de stock.

Columnas reales detectadas:
- `id`
- `categoria_id`
- `titulo`
- `descripcion`
- `precio`
- `disponible`
- `visible`
- `portada_url`
- `created_at`
- `precio_costo`
- `precio_venta`

## Campos usados
No hay campos reales de stock en uso actualmente.

El código quedó preparado para detectar columnas si en el futuro existen estos pares:
- `stock_actual` y `stock_minimo`,
- `stock` y `stock_minimo`,
- `cantidad` y `stock_minimo`,
- `cantidad_disponible` y `minimo_stock`.

## Alta producto
Como no existen columnas reales, la pantalla de alta no muestra campos de stock para no simular funcionalidad ni romper Supabase.

## Edición producto
Como no existen columnas reales, la pantalla de edición no muestra campos de stock. Si se agregan columnas con aprobación, se mostrarán `Stock actual` y `Stock mínimo`.

## Dashboard
Las alertas de bajo stock no se muestran mientras no existan columnas reales. Si existen, se listarán productos donde `stock_actual <= stock_minimo` o equivalentes detectados.

## Pendiente
Propuesta SQL no aplicada:

```sql
ALTER TABLE productos
ADD COLUMN stock_actual integer DEFAULT 0,
ADD COLUMN stock_minimo integer DEFAULT 0;
```

Esta propuesta requiere aprobación antes de ejecutarse. No fue aplicada por esta reparación.
