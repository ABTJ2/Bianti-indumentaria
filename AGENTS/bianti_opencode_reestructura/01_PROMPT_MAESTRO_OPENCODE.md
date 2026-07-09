# PROMPT MAESTRO PARA OPENCODE

Vas a trabajar sobre el proyecto BIANTI INDUMENTARIA.

Necesito reestructurar el panel admin y el catálogo manteniendo la base de datos actual en Supabase. No inventes una base nueva. No cambies nombres de tablas ni columnas salvo que sea estrictamente necesario y primero expliques el motivo.

## Tecnologías del proyecto

El proyecto usa:

- HTML
- CSS
- JavaScript
- Supabase como backend/base de datos
- Supabase Storage para imágenes
- Login admin mediante tabla `usuarios`

## Tablas detectadas / esperadas

Usar las tablas actuales:

- usuarios
- productos
- categorias
- producto_categorias
- producto_talles
- producto_fotos
- pedidos
- ventas
- ventas_manuales
- eventos

No crear tablas nuevas para esta etapa.

## Objetivo visual

Aplicar el diseño aprobado:
- sidebar oscuro elegante
- fondo principal claro
- acentos violetas
- tarjetas redondeadas
- modales prolijos
- tablas limpias
- topbar oscuro
- diseño desktop 16:9
- responsive básico para pantallas chicas

## Sidebar definitivo

El sidebar debe ser único y reutilizable en todas las pantallas admin.

Orden exacto:

1. Panel principal
2. Métricas
3. Categorías
4. Pedidos
5. Contabilidad
6. Estadísticas

Eliminar del sidebar:
- Configuración
- Backups
- Tracking
- Clientes
- Consultas
- Productos
- Nuevo producto

Importante:
Productos no desaparece del sistema. La gestión de productos puede quedar accesible desde Panel principal o desde accesos rápidos, pero no como ítem principal del sidebar.

## Pantallas admin definitivas

### 1. Panel principal

Debe mostrar:
- consultas WhatsApp en revisión
- ventas confirmadas
- no vendidos
- ingresos del período
- producto más consultado
- tasa de conversión
- flujo de ventas
- accesos rápidos
- últimas consultas

Flujo visual:
Consulta WhatsApp → Pedido en revisión → Vendido / No vendido → Si es vendido impacta en Contabilidad.

### 2. Métricas

Debe mostrar:
- consultas WhatsApp
- ventas confirmadas
- tasa de conversión
- facturación del período
- ticket promedio
- productos consultados
- gráfico consultas vs ventas
- productos más consultados
- productos más vendidos

### 3. Categorías

Debe permitir:
- listar categorías
- crear categoría
- editar categoría
- eliminar categoría si corresponde
- ordenar categorías
- marcar visible
- marcar usa_talles

Modal categoría:
- nombre
- orden
- visible
- usa_talles
- guardar
- cancelar

### 4. Pedidos

Esta pantalla representa las consultas de WhatsApp.

Regla:
Cada consulta hecha desde un producto por WhatsApp debe guardarse como pedido/consulta en revisión.

Estados:
- en_revision
- vendido
- no_vendido

Debe mostrar:
- filtros por estado
- búsqueda
- rango de fecha
- tabla de pedidos
- modal editar pedido/consulta

Modal pedido:
- estado
- producto
- cliente
- WhatsApp
- nota
- botón Marcar vendido
- botón Marcar no vendido

Regla importante:
Solo los pedidos marcados como `vendido` impactan en contabilidad.

### 5. Contabilidad

Debe mostrar solo datos financieros reales.

Debe tomar como ventas válidas:
- ventas
- ventas_manuales
- pedidos marcados como vendido, si el proyecto los usa para generar ventas

Debe mostrar:
- ingresos por ventas confirmadas
- ventas confirmadas
- consultas no vendidas
- ticket promedio
- caja del período
- conversión a venta
- ventas confirmadas vs consultas WhatsApp
- ingresos por categoría
- movimientos recientes

Debe aclarar:
Solo las consultas marcadas como vendido desde Pedidos impactan en esta sección.

### 6. Estadísticas

Debe mostrar análisis de ventas y búsquedas.

Debe mostrar:
- más vendido
- más consultado
- top categoría buscada
- unidades vendidas
- conversión
- top productos vendidos
- productos/categorías más consultadas
- destacados según lo que más consulta o busca la gente
- gráfico consultas, ventas y conversión

Regla:
Lo destacado debe salir de lo más consultado o buscado, no cargarse manualmente en esta etapa.

## Orden de trabajo

1. Revisar archivos actuales.
2. Revisar conexión Supabase.
3. Detectar tablas y columnas usadas en JS.
4. Rehacer sidebar único.
5. Rehacer CSS base admin.
6. Actualizar Panel principal.
7. Actualizar Métricas.
8. Actualizar Categorías.
9. Actualizar Pedidos.
10. Actualizar Contabilidad.
11. Actualizar Estadísticas.
12. Probar navegación.
13. Probar login.
14. Probar carga de datos desde Supabase.
15. Probar modales.
16. Probar que no se rompa el catálogo público.

## Prohibiciones

No hacer esto:
- No cambiar las credenciales de Supabase.
- No borrar tablas.
- No cambiar nombres de columnas.
- No cambiar rutas sin actualizar enlaces.
- No eliminar IDs usados por JavaScript sin actualizar el JS.
- No crear pantallas falsas.
- No dejar botones sin función salvo que estén marcados como pendiente.
- No duplicar CSS sin necesidad.
- No mezclar estilos viejos con nuevos sin limpiar.

## Entrega esperada

Al terminar, entregar:
- lista de archivos modificados
- qué cambió en cada archivo
- qué pantallas funcionan
- qué cosas quedaron pendientes
- errores encontrados
- recomendaciones
