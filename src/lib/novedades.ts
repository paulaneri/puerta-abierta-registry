// ─── Novedades de la plataforma ──────────────────────────────────────────────
// Mensajes temporales que se muestran en la Home la primera vez que una
// persona entra después de una actualización de la plataforma.
// Agregá una entrada nueva arriba de todo cada vez que se publique un cambio.
// Solo cambios de la plataforma (funcionalidades), nunca contenidos.
// ─────────────────────────────────────────────────────────────────────────────

export interface Novedad {
  id: string;      // identificador único y estable
  fecha: string;   // ISO date (aaaa-mm-dd)
  mensaje: string; // texto que se muestra
}

export const NOVEDADES: Novedad[] = [
  {
    id: "2026-08-11-novedades",
    fecha: "2026-08-11",
    mensaje:
      "¡Bienvenida! Ahora la Home te avisa con mensajes como este cada vez que se agrega algo nuevo a la plataforma.",
  },
  {
    id: "2026-08-05-favicon-compartir",
    fecha: "2026-08-05",
    mensaje:
      "Al compartir el enlace de la aplicación ya se ve el logo de Puerta Abierta Recreando.",
  },
  {
    id: "2026-07-20-sensibilizacion",
    fecha: "2026-07-20",
    mensaje:
      "Se agregó el tipo de evento Sensibilización en el Calendario y ya se contabiliza en Estadísticas.",
  },
  {
    id: "2026-07-10-hijos-a-cargo",
    fecha: "2026-07-10",
    mensaje:
      "Al editar una participante podés cargar el detalle de hijos a cargo (nombre, fecha de nacimiento con edad calculada y CUIL).",
  },
];

const VISTAS_KEY = "pa_novedades_vistas";

export const getNovedadesVistas = (): string[] => {
  try {
    const raw = localStorage.getItem(VISTAS_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
};

/** Novedades que esta persona todavía no vio */
export const getNovedadesPendientes = (): Novedad[] => {
  const vistas = getNovedadesVistas();
  return NOVEDADES.filter((n) => !vistas.includes(n.id));
};

/** Marca novedades como vistas para que no vuelvan a aparecer */
export const marcarNovedadesVistas = (ids: string[]) => {
  if (!ids.length) return;
  const vistas = new Set([...getNovedadesVistas(), ...ids]);
  try {
    localStorage.setItem(VISTAS_KEY, JSON.stringify([...vistas]));
  } catch {
    /* almacenamiento no disponible */
  }
};
