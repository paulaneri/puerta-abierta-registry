## Diagnóstico probable

El PDF se genera con `jsPDF`, pero la entrega del archivo está fallando por una combinación de restricciones del navegador:

1. **Iframe sandbox de Lovable Preview**: puede bloquear `a.download`, clicks automáticos y `showSaveFilePicker`.
2. **Popup/ventana nueva**: el código actual escribe HTML en una pestaña y luego intenta un click automático; ese click puede bloquearse igual por no considerarse acción directa del usuario.
3. **Blob URL entre ventanas**: un `blob:` creado en la ventana de la app puede no ser confiable si se usa dentro de otra ventana escrita manualmente.
4. **Data URI como fallback**: puede quedar vacío/no renderizarse en visores PDF embebidos o superar límites prácticos del navegador.
5. **Falsa confirmación por toast**: hoy se muestra éxito aunque el navegador haya bloqueado la descarga silenciosamente.

## Solución a implementar

### 1. Separar generación y entrega del PDF
- Mantener `generarFichaMujerPDF(mujer)` como generador puro.
- Hacer que devuelva también un `Blob` validado o exponer una función de validación:
  - tamaño mayor a 0
  - tipo PDF
  - bytes iniciales `%PDF`
- Si la validación falla, mostrar error real y no toast de éxito.

### 2. Reemplazar la entrega actual por una cadena de estrategias comprobables
Crear una utilidad única de descarga PDF con fallback ordenado:

1. **Descarga directa real**
   - `doc.save(filename)` dentro del click del usuario.
   - Es el camino más compatible para `jsPDF` cuando el navegador permite descargas.

2. **Anchor download con blob URL**
   - Crear `Blob`, `URL.createObjectURL`, `<a download>`, click sincrónico.
   - Mantener el URL vivo por varios minutos.

3. **Ventana manual segura**
   - Si las descargas automáticas están bloqueadas, abrir una pestaña con instrucciones y un botón visible que el usuario presiona manualmente.
   - El botón manual ejecuta la descarga desde esa misma ventana, no con autoclick.
   - Evitar iframe/object vacío como mecanismo principal.

4. **Fallback final**
   - Abrir el PDF como `blob:` top-level para que el visor nativo permita guardar.
   - El toast debe decir claramente que se abrió para guardar desde el visor, no “descargado”.

### 3. Corregir el botón en `DetalleMujer`
- Cambiar `handleGenerarPdf` a una función robusta con estado `generandoPdf`.
- Deshabilitar el botón mientras genera.
- Mostrar toast de éxito solo si se pudo iniciar una entrega válida.
- Mostrar error específico si el navegador bloquea popup/descarga.

### 4. Agregar instrumentación mínima de depuración
- Loguear en consola, solo en caso de error, qué estrategia falló.
- No mostrar mensajes técnicos al usuario salvo el motivo útil: popup bloqueado, descarga bloqueada o PDF vacío.

## Verificación

### Verificación de generación
- Ejecutar una prueba local con datos de participante de ejemplo.
- Confirmar que el blob empieza con `%PDF` y pesa más de 0 bytes.
- Renderizar o inspeccionar el PDF generado para confirmar que contiene contenido real.

### Verificación en app
- Abrir la vista de un participante.
- Click en **Descargar PDF**.
- Comprobar en el navegador que:
  - no queda iframe vacío,
  - no aparece un toast falso de éxito,
  - se dispara una descarga real cuando el contexto lo permite,
  - si el preview sandbox bloquea la descarga automática, queda una pestaña/botón manual funcional.

### Límite importante
En el **preview embebido** de Lovable, el navegador puede impedir descargas automáticas por sandbox. Si eso ocurre, la solución verificable será: PDF generado correctamente + pestaña/botón manual funcional. En la app publicada fuera del iframe, la descarga directa debe funcionar normalmente.

## Archivos a modificar

- `src/lib/mujerPdf.ts`
  - Validación del PDF.
  - Nueva función centralizada de entrega/descarga con estrategias ordenadas.

- `src/pages/DetalleMujer.tsx`
  - Estado de generación.
  - Handler del botón.
  - Mensajes de toast correctos.

No se modificarán datos, base de datos ni el diseño general de la ficha.