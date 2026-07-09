# BIANTI MVC Supabase v3

Esta versión recupera estética del proyecto anterior y mantiene la lógica MVC/PHP para XAMPP.

## Cambios principales
- Login recuperado con estética anterior de BIANTI.
- Catálogo: buscador por nombre, categorías más claras, beneficios restaurados y footer más completo.
- Filtros: no se abren solos, cierran con X/clic afuera/ESC, sin precio en catálogo público.
- Productos: edición de datos, categorías y talles.
- Categorías: crear, editar, eliminar y subir portada local sin tocar tablas de Supabase.
- Pedidos: cambiar estado a vendido/no vendido y eliminar definitivamente.
- Ofertas: descuentos por porcentaje y días usando `storage/ofertas.json`, sin modificar DER.
- Métricas: muestra nombres e imágenes de productos, no solo IDs.
- Estadísticas y contabilidad: gráficos y paneles más claros.
- Sidebar: se recuperan íconos, estética oscura y cerrar sesión abajo.

## Nota
El módulo de importación usa el importador JS existente para no romper la carga masiva. La optimización total de importación por cola/lotes queda para Codex.
