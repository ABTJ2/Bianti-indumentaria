# Gráficos de contabilidad BIANTI

## Estado anterior
La pantalla `/admin/contabilidad` recibía productos, ventas, ventas manuales y pedidos, pero la vista hacía los cálculos directamente y solo mostraba KPIs/listas simples. No había gráficos visuales útiles para evolución mensual, inversión, ganancia o top de productos.

En el entorno revisado no había muestras de `ventas`, `ventas_manuales` ni `pedidos`, por lo que la pantalla debe mostrar estado vacío elegante y no gráficos falsos.

## Datos usados
Se usan datos reales de:
- `ventas`: operaciones vendidas registradas.
- `ventas_manuales`: ventas cargadas manualmente.
- `pedidos`: solo pedidos con `estado = vendido` y precio válido.
- `productos`: solo para mapear nombre y `precio_costo` cuando hay `producto_id`.

## Gráficos implementados
- Ingresos por mes.
- Ventas por mes.
- Inversión recuperada vs pendiente.
- Ganancia por periodo.
- Top productos por ganancia.

Los gráficos se implementan con HTML/CSS liviano, sin librerías externas.

## Reglas
- No se inventan ingresos.
- Solo ventas reales y pedidos vendidos cuentan como operaciones.
- No se usan pedidos `en_revision`, `no_vendido` ni `cancelado`.
- Si falta precio válido, la operación no suma ingresos.
- Si falta costo, no se calcula ganancia falsa para esa operación.
- Los productos cargados no se cuentan como ventas.
- Si una venta ya referencia un pedido, ese pedido vendido no se duplica.

## Cómo probar
1. Entrar a `/admin/contabilidad`.
2. Ver KPIs.
3. Ver gráficos si hay ventas reales.
4. Si no hay ventas, ver estado vacío: `Todavía no hay ventas suficientes`.
5. Marcar un pedido como vendido.
6. Volver a contabilidad.
7. Confirmar que se actualizan ingresos, operaciones y gráficos.
