# Funcionamiento de pantallas BIANTI

BIANTI quedó como sitio estático servido desde la raíz. Cada pantalla usa HTML, CSS y JavaScript directo contra Supabase con `anon key`. No hay PHP, MVC, CodeIgniter ni endpoints intermedios.

## Catálogo público

- Archivos: `index.html`, `assets/js/catalogo.js`, `assets/css/catalogo.css`, `assets/css/fixes.css`.
- Carga productos desde `productos`.
- Carga categorías desde `categorias`.
- Carga relaciones desde `producto_categorias`.
- Carga talles desde `producto_talles`.
- Carga fotos desde `producto_fotos` y usa `portada_url` si existe.
- Si un producto real no tiene foto, muestra `assets/img/placeholder-product.svg` solo en el modal y un placeholder discreto en cards.
- Los filtros y el modal arrancan cerrados por `hidden`, `aria-hidden="true"` y CSS seguro.
- `Ver detalle` solo abre si existe un producto real con título.
- El modal cierra con X, Escape o clic en el fondo.
- WhatsApp abre con el número de `BIANTI_WHATSAPP` y registra pedido/evento si RLS lo permite.
- El footer público no muestra acceso administrativo con texto visible; solo incluye un punto discreto hacia `login/`.
- En mobile hay una barra sticky con categoría, buscador compacto y filtros.
- El catálogo intenta leer ofertas reales desde `ofertas` si la tabla existe. Si no existe, usa promociones temporales del navegador y queda documentado en `docs/SUPABASE_OFERTAS_PROPUESTA.md`.
- WhatsApp arma mensajes distintos para productos normales y productos en oferta, siempre con nombre y precio reales.

## Login

- Archivos: `login/index.html`, `login/login.js`.
- Pide Usuario y Contraseña.
- Verifica usuario y contraseña con RPC contra `public.usuarios`.
- La contraseña se envía solo a la función de login, no se guarda y no se configura en archivos.
- Si falla, muestra mensaje visual BIANTI.
- Si funciona, redirige a `/admin/`.

## Admin general

- Archivos: `admin/index.html`, `admin/admin.js`, `assets/css/admin.css`.
- Verifica sesión administrativa con token temporal validado por RPC.
- Maneja sidebar, navegación, módulo activo, loader, errores globales y logout.
- Carga cada pantalla desde `modules/<modulo>/<modulo>.html` y `modules/<modulo>/<modulo>.js`.
- No contiene la lógica interna de productos, pedidos, métricas ni contabilidad.

## Dashboard

- Archivos: `modules/dashboard/dashboard.html`, `modules/dashboard/dashboard.js`.
- Calcula KPIs con productos, pedidos, eventos, ventas y ventas manuales.
- Solo suma pedidos vendidos como venta.
- Muestra alertas de stock solo cuando existen columnas compatibles.

## Productos

- Archivos: `modules/productos/productos.html`, `modules/productos/productos.js`.
- Lista productos reales.
- Permite crear, editar, ocultar/mostrar, marcar disponible/no disponible y eliminar con modal BIANTI.
- Usa `portada_url` y fallback desde `producto_fotos.url`.
- Limpia relaciones directas si RLS lo permite.
- No elimina productos con ventas o pedidos vendidos asociados.

## Categorías

- Archivos: `modules/categorias/categorias.html`, `modules/categorias/categorias.js`.
- Lista categorías reales.
- Permite crear, editar y eliminar si RLS lo permite.
- Maneja visible/no visible, usa talles, orden y portada cuando existe.

## Pedidos

- Archivos: `modules/pedidos/pedidos.html`, `modules/pedidos/pedidos.js`.
- Lista pedidos reales.
- Filtra por estado y búsqueda.
- Permite detalle, vendido, no vendido, cancelado y eliminación si RLS lo permite.
- Solo `vendido` cuenta para contabilidad.

## Ofertas

- Archivos: `modules/ofertas/ofertas.html`, `modules/ofertas/ofertas.js`.
- Usa almacenamiento temporal local porque no se crea una tabla nueva sin permiso.
- Permite seleccionar producto, descuento, duración, activar/desactivar y eliminar.
- El catálogo lee esas ofertas temporales para mostrar OFF, precio anterior y precio final.

## Métricas

- Archivos: `modules/metricas/metricas.html`, `modules/metricas/metricas.js`.
- Usa `eventos`.
- Lee `producto_id` como columna si existe o desde `payload`.
- Limpia eventos huérfanos y resetea solo tipos conocidos.
- No borra productos, pedidos ni ventas.

## Estadísticas

- Archivos: `modules/estadisticas/estadisticas.html`, `modules/estadisticas/estadisticas.js`.
- Calcula totales, visibles, ocultos, sin foto, categorías activas y rankings desde Supabase.
- Para productos sin foto solo usa `portada_url` y `producto_fotos.url`.
- Reset borra solo eventos conocidos.

## Contabilidad

- Archivos: `modules/contabilidad/contabilidad.html`, `modules/contabilidad/contabilidad.js`.
- Usa ventas, ventas manuales y pedidos vendidos.
- Usa `precio_costo` para inversión y ganancia cuando está disponible.
- No cuenta pedidos en revisión, cancelados o no vendidos.
- Si no hay ventas, muestra estados vacíos sin datos inventados.

## Importador

- Archivos: `modules/importar/importar.html`, `modules/importar/importar.js`.
- Carga CSV y ZIP.
- Importa por lotes contra Supabase.
- Sube imágenes al bucket `productos` si Storage/RLS lo permite.
- Crea relaciones de categorías, talles y fotos según datos disponibles.
