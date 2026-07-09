# AGENTE 7 - SUPABASE Y FUNCIONALIDAD

## Objetivo
Verificar que la conexión con Supabase funcione correctamente y que las operaciones principales guarden datos bien.

## Archivos
- assets/js/supabase.js
- assets/js/constants.js
- assets/js/admin/auth.js
- assets/js/admin/productos.js
- assets/js/admin/nuevo-producto.js
- assets/js/admin/categorias.js
- assets/js/admin/pedidos.js
- assets/js/admin/ventas.js
- assets/js/admin/metricas.js
- assets/js/admin/tracking.js
- assets/js/admin/contabilidad.js
- assets/js/admin/backups.js

## Verificar
- Login con tabla usuarios.
- Campos correctos: username, password, rol, activo.
- Carga de productos.
- Listado de productos.
- Carga de categorías.
- Relación producto_categorias.
- Fotos de productos.
- Talles.
- Pedidos.
- Ventas.
- Eventos.
- Métricas.
- Backups.

## Reglas críticas
- No cambiar nombres de tablas.
- No cambiar nombres de columnas.
- No borrar datos.
- No desactivar seguridad sin avisar.
- No tocar RLS sin explicar.
- No guardar contraseñas nuevas de otra forma sin adaptar login.
- No romper funciones actuales.

## Entrega esperada
Lista de funcionalidades probadas y errores corregidos.