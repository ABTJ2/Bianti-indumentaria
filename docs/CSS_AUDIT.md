# Auditoría CSS BIANTI

## Alcance revisado

- `public/assets/css/`: CSS usado por la app MVC actual.
- `assets/css/`: CSS legacy usado por HTML estáticos viejos.
- `app/Views/`: layouts MVC y estilos/scripts inline detectados.
- `admin/*.html` e `index.html`: referencia visual anterior, no rutas MVC actuales.
- `AGENTS/`: copia/backup del proyecto, no se usa para servir la app actual.

## Inventario

| Archivo | Uso real | Estado | Duplicados / conflictos | Decisión |
|---|---|---|---|---|
| `public/assets/css/base.css` | Nuevo CSS base para layouts MVC | Cargado por público, admin y auth | Reemplaza variables repetidas de `bianti-ci.css` | Mantener |
| `public/assets/css/layout.css` | Grids, paneles, KPI, helpers compartidos | Cargado por público/admin | Centraliza `.panel`, `.kpi`, `.bar-row` | Mantener |
| `public/assets/css/admin.css` | Sidebar, topbar, tablas, cards admin | Cargado por layout admin | Reemplaza reglas admin mezcladas con catálogo | Mantener |
| `public/assets/css/catalogo.css` | Header público, hero, categorías, productos, footer | Cargado por layout público | Reemplaza bloques V2/V3 con `!important` | Mantener |
| `public/assets/css/auth.css` | Login admin | Cargado por layout auth | Evita pisadas de `admin-original.css` | Mantener |
| `public/assets/css/responsive.css` | Ajustes tablet/mobile | Cargado por público/admin/auth | Unifica media queries repetidas | Mantener |
| `public/assets/css/bianti-ci.css` | Antes era monolito MVC | Ya no se carga directo por layouts MVC | Tenía reglas duplicadas, colores repetidos y muchos `!important` | Convertido a manifiesto legacy con `@import` |
| `public/assets/css/admin-original.css` | Antes se cargaba en login | Ya no se carga | CSS oscuro legacy muy grande, pisaba login y variables | Mantener como referencia visual legacy, no cargar |
| `public/assets/css/admin.css` anterior | No era usado por MVC antes | Reemplazado por admin ordenado | Duplicaba `assets/css/admin.css` y reglas antiguas | Fusionado/reemplazado |
| `public/assets/css/bianti.css` | No detectado en layouts MVC | No cargado por app actual | CSS legacy público | Mantener sin cargar |
| `assets/css/admin.css` | HTML estáticos `admin/*.html` | Legacy | Referencia de estética anterior | No tocar |
| `assets/css/bianti.css` | `index.html` estático | Legacy | Referencia pública anterior | No tocar |
| `AGENTS/**/assets/css/*.css` | Backup/copia | No cargado por app actual | Duplicado completo | No tocar |

## Estilos Inline Detectados

- `app/Views/admin/importar/index.php`: tenía estilos inline para filas, paneles y botones. Se movieron a clases CSS (`import-row`, `import-actions`, `panel-title-row`, `list`).
- `app/Views/admin/dashboard/index.php`: no mantiene estilos inline; el copiado usa `admin-ci.js`.
- `app/Views/admin/ofertas/index.php`: no mantiene estilos inline; el cálculo visual usa `admin-ci.js`.
- JS legacy del importador todavía genera algunos `style` en HTML dinámico para badges internos. Queda documentado porque pertenece a salida generada del importador y no pisa layout global.

## Reglas Que Pisaban Otras Reglas

- `bianti-ci.css` mezclaba público, auth y admin en un solo archivo.
- Tenía bloques `V2`, `V3` y `V3B` con `!important` sobre reglas anteriores.
- Redefinía variables `--brand`, `--bg`, `--line` después de ya haberlas declarado.
- El login cargaba `admin-original.css` y `bianti-ci.css`, provocando doble sistema visual.
- Responsive estaba repetido en varios bloques con breakpoints similares.

## Clases Dinámicas Revisadas

- `menu-open`: usada por `admin-ci.js`, se mantiene.
- `sidebar-collapsed`: nueva clase persistida por `admin-ci.js`.
- `is-open`: usada por catálogo/filtros, se mantiene.
- `active`: usada en links admin, se mantiene.
- `hidden`/atributo `hidden`: usado por vistas y JS, se mantiene.

## Resultado

- La app MVC actual carga entre 3 y 4 CSS por layout, no el monolito completo.
- Los colores se concentran en variables de `base.css`.
- La estética vuelve a negro/blanco con violeta como acento.
- Mobile evita tablas horizontales en admin usando cards.
