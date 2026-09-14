import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowDown, ArrowUp, MapPin, Trash2, Info } from "lucide-react";
import { toast } from "sonner";
import MapaRecorrido from "./MapaRecorrido";
import BuscadorDireccion from "./BuscadorDireccion";
import { UbicacionRecorrido } from "./tipos";

interface EncuentroBasico {
  id: number;
  nombre: string;
  apellido: string;
}

interface UbicacionesEditorProps {
  encuentros: EncuentroBasico[];
  ubicaciones: UbicacionRecorrido[];
  onChange: (ubicaciones: UbicacionRecorrido[]) => void;
}

const PARADA = "__parada__";
const COLOR = "#f97316";

const UbicacionesEditor = ({ encuentros, ubicaciones, onChange }: UbicacionesEditorProps) => {
  const [destino, setDestino] = useState<string>(PARADA);
  const [centrarEn, setCentrarEn] = useState<[number, number] | null>(null);

  const etiquetaDestino = useMemo(() => {
    if (destino === PARADA) return "Parada del recorrido";
    const enc = encuentros.find((e) => String(e.id) === destino);
    return enc ? `${enc.nombre} ${enc.apellido}`.trim() : "Parada del recorrido";
  }, [destino, encuentros]);

  const reordenar = (lista: UbicacionRecorrido[]) =>
    lista.map((u, i) => ({ ...u, orden: i }));

  const agregarPunto = (lat: number, lng: number) => {
    const encuentroId = destino === PARADA ? null : Number(destino);
    if (encuentroId !== null && ubicaciones.some((u) => u.encuentroId === encuentroId)) {
      toast.error("Esa mujer ya tiene un punto marcado. Arrastrá el punto para corregirlo.");
      return;
    }
    const nueva: UbicacionRecorrido = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      tipo: encuentroId === null ? "parada" : "encuentro",
      encuentroId,
      etiqueta: etiquetaDestino,
      lat,
      lng,
      orden: ubicaciones.length,
      nota: "",
    };
    onChange(reordenar([...ubicaciones, nueva]));
    setCentrarEn([lat, lng]);
    if (encuentroId !== null) setDestino(PARADA);
  };

  const moverPunto = (id: string, lat: number, lng: number) => {
    onChange(ubicaciones.map((u) => (u.id === id ? { ...u, lat, lng } : u)));
  };

  const eliminarPunto = (id: string) => {
    onChange(reordenar(ubicaciones.filter((u) => u.id !== id)));
  };

  const cambiarOrden = (index: number, delta: number) => {
    const nuevo = [...ubicaciones].sort((a, b) => a.orden - b.orden);
    const destinoIdx = index + delta;
    if (destinoIdx < 0 || destinoIdx >= nuevo.length) return;
    [nuevo[index], nuevo[destinoIdx]] = [nuevo[destinoIdx], nuevo[index]];
    onChange(reordenar(nuevo));
  };

  const cambiarNota = (id: string, nota: string) => {
    onChange(ubicaciones.map((u) => (u.id === id ? { ...u, nota } : u)));
  };

  const ordenadas = [...ubicaciones].sort((a, b) => a.orden - b.orden);
  const sinUbicar = encuentros.filter((e) => !ubicaciones.some((u) => u.encuentroId === e.id));

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
        <Info className="h-4 w-4 mt-0.5 shrink-0" />
        <p>
          Elegí a quién corresponde el punto, buscá la dirección o esquina y tocá el mapa para marcarlo.
          Los puntos se unen en orden formando el recorrido.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Marcar punto para</Label>
          <Select value={destino} onValueChange={setDestino}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-[1100]">
              <SelectItem value={PARADA}>Parada del recorrido (sin mujer)</SelectItem>
              {encuentros.map((e) => (
                <SelectItem key={e.id} value={String(e.id)}>
                  {`${e.nombre} ${e.apellido}`.trim() || "Sin nombre"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Buscar ubicación</Label>
          <BuscadorDireccion onSeleccionar={(lat, lng) => agregarPunto(lat, lng)} />
        </div>
      </div>

      {sinUbicar.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">Sin punto en el mapa:</span>
          {sinUbicar.map((e) => (
            <Badge key={e.id} variant="outline">
              {`${e.nombre} ${e.apellido}`.trim() || "Sin nombre"}
            </Badge>
          ))}
        </div>
      )}

      <MapaRecorrido
        recorridos={[{ id: "actual", color: COLOR, ubicaciones: ordenadas }]}
        editable
        onMapClick={agregarPunto}
        onMarkerMove={moverPunto}
        centrarEn={centrarEn}
      />

      {ordenadas.length > 0 && (
        <div className="space-y-2">
          <Label>Puntos del recorrido ({ordenadas.length})</Label>
          <div className="space-y-2">
            {ordenadas.map((u, index) => (
              <div
                key={u.id}
                className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-md border p-3"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ background: COLOR }}
                  >
                    {index + 1}
                  </span>
                  <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate text-sm font-medium">
                    {u.etiqueta || (u.tipo === "parada" ? "Parada" : "Encuentro")}
                  </span>
                </div>

                <Input
                  value={u.nota || ""}
                  onChange={(e) => cambiarNota(u.id, e.target.value)}
                  placeholder="Nota (opcional)"
                  className="sm:max-w-xs"
                />

                <TooltipProvider>
                  <div className="flex items-center gap-1 self-end sm:self-auto">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button type="button" variant="ghost" size="icon" onClick={() => cambiarOrden(index, -1)}>
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Subir en el recorrido</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button type="button" variant="ghost" size="icon" onClick={() => cambiarOrden(index, 1)}>
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Bajar en el recorrido</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => eliminarPunto(u.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Eliminar punto</TooltipContent>
                    </Tooltip>
                  </div>
                </TooltipProvider>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UbicacionesEditor;
