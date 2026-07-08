# Revisión funcional post restauración BIANTI

## Problemas encontrados

- El catálogo público no tenía markup de modal de producto, pero los botones `Ver detalle` existían.
- Las tarjetas estáticas de ofertas no tenían botones `Ver detalle` ni `Consultar`.
- El JS público estaba minificado en una sola línea, difícil de auditar, y no garantizaba delegación clara para productos estáticos, productos renderizados por búsqueda y productos renderizados por categoría.
- El botón `Consultar` dependía del `href` estático y no garantizaba apertura si fallaba el registro de evento.
- En Categorías admin había un `onclick` inline para abrir edición.
- Pedidos admin tenía tabla desktop, pero no tenía cards mobile equivalentes.

## Catálogo público

Se corrigió el flujo público en `app/Views/catalogo/index.php` y `public/assets/js/catalogo-ci.js`.

- Se agregó un modal real `#productModal` con imagen, nombre, categoría, precio, descripción, talles, disponibilidad y botón WhatsApp.
- Se agregó JSON inicial `#biantiStaticProducts` para que los productos destacados/ofertas funcionen antes o aunque tarde la API.
- Se mantuvo la API `api/catalogo/productos` para búsqueda, filtros y render dinámico.
- Se reescribió `catalogo-ci.js` en formato legible y con delegación de eventos sobre `document`.
- Se validó por HTTP que la entrada principal responde `200`, carga `catalogo-ci.js` y contiene `productModal`.
- Se validó por HTTP que `api/catalogo/productos` responde `200` con `ok=true` y productos.

## Botón Ver detalle

Quedó funcionando por delegación de eventos para:

- Productos destacados estáticos.
- Ofertas estáticas.
- Productos renderizados por búsqueda.
- Productos renderizados por categoría/filtros.

El JS toma el producto desde `data-id`, `data-wa` o `data-product`, busca los datos en memoria y abre el modal. Al abrir detalle registra evento `view_product` en `api/eventos`. Si el registro falla, lo informa en consola y no bloquea el modal.

## Botón Consultar WhatsApp

Quedó funcionando por delegación de eventos para tarjetas estáticas, dinámicas y modal.

El mensaje generado es:

`Hola BIANTI, quiero consultar por este producto: [nombre] - Precio: $[precio] - ID interno: #[id]`

El flujo abre WhatsApp con `window.open`. Después intenta registrar `click_whatsapp` en `api/eventos`. Si Supabase/API falla, se muestra un warning claro en consola y WhatsApp igual se abre.

## Admin

Pantallas revisadas a nivel rutas, vistas, sintaxis y acciones principales:

- Login: vista y controlador sin errores de sintaxis.
- Dashboard: vista y controlador sin errores de sintaxis; acciones superiores revisadas.
- Productos: filtros, editar, ocultar/mostrar, disponible/no disponible y eliminar tienen rutas POST existentes.
- Importar productos: scripts cargan solo en importador; vista corregida para `hidden` y paneles dinámicos.
- Categorías: crear, editar, eliminar y portada tienen rutas existentes; se quitó `onclick` inline y se pasó a `admin-ci.js`.
- Pedidos: vendido, no vendido y eliminar tienen rutas existentes; se agregaron cards mobile.
- Ofertas: buscar, filtrar, aplicar porcentaje, calcular precio final y eliminar usan rutas existentes y JSON local.
- Métricas/Estadísticas/Contabilidad: vistas y controladores sin errores de sintaxis; estados vacíos revisados.

No se cambiaron credenciales, Supabase, DER, tablas ni campos.

## JS corregido

- `public/assets/js/catalogo-ci.js`: reescrito completo, legible, con delegación, modal, búsqueda/filtros y WhatsApp robusto.
- `public/assets/js/admin-ci.js`: agregado manejo delegado para abrir/cerrar edición de categorías.

## CSS corregido

- `public/assets/css/catalogo.css`: estilos del modal de detalle público.
- `public/assets/css/responsive.css`: modal responsive y cards admin mobile.
- `public/assets/css/admin.css`: cards mobile de pedidos.

## Pendientes

## Crítico

- No quedó pendiente crítico detectado en catálogo público: API responde, JS carga, modal existe y botones usan delegación.

## Importante

- `Nuevo producto` no tiene ruta MVC propia de alta manual; actualmente el acceso disponible apunta al importador para no inventar flujo ni tablas.
- Pedidos no tiene ruta de `Ver detalle` ni `Cancelar`; existen `vendido`, `no_vendido` y `eliminar`.
- El importador actual trabaja con ZIP que contiene CSV e imágenes; no hay flujo separado de seleccionar CSV independiente.

## Mejora posterior

- Probar con navegador real y sesión admin autenticada todos los POST contra Supabase en datos reales.
- Agregar toast visual cuando se copia el link del catálogo.
- Separar aún más datos JSON iniciales del catálogo si el volumen crece.

## Cómo probar

1. Abrir `http://localhost/programacion3/proyectos/Bianti-indumentaria-main/`.
2. Hacer click en `Ver detalle` en un producto destacado.
3. Confirmar que abre modal con imagen, nombre, categoría, precio, descripción, talles, estado y WhatsApp.
4. Hacer click en `Consultar` desde una tarjeta y verificar que abre WhatsApp.
5. Buscar por nombre con `Buscar producto por nombre... Ej: pantalón, calza, perfume` y probar `Ver detalle` en los resultados.
6. Click en una categoría y probar `Ver detalle` y `Consultar` en productos filtrados.
7. Abrir filtros, cambiar categoría/talle/orden, aplicar y probar botones de resultados.
8. Entrar a `http://localhost/programacion3/proyectos/Bianti-indumentaria-main/public/admin/login`.
9. Iniciar sesión y revisar Dashboard, Productos, Importar, Categorías, Pedidos, Ofertas, Métricas, Estadísticas y Contabilidad.
10. En Productos, probar editar, ocultar/mostrar, disponible/no disponible y eliminar con cuidado.
11. En Categorías, probar crear, editar, cambiar portada, visible, usa talles, orden y eliminar con cuidado.
12. En mobile, verificar catálogo en cards, modal usable, footer visible, menú admin hamburguesa y productos/pedidos admin en cards.
