# Cierre funcional real

## Corregido

- Catálogo inicial: mantiene header, hero, buscador, categorías, destacados, ofertas, beneficios y footer sin listar todos los productos dinámicos.
- Destacados: salen de eventos válidos, sin fallback manual a los primeros productos.
- Resultados del catálogo: aparecen solo por búsqueda, categoría o filtros.
- Detalle de producto: sigue funcionando desde destacados, ofertas y resultados dinámicos.
- WhatsApp: abre siempre primero; luego intenta registrar evento y pedido.
- Pedidos: `api/pedidos` crea consulta en `pedidos` usando campos disponibles y producto real.
- Eventos: `view_product` y `click_whatsapp` no se guardan si apuntan a producto eliminado.
- Huérfanos: limpieza detecta `producto_id`, `id_producto`, `product_id` y `id` solo para eventos de producto.
- Dashboard/métricas/estadísticas: no cuentan productos borrados como productos válidos.
- Productos: alta y edición permiten portada contra Supabase Storage bucket `productos`.
- Pedidos admin: detalle muestra ID, fecha, producto, ID producto, precio o aviso, estado, mensaje, origen, cliente y contacto si existen.
- Contabilidad: usa ventas, ventas manuales y pedidos vendidos con precio válido; muestra vacío si no hay ventas reales.
- Importador: corregido bug seguro de `debugLog`.

## No cambiado

- No se cambió Supabase.
- No se cambió DER.
- No se cambiaron nombres de tablas.
- No se tocaron credenciales ni `.env`.
- No se agregó Tailwind ni librerías pesadas.
- No se borró legacy.

## Pendientes técnicos

- Validación manual completa con datos reales y sesión admin.
- Si se quiere eliminar imagen anterior al editar portada, falta implementar una estrategia segura para no borrar archivos compartidos o externos.
- La contabilidad sigue en vista por mínima intervención; conviene moverla a servicio/modelo en una refactorización futura.
