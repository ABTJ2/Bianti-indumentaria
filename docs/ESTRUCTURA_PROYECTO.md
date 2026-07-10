# Estructura final BIANTI Cloudflare

La raíz del repositorio es directamente la app estática final para Cloudflare Pages.

## Raíz

- `index.html`: catálogo público BIANTI.
- `login/`: pantalla de login admin.
- `admin/`: panel admin y coordinador modular.
- `modules/`: pantallas internas del admin.
- `assets/`: CSS, JavaScript compartido e imágenes.
- `docs/`: documentación final.
- `_redirects`: fallback de Cloudflare Pages.
- `.gitignore`: evita claves reales y archivos no deployables.

## Módulos

Cada módulo vive en su propia carpeta con HTML y JS propios:

- `modules/dashboard/`
- `modules/productos/`
- `modules/categorias/`
- `modules/pedidos/`
- `modules/ofertas/`
- `modules/metricas/`
- `modules/estadisticas/`
- `modules/contabilidad/`
- `modules/importar/`

Si hay un problema en productos, revisar `modules/productos/`. Si hay un problema en contabilidad, revisar `modules/contabilidad/`.

## Archivos compartidos

- `assets/js/supabase-client.js`: inicializa Supabase desde `window.BIANTI_CONFIG` y bloquea `service_role`.
- `assets/js/ui.js`: modal BIANTI, toast, loader, estado vacío y helpers visuales.
- `assets/js/helpers.js`: moneda, fechas, escape HTML, consultas comunes, relaciones y cálculos compartidos.
- `assets/js/catalogo.js`: catálogo público.
- `admin/admin.js`: coordinador del admin; no contiene lógica interna de productos, pedidos, métricas ni contabilidad.
- `login/login.js`: login administrativo por RPC contra `public.usuarios`.

## Configuración sensible

`assets/js/config.js` puede existir localmente o en deploy con claves reales, pero no debe commitearse. Usar como base `assets/js/config.example.js`.

## Legacy eliminado

La rama `cloudflare-clean-final` no contiene `app/`, `public/`, `storage/`, `vendor/`, PHP ni MVC. La versión anterior queda respaldada en `main`.
