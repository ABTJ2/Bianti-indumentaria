# Ajustes UX mobile BIANTI

## Catálogo
El inicio queda ordenado como header, hero/buscador, selector rápido de categorías, productos destacados, ofertas activas, categorías visuales, beneficios y footer. No se muestran todos los productos de golpe.

## Modo categoría
Al elegir una categoría desde el selector rápido o una card visual, el catálogo entra en modo categoría y muestra `Categoría: [nombre]` con productos directamente debajo del buscador. Destacados, ofertas y categorías visuales dejan de estorbar arriba.

## Cards
Se mejoró el aire interno de cards públicas y cards de ofertas admin. Los botones tienen más separación y altura táctil mínima cómoda en mobile.

## Footer
El footer público queda con 3 columnas en desktop: marca, catálogo online y contacto. Abajo queda una línea separadora con derechos reservados y el punto discreto de acceso admin.

## Modales
Se agregó modal reusable BIANTI en admin para formularios destructivos con `data-confirm-title` y `data-confirm-message`. Se reemplazaron confirmaciones nativas de productos, categorías, pedidos, ofertas y limpieza de métricas.

## Responsive
Se ajustaron reglas para 1366/desktop, tablet y mobile 390/430px: selector rápido en una columna, footer en una columna, botones separados y modal de confirmación usable sin scroll horizontal.
