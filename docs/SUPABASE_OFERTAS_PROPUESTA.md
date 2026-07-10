# Propuesta de tabla ofertas

El catálogo intenta leer una tabla `ofertas` si existe. Si Supabase responde que no existe o que RLS no permite lectura, usa las promociones temporales guardadas en el navegador del admin.

Esa solución temporal no sincroniza ofertas entre dispositivos. Para producción conviene crear una tabla real.

SQL propuesto, no aplicado automáticamente:

```sql
create table public.ofertas (
  id uuid primary key default gen_random_uuid(),
  producto_id bigint not null references public.productos(id) on delete cascade,
  porcentaje numeric not null check (porcentaje > 0 and porcentaje < 100),
  precio_anterior numeric,
  precio_final numeric,
  inicio timestamptz not null default now(),
  fin timestamptz,
  activa boolean not null default true,
  created_at timestamptz not null default now()
);
```

Si `productos.id` es UUID en lugar de bigint, cambiar `producto_id bigint` por `producto_id uuid`.

Reglas recomendadas:

- Lectura pública solo de ofertas activas.
- Escritura solo para usuarios autenticados autorizados.
- No usar claves privadas desde el navegador.
