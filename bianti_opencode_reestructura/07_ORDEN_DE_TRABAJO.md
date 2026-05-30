# Orden recomendado de trabajo

## Fase 1 - Auditoría

1. Abrir proyecto.
2. Revisar `assets/js/supabase.js`.
3. Revisar `admin/_sidebar.html`.
4. Revisar todos los HTML admin.
5. Revisar JS admin.
6. Anotar tablas y columnas reales usadas.

No modificar todavía.

---

## Fase 2 - Layout base

1. Rehacer `admin/_sidebar.html`.
2. Dejar solo:
   - Panel principal
   - Métricas
   - Categorías
   - Pedidos
   - Contabilidad
   - Estadísticas
3. Rehacer `assets/css/admin.css`.
4. Crear clases comunes:
   - layout
   - sidebar
   - topbar
   - page
   - card
   - table
   - badge
   - modal
   - button
   - input
5. Probar que todas las páginas carguen el sidebar.

---

## Fase 3 - Pantallas

Orden:
1. Panel principal
2. Categorías
3. Pedidos
4. Contabilidad
5. Métricas
6. Estadísticas

---

## Fase 4 - Datos

1. Conectar cada pantalla a las tablas actuales.
2. No crear tablas nuevas.
3. No romper consultas existentes.
4. Si un dato no existe, mostrar placeholder controlado o dejar pendiente marcado.

---

## Fase 5 - Pruebas

1. Login.
2. Navegación.
3. Sidebar.
4. Tablas.
5. Modales.
6. Supabase.
7. Catálogo público.
8. Consola navegador.
