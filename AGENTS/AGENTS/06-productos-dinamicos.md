# AGENTE 6 - CARGA DE PRODUCTOS DINÁMICA

## Objetivo
Mejorar la pantalla de carga de productos para que sea más fácil, clara y dinámica.

## Archivos
- admin/nuevo-producto.html
- admin/productos.html
- admin/categorias.html
- assets/js/admin/nuevo-producto.js
- assets/js/admin/productos.js
- assets/js/admin/categorias.js
- assets/css/admin.css

## Cambios deseados
- Mejorar formulario de nuevo producto.
- Separar datos básicos, categorías, talles, fotos y estado.
- Usar listas desplegables cuando sea posible.
- Facilitar selección de categorías.
- Facilitar selección de talles.
- Facilitar selección de visibilidad y disponibilidad.
- Mejorar mensajes de éxito/error.
- Mejorar vista de productos cargados.
- Mostrar mejor los productos en tabla.
- Agregar estados visuales.

## Listas desplegables deseadas
Cuando la base de datos lo permita:
- Categorías.
- Subcategorías.
- Talles.
- Estado del producto.
- Visibilidad.
- Disponibilidad.

## Reglas
- No romper las tablas existentes.
- No cambiar nombres de columnas.
- No cambiar lógica de Supabase sin revisar.
- No eliminar carga manual si todavía es necesaria.
- Si una lista no tiene datos, mostrar mensaje claro.
- Si no hay categorías, ofrecer botón para crear categoría.

## Entrega esperada
Una carga de producto más simple y entendible para una persona que no es técnica.