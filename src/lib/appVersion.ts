// ─── App Version System ───────────────────────────────────────────────────────
// Add a new entry to VERSIONS every time a meaningful update is released.
// Each version can optionally include a `migrate` function that runs once
// when the user "applies" the update from the Admin panel.
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from "@/integrations/supabase/client";

export interface AppVersion {
  version: string;               // semver string, e.g. "1.2.0"
  date: string;                  // ISO date string
  title: string;                 // Short title shown in the UI
  description: string;           // What changed in this release
  type: "major" | "minor" | "patch" | "hotfix";
  changes: string[];             // Bullet list of changes
  migrate?: () => Promise<{ success: boolean; message: string }>;
}

// ─── Version registry ────────────────────────────────────────────────────────
// IMPORTANT: Always append at the end. Never reorder or remove entries.
export const VERSIONS: AppVersion[] = [
  {
    version: "1.0.0",
    date: "2025-01-01",
    title: "Lanzamiento inicial",
    description: "Primera versión estable del sistema de gestión.",
    type: "major",
    changes: [
      "Módulo de mujeres y registro de acompañamientos",
      "Módulo de equipo de trabajo",
      "Módulo de gastos con etiquetas",
      "Módulo de centro de día",
      "Módulo de trabajo de campo",
      "Calendario y eventos",
      "Reuniones semanales",
      "Galería de fotos",
      "Panel de administración",
    ],
  },
  {
    version: "1.1.0",
    date: "2025-06-01",
    title: "Mejoras de gestión y catálogos",
    description: "Incorporación de catálogos configurables y mejoras de UI.",
    type: "minor",
    changes: [
      "Catálogo de lugares para trabajo de campo",
      "Catálogo de cargos profesionales",
      "Catálogo de nacionalidades",
      "Búsqueda predictiva de lugares",
      "Selector multiselección de etiquetas en gastos",
    ],
  },
  {
    version: "1.2.0",
    date: "2025-10-01",
    title: "Exportación y portabilidad",
    description: "Sistema de backup y configuración para replicar la aplicación.",
    type: "minor",
    changes: [
      "Exportación de backup completo (SQL)",
      "Exportación de catálogos (SQL)",
      "Exportación de resumen de datos (JSON)",
      "Guía de despliegue (DEPLOYMENT.md)",
      "Asistente de configuración inicial (Setup Wizard)",
      "Panel de actualizaciones del sistema",
    ],
    migrate: async () => {
      // Example migration: verify the database-backup edge function exists
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        const url = `https://${projectId}.supabase.co/functions/v1/database-backup?mode=json_summary`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("La Edge Function aún no está desplegada");
        return { success: true, message: "Edge Function de backup verificada correctamente." };
      } catch (e) {
        return {
          success: false,
          message: `Atención: ${e instanceof Error ? e.message : "Error desconocido"}. Desplegá la función con: supabase functions deploy database-backup`,
        };
      }
    },
  },

  // ── Add future versions below ──────────────────────────────────────────────
  // {
  //   version: "1.3.0",
  //   date: "2026-XX-XX",
  //   title: "Nombre de la actualización",
  //   description: "Descripción general",
  //   type: "minor",
  //   changes: ["cambio 1", "cambio 2"],
  //   migrate: async () => {
  //     // optional DB or config migration
  //     return { success: true, message: "Migración completada." };
  //   },
  // },
];

// ─── Current version (latest) ────────────────────────────────────────────────
export const CURRENT_VERSION = VERSIONS[VERSIONS.length - 1].version;

// ─── localStorage key ────────────────────────────────────────────────────────
const INSTALLED_VERSION_KEY = "pa_installed_version";

export const getInstalledVersion = (): string =>
  localStorage.getItem(INSTALLED_VERSION_KEY) ?? "0.0.0";

export const setInstalledVersion = (version: string) =>
  localStorage.setItem(INSTALLED_VERSION_KEY, version);

// ─── Semver comparator (simple, no deps) ─────────────────────────────────────
const parseSemver = (v: string) => v.split(".").map(Number);

export const isNewerThan = (a: string, b: string): boolean => {
  const [aMaj, aMin, aPat] = parseSemver(a);
  const [bMaj, bMin, bPat] = parseSemver(b);
  if (aMaj !== bMaj) return aMaj > bMaj;
  if (aMin !== bMin) return aMin > bMin;
  return aPat > bPat;
};

/** Returns all versions newer than the currently installed one */
export const getPendingUpdates = (): AppVersion[] => {
  const installed = getInstalledVersion();
  return VERSIONS.filter((v) => isNewerThan(v.version, installed));
};

/** Mark all versions up to `version` as applied */
export const markVersionInstalled = (version: string) => {
  setInstalledVersion(version);
};
