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


## Ajustes extra (segunda pasada)
- Corregí el bloque de categorías del catálogo para que no se desborde, quede mejor centrado y responda mejor en pantallas chicas.
- Reorganicé el sidebar admin para que no tape el logo, no empuje mal el botón de cerrar sesión y se vea más prolijo en notebooks.
- Mejoré la caja del botón de “Cerrar sesión” para que no quede fuera del cuadro.
- En **Productos** agregué filtros más útiles:
  - por **categoría**,
  - por **visibilidad** (todos / visibles / no visibles),
  - y se mantiene **solo disponibles**.
- Compacté el toolbar de filtros para que no se rompa visualmente en resoluciones comunes.


## Ajuste mobile V3
- El admin ya no usa sidebar lateral en celular: pasa a navegación inferior con íconos para no quitar ancho.
- El contenido admin ocupa el ancho completo del celular.
- Dashboard, importación, contabilidad, productos y paneles se apilan en una sola columna.
- Filtros, botones y formularios se hacen 100% ancho en mobile.
- Tablas quedan con scroll horizontal controlado dentro del panel, sin romper toda la pantalla.
- Modales de edición pasan a pantalla completa en celular.
- El catálogo público se reorganiza para celular: header compacto, hero más corto, categorías con scroll horizontal, cards en una columna y footer limpio.


## Ajustes extra (tercera pasada)
- En **Productos (admin)** agregué filtros más completos: categoría, visibilidad, disponibilidad, con/sin foto y ordenamiento.
- Mejoré la visibilidad de las **categorías, talles y estados** con colores más fuertes.
- Hice más grande la miniatura del producto en la tabla para identificarlo mejor.
- En el **catálogo público** agregué un botón de **Filtros** con modal para filtrar por categoría, precio mínimo/máximo, solo disponibles y ordenamiento.
- Mostré mejor la categoría y disponibilidad en cada card del catálogo.
- Cambié el botón de WhatsApp de cada producto para que se vea más claro como acción de consulta.
- Saqué el bloque de **"Envíos a todo el país"** porque no corresponde.

## Ajustes extra (cuarta pasada)
- En **Productos admin** agregué filtros más completos: categoría, visibilidad, disponibilidad, con/sin foto y ordenamiento.
- Reforcé los colores de categorías, talles y estados para que se lean bien.
- Corregí **mostrar/ocultar** para que actualice Supabase y refresque visualmente el estado.
- Corregí el borrado de fotos existentes para que, si esa foto también era portada, se limpie `productos.portada_url` y desaparezca del catálogo.
- En el catálogo público agregué modal de filtros: categoría, precio mínimo/máximo, solo disponibles y ordenamiento.
- Saqué el beneficio “Envíos a todo el país”.

## Ajustes extra (sexta pasada)
- Corregí el modal de filtros del catálogo para que los campos no se salgan del cuadro.
- Convertí la card “Colección destacada” en banner horizontal para que no corte la grilla de productos.
- Ajusté la grilla del catálogo para que los productos no se corten a la derecha.
- Reforcé tamaños de fotos y acciones para que los productos sean lo principal.
