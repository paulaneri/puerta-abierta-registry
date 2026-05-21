import { supabase } from "@/integrations/supabase/client";

/**
 * Devuelve el uid del usuario autenticado actual, o null si no hay sesión.
 * Se utiliza para rellenar la columna `creado_por` al insertar registros.
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getUser();
    return data.user?.id ?? null;
  } catch {
    return null;
  }
}
