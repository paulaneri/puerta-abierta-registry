// ─── Setup Configuration System ──────────────────────────────────────────────
// Manages the connection config for auto-installation on new servers.
// The app reads from env vars first, then falls back to localStorage config.
// ─────────────────────────────────────────────────────────────────────────────

export const SETUP_DONE_KEY = "pa_setup_completed";
export const SETUP_CONFIG_KEY = "pa_supabase_config";

export interface SetupConfig {
  url: string;
  anonKey: string;
  projectId: string;
}

/** Check if setup has been completed */
export const isSetupCompleted = (): boolean =>
  localStorage.getItem(SETUP_DONE_KEY) === "true";

/** Get the stored setup config from localStorage */
export const getSetupConfig = (): SetupConfig | null => {
  const raw = localStorage.getItem(SETUP_CONFIG_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

/** Save setup config to localStorage */
export const saveSetupConfig = (config: SetupConfig) => {
  localStorage.setItem(SETUP_CONFIG_KEY, JSON.stringify(config));
};

/** Mark setup as completed */
export const markSetupCompleted = () => {
  localStorage.setItem(SETUP_DONE_KEY, "true");
};

/** Reset setup (for re-installation) */
export const resetSetup = () => {
  localStorage.removeItem(SETUP_DONE_KEY);
  localStorage.removeItem(SETUP_CONFIG_KEY);
};

/** 
 * Resolve the Supabase connection params.
 * Priority: env vars → localStorage config → null (needs setup)
 */
export const resolveSupabaseConfig = (): SetupConfig | null => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const envId = import.meta.env.VITE_SUPABASE_PROJECT_ID;

  // If env vars are present and non-empty, use them
  if (envUrl && envKey && envId) {
    return { url: envUrl, anonKey: envKey, projectId: envId };
  }

  // Otherwise, try localStorage config
  return getSetupConfig();
};

/** Check if the app needs initial setup */
export const needsSetup = (): boolean => {
  // If env vars are present, setup is not needed (already deployed)
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const envId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  if (envUrl && envKey && envId) return false;

  // Otherwise check localStorage config
  const config = getSetupConfig();
  return !config || !isSetupCompleted();
};

/** Required tables for schema verification */
export const REQUIRED_TABLES = [
  "profiles",
  "user_roles",
  "mujeres",
  "equipo",
  "centro_dia",
  "trabajo_campo",
  "gastos",
  "etiquetas_gastos",
  "contactos",
  "eventos",
  "albumes",
  "fotos_album",
  "reuniones_semanales",
  "asignaciones_roles",
  "disponibilidad_reuniones",
  "duplas_acompanamiento",
  "cargos_profesionales",
  "nacionalidades",
  "lugares",
  "actividades",
];
