# Mapa de datos Supabase

## usuarios
Uso:
- login admin

Campos esperados:
- id
- username
- password
- rol
- activo

---

## productos
Uso:
- catálogo
- panel principal
- estadísticas
- ventas
- pedidos

Campos esperados:
- id
- titulo
- descripcion
- precio
- visible
- disponible
- portada_url
- created_at

---

## categorias
Uso:
- catálogo
- pantalla Categorías
- filtros
- estadísticas

Campos esperados:
- id
- nombre
- orden
- visible
- usa_talles

---

## producto_categorias
Uso:
- relación muchos a muchos entre productos y categorías

Campos esperados:
- producto_id
- categoria_id

---

## producto_talles
Uso:
- talles por producto

Campos esperados:
- producto_id
- talle

---

## producto_fotos
Uso:
- fotos extras del producto

Campos esperados:
- id
- producto_id
- url
- orden

---

## pedidos
Uso:
- consultas WhatsApp
- seguimiento
- decidir vendido/no vendido

Campos esperados aproximados:
- id
- producto_id
- producto_titulo
- cliente
- telefono
- cantidad
- precio_final
- nota
- estado
- created_at

Estados recomendados:
- en_revision
- vendido
- no_vendido

Si el proyecto tiene otros nombres actuales, adaptarse a los existentes.

---

## ventas
Uso:
- ventas confirmadas
- contabilidad
- métricas
- estadísticas

Campos esperados:
- id
- fecha
- producto_id
- producto_titulo
- cantidad
- precio
- total
- canal
- pedido_id
- nota
- created_at

---

## ventas_manuales
Uso:
- ventas fuera del catálogo
- contabilidad

Campos esperados:
- id
- fecha
- producto_id
- producto_titulo
- cantidad
- precio_final
- total
- canal
- nota
- created_at

---

## eventos
Uso:
- tracking
- productos más consultados
- categorías más consultadas
- estadísticas
- métricas

Campos esperados:
- id
- type
- payload
- created_at
