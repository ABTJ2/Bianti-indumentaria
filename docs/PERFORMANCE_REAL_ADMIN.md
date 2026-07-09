# Performance real admin BIANTI

## Medición
Se midió con servidor PHP local (`php -S 127.0.0.1:8099 -t . index.php`) usando `curl` con `time_starttransfer` y `time_total`.

Para admin se creó una sesión PHP local de medición con `bianti_user` para ejecutar controladores reales sin usar credenciales ni tocar `.env`. Sin sesión, las rutas admin solo miden redirect/login.

## Antes

| Pantalla | Tiempo actual | Consultas Supabase | Recurso más lento | Causa probable | Acción |
|---|---:|---:|---|---|---|
| `/` | 6.84s | 8 aprox. | Supabase productos/eventos | Catálogo arma destacados/ofertas/talles antes de render | Mantener cache corto existente |
| `/public/catalogo` | 2.09s | 8 aprox. | Supabase productos/eventos | Carga inicial de catálogo | Mantener cache corto existente |
| `/api/catalogo/productos` | 3.95s | 5 aprox. | Hidratación productos | Relaciones de productos sin cache por lote | Cache relaciones por IDs |
| `/api/catalogo/productos?q=flor` | 3.40s | 5 aprox. | Hidratación productos | Igual API catálogo | Cache relaciones por IDs |
| `/api/catalogo/productos?categoria=1` | 0.64s | 5 aprox. | Supabase relaciones | Menos productos por filtro | Sin cambios mayores |
| `/admin/login` | 0.01s | 0 | Ninguno | Login liviano | Sin cambios |
| `/admin` | 7.10s | 10 aprox. | Dashboard | Productos completos hidratados y stock recalculado | Dashboard liviano |
| `/admin/dashboard` | 5.75s | 10 aprox. | Dashboard | `ProductoModel::admin()` + `lowStockProducts()` duplicaba carga | Dashboard liviano |
| `/admin/productos` | 3.73s | 5 aprox. | Relaciones producto | Relaciones sin cache por lote | Cache relaciones por IDs |
| `/admin/categorias` | 0.03s | 1 aprox. | Ninguno | Pantalla liviana | Sin cambios |
| `/admin/pedidos` | 0.00s | 1 aprox. | Cache | Pedidos cacheados | Sin cambios |
| `/admin/ofertas` | 3.37s | 5 aprox. | Productos admin | Reutiliza productos hidratados | Cache relaciones por IDs |
| `/admin/metricas` | 5.12s | 8 aprox. | Productos + huérfanas | Productos hidratados y eventos huérfanos pesados | Productos livianos + cache productEvents |
| `/admin/estadisticas` | 3.10s | 6 aprox. | Productos hidratados | Cargaba relaciones completas para resumen | Productos livianos |
| `/admin/contabilidad` | 1.90s | 4 aprox. | Supabase ventas/pedidos/productos | Cálculo contable con datos reales | Medición y mantener métodos livianos |

## Después

Primera pasada después de optimizar:

| Pantalla | Tiempo |
|---|---:|
| `/admin` | 2.65s |
| `/admin/dashboard` | 0.65s |
| `/admin/productos` | 3.23s |
| `/admin/ofertas` | 3.20s |
| `/admin/metricas` | 3.42s |
| `/admin/estadisticas` | 1.40s |
| `/admin/contabilidad` | 1.90s |

Segunda pasada con cache corto activo:

| Pantalla | Tiempo |
|---|---:|
| `/admin` | 0.64s |
| `/admin/dashboard` | 0.68s |
| `/admin/productos` | 0.67s |
| `/admin/ofertas` | 0.67s |
| `/admin/metricas` | 0.64s |
| `/admin/estadisticas` | 0.73s |
| `/admin/contabilidad` | ~0.03s |

Medición posterior al separar ofertas de la hidratación completa de productos:

| Pantalla | Primera pasada | Segunda pasada |
|---|---:|---:|
| `/admin/productos` | 4.81s | 0.67s |
| `/admin/ofertas` | 0.73s | 0.67s |
| `/admin/dashboard` | 2.70s | 0.67s |
| `/admin/metricas` | 3.45s | 0.67s |
| `/admin/estadisticas` | 1.29s | 0.67s |
| `/admin/contabilidad` | 2.04s | ~0.00s |

## Mejoras aplicadas
- Dashboard dejó de usar `ProductoModel::admin()` hidratado para KPIs.
- Dashboard dejó de llamar `lowStockProducts()` como segunda carga completa de productos.
- Dashboard calcula KPIs, top, ventas y stock desde filas livianas.
- Métricas y estadísticas usan `ProductoModel::metricRows()` en lugar de productos hidratados completos.
- `EventoModel::productEvents()` queda cacheado 30s para reducir costo de huérfanas.
- `ProductoModel::hydrateAndFilter()` cachea relaciones por lote (`producto_categorias`, `producto_fotos`, `producto_talles`) 45s.
- `ProductoModel::admin()` cachea la base de productos admin 30s.
- `ProductoModel::offerRows()` evita cargar talles en ofertas porque esa pantalla no los usa.
- `SupabaseService` tiene `CURLOPT_CONNECTTIMEOUT = 5` y `CURLOPT_TIMEOUT = 15` para requests REST.
- Se agregaron mediciones `Performance::measure()` en dashboard, productos, métricas, estadísticas y contabilidad. Solo se registran si `DEBUG_PERFORMANCE=true`.

## Notas
- No se cambió Supabase schema ni DER.
- No se tocaron credenciales.
- No se agregaron librerías de frontend.
- El cache se invalida con `Cache::forgetPrefix('bianti_')` en altas/ediciones/eliminaciones y cambios relevantes ya existentes.
- No se detectaron recursos pesados nuevos en contabilidad; los gráficos son HTML/CSS.
- `/admin/productos` conserva la carga completa de categorías, fotos y talles porque la pantalla los muestra. Reducir más el primer hit requeriría paginación real, menos filas por defecto o carga diferida de talles.
