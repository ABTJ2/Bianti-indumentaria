# BIANTI Indumentaria - Reestructura MVC / CodeIgniter-ready

## Qué trae esta versión

- Misma base de datos Supabase. No se modifica el DER.
- Misma identidad visual BIANTI, con mejoras responsive.
- Estructura MVC ordenada: `Controllers`, `Models`, `Views`, `Services`.
- Bootstrap lógico preparado: estilos propios + PHP + JS liviano.
- Catálogo con categorías fijas con imágenes de portada.
- Productos destacados por eventos/clicks, con fallback a productos recientes.
- Admin con login contra tabla `usuarios` de Supabase.
- Productos, categorías, pedidos, métricas, estadísticas, contabilidad y ofertas separados por módulos.

## Importante sobre CodeIgniter

Este ZIP está armado con estructura MVC tipo CodeIgniter y preparado para migrar a CodeIgniter 4 real. Como en este entorno no se pudo descargar Composer/CodeIgniter desde internet, agregué un bootstrap liviano para que corra en XAMPP sin instalar dependencias.

La carpeta `app/` ya está separada como CodeIgniter: controladores, modelos, vistas y servicios. Si después querés CI4 puro, esta estructura se puede pasar a un proyecto CI4 con Composer.

## Cómo levantar con XAMPP

1. Copiá la carpeta en:
   `C:\xampp\htdocs\programacion3\Bianti-indumentaria-main`

2. Encendé Apache en XAMPP.

3. Abrí:
   `http://localhost/programacion3/Bianti-indumentaria-main/public/`

4. Admin:
   `http://localhost/programacion3/Bianti-indumentaria-main/public/admin/login`

## Configuración

El archivo `.env` ya trae la URL y la key pública de Supabase tomada del proyecto actual.

No subas service_role ni claves privadas.

## Qué tocar primero

1. Probar catálogo público.
2. Probar login.
3. Probar productos.
4. Probar métricas: hacer clic en productos y WhatsApp, luego entrar a Métricas.
5. Revisar Contabilidad.
6. Después recién seguir con importación masiva completa.


## Ajustes v2 catálogo
- El modal de filtros ya no se abre solo.
- El modal se cierra con X, clic afuera o tecla ESC.
- Se quitaron filtros de precio de la vista pública para simplificar.
- Filtros públicos actuales: categoría, talle si corresponde y orden.
- El catálogo ya no carga todos los productos de entrada; primero muestra categorías/destacados y espera búsqueda o categoría.
- Footer mejorado con identidad BIANTI, contacto, derechos reservados y acceso privado discreto.
