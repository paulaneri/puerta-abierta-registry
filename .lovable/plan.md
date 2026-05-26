## Objetivo

Cuando en el registro de una mujer se marque "Sí" en *¿Tiene hijos a cargo?*, mostrar un mini-formulario dinámico para cargar cada hijo (Nombre, Fecha de nacimiento con edad calculada, CUIL), con botón **+** para agregar más filas y **🗑** para quitar. En la vista de detalle, mostrar la lista en un recuadro junto con la cantidad total.

## Cambios

### 1. Base de datos (migración)
- Agregar columna `hijos_detalle jsonb default '[]'` a `public.mujeres`.
- Estructura por hijo: `{ id, nombre, fechaNacimiento, cuil }`.
- `numero_hijos` se sincroniza automáticamente desde el largo del array al guardar (en el store, no en SQL).

### 2. Componente reusable: `HijosACargoEditor`
- Ubicación: `src/components/mujeres/HijosACargoEditor.tsx`.
- Props: `value: HijoACargo[]`, `onChange(value)`.
- Render: lista de filas con inputs *Nombre* / *Fecha de nacimiento* (date-picker dd/mm/aaaa) / *CUIL* + chip con edad calculada (`parseLocalDate` desde `src/lib/utils.ts`) + botón eliminar (con tooltip, ghost).
- Botón **+ Agregar hijo/a** al final.
- Validación suave: CUIL opcional, formato 11 dígitos si se ingresa.

### 3. Componente de solo lectura: `HijosACargoLista`
- Mismo directorio. Recibe `hijos: HijoACargo[]`.
- Renderiza un `Card`/recuadro con encabezado *"Hijos/as a cargo (N)"* y una tabla compacta: Nombre · Fecha nac. (dd/mm/aaaa) · Edad · CUIL.
- Si la lista está vacía pero `hijosACargo` es true, muestra "Sin detalle cargado".

### 4. Integración en formularios
- `src/pages/MujerNueva.tsx`: cuando `formData.hijosACargo === true`, renderizar `HijosACargoEditor` debajo del switch; incluir `hijos_detalle` al llamar `agregarMujer`.
- `src/pages/DetalleMujer.tsx`:
  - En modo edición: mismo editor.
  - En modo vista: usar `HijosACargoLista`.
  - Incluir el array en `useUnsavedChanges` y en el payload de `actualizarMujer`.

### 5. Store (`src/lib/mujeresStore.ts`)
- Tipo `Mujer`: agregar `hijosDetalle?: HijoACargo[]`.
- Mapeo en `getMujeres`: leer `row.hijos_detalle`.
- `agregarMujer` / `actualizarMujer`: persistir `hijos_detalle` y derivar `numero_hijos = hijosDetalle?.length ?? 0`.

### Detalles técnicos
- Cálculo de edad: función utilitaria en `src/lib/utils.ts` → `calcularEdad(fechaNacimiento: string): number` usando `parseLocalDate` (sin desfase de zona horaria, respeta la memoria del proyecto).
- Fechas: input tipo date-picker existente, formato visual dd/mm/aaaa.
- Al desmarcar "Tiene hijos a cargo" se conserva el array en memoria pero no se persiste (se vacía al guardar) — confirmar comportamiento si preferís borrarlo inmediatamente.
- Sin cambios de RLS (la columna nueva hereda las policies de `mujeres`).

### Archivos tocados
- `supabase/migrations/<nuevo>.sql` (ALTER TABLE)
- `src/integrations/supabase/types.ts` (autogenerado tras migración)
- `src/lib/utils.ts` (calcularEdad)
- `src/lib/mujeresStore.ts`
- `src/components/mujeres/HijosACargoEditor.tsx` (nuevo)
- `src/components/mujeres/HijosACargoLista.tsx` (nuevo)
- `src/pages/MujerNueva.tsx`
- `src/pages/DetalleMujer.tsx`
