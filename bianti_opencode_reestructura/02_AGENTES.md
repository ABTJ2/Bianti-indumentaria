# Agentes para OpenCode

Usar estos agentes como roles de trabajo. No todos trabajan al mismo tiempo. Se ejecutan en orden.

---

## AGENTE 1 - Auditor del proyecto

### Objetivo
Revisar el proyecto antes de modificar.

### Tareas
- Revisar estructura de carpetas.
- Detectar archivos HTML admin.
- Detectar archivos CSS.
- Detectar archivos JS.
- Detectar conexión Supabase.
- Detectar tablas usadas en cada JS.
- Detectar IDs usados por JavaScript.
- Detectar pantallas que ya existen.
- Detectar pantallas que sobran.

### Archivos a revisar
- index.html
- admin/*.html
- admin/_sidebar.html
- assets/css/*.css
- assets/js/*.js
- assets/js/admin/*.js

### Entrega
Informe corto:
- archivos encontrados
- tablas usadas
- problemas detectados
- orden recomendado

---

## AGENTE 2 - Arquitecto UI Admin

### Objetivo
Crear la estructura visual común del panel.

### Tareas
- Definir layout admin.
- Definir sidebar único.
- Definir topbar.
- Definir footer.
- Definir sistema de cards.
- Definir sistema de tablas.
- Definir sistema de modales.
- Definir estados visuales.

### Reglas
- Sidebar igual en todas las pantallas.
- No cambiar el orden del sidebar.
- Eliminar Configuración del sidebar.
- Mantener diseño 16:9.
- Mantener estética BIANTI.

### Archivos
- admin/_sidebar.html
- assets/css/admin.css

---

## AGENTE 3 - Integrador Supabase

### Objetivo
Asegurar que la UI use las tablas reales.

### Tareas
- Revisar Supabase client.
- Revisar consultas existentes.
- No cambiar nombres de tablas.
- Adaptar consultas si una pantalla cambió de diseño.
- Confirmar que pedidos, ventas y eventos se usan correctamente.

### Tablas
- usuarios
- productos
- categorias
- producto_categorias
- producto_talles
- producto_fotos
- pedidos
- ventas
- ventas_manuales
- eventos

### Regla crítica
Si una tabla o columna no existe, no inventar. Informar y proponer alternativa.

---

## AGENTE 4 - Panel principal

### Objetivo
Crear dashboard inicial.

### Datos que usa
- pedidos
- ventas
- ventas_manuales
- eventos
- productos

### Debe mostrar
- consultas WhatsApp en revisión
- ventas confirmadas
- no vendidos
- ingresos del período
- producto más consultado
- tasa de conversión
- últimas consultas
- accesos rápidos
- flujo de ventas

---

## AGENTE 5 - Categorías

### Objetivo
Rehacer pantalla Categorías.

### Datos que usa
- categorias

### Debe permitir
- listar
- crear
- editar
- eliminar
- activar/desactivar visible
- activar/desactivar usa_talles
- ordenar

### Modal
- nombre
- orden
- visible
- usa_talles
- guardar
- cancelar

---

## AGENTE 6 - Pedidos

### Objetivo
Rehacer pantalla Pedidos como centro de consultas WhatsApp.

### Datos que usa
- pedidos
- productos
- ventas, solo si al vender genera venta

### Estados
- en_revision
- vendido
- no_vendido

### Regla
Solo si se marca como vendido impacta en contabilidad.

### Modal
- estado
- producto
- cliente
- WhatsApp
- nota
- Marcar vendido
- Marcar no vendido

---

## AGENTE 7 - Contabilidad

### Objetivo
Mostrar resumen financiero real.

### Datos que usa
- ventas
- ventas_manuales
- pedidos vendidos
- productos si hace falta obtener categoría o título

### Debe mostrar
- ingresos por ventas confirmadas
- ventas confirmadas
- consultas no vendidas
- ticket promedio
- caja del período
- conversión a venta
- movimientos recientes
- gráfico ventas confirmadas vs consultas WhatsApp
- ingresos por categoría

### Regla
No contar pedidos en revisión ni no vendidos como ingreso.

---

## AGENTE 8 - Métricas y Estadísticas

### Objetivo
Separar métricas operativas de estadísticas de comportamiento.

### Métricas
Usa:
- pedidos
- ventas
- eventos
- productos

Muestra:
- rendimiento consultas/ventas
- conversión
- productos consultados
- productos vendidos

### Estadísticas
Usa:
- eventos
- pedidos
- ventas
- productos
- categorias

Muestra:
- más vendido
- más consultado
- top categoría buscada
- destacados por búsqueda/consulta

---

## AGENTE 9 - Tester

### Objetivo
Probar que todo funcione.

### Checklist
- Login funciona.
- Sidebar aparece igual en todas las pantallas.
- Links funcionan.
- No aparece Configuración.
- Panel principal carga.
- Métricas carga.
- Categorías lista y abre modal.
- Pedidos lista y abre modal.
- Marcar vendido/no vendido funciona o queda indicado si falta lógica.
- Contabilidad no cuenta no vendidos.
- Estadísticas muestra destacados.
- Catálogo público sigue funcionando.
- Consola sin errores graves.
