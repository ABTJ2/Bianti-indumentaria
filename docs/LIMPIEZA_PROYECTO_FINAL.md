# Limpieza proyecto final Cloudflare

## Rama

Se creó la rama `cloudflare-clean-final` para convertir el repositorio en la versión final Cloudflare.

`main` queda como respaldo de la versión anterior PHP/MVC si hiciera falta consultar o recuperar código.

## Estado inicial

Antes de limpiar, el workspace tenía cambios de la migración previa, una carpeta `dist/` con la app estática modular y archivos legacy como `app/`, `public/`, `storage/`, `admin/` viejo, assets viejos y documentación anterior.

## Base usada

Se usó el contenido de `dist/` como fuente final y se movió a la raíz del repositorio.

## Eliminado de esta rama

- `dist/`
- `cloudflare-static/`
- `app/`
- `public/`
- `storage/`
- `vendor/` si existía
- PHP/MVC y archivos asociados
- `.env`
- `.htaccess` dependiente de PHP
- documentación vieja contradictoria
- carpetas de agentes/referencias que no forman parte del deploy final

## Resultado

La raíz del repositorio ahora es la app estática final para Cloudflare Pages. Cloudflare debe usar Build output directory `/`.
