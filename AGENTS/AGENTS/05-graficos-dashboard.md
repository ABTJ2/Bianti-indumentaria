# AGENTE 5 - GRÁFICOS PROFESIONALES

## Objetivo
Reemplazar o mejorar los gráficos actuales para que se vean profesionales, claros y útiles.

## Problema actual
Los gráficos se ven pobres, oscuros, con mala legibilidad y poco nivel visual.

## Librería recomendada
Usar Chart.js si ya está disponible o se puede agregar por CDN/local.

Preferencia:
- Chart.js para mantener JavaScript simple.
- No usar Python para los gráficos porque este proyecto corre en navegador.
- No usar Java.
- Usar JavaScript con Chart.js o ApexCharts.

## Archivos a revisar
- admin/metricas.html
- admin/tracking.html
- admin/contabilidad.html
- assets/js/admin/metricas.js
- assets/js/admin/tracking.js
- assets/js/admin/contabilidad.js
- assets/css/admin.css

## Cambios obligatorios
- Mejorar colores de gráficos.
- Mejorar leyendas.
- Mejorar ejes.
- Mejorar tooltips.
- Mejorar tamaño.
- Mejorar contraste.
- Agregar cards de resumen arriba.
- Evitar gráficos aplastados.
- Mostrar mensaje elegante si no hay datos.
- Usar formato de moneda argentino cuando corresponda.
- Separar gráficos de plata, ventas, clicks y productos.

## Estilo de gráficos
- Líneas suaves.
- Barras limpias.
- Colores vivos pero profesionales.
- Fondo transparente o card.
- Texto visible.
- Tooltip moderno.
- Sin saturar la pantalla.

## Configuración sugerida Chart.js
Usar opciones similares:

```js
{
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        color: "#c9c3d8",
        font: { size: 12, weight: "600" }
      }
    },
    tooltip: {
      backgroundColor: "#181426",
      titleColor: "#fff",
      bodyColor: "#c9c3d8",
      borderColor: "rgba(255,255,255,.12)",
      borderWidth: 1,
      padding: 12
    }
  },
  scales: {
    x: {
      ticks: { color: "#9ca3af" },
      grid: { color: "rgba(255,255,255,.06)" }
    },
    y: {
      ticks: { color: "#9ca3af" },
      grid: { color: "rgba(255,255,255,.06)" }
    }
  }
}
Reglas
No romper datos existentes.
No cambiar nombres de tablas.
No inventar datos.
Si no hay datos, mostrar estado vacío profesional.
No usar emojis.