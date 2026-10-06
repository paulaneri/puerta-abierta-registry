import { toast } from "sonner";

/**
 * Traduce cualquier error técnico a un mensaje comprensible para la persona
 * que está trabajando en la aplicación.
 */
export function describirError(error: unknown): string {
  const err = error as any;
  const msg = String(err?.message || err?.error_description || err || '').toLowerCase();
  const code = String(err?.code || err?.status || '');

  if (msg.includes('dynamically imported module') || msg.includes('importing a module script failed')) {
    return 'Hay una versión nueva de la aplicación. Recargá la página (tecla F5) e intentá de nuevo.';
  }
  if (!navigator.onLine || msg.includes('failed to fetch') || msg.includes('networkerror') || msg.includes('network request failed')) {
    return 'No hay conexión a internet. Revisá la conexión e intentá de nuevo.';
  }
  if (code === '42501' || code === '401' || code === '403' || msg.includes('row-level security') || msg.includes('jwt') || msg.includes('not authorized') || msg.includes('permission')) {
    return 'Tu sesión venció o no tenés permiso para hacer esto. Volvé a iniciar sesión e intentá de nuevo.';
  }
  if (code === '23505' || msg.includes('duplicate key')) {
    return 'Ya existe un registro igual. Revisá los datos cargados.';
  }
  if (code === '23502' || msg.includes('null value')) {
    return 'Falta completar un dato obligatorio.';
  }
  if (code === '22007' || code === '22008' || msg.includes('invalid input syntax for type date')) {
    return 'La fecha ingresada no es válida.';
  }
  if (code === '429' || msg.includes('too many requests')) {
    return 'Se enviaron demasiados pedidos seguidos. Esperá unos segundos e intentá de nuevo.';
  }
  if (code.startsWith('5') || msg.includes('internal server error')) {
    return 'El servidor no responde en este momento. Esperá un momento e intentá de nuevo.';
  }
  if (msg.includes('quota') || msg.includes('storage full')) {
    return 'No hay espacio disponible para guardar. Contactá a la administración.';
  }

  const detalle = err?.message || (typeof err === 'string' ? err : '');
  return detalle
    ? `Ocurrió un problema inesperado: ${detalle}`
    : 'Ocurrió un problema inesperado. Volvé a intentar en unos segundos.';
}

/** Muestra un cartel de error con el motivo explicado. */
export function avisarError(error: unknown, titulo = 'No se pudo completar la acción') {
  toast.error(titulo, {
    description: describirError(error),
    duration: 10000,
  });
}

let instalado = false;

/**
 * Instala avisos visibles para cualquier error inesperado de la aplicación:
 * fallos no controlados, promesas rechazadas y pérdida de conexión.
 */
export function instalarAvisosGlobales() {
  if (instalado) return;
  instalado = true;

  window.addEventListener('error', (evento) => {
    // Errores de carga de imágenes u otros recursos: no molestar con un cartel.
    if (evento.target && evento.target !== window) return;
    avisarError(evento.error || evento.message, 'Ocurrió un error inesperado');
  });

  window.addEventListener('unhandledrejection', (evento) => {
    avisarError(evento.reason, 'Ocurrió un error inesperado');
  });

  window.addEventListener('offline', () => {
    toast.error('Te quedaste sin conexión a internet', {
      description: 'Lo que cargues ahora puede no guardarse hasta que vuelva la conexión.',
      duration: 10000,
    });
  });

  window.addEventListener('online', () => {
    toast.success('Volvió la conexión a internet', { duration: 5000 });
  });
}
