# PROMPT MAESTRO PARA CODEX — BIANTI INDUMENTARIA

## Rol
Actuá como desarrollador senior PHP/CodeIgniter, frontend responsive y especialista en Supabase. El objetivo es mejorar el proyecto BIANTI sin destruir la estética original.

## Regla principal
NO rediseñar desde cero. Mantener la estética anterior del proyecto:
- hero oscuro premium,
- tipografía original Manrope y estilo editorial BIANTI,
- sidebar admin negro con logo, íconos y botón de cerrar sesión abajo,
- login anterior elegante BIANTI,
- dashboard anterior con cards claras y flujo visual,
- footer anterior con logo, marca, contacto y derechos reservados.

Si tenés que cambiar algo visual, debe ser mínimo y por legibilidad: fondo blanco = texto negro; fondo oscuro = texto blanco. No usar letras violetas sobre fondos claros/violetas si no se leen.

## Stack definido
- XAMPP local.
- PHP.
- CodeIgniter 3 o estructura compatible MVC.
- Supabase como base de datos remota.
- NO cambiar el DER ni crear tablas nuevas salvo autorización explícita.
- Bootstrap puede usarse como apoyo, pero no debe reemplazar la estética propia.
- JS liviano para filtros, modales, importación y acciones.

## Base de datos existente
Respetar las tablas y campos usados actualmente:
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

Las credenciales de Supabase ya están en el proyecto. No exponerlas en documentación nueva.

## Objetivo de estructura
Separar el sistema en módulos MVC sin romper el diseño:
- Auth/Login
- Catalogo público
- Admin/Dashboard
- Admin/Productos
- Admin/Categorias
- Admin/ImportarProductos
- Admin/Pedidos
- Admin/Ofertas
- Admin/Metricas
- Admin/Estadisticas
- Admin/Contabilidad

Cada módulo debe tener controlador, modelo/servicio y vista separados.

## Catálogo público
Restaurar la estética anterior y aplicar estas reglas:
1. Al entrar al catálogo NO mostrar todos los productos de golpe.
2. Mostrar primero:
   - hero BIANTI,
   - buscador,
   - cards de categorías,
   - productos destacados,
   - ofertas si existen,
   - beneficios BIANTI.
3. Las cards de categoría usan imágenes fijas desde `assets/img/categorias/`.
4. El botón de filtros NO debe abrirse solo.
5. El modal de filtros debe poder cerrarse con X, clic afuera y ESC.
6. Buscador público: placeholder sin ID. Ejemplo: `Buscar producto por nombre... Ej: pantalón, calza, perfume`.
7. Búsqueda inteligente por sinónimos:
   - pantalón => pantalon, pantalones, jogging, jogger, calza, calzas, short, shorts
   - remera => remera, camiseta, musculosa, top
   - campera => campera, buzo, abrigo, hoodie
   - perfume => perfume, fragancia, roll on, crema, natura
8. Filtros públicos:
   - categoría,
   - talle solo si la categoría/productos tienen talles,
   - orden: más recientes, destacados, precio menor/mayor.
9. No filtrar por ID en catálogo público.
10. Mantener beneficios: calidad garantizada, atención personalizada, medios de pago seguros.
11. Quitar solo “envíos a todo el país”.
12. Footer con logo, BIANTI INDUMENTARIA, contacto, derechos reservados y acceso privado como puntito discreto.

## Productos admin
Debe funcionar completo:
- Listar productos con buena lectura.
- Buscar por ID, nombre y categoría en admin sí está permitido.
- Filtrar por categoría, visible/oculto, disponible/no disponible, con foto/sin foto, oferta/no oferta.
- Editar producto completo:
  - título,
  - descripción,
  - precio venta,
  - precio costo,
  - visible,
  - disponible,
  - categorías,
  - talles,
  - portada,
  - galería de fotos.
- Si se quita una foto, debe desaparecer del admin y del catálogo.
- Si la foto eliminada era portada, limpiar/actualizar `portada_url`.
- En celular no usar tabla horizontal: usar cards con botón `⋮ Acciones`.

## Categorías admin
Debe permitir:
- crear categoría,
- editar nombre,
- editar orden,
- visible/no visible,
- asignar portada fija desde `assets/img/categorias/`,
- eliminar categoría con confirmación.

No repetir categorías por nombre. Normalizar por minúsculas y sin acentos.

## Pedidos
Debe permitir:
- ver detalle,
- marcar como vendido,
- marcar como no vendido,
- cancelar,
- eliminar definitivamente.

Regla contable:
- Solo los pedidos marcados como vendido afectan ventas/contabilidad.
- Si se elimina un pedido no vendido, no debe afectar contabilidad.

## Ofertas
No es editar precio normal. Es aplicar descuento temporal:
- elegir producto,
- porcentaje de descuento,
- duración en días u horas,
- fecha/hora inicio,
- fecha/hora fin automática,
- activar/desactivar,
- eliminar oferta.

Si no se puede tocar Supabase, guardar ofertas temporalmente en archivo JSON local (`storage/ofertas.json`) o integrar con campos existentes sin alterar DER.

En catálogo:
- mostrar precio original tachado,
- precio final con descuento,
- badge: `15% OFF`,
- ocultar oferta cuando vence.

## Métricas
No mostrar solo IDs. Debe mostrar producto con:
- imagen,
- nombre,
- ID como dato secundario,
- categoría,
- cantidad de vistas,
- clics WhatsApp.

Eventos a registrar:
- view_catalog
- view_category
- view_product
- click_whatsapp
- search

## Estadísticas
Mostrar datos legibles:
- productos totales,
- visibles,
- ocultos,
- sin foto,
- productos por categoría con nombre,
- categorías con más productos,
- productos con más consultas,
- alertas: sin foto, precio 0, sin categoría.

Nada de gráficos con solo IDs.

## Contabilidad
Rehacer visualmente manteniendo estética admin anterior.
Debe mostrar:
- inversión total,
- ingresos,
- inversión recuperada,
- falta recuperar,
- ganancia real,
- caja total,
- ticket promedio,
- ventas confirmadas.

Gráficos claros:
- ingresos por mes,
- ganancia/pérdida por mes,
- inversión recuperada vs activa,
- top productos por ganancia con nombre.

Filtros:
- mes,
- trimestre,
- semestre,
- año,
- rango manual.

## Performance
- No bloquear la interfaz cuando importa productos.
- Importación masiva por lotes.
- Comprimir imágenes antes de subir si pesan mucho.
- Mostrar progreso real.
- Permitir cancelar importación si se puede.
- En catálogo, lazy load de imágenes.
- No recargar todo Supabase en cada acción.

## Mobile
- Catálogo mobile primero.
- Admin mobile sin scroll horizontal.
- Menú mobile tipo botón hamburguesa/desplegable.
- En tablas grandes usar cards o acciones desplegables.
- No usar barras horizontales táctiles como solución principal.

## Checklist antes de terminar
- Login conserva estética anterior.
- Dashboard conserva estética anterior.
- Sidebar conserva logo, íconos y cerrar sesión abajo.
- Catálogo no abre filtros solo.
- Catálogo muestra categorías antes que productos.
- Buscador público no menciona ID.
- Footer tiene identidad BIANTI y puntito privado.
- Productos se pueden editar completo.
- Categorías tienen CRUD.
- Pedidos tienen acciones.
- Ofertas funcionan por porcentaje y duración horas/días.
- Métricas muestran nombres e imágenes.
- Estadísticas muestran nombres, no IDs solos.
- Contabilidad tiene gráficos útiles.
- Responsive mobile revisado.
