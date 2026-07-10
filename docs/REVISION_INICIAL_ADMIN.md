# Revisión inicial admin

Estado de esta ejecución: login disponible en XAMPP, ingreso real pendiente.

Motivo: el nuevo login depende de las RPCs creadas en `docs/sql/LOGIN_USUARIOS_HASH.sql`. Ese SQL debe ejecutarse primero en Supabase SQL Editor. Desde este entorno no hay acceso directo para aplicarlo.

## Acceso

- Login: actualizado para usar `login_admin`.
- XAMPP login: responde HTTP 200 en `/login/`.
- Admin: actualizado para validar `bianti_admin_token` con `validar_sesion_admin`.
- Logout: actualizado para llamar `logout_admin` y borrar el token local.
- Prueba real de credenciales existentes: pendiente hasta aplicar SQL.

## Pantallas

- Dashboard: pendiente de abrir con sesión válida.
- Productos: pendiente de abrir con sesión válida.
- Importar productos: pendiente de abrir con sesión válida.
- Categorías: pendiente de abrir con sesión válida.
- Pedidos: pendiente de abrir con sesión válida.
- Ofertas: pendiente de abrir con sesión válida.
- Métricas: pendiente de abrir con sesión válida.
- Estadísticas: pendiente de abrir con sesión válida.
- Contabilidad: pendiente de abrir con sesión válida.

## Checklist para completar después del SQL

- Abrir `/login/` desde XAMPP.
- Probar usuario incorrecto.
- Probar contraseña incorrecta.
- Probar credenciales existentes.
- Confirmar redirección a `/admin/`.
- Recargar `/admin/` y confirmar que conserva sesión.
- Abrir cada módulo del sidebar.
- Registrar errores de consola por pantalla.
- Probar cerrar sesión.
- Confirmar que volver a `/admin/` después del logout redirige a login.
