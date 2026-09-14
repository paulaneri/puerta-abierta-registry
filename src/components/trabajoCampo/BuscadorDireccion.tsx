import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";

interface Resultado {
  display_name: string;
  lat: string;
  lon: string;
}

interface BuscadorDireccionProps {
  onSeleccionar: (lat: number, lng: number, etiqueta: string) => void;
  placeholder?: string;
}

const BuscadorDireccion = ({ onSeleccionar, placeholder }: BuscadorDireccionProps) => {
  const [texto, setTexto] = useState("");
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [abierto, setAbierto] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const buscar = async (consulta: string) => {
    if (consulta.trim().length < 4) {
      setResultados([]);
      return;
    }
    setBuscando(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=ar&limit=5&q=${encodeURIComponent(
        consulta
      )}`;
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as Resultado[];
      setResultados(data);
      setAbierto(true);
    } catch (error) {
      console.error("Error buscando dirección:", error);
      setResultados([]);
    } finally {
      setBuscando(false);
    }
  };

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => buscar(texto), 700);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texto]);

  return (
    <div className="relative">
      <div className="flex gap-2">
        <Input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder={placeholder || "Buscar dirección o esquina (ej: Rivadavia y Medrano)"}
          onFocus={() => resultados.length > 0 && setAbierto(true)}
        />
        <Button type="button" variant="outline" size="icon" onClick={() => buscar(texto)}>
          {buscando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </Button>
      </div>

      {abierto && resultados.length > 0 && (
        <div className="absolute z-[1000] mt-1 w-full rounded-md border bg-popover shadow-md max-h-60 overflow-y-auto">
          {resultados.map((r, i) => (
            <button
              key={`${r.lat}-${r.lon}-${i}`}
              type="button"
              className="w-full text-left px-3 py-2 text-sm hover:bg-accent"
              onClick={() => {
                onSeleccionar(parseFloat(r.lat), parseFloat(r.lon), r.display_name);
                setAbierto(false);
                setTexto("");
                setResultados([]);
              }}
            >
              {r.display_name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default BuscadorDireccion;
