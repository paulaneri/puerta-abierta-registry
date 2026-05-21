import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface RecordMetadata {
  created_at?: string | null;
  updated_at?: string | null;
  creado_por?: string | null;
}

/**
 * Obtiene los metadatos (created_at, updated_at, creado_por) de un registro existente.
 * Si no hay id o tabla, no consulta.
 */
export function useRecordMetadata(tabla: string | null | undefined, id: string | null | undefined) {
  const [metadata, setMetadata] = useState<RecordMetadata | null>(null);

  useEffect(() => {
    let active = true;
    if (!tabla || !id) {
      setMetadata(null);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from(tabla as any)
        .select("created_at, updated_at, creado_por")
        .eq("id", id)
        .maybeSingle();
      if (active) {
        setMetadata((data as any) || null);
      }
    })();
    return () => {
      active = false;
    };
  }, [tabla, id]);

  return metadata;
}
