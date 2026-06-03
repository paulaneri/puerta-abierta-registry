# Problema

Tanto la **imagen** de Roles de Reuniones como el **PDF** de ficha de participante se generan correctamente (el toast "descargado" aparece), pero el archivo nunca llega al disco del usuario.

Causa: el preview de Lovable corre dentro de un iframe sandboxed. En ese contexto, el truco clásico de `<a download>` + `link.click()` queda bloqueado silenciosamente por el navegador (y `showSaveFilePicker` tampoco está permitido dentro del iframe). Por eso la lógica se ejecuta sin error, pero no aparece ninguna descarga.

# Solución

Usar la única vía confiable dentro del iframe: abrir el blob en una pestaña nueva con `window.open(blobUrl, '_blank')`. El navegador muestra el archivo y el usuario puede guardarlo con Ctrl/Cmd+S o con el botón de descarga del visor (PDF/imagen). En la app desplegada (fuera del iframe) funciona igual.

## Cambios

### 1. `src/components/reuniones/CalendarioMensual.tsx` – exportar imagen
- Quitar la rama de `showSaveFilePicker` y el `<a download>` + `dispatchEvent`.
- Después de obtener el `dataUrl` con `toPng`, convertirlo a Blob y abrirlo con `window.open(URL.createObjectURL(blob), '_blank')`.
- Si `window.open` devuelve `null` (popup bloqueado), navegar la propia pestaña al data URL como fallback y mostrar un toast indicando que habilite popups.
- Toast final: "Imagen lista, usá Guardar como… en la pestaña que se abrió".

### 2. `src/lib/mujerPdf.ts` – descargar PDF
- Reemplazar `doc.save(...)` por:
  - `const blob = doc.output('blob');`
  - `const url = URL.createObjectURL(blob);`
  - `window.open(url, '_blank')`, con el mismo fallback que arriba.
- Devolver el nombre sugerido para el toast.

### 3. `src/pages/DetalleMujer.tsx` – mensaje del toast
- Ajustar el toast del botón "Descargar PDF" para indicar que el PDF se abre en una pestaña nueva donde puede guardarlo.

## Notas técnicas
- No se cambia el contenido visual ni la lógica de generación, solo la entrega del archivo.
- En producción (dominio publicado) la pestaña nueva con el PDF/PNG igual permite descargar con el visor nativo del navegador, así que el comportamiento es consistente en preview y publicado.
- Se mantiene `URL.revokeObjectURL` con un `setTimeout` largo (≥ 60 s) para que la pestaña nueva tenga tiempo de cargar el blob antes de invalidarlo.
