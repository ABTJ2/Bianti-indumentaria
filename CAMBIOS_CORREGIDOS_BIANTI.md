# Cambios corregidos BIANTI

## Productos
- Se optimizó la carga del listado de productos: ahora relaciones, talles y fotos se consultan en paralelo.
- Se corrigió el modal de edición para que guarde mejor título, precio, descripción, estado, categorías, talles y fotos.
- Se agregó opción real para quitar portada: queda marcada y se confirma al guardar.
- Se corrigió eliminación de fotos existentes con modal interno de confirmación.
- Se reemplazaron confirmaciones nativas del navegador por modales dentro del sistema.
- Se agregaron notificaciones internas tipo toast para guardado, eliminación y errores.

## Importación masiva
- Se mejoró la detección de imágenes dentro del ZIP.
- Ahora reconoce más columnas posibles: imagen, imagenes, foto, fotos, portada, imagen_principal, archivo_imagen, filename, image, etc.
- Ahora compara nombres ignorando mayúsculas, acentos, espacios, guiones, guiones bajos y extensión.
- Si el CSV no trae coincidencia exacta, intenta encontrar la imagen por el título del producto.
- Se ignoran archivos basura de macOS como __MACOSX y .DS_Store.

## Sidebar
- Se reforzó el marcado de página activa.
- Nuevo producto queda marcado dentro de Productos.
- Se evita que queden dos opciones activas al mismo tiempo.

## Diseño responsive
- Se compactó el sistema para notebooks chicas.
- Se redujeron tamaños de títulos, botones, paneles, chips, tablas y modales.
- La tabla ahora permite scroll interno sin romper toda la pantalla.
- El sidebar se achica antes en pantallas pequeñas.
- El modal de edición ocupa menos espacio y tiene mejor altura máxima.

## Archivos modificados
- assets/js/admin/admin-core.js
- assets/js/admin/productos.js
- assets/js/admin/importar-productos.js
- assets/css/admin.css
