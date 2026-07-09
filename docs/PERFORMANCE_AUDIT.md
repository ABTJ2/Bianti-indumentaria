# Auditoria de rendimiento BIANTI

Fecha: 2026-07-08

## Mediciones locales

Entorno medido: XAMPP local contra Supabase remoto, usando `curl.exe` sobre `http://localhost/programacion3/proyectos/Bianti-indumentaria-main/public/`.

| Pantalla | Tiempo carga | Recurso lento | Posible causa | Prioridad |
| --- | ---: | --- | --- | --- |
| `/` catalogo, antes de segunda optimizacion | 8.203s frio / 5.516s caliente | TTFB completo | PHP esperaba consultas Supabase secuenciales antes de renderizar HTML | Critica |
| `/` catalogo, despues | 2.390s primera pasada / 0.844s cache caliente | TTFB | Quedan consultas remotas, pero categorias/eventos/talles y listados chicos tienen cache TTL corto | Alta |
| `/api/catalogo/productos?categoria=1` | 0.828s | API catalogo | Consulta Supabase filtrada por categoria + hidratacion acotada a IDs | Alta |
| `/api/catalogo/productos?q=pantalon` | 0.703s | API catalogo | Consulta con busqueda y limite de respuesta | Alta |
| `/admin/login` | 0.032s | Ninguno relevante | Vista liviana, sin consultas pesadas | Baja |
| `/admin` sin sesion | 0.031s, 302 | Ninguno relevante | Redireccion por auth | Baja |
| `/admin/productos` sin sesion | 0.031s, 302 | Ninguno relevante | Redireccion por auth | Baja |
| `/admin/metricas` sin sesion | 0.047s, 302 | Ninguno relevante | Redireccion por auth | Baja |
| `/admin/contabilidad` sin sesion | 0.032s, 302 | Ninguno relevante | Redireccion por auth | Baja |

## Hallazgos reales

| Pantalla | Tiempo carga | Recurso lento | Posible causa | Prioridad |
| --- | ---: | --- | --- | --- |
| Catalogo `/` | 8s observado antes | HTML inicial | `Catalogo::index()` cargaba todos los productos completos, destacados, ofertas y talles antes de renderizar | Critica |
| Catalogo `/` y API productos | No medido en DevTools | Supabase REST | `ProductoModel::hydrateAndFilter()` traia todas las fotos, talles y relaciones del sistema en cada respuesta | Critica |
| Destacados | No medido en DevTools | Eventos Supabase | `EventoModel::topProducts()` leia hasta 3000 eventos y agrupaba en PHP en cada home | Alta |
| Admin dashboard/metricas/estadisticas | No medido con sesion admin | Eventos/productos | Se cargaban miles de eventos y productos hidratados para calculos iniciales | Alta |
| Contabilidad | No medido con sesion admin | Productos completos | La pantalla necesitaba costos/precios, pero cargaba productos con fotos, talles y categorias | Alta |
| `/api/pedidos` | 500 reportado | Validacion API | Body sin `producto_id` lanzaba excepcion y respondia 500 | Alta |
| Assets catalogo/admin | Revisado por layouts | JS/CSS | Layout publico carga `catalogo-ci.js`; admin carga `admin-ci.js`; no se detecto importador/admin en catalogo | Media |
| Imagenes de cards | Revisado en vista | Imagenes | Cards estaticas no declaraban `loading`, `width` ni `height` | Media |

## Limitaciones de medicion

No se pudo medir DevTools visual con sesion admin autenticada desde esta ejecucion. Las rutas admin protegidas se midieron sin cookie y devolvieron 302 correctamente. Para completar auditoria visual: abrir DevTools Network autenticado y registrar TTFB de `/admin/dashboard`, `/admin/productos`, `/admin/metricas`, `/admin/estadisticas` y `/admin/contabilidad`.
