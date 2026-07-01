import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { format } from "date-fns";
import { toast } from "sonner";
import { MapPin, Save } from "lucide-react";
import LugarPredictiveInput from "@/components/LugarPredictiveInput";
import { trabajoCampoStore } from "@/lib/trabajoCampoStore";
import { equipoStore } from "@/lib/equipoStore";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fechaInicial?: string;
  onCreado?: (descripcion: string) => void;
}

const TrabajoCampoDialog = ({ open, onOpenChange, fechaInicial, onCreado }: Props) => {
  const [profesionalesDisponibles, setProfesionalesDisponibles] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    fecha: fechaInicial || new Date().toISOString().split('T')[0],
    lugar: "",
    descripcion: "",
    profesionales: [] as string[],
  });

  useEffect(() => {
    if (!open) return;
    setFormData(prev => ({ ...prev, fecha: fechaInicial || prev.fecha }));
    equipoStore.getProfesionalesActivos().then(equipo => {
      setProfesionalesDisponibles(equipo.map(p => `${p.nombre} ${p.apellido}${p.cargo ? ' - ' + p.cargo : ''}`));
    });
  }, [open, fechaInicial]);

  const toggleProfesional = (nombre: string) => {
    setFormData(prev => ({
      ...prev,
      profesionales: prev.profesionales.includes(nombre)
        ? prev.profesionales.filter(p => p !== nombre)
        : [...prev.profesionales, nombre],
    }));
  };

  const guardar = async () => {
    if (!formData.fecha || !formData.lugar || !formData.descripcion || formData.profesionales.length === 0) {
      toast.error("Complete fecha, lugar, descripción y al menos un profesional");
      return;
    }
    setSaving(true);
    try {
      const nuevo = await trabajoCampoStore.agregarTrabajo({
        fecha: formData.fecha,
        lugar: formData.lugar,
        descripcion: formData.descripcion,
        actividad: formData.descripcion,
        profesionales: formData.profesionales,
        encuentros: [],
      } as any);
      if (nuevo) {
        toast.success("Trabajo de campo registrado");
        onCreado?.(formData.descripcion);
        onOpenChange(false);
        setFormData({
          fecha: fechaInicial || new Date().toISOString().split('T')[0],
          lugar: "",
          descripcion: "",
          profesionales: [],
        });
      } else {
        toast.error("Error al guardar");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Cargar Trabajo de Campo
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Fecha *</Label>
              <DatePicker
                date={formData.fecha ? new Date(formData.fecha) : undefined}
                onSelect={(date) => {
                  if (date) setFormData(p => ({ ...p, fecha: format(date, "yyyy-MM-dd") }));
                }}
              />
            </div>
            <div>
              <Label>Lugar *</Label>
              <LugarPredictiveInput
                value={formData.lugar}
                onChange={(v) => setFormData(p => ({ ...p, lugar: v }))}
                placeholder="Lugar..."
              />
            </div>
          </div>

          <div>
            <Label>Descripción *</Label>
            <Textarea
              value={formData.descripcion}
              onChange={(e) => setFormData(p => ({ ...p, descripcion: e.target.value }))}
              placeholder="Describa el trabajo de campo realizado..."
              rows={3}
            />
          </div>

          <div>
            <Label>Profesionales que participaron *</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 max-h-60 overflow-y-auto border rounded p-2">
              {profesionalesDisponibles.length === 0 && (
                <p className="text-sm text-muted-foreground col-span-2">No hay profesionales activos en Equipo de Trabajo.</p>
              )}
              {profesionalesDisponibles.map(prof => (
                <label key={prof} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-muted/50 rounded">
                  <input
                    type="checkbox"
                    checked={formData.profesionales.includes(prof)}
                    onChange={() => toggleProfesional(prof)}
                  />
                  <span className="text-sm">{prof}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={guardar} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TrabajoCampoDialog;
