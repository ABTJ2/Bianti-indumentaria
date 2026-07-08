# Revisión worktree pre commit BIANTI

## Cambios propios de esta tarea

- `app/Config/Routes.php`: agrega `POST api/pedidos`.
- `app/Controllers/Api.php`: endpoint de pedidos y respuesta ordenada de eventos.
- `app/Controllers/Catalogo.php`: destacados solo desde eventos, sin fallback manual.
- `app/Controllers/Admin/Dashboard.php`: evita estadísticas no filtradas.
- `app/Controllers/Admin/Estadisticas.php`: carga eventos reales para rankings válidos.
- `app/Controllers/Admin/Productos.php`: validación y subida de portada manual.
- `app/Models/EventoModel.php`: validación de producto existente y detección segura de IDs.
- `app/Models/PedidoModel.php`: creación adaptativa de consulta/pedido y estado vendido.
- `app/Models/ProductoModel.php`: subida de foto al bucket `productos` y relación `producto_fotos`.
- `app/Views/admin/contabilidad/index.php`: ingresos reales, pedidos vendidos con precio válido y avisos.
- `app/Views/admin/dashboard/index.php`: métricas filtradas contra productos existentes.
- `app/Views/admin/estadisticas/index.php`: productos reales con imagen/nombre/ID/categoría.
- `app/Views/admin/pedidos/detalle.php`: detalle completo y precio real o aviso.
- `app/Views/admin/pedidos/index.php`: listado con precio real o aviso.
- `app/Views/admin/productos/nuevo.php`: formulario multipart y portada.
- `app/Views/admin/productos/editar.php`: cambio de portada.
- `public/assets/css/admin.css`: ajustes mínimos de overflow y acciones.
- `public/assets/css/responsive.css`: protección mobile contra scroll horizontal.
- `public/assets/js/admin/importar-productos.js`: `debugLog` usa `console.debug`.
- `public/assets/js/catalogo-ci.js`: catálogo sin carga inicial masiva, pedidos por WhatsApp y filtros reales.
- `docs/ESTADO_REAL_PROYECTO.md`: estado real del MVC y legacy.
- `docs/CIERRE_FUNCIONAL_REAL.md`: cierre funcional.
- `docs/PRUEBAS_MANUALES_REALES.md`: pasos de prueba.
- `docs/REVISION_WORKTREE_PRE_COMMIT.md`: este informe.
- `docs/CHECKLIST_PRUEBA_MANUAL_USUARIO.md`: checklist para prueba manual del usuario.

## Archivos excluidos

- `.env`: credenciales, nunca commitear.
- `.env.example`: untracked y no forma parte de esta tarea.
- `.codex/`: carpeta temporal/herramienta.
- `storage/`: runtime/local.
- `vendor/` y `node_modules/`: no aparecen como cambios a stagear; si existieran se excluyen.
- `admin/*.html`: legacy visual anterior, no app principal.
- `assets/css/*` y `assets/js/*`: legacy anterior, no app principal.
- `index.html`: legacy/referencia visual anterior.
- `AGENTS/`, `SKILLS/`, `bianti_opencode_reestructura/`, `opencode_referencias_bianti/`: documentación/agentes ajenos a este cierre funcional.
- `README_*`, `PROMPT_*`, `CAMBIOS_CORREGIDOS_BIANTI.md`: documentación previa no modificada por esta tarea.
- `public/assets/img/`, `assets/img/categorias/`, `docs/imagenes-categorias/`: imágenes/referencias no tocadas para el flujo.
- `public/assets/js/catalogo.js`, `public/assets/js/supabase.js`, `public/assets/js/admin/*.js` salvo `admin/importar-productos.js`: no son cambios de esta tarea.
- `public/assets/css/bianti.css`, `public/assets/css/admin-original.css`, `public/assets/css/admin.css.responsive.bak`: no cargados por el MVC actual o backup/legacy.

## Archivos dudosos

- `app/Core/`, `app/Services/SupabaseService.php`, `app/Models/BaseSupabaseModel.php`, `app/Models/CategoriaModel.php`, `app/Models/UsuarioModel.php`, `app/Models/VentaModel.php`: están `untracked`, son parte del MVC local, pero no fueron modificados en esta tarea.
- `app/Controllers/Admin/Categorias.php`, `Contabilidad.php`, `Importar.php`, `Auth.php`: `untracked`, necesarios para la app local, pero no son cambios propios de este cierre.
- `app/Views/auth/` y otras vistas admin no tocadas: `untracked`, revisar manualmente antes de cualquier commit futuro.
- `public/index.php`, `index.php`, `.htaccess`, `public/.htaccess`, `composer.json`: `untracked`; pueden ser necesarios para despliegue, pero no se incluyen por no ser cambios de esta tarea.
- Cambios ya existentes en archivos tracked fuera de `app/` y `public/assets/*` actual: requieren revisión manual antes de commitear.

## Riesgos detectados

- Existe `.env` untracked en el worktree. No se stagea.
- Hay muchos cambios legacy y documentación/agentes modificados antes de este cierre. No se stagean.
- Algunos archivos MVC tocados por esta tarea están `untracked` en Git. Se stagean solo por ruta explícita porque forman parte directa del cambio funcional.
- No se realizó prueba manual con sesión admin desde navegador interactivo; queda checklist para validación real.

## Plan de commits

1. `Corregir flujo de consulta y pedidos BIANTI`: rutas/API/catálogo/pedidos/eventos necesarios para consulta WhatsApp y pedido real.
2. `Completar productos metricas y contabilidad BIANTI`: alta/edición con portada, métricas/dashboard/estadísticas y contabilidad realista.
3. `Ajustar catalogo responsive e importador BIANTI`: JS del catálogo, corrección `debugLog` y CSS responsive mínimo.
4. `Documentar cierre funcional real BIANTI`: documentación y checklist de prueba manual.

## Resultados de prueba técnica

- `php -l` en PHP modificados: OK.
- `node --check` en JS modificados: OK.
- `git diff --check` en archivos modificados de la tarea: OK. Solo warnings normales de CRLF del entorno Windows.
- Servidor PHP temporal con docroot `public`:
  - `GET /` -> 200.
  - `GET /admin/login` -> 200.
  - `GET /api/catalogo/productos` -> 200.
  - `POST /api/pedidos` con body vacío -> 500 esperado por faltar `producto_id`.
  - `GET /admin/metricas` -> 302 esperado por falta de sesión admin.
  - `GET /admin/productos` -> 302 esperado por falta de sesión admin.
  - `GET /admin/pedidos` -> 302 esperado por falta de sesión admin.
- Servidor PHP temporal simulando prefijo XAMPP `/public`:
  - `GET /public/admin/login` -> 200.
  - `GET /public/admin/metricas` -> 302 esperado por falta de sesión admin.
  - `GET /public/admin/productos` -> 302 esperado por falta de sesión admin.
  - `GET /public/admin/pedidos` -> 302 esperado por falta de sesión admin.
