# Optimizacion de rendimiento BIANTI

## Problemas encontrados

- El catalogo bloqueaba el primer render esperando productos completos, destacados, ofertas, talles y relaciones.
- La hidratacion de productos traia todas las fotos, talles y categorias del sistema aunque la pantalla usara pocos productos.
- Los destacados por eventos leian demasiados eventos para cada carga.
- Admin metricas/estadisticas usaba eventos y productos completos con limites altos.
- Contabilidad cargaba productos completos aunque solo necesitaba costo/precio.
- `/api/pedidos` devolvia 500 para una validacion esperable.

## Cambios aplicados

- `app/Core/Cache.php`: cache TTL simple en archivo con memoria por request.
- `app/Core/Performance.php`: medicion temporal controlada por `DEBUG_PERFORMANCE=false` por defecto.
- `app/Services/SupabaseService.php`: medicion opcional por request Supabase.
- `app/Models/ProductoModel.php`: hidratacion acotada por IDs, summaries livianos para home, limites en admin, metodos livianos para contabilidad e IDs.
- `app/Models/CategoriaModel.php`, `EventoModel.php`, `PedidoModel.php`, `VentaModel.php`: cache corto e invalidacion.
- `app/Services/OfferService.php`: invalidacion de cache al guardar/eliminar ofertas.
- `app/Controllers/Catalogo.php`: home carga categorias, destacados y ofertas livianos; evita traer catalogo completo.
- `app/Controllers/Admin/Dashboard.php`, `Metricas.php`, `Estadisticas.php`, `Contabilidad.php`, `Productos.php`: limites y consultas mas especificas.
- `app/Controllers/Api.php`: `/api/pedidos` invalido responde 422 con JSON claro.
- `app/Views/catalogo/index.php`: lazy loading y dimensiones en imagenes de cards estaticas.
- `public/assets/js/catalogo-ci.js`, `public/assets/js/admin-ci.js`: medicion JS opcional apagada por defecto.

## Antes

| Ruta | Tiempo aproximado |
| --- | ---: |
| `/` catalogo frio | 8.203s |
| `/` catalogo cache caliente antes de summary liviano | 5.516s |
| `/api/pedidos` body `{}` | 500 reportado |

## Despues

| Ruta | Tiempo aproximado |
| --- | ---: |
| `/` catalogo primera pasada tras optimizar | 2.390s |
| `/` catalogo cache caliente | 0.844s |
| `/api/catalogo/productos?categoria=1` | 0.828s |
| `/api/catalogo/productos?q=pantalon` | 0.703s |
| `/admin/login` | 0.032s |
| `/api/pedidos` body `{}` | 422 |

## Mejoras aplicadas

- Consultas reducidas: relaciones de productos filtradas por IDs.
- Cache liviano: categorias, eventos recientes/top, talles, pedidos, ventas y summaries.
- Lazy loading: imagenes de categorias/productos estaticos del catalogo.
- Scripts revisados: catalogo no carga admin/importador; admin no carga importador global.
- Validaciones corregidas: body invalido de pedidos devuelve 422.
- Admin limitado: productos iniciales, metricas y estadisticas bajan volumen inicial.

## Pendientes

### Critico

- Medir DevTools Network autenticado en admin real y registrar TTFB con cookie de sesion.
- Si metricas sigue lenta con muchos eventos, crear endpoints/resumen especifico o vista diferida para dashboard/metricas.

### Importante

- Agregar endpoint de detalle de producto para que el home pueda usar cards livianas y cargar detalle completo al abrir modal.
- Revisar imagenes reales de Supabase Storage y generar miniaturas si las portadas son muy pesadas.

### Mejora posterior

- Agregar headers `Cache-Control` para assets estaticos desde Apache.
- Revisar indices Supabase desde dashboard si las busquedas por `titulo/descripcion` crecen mucho.
