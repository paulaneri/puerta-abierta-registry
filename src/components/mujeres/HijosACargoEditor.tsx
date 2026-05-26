import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, Trash2 } from "lucide-react";
import { calcularEdad } from "@/lib/utils";

export interface HijoACargo {
  id: string;
  nombre: string;
  fechaNacimiento: string;
  cuil: string;
}

interface Props {
  value: HijoACargo[];
  onChange: (value: HijoACargo[]) => void;
}

export const crearHijoVacio = (): HijoACargo => ({
  id: crypto.randomUUID(),
  nombre: "",
  fechaNacimiento: "",
  cuil: "",
});

export const HijosACargoEditor = ({ value, onChange }: Props) => {
  const hijos = value && value.length > 0 ? value : [];

  const actualizar = (id: string, patch: Partial<HijoACargo>) => {
    onChange(hijos.map((h) => (h.id === id ? { ...h, ...patch } : h)));
  };

  const agregar = () => onChange([...hijos, crearHijoVacio()]);
  const eliminar = (id: string) => onChange(hijos.filter((h) => h.id !== id));

  return (
    <div className="border rounded-lg p-4 bg-card space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">
          Hijos/as a cargo {hijos.length > 0 && `(${hijos.length})`}
        </Label>
        {hijos.length === 0 && (
          <Button type="button" variant="outline" size="sm" onClick={agregar}>
            <Plus className="h-4 w-4 mr-1" /> Agregar hijo/a
          </Button>
        )}
      </div>

      {hijos.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Aún no hay hijos/as cargados.
        </p>
      )}

      {hijos.map((h, idx) => {
        const edad = calcularEdad(h.fechaNacimiento);
        const esUltimo = idx === hijos.length - 1;
        return (
          <div
            key={h.id}
            className="grid grid-cols-1 md:grid-cols-[1fr_180px_160px_80px_auto] gap-2 items-end border-t pt-3"
          >
            <div>
              <Label className="text-xs">Nombre</Label>
              <Input
                value={h.nombre}
                onChange={(e) => actualizar(h.id, { nombre: e.target.value })}
                placeholder="Nombre y apellido"
                maxLength={100}
              />
            </div>
            <div>
              <Label className="text-xs">Fecha de nacimiento</Label>
              <DatePicker
                value={h.fechaNacimiento ? new Date(h.fechaNacimiento + "T00:00:00") : undefined}
                onChange={(d) => {
                  if (!d) return actualizar(h.id, { fechaNacimiento: "" });
                  const y = d.getFullYear();
                  const m = String(d.getMonth() + 1).padStart(2, "0");
                  const day = String(d.getDate()).padStart(2, "0");
                  actualizar(h.id, { fechaNacimiento: `${y}-${m}-${day}` });
                }}
              />
            </div>
            <div>
              <Label className="text-xs">CUIL</Label>
              <Input
                value={h.cuil}
                onChange={(e) => actualizar(h.id, { cuil: e.target.value.replace(/[^\d-]/g, "") })}
                placeholder="XX-XXXXXXXX-X"
                maxLength={13}
              />
            </div>
            <div>
              <Label className="text-xs">Edad</Label>
              <div className="h-10 flex items-center px-3 rounded-md border bg-muted/30 text-sm">
                {edad !== null ? `${edad} años` : "—"}
              </div>
            </div>
            <div className="flex gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => eliminar(h.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Eliminar</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              {esUltimo && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={agregar}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Agregar otro/a</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
