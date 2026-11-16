# Actualizar Puerta Abierta a la versión 1.4.3

Este paquete es para actualizar la instalación existente en
https://registro.puertaabiertarecreando.org.ar, con PHP y MySQL propios.
No requiere Supabase, una nueva base de datos ni volver a crear usuarios.

## Antes de empezar

1. Avisá al equipo para que termine de guardar lo que está trabajando.
2. En cPanel, descargá una copia de la carpeta completa del sitio y exportá la base de datos con phpMyAdmin. Guardá ambos respaldos fuera de la carpeta pública.
3. Conservá especialmente `api/config.php`, las carpetas con fotos y documentos y cualquier configuración personalizada del hosting.
4. Usá PHP 7.4 o superior, PDO MySQL y Apache con reescritura de direcciones habilitada. El sitio debe tener HTTPS.

## Qué contiene el ZIP

- `subir-al-servidor/`: los archivos que se deben copiar a la carpeta del sitio.
  - `index.html`, `assets/`, íconos y `manifest.webmanifest`: aplicación 1.4.3 compilada para PHP/MySQL, usando `/api`.
  - `api/auth.php`, `api/index.php`, `api/jwt.php`, `api/storage.php`: servicios PHP.
  - `.htaccess`: direcciones de la aplicación y servicios PHP.
  - `storage/.htaccess`: protección del acceso directo a fotos y documentos.
- `LEER-ANTES-DE-SUBIR.md`: estas instrucciones; no hace falta subirlas al sitio.
- `SHA256SUMS.txt`: comprobaciones de integridad; no hace falta subirlo al sitio.

Por seguridad, NO se incluyen `api/config.php`, `install.php`, contraseñas,
datos de la base, fotos ni documentos. El paquete no modifica el esquema MySQL.
La configuración ya instalada debe permanecer intacta.

## Subir la actualización

1. Descargá y descomprimí el ZIP en tu computadora.
2. En cPanel → Administrador de archivos, abrí la carpeta que corresponde al dominio `registro.puertaabiertarecreando.org.ar`. En el despliegue actual figura `/home/puerta/registro.puertaabiertarecreando.org.ar`; confirmá la carpeta en la configuración del dominio antes de copiar.
3. Activá “Mostrar archivos ocultos”, para ver los `.htaccess`.
4. Copiá el CONTENIDO de `subir-al-servidor/` a esa carpeta, no la carpeta contenedora. Al finalizar, `index.html`, `api/` y `storage/` deben estar al mismo nivel.
5. Subí primero `assets/`, luego los archivos PHP, íconos y manifiesto, y por último `index.html`. Reemplazá los archivos coincidentes, pero no borres las carpetas existentes. No uses sincronización con “borrar archivos que no estén en el paquete”.
6. Si el `.htaccess` del servidor tiene reglas propias de HTTPS, seguridad o cPanel, conservá esas reglas y agregá las reglas del paquete con ayuda de quien administra el hosting; no lo reemplaces a ciegas.
7. Confirmá que `api/config.php` sigue siendo el original y que `storage/` conserva sus archivos. PHP debe poder escribir en `storage/`; normalmente se usa permiso 755, no 777.
8. No abras el instalador ni importes un SQL: esto es una actualización, no una instalación nueva.

Dejá los archivos anteriores de `assets/` durante la transición para las personas
que todavía tienen la aplicación abierta. No borres fotos, documentos o datos.
Si el hosting o una CDN guarda la página en caché, limpiá esa caché al finalizar.

## Comprobar que quedó bien

1. Abrí la dirección del sitio y recargá con Ctrl + Shift + R en la computadora, o cerrá y volvé a abrir la aplicación del celular.
2. Ingresá con tu usuario habitual. En Administración debe figurar **1.4.3 — Corrección del bloqueo de sesión**.
3. Confirmá que aparecen los registros y usuarios de siempre. Si no aparecen, detené la actualización y restaurá la copia anterior; no crees otra base ni vuelvas a instalar.
4. Abrí dos pestañas e ingresá en ambas para comprobar que no aparece “Lock was stolen by another request”.
5. Guardá una modificación pequeña que puedas comprobar y verificá que siga allí al volver a abrir el registro.
6. Subí una foto de prueba a un álbum y pedile a otra persona que compruebe que la ve.
7. En un celular, revisá el botón “Instalar app” o la opción del navegador “Agregar a pantalla de inicio”. La instalación depende del navegador; no habilita trabajo sin internet.

Si una foto da error por tamaño, revisá los límites de PHP del hosting:
`upload_max_filesize` debe permitir al menos 15 MB y `post_max_size` ser mayor
(por ejemplo, 20 MB). No se cambian estos valores automáticamente.

## Si algo falla

- Copiá el texto del aviso y anotá en qué pantalla y acción ocurrió.
- Restaurá los archivos del sitio desde el respaldo, conservando los datos y fotos creados después de la actualización. Este paquete no requiere restaurar la base de datos.
- La restauración de la base debe quedar como último recurso, porque perdería cualquier registro posterior al respaldo.

## Comprobaciones realizadas antes de entregar

El paquete se verifica para contener la versión 1.4.3 compilada en modo PHP,
sus recursos referenciados y los servicios de subida de fotos; no incluye configuración
privada ni el instalador. La comprobación en tu servidor con un usuario real debe
realizarse siguiendo los pasos anteriores; no se ha accedido a tu cuenta ni a tu MySQL.