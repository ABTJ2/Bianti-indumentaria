# Pruebas manuales reales BIANTI

## Catálogo

1. Abrir `catalogo`.
2. Confirmar que no se listan todos los productos dinámicos al inicio.
3. Confirmar mensaje: `Elegí una categoría o buscá por nombre para ver productos.`
4. Buscar por nombre y verificar cards con imagen, nombre, precio y botón `Consultar`.
5. Tocar una categoría y verificar resultados filtrados.
6. Abrir `Ver detalle` y confirmar modal usable.
7. Tocar `Consultar por WhatsApp`.
8. Confirmar que WhatsApp abre.
9. Confirmar en consola que no haya error fatal si Supabase falla.
10. Confirmar en admin que se creó pedido y se registró evento.

## Admin

1. Entrar a `admin/login` con sesión admin real.
2. Revisar `admin/dashboard` y confirmar que no muestre producto inexistente como más consultado.
3. Ir a `admin/productos`.
4. Crear producto `TEST BIANTI NO USAR` con portada JPG/PNG/WEBP.
5. Confirmar que aparece en admin con foto.
6. Editar producto y cambiar precio, categorías, talles, visible/disponible y portada.
7. Confirmar que visible/disponible aparece en catálogo cuando corresponde.
8. Consultar el producto desde catálogo.
9. Ver el pedido en `admin/pedidos`.
10. Abrir detalle del pedido.
11. Marcar vendido, no vendido y cancelado según corresponda.
12. Revisar `admin/contabilidad` y confirmar que solo suma pedidos vendidos con precio válido.
13. Revisar `admin/metricas` y confirmar nombres/imágenes reales.
14. Usar `Limpiar métricas huérfanas` si aparece contador mayor a cero.
15. Eliminar `TEST BIANTI NO USAR` al finalizar.

## Responsive

1. Probar catálogo en desktop, notebook chica, tablet y celular.
2. Confirmar que mobile no usa tabla ni scroll horizontal como solución principal.
3. Confirmar header compacto, buscador usable, categorías claras, cards, modal y WhatsApp tocable.
4. Probar admin mobile con menú hamburguesa, cards de productos/pedidos, formularios en una columna y botones tocables.

## Verificación pendiente

- No se ejecutó navegador interactivo con sesión admin desde esta revisión. Se dejaron pasos reproducibles y se verificará con usuario/sesión real.
