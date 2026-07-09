# AGENTE 4 - CSS GLOBAL Y DESIGN SYSTEM

## Objetivo
Crear una base visual profesional para todo el proyecto BIANTI.

## Archivos
- assets/css/bianti.css
- assets/css/admin.css

## Responsabilidades
- Crear variables CSS globales.
- Unificar colores.
- Unificar botones.
- Unificar inputs.
- Unificar cards.
- Unificar tablas.
- Unificar modales.
- Unificar badges.
- Unificar estados visuales.
- Limpiar estilos duplicados.
- Mejorar responsive.

## Paleta sugerida
Usar una estética premium y comercial:

- Fondo principal: #080711
- Fondo secundario: #11101c
- Fondo card: #181426
- Borde: rgba(255,255,255,.10)
- Texto principal: #ffffff
- Texto secundario: #c9c3d8
- Violeta principal: #7c3aed
- Violeta claro: #a855f7
- Fucsia suave: #ec4899
- Verde WhatsApp: #22c55e
- Rojo alerta: #ef4444
- Amarillo aviso: #f59e0b

## Variables CSS obligatorias
Crear o mejorar variables como:

```css
:root {
  --bg: #080711;
  --bg-soft: #11101c;
  --surface: #181426;
  --surface-2: #211a32;
  --border: rgba(255,255,255,.10);
  --text: #ffffff;
  --muted: #c9c3d8;
  --primary: #7c3aed;
  --primary-2: #a855f7;
  --accent: #ec4899;
  --success: #22c55e;
  --danger: #ef4444;
  --warning: #f59e0b;
  --radius-sm: 10px;
  --radius-md: 16px;
  --radius-lg: 22px;
  --shadow: 0 18px 50px rgba(0,0,0,.35);
}
Reglas
No crear 500 clases sin sentido.
No duplicar estilos.
No usar colores sueltos si pueden ser variables.
No romper responsive.
Mantener compatibilidad con HTML actual.

---