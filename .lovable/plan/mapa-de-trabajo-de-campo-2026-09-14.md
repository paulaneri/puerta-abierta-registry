# Mapa de Trabajo de Campo

Sí, es posible. Se agrega un mapa a cada salida de Trabajo de Campo para marcar dónde se vio a cada mujer y dibujar el recorrido, más un mapa general que junta varias salidas.

## Cómo se usa

**Al cargar o editar una salida**
- Debajo de los encuentros aparece un mapa de la zona.
- Para cada mujer agregada se puede fijar su punto de dos maneras: escribiendo la dirección o esquina (por ejemplo "Av. Rivadavia y Medrano") y confirmando la sugerencia, o tocando directamente el mapa. El punto se puede arrastrar para corregirlo.
- También se pueden agregar paradas sin mujer asociada (por ejemplo un punto de partida o una esquina recorrida).
- Los puntos se numeran en orden y se unen con una línea que muestra el recorrido. El orden se puede cambiar (subir/bajar cada punto).
- Cada punto puede llevar una nota corta.

**Al ver una salida**
- El mapa aparece en modo lectura, con los puntos numerados, el recorrido dibujado y, al tocar un punto, el nombre de la mujer y su nota.

**Mapa general**
- Nueva pestaña "Mapa" dentro de Trabajo de Campo.
- Muestra los puntos de todas las salidas, con filtros por rango de fechas, lugar y profesional.
- Cada salida se dibuja con su recorrido y un color propio; se puede abrir el registro desde el mapa.

## Detalles técnicos

**Mapa**: Leaflet + react-leaflet con capas de OpenStreetMap. No requiere cuenta ni clave de API ni costo. Búsqueda de direcciones con Nominatim (servicio gratuito de OpenStreetMap), limitando resultados a Argentina y con debounce para respetar su límite de uso.

**Base de datos**: migración que agrega a `trabajo_campo` la columna `ubicaciones jsonb not null default '[]'::jsonb` con la forma:

```text
[{ id, tipo: 'encuentro' | 'parada', encuentroId, etiqueta, lat, lng, orden, nota }]
```

No se modifica `encuentros`, así los registros existentes siguen funcionando (arrancan con lista de ubicaciones vacía). Las políticas RLS actuales de `trabajo_campo` ya cubren la columna nueva; no hacen falta permisos adicionales.

**Archivos**
- `src/components/trabajoCampo/MapaRecorrido.tsx`: mapa reutilizable (modo edición y modo lectura), marcadores numerados, polilínea del recorrido.
- `src/components/trabajoCampo/BuscadorDireccion.tsx`: búsqueda de dirección/esquina contra Nominatim.
- `src/components/trabajoCampo/UbicacionesEditor.tsx`: lista de puntos con orden, nota, vínculo al encuentro y eliminar.
- `src/pages/TrabajoCampoNuevo.tsx` y `TrabajoCampoEditar.tsx`: integrar el editor de ubicaciones.
- `src/pages/TrabajoCampo.tsx`: nueva pestaña "Mapa" con filtros y mapa consolidado; mapa de solo lectura en el detalle de cada registro.
- `src/lib/trabajoCampoStore.ts`: leer y guardar `ubicaciones` (con parseo seguro como el de `encuentros`).

**Responsive**: mapa con alto adaptable (aprox. 300px en celular, 450px en escritorio), controles apilados en pantallas chicas.
