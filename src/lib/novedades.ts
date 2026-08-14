// ─── Novedades de la plataforma ──────────────────────────────────────────────
// Mensajes temporales que se muestran en la Home la primera vez que una
// persona entra después de una actualización de la plataforma.
// Agregá una entrada nueva arriba de todo cada vez que se publique un cambio.
// Solo cambios de la plataforma (funcionalidades), nunca contenidos.
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from "@/integrations/supabase/client";

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
const META_KEY = "novedades_vistas";

const claveLocal = (userId?: string | null) =>
  userId ? `${VISTAS_KEY}_${userId}` : VISTAS_KEY;

const leerLocal = (userId?: string | null): string[] => {
  try {
    const raw = localStorage.getItem(claveLocal(userId));
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
};

const guardarLocal = (ids: string[], userId?: string | null) => {
  try {
    localStorage.setItem(claveLocal(userId), JSON.stringify(ids));
  } catch {
    /* almacenamiento no disponible */
  }
};

/** @deprecated usar getNovedadesPendientes (async) */
export const getNovedadesVistas = (): string[] => leerLocal();

/**
 * Novedades que esta persona todavía no vio.
 * El registro se guarda en el perfil del usuario (metadata de Supabase), de
 * modo que persiste entre sesiones, dispositivos y navegadores.
 */
export const getNovedadesPendientes = async (): Promise<Novedad[]> => {
  let userId: string | null = null;
  let vistas: string[] = [];

  try {
    const { data } = await supabase.auth.getUser();
    userId = data.user?.id ?? null;
    const meta = data.user?.user_metadata?.[META_KEY];
    if (Array.isArray(meta)) vistas = meta as string[];
  } catch {
    /* sin sesión: se usa solo el almacenamiento local */
  }

  const locales = leerLocal(userId);
  const todas = new Set([...vistas, ...locales, ...leerLocal()]);

  return NOVEDADES.filter((n) => !todas.has(n.id));
};

/** Marca novedades como vistas para que no vuelvan a aparecer */
export const marcarNovedadesVistas = async (ids: string[]) => {
  if (!ids.length) return;

  let userId: string | null = null;
  let previas: string[] = [];

  try {
    const { data } = await supabase.auth.getUser();
    userId = data.user?.id ?? null;
    const meta = data.user?.user_metadata?.[META_KEY];
    if (Array.isArray(meta)) previas = meta as string[];
  } catch {
    /* sin sesión */
  }

  const todas = [...new Set([...previas, ...leerLocal(userId), ...ids])];
  guardarLocal(todas, userId);

  if (userId) {
    try {
      await supabase.auth.updateUser({ data: { [META_KEY]: todas } });
    } catch {
      /* si falla, queda al menos el registro local */
    }
  }
};
