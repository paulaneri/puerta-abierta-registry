## Objetivo

Mostrar en pequeño y no editable, en la vista de detalle/edición de cada registro, **quién lo creó** y **cuándo**.

## Cambios en base de datos

Agregar columna `creado_por uuid` (nullable, referencia a `auth.users` por id pero **sin FK** según las reglas del proyecto) a las tablas que aún no la tienen:

- `mujeres`
- `centro_dia`
- `trabajo_campo`
- `gastos`
- `contactos`
- `reuniones_semanales`
- `albumes`
- `fotos_album`
- `eventos`
- `duplas_acompanamiento`
- `equipo`
- `lugares`
- `nacionalidades`
- `cargos_profesionales`
- `etiquetas_gastos`

`actividades` ya tiene `creado_por`. `user_roles`, `profiles`, `asignaciones_roles`, `disponibilidad_reuniones` quedan fuera (son metadatos auxiliares, no "registros de contenido").

Para registros viejos `creado_por` quedará `null` → se mostrará solo la fecha. La fecha siempre se podrá mostrar porque todas las tablas tienen `created_at`.

## Cambios en frontend

### 1. Componente reutilizable
Crear `src/components/ui/MetadatosRegistro.tsx`:
- Recibe `createdAt: string` y `creadoPor?: string | null` (uuid).
- Hace fetch a `profiles` para obtener `nombre apellido` o `email` del autor (con caché en memoria para no repetir).
- Renderiza en texto pequeño y atenuado:  
  `Creado por <Nombre Apellido> el dd/mm/aaaa HH:mm` o  
  `Creado el dd/mm/aaaa HH:mm` si no hay autor.

### 2. Stores
Modificar todos los stores con función `agregar...()` para incluir `creado_por: (await supabase.auth.getUser()).data.user?.id` en el insert. Actualizar las interfaces TS correspondientes para incluir `creadoPor` y `createdAt` cuando falten.

Stores a tocar:
`mujeresStore`, `centroDiaStore`, `trabajoCampoStore`, `gastosStore`, `contactosStore`, `reunionesStore`, `albumesStore`, `eventosStore`, `duplasStore`, `equipoStore`, `lugaresStore`, `nacionalidadesStore`, `cargosProfesionalesStore`.

### 3. Vistas de detalle/edición
Insertar `<MetadatosRegistro />` al pie de cada vista de detalle/edición:

- `DetalleMujer.tsx`
- `CentroDiaEditar.tsx` + `DetalleRegistro.tsx`
- `TrabajoCampoEditar.tsx`
- `pages/Actividades.tsx` (dialog de edición)
- `gastos/DetalleGasto.tsx` + `FormularioGastos.tsx`
- `contactos/DetalleContacto.tsx` + `FormularioContactos.tsx`
- `Duplas.tsx` (edición)
- `EquipoTrabajo.tsx` (edición)
- `Galeria.tsx` (detalle de álbum/foto)
- `Calendario.tsx` (detalle de evento)
- `Reuniones.tsx` (detalle de reunión)

Cuando el registro es nuevo (sin id), no se muestra.

## Detalles técnicos

- Formato: `dd/MM/yyyy HH:mm` con `formatDate` + `format(...,'HH:mm')` (regla 24h + es-AR del proyecto).
- Clase Tailwind: `text-xs text-muted-foreground mt-4 pt-3 border-t border-border/40`.
- Caché de profiles: `Map<uuid, {nombre, apellido, email}>` exportado desde el componente, se llena bajo demanda.
- No editable: solo `<span>`, sin inputs.
- En modo PHP (`VITE_BACKEND_MODE='php'`) el `creado_por` lo setea el cliente igual con el `user.id` actual; el backend PHP ya acepta columnas arbitrarias.

## Orden de ejecución

1. Migración SQL (agregar columnas).
2. Componente `MetadatosRegistro`.
3. Actualizar stores (insert con `creado_por`).
4. Insertar componente en cada vista de detalle.
