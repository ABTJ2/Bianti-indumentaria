# BIANTI INDUMENTARIA - Reestructuración Admin y Catálogo

Este paquete contiene la guía para que OpenCode reestructure el sistema BIANTI sin romper la base de datos actual de Supabase.

## Objetivo principal

Adaptar el diseño aprobado al proyecto real, manteniendo las tablas actuales y ordenando el sistema en 6 pantallas principales:

1. Panel principal
2. Métricas
3. Categorías
4. Pedidos
5. Contabilidad
6. Estadísticas

Se elimina `Configuración` del sidebar porque no hay una función real definida para esa pantalla.

## Regla máxima

No cambiar nombres de tablas ni columnas existentes sin autorización.

Primero se reestructura la interfaz, después se ajusta la lógica JavaScript si hace falta.
