# Skills del proyecto BIANTI para OpenCode

Estas skills son capacidades que OpenCode debe aplicar durante el trabajo.

---

## Skill 1 - No romper Supabase

Antes de modificar una consulta:
1. Buscar dónde se usa la tabla.
2. Ver qué columnas se consultan.
3. Ver qué HTML espera esos datos.
4. Modificar solo lo necesario.

No cambiar:
- URL Supabase
- anon key
- nombres de tablas
- nombres de columnas

---

## Skill 2 - Mantener sidebar único

Siempre usar:
- admin/_sidebar.html

Nunca copiar sidebars distintos dentro de cada página.

El sidebar debe contener solo:

1. Panel principal
2. Métricas
3. Categorías
4. Pedidos
5. Contabilidad
6. Estadísticas

---

## Skill 3 - Modal profesional

Todo modal debe tener:
- overlay
- título claro
- botón cerrar
- campos agrupados
- botones de acción abajo
- botón primario claro
- botón cancelar
- mensaje de error/éxito

Evitar:
- prompt()
- confirm() visual feo, salvo eliminación crítica temporal
- alerts innecesarios

---

## Skill 4 - Estados visuales

Usar badges consistentes:

Pedidos:
- en_revision: violeta
- vendido: verde
- no_vendido: rojo

Categorías:
- visible sí: verde
- visible no: gris
- usa_talles sí: verde
- usa_talles no: gris

Finanzas:
- ingreso: verde
- egreso: rojo
- info: violeta

---

## Skill 5 - Flujo de WhatsApp a pedido

Cuando el usuario consulta por WhatsApp:
1. Registrar evento si ya existe lógica.
2. Crear registro en pedidos si es posible.
3. Estado inicial: en_revision.
4. No crear venta todavía.

Solo el admin decide si fue vendido.

---

## Skill 6 - Venta confirmada

Cuando el admin marca pedido como vendido:
1. Cambiar pedido.estado a vendido.
2. Crear venta en tabla ventas si el proyecto ya usa ese flujo.
3. Si no está implementado, dejar función preparada y comentar pendiente.
4. Contabilidad solo debe contar vendido.

---

## Skill 7 - Estadísticas por interés

Lo más destacado debe salir de:
- eventos
- pedidos consultados
- productos más consultados
- categorías más consultadas

No cargar destacados manuales en esta etapa.

---

## Skill 8 - UI responsive básica

Aunque el diseño principal sea 16:9, debe funcionar en:
- notebook
- tablet
- celular básico

En celular:
- sidebar puede contraerse
- tablas pueden tener scroll horizontal
- cards se apilan
