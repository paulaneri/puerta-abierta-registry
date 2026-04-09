import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { gastosStore, type EtiquetaGasto } from "@/lib/gastosStore";
import { Plus, Trash2, Tag } from "lucide-react";
import { toast } from "sonner";

interface GestionEtiquetasProps {
  onClose: () => void;
  onChanged: () => void;
}

export function GestionEtiquetas({ onClose, onChanged }: GestionEtiquetasProps) {
  const [etiquetas, setEtiquetas] = useState<EtiquetaGasto[]>([]);
  const [nueva, setNueva] = useState("");
  const [loading, setLoading] = useState(false);

  const loadEtiquetas = async () => {
    const data = await gastosStore.getEtiquetas();
    setEtiquetas(data);
  };

  useEffect(() => {
    loadEtiquetas();
  }, []);

  const handleAdd = async () => {
    if (!nueva.trim()) return;
    setLoading(true);
    const ok = await gastosStore.addEtiqueta(nueva.trim());
    if (ok) {
      toast.success("Etiqueta agregada");
      setNueva("");
      await loadEtiquetas();
      onChanged();
    } else {
      toast.error("Error al agregar etiqueta (puede que ya exista)");
    }
    setLoading(false);
  };

  const handleDelete = async (id: string, nombre: string) => {
    const ok = await gastosStore.deleteEtiqueta(id);
    if (ok) {
      toast.success(`Etiqueta "${nombre}" eliminada`);
      await loadEtiquetas();
      onChanged();
    } else {
      toast.error("Error al eliminar etiqueta");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Nueva etiqueta..."
          value={nueva}
          onChange={(e) => setNueva(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <Button onClick={handleAdd} disabled={loading || !nueva.trim()} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Agregar
        </Button>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {etiquetas.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4">No hay etiquetas definidas</p>
        ) : (
          etiquetas.map((e) => (
            <div key={e.id} className="flex items-center justify-between p-2 border rounded-lg">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{e.nombre}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => handleDelete(e.id, e.nombre)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </div>

      <div className="flex justify-end pt-2 border-t">
        <Button variant="outline" onClick={onClose}>Cerrar</Button>
      </div>
    </div>
  );
}
