# Prueba funcional final BIANTI

## Servidor local estático

Prueba XAMPP:

```text
http://localhost/programacion3/proyectos/Bianti-indumentaria-main/
```

Prueba adicional:

Ejecutar desde la raíz del proyecto:

```bash
npx serve . -l 5500
```

Abrir:

```text
http://localhost:5500
```

No usar XAMPP para esta prueba.

## Resoluciones a revisar

- [ ] Escritorio 1366x768.
- [ ] Escritorio 1440x900.
- [ ] Mobile 360x800.
- [ ] Mobile 390x844.
- [ ] Mobile 412x915.

## Catálogo

- [ ] La página carga sin depender de PHP.
- [ ] El header negro muestra logo y texto BIANTI INDUMENTARIA.
- [ ] El catálogo no queda tapado por overlay.
- [ ] El modal no aparece al inicio.
- [ ] Los filtros no aparecen al inicio.
- [ ] No hay clase `is-open` aplicada al modal o filtros al cargar.
- [ ] Se cargan productos reales desde Supabase.
- [ ] Se cargan categorías reales desde Supabase.
- [ ] Se cargan fotos reales o placeholder discreto si falta foto.
- [ ] El buscador filtra productos reales.
- [ ] El selector de categoría filtra productos reales.
- [ ] La barra sticky mobile permite cambiar categoría sin volver arriba.
- [ ] El buscador mobile abre y filtra sin scroll horizontal.
- [ ] El botón Filtros abre los filtros solo al hacer clic.
- [ ] Aplicar filtros actualiza resultados.
- [ ] Limpiar filtros vuelve al inicio.
- [ ] Ver detalle abre solo un producto real.
- [ ] El modal muestra imagen, título, categoría, precio, descripción, talles y estado.
- [ ] El modal cierra con X.
- [ ] El modal cierra con Escape.
- [ ] El modal cierra tocando el fondo.
- [ ] WhatsApp abre desde producto y desde header/footer.
- [ ] WhatsApp incluye producto, precio, talle si corresponde y oferta si corresponde.
- [ ] Si no hay ofertas activas, registrar si no existe tabla real o si no hay promociones vigentes.
- [ ] Si RLS lo permite, se crea pedido en `pedidos`.
- [ ] Si RLS lo permite, se crea evento en `eventos`.
- [ ] No hay errores graves en consola.

## Login y admin

- [ ] `/login/` muestra login BIANTI.
- [ ] Pide Usuario.
- [ ] Pide Contraseña.
- [ ] No pide correo visible.
- [ ] No muestra textos técnicos.
- [ ] Login inválido muestra error visual, no diálogos nativos del navegador.
- [ ] Login válido redirige a `/admin/`.
- [ ] `/admin/` verifica sesión.
- [ ] El sidebar carga los módulos sin recargar todo el sitio.
- [ ] Logout cierra sesión y vuelve a login.

## Verificaciones de código

Ejecutar:

Ejecutar las búsquedas indicadas en el criterio de aceptación del pedido para extensiones PHP y diálogos nativos. Ambas deben devolver cero resultados.

Verificar que no existan carpetas prohibidas:

```text
app/
public/
storage/
vendor/
dist/
cloudflare-static/
```

Verificar JavaScript:

```bash
node --check assets/js/catalogo.js
node --check assets/js/helpers.js
node --check assets/js/supabase-client.js
node --check assets/js/ui.js
node --check login/login.js
node --check admin/admin.js
node --check modules/dashboard/dashboard.js
node --check modules/productos/productos.js
node --check modules/categorias/categorias.js
node --check modules/pedidos/pedidos.js
node --check modules/ofertas/ofertas.js
node --check modules/metricas/metricas.js
node --check modules/estadisticas/estadisticas.js
node --check modules/contabilidad/contabilidad.js
node --check modules/importar/importar.js
node --check scripts/generate-config.js
```

## Configuración sensible

- [ ] `assets/js/config.js` existe solo localmente o se genera en Cloudflare.
- [ ] `assets/js/config.js` está en `.gitignore`.
- [ ] `assets/js/config.js` no está trackeado.
- [ ] No hay `.env` commiteado.
- [ ] No hay `service_role` en el proyecto.

## Registro de esta ejecución

- `npx serve . -l 5500`: probado, catálogo y login respondieron HTTP 200.
- Catálogo servido: modal cerrado al inicio, filtros cerrados al inicio, barra mobile presente, sin texto visible de acceso administrativo.
- Login servido: pide Usuario y Contraseña, no pide correo visible.
- XAMPP: pendiente en esta ejecución porque `http://localhost/programacion3/proyectos/Bianti-indumentaria-main/` no respondió. Levantar Apache y repetir.
- Resoluciones visuales: pendientes de verificación manual en navegador real.
- Ofertas: el catálogo intenta tabla real `ofertas`; si no existe, usa promociones temporales del navegador. Ver propuesta en `docs/SUPABASE_OFERTAS_PROPUESTA.md`.
