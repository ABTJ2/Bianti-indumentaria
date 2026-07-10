# Deploy BIANTI en Cloudflare Pages

## Cloudflare Pages

- Build command: vacío
- Build output directory: `/`

Rama recomendada:

- `cloudflare-clean-final`

La raíz del repositorio ya es la app estática final. No usar `dist/`, `public/`, `app/`, PHP, XAMPP, Composer ni `.env`.

## Configuración Supabase

Crear localmente o en el entorno de deploy:

```js
window.BIANTI_CONFIG = {
  SUPABASE_URL: "...",
  SUPABASE_ANON_KEY: "...",
  WHATSAPP: "5492645694047"
};
```

Guardar como:

- `assets/js/config.js`

No commitear `config.js` con claves reales. No usar `service_role`.

## Archivos importantes

- `index.html`: catálogo público.
- `login/`: login admin por RPC contra `public.usuarios`.
- `admin/`: panel admin modular.
- `modules/`: módulos del admin.
- `assets/`: estilos, scripts compartidos e imágenes.
- `docs/`: documentación final.

## Prueba local

Si Python está disponible:

```bash
python -m http.server 5500
```

Alternativas:

```bash
npx serve . -l 5500
```

Abrir `http://localhost:5500`.
