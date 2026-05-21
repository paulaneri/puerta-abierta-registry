import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface MetadatosRegistroProps {
  createdAt?: string | null;
  creadoPor?: string | null;
  updatedAt?: string | null;
  className?: string;
}

interface PerfilCache {
  nombre?: string | null;
  apellido?: string | null;
  email?: string | null;
}

const cache = new Map<string, PerfilCache | null>();
const inFlight = new Map<string, Promise<PerfilCache | null>>();

async function fetchProfile(userId: string): Promise<PerfilCache | null> {
  if (cache.has(userId)) return cache.get(userId) ?? null;
  if (inFlight.has(userId)) return inFlight.get(userId)!;

  const promise = (async () => {
    const { data } = await supabase
      .from("profiles")
      .select("nombre, apellido, email")
      .eq("id", userId)
      .maybeSingle();
    const result = data ? { nombre: data.nombre, apellido: data.apellido, email: data.email } : null;
    cache.set(userId, result);
    inFlight.delete(userId);
    return result;
  })();

  inFlight.set(userId, promise);
  return promise;
}

function formatDateTime(value: string): string {
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
}

export function MetadatosRegistro({
  createdAt,
  creadoPor,
  updatedAt,
  className = "",
}: MetadatosRegistroProps) {
  const [autor, setAutor] = useState<PerfilCache | null>(null);

  useEffect(() => {
    let active = true;
    if (creadoPor) {
      fetchProfile(creadoPor).then((p) => {
        if (active) setAutor(p);
      });
    } else {
      setAutor(null);
    }
    return () => {
      active = false;
    };
  }, [creadoPor]);

  if (!createdAt && !creadoPor && !updatedAt) return null;

  const nombreAutor = autor
    ? [autor.nombre, autor.apellido].filter(Boolean).join(" ").trim() || autor.email || "Usuario"
    : null;

  return (
    <div
      className={`text-xs text-muted-foreground mt-4 pt-3 border-t border-border/40 select-text ${className}`}
    >
      {createdAt && (
        <div>
          Creado{nombreAutor ? ` por ${nombreAutor}` : ""} el {formatDateTime(createdAt)}
        </div>
      )}
      {updatedAt && createdAt && updatedAt !== createdAt && (
        <div>Última modificación: {formatDateTime(updatedAt)}</div>
      )}
    </div>
  );
}

export default MetadatosRegistro;
