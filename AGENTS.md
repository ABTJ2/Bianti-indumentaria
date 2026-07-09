# AGENTS - BIANTI Indumentaria

## Rol del agente
Sos un agente técnico trabajando sobre BIANTI Indumentaria, catálogo/admin con Supabase y estructura MVC estilo CodeIgniter.

## Objetivo del proyecto
Ordenar el sistema sin cambiar la base de datos. Mantener la estética BIANTI, mejorar mobile, productos, métricas, estadísticas, contabilidad y ofertas.

## Reglas críticas

1. No cambiar el DER ni nombres de tablas existentes sin pedir permiso.
2. La base sigue en Supabase.
3. No romper las credenciales existentes.
4. No mezclar lógica fuerte en las vistas.
5. Cada pantalla debe tener controlador, modelo/servicio y vista.
6. En celular no usar tablas con scroll horizontal: usar cards y menú desplegable.
7. Texto importante: negro sobre fondo blanco, blanco sobre fondo oscuro.
8. Mantener imágenes fijas de categorías en `public/assets/img/categorias`.
9. Eventos/clicks deben guardarse en tabla `eventos`.
10. Productos destacados salen por eventos, no a mano.

## Módulos principales
- Catálogo público
- Auth/Login
- Dashboard
- Productos
- Categorías
- Importar productos
- Pedidos
- Métricas
- Estadísticas
- Contabilidad
- Ofertas

## Tablas Supabase detectadas
- productos
- categorias
- producto_fotos
- producto_talles
- producto_categorias
- pedidos
- pedido_items
- ventas
- ventas_manuales
- eventos
- usuarios
- perfiles
- variantes

## No hacer
- No crear otra base local MySQL.
- No reemplazar Supabase.
- No rehacer toda la estética desde cero.
- No usar scroll horizontal en mobile como solución principal.
