import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { gastosStore, type Gasto, type DocumentoAdjunto, type EtiquetaGasto } from "@/lib/gastosStore";
import { Upload, X, FileText } from "lucide-react";
import { toast } from "sonner";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { UnsavedChangesDialog } from "@/components/ui/unsaved-changes-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FormularioGastosProps {
  gasto?: Gasto;
  onSuccess: () => void;
}

export function FormularioGastos({ gasto, onSuccess }: FormularioGastosProps) {
  const [hasChanges, setHasChanges] = useState(false);
  const [etiquetas, setEtiquetas] = useState<EtiquetaGasto[]>([]);
  const [formData, setFormData] = useState({
    descripcion: gasto?.descripcion || "",
    monto: gasto?.monto || 0,
    fecha: gasto?.fecha ? new Date(gasto.fecha) : new Date(),
    detalleFactura: gasto?.detalleFactura || "",
    etiqueta: gasto?.etiqueta || "",
    documentosAdjuntos: gasto?.documentosAdjuntos || [] as DocumentoAdjunto[]
  });
  
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { showWarning, confirmNavigation, cancelNavigation } = useUnsavedChanges(hasChanges);

  useEffect(() => {
    gastosStore.getEtiquetas().then(data => {
      setEtiquetas(data);
      if (!formData.etiqueta && data.length > 0) {
        setFormData(prev => ({ ...prev, etiqueta: data[0].nombre }));
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};
    if (!formData.descripcion.trim()) newErrors.descripcion = "La descripción es obligatoria";
    if (formData.monto <= 0) newErrors.monto = "El monto debe ser mayor a 0";
    if (!formData.detalleFactura.trim()) newErrors.detalleFactura = "El detalle de la factura es obligatorio";
    if (!formData.etiqueta) newErrors.etiqueta = "La etiqueta es obligatoria";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const gastoData = {
      descripcion: formData.descripcion,
      monto: formData.monto,
      fecha: formData.fecha.toISOString().split('T')[0],
      detalleFactura: formData.detalleFactura,
      etiqueta: formData.etiqueta,
      documentosAdjuntos: formData.documentosAdjuntos
    };

    try {
      let success = false;
      if (gasto) {
        success = await gastosStore.updateGasto(gasto.id, gastoData);
      } else {
        success = await gastosStore.addGasto(gastoData);
      }

      if (success) {
        toast.success(gasto ? "Gasto actualizado correctamente" : "Gasto registrado correctamente");
        onSuccess();
      } else {
        toast.error("Error al guardar el gasto");
      }
    } catch (error) {
      console.error('Error submitting gasto:', error);
      toast.error("Error al guardar el gasto");
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: "" }));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setUploadingFiles(true);
    const documentosSubidos: DocumentoAdjunto[] = [];

    try {
      for (const file of Array.from(files)) {
        const documento = await gastosStore.subirDocumento(file, Date.now().toString());
        if (documento) documentosSubidos.push(documento);
      }
      setFormData(prev => ({ ...prev, documentosAdjuntos: [...prev.documentosAdjuntos, ...documentosSubidos] }));
      toast.success(`${documentosSubidos.length} documento(s) subido(s) exitosamente`);
    } catch {
      toast.error("Error al subir los documentos");
    } finally {
      setUploadingFiles(false);
      event.target.value = '';
    }
  };

  const handleRemoveDocument = (documentoId: string) => {
    setFormData(prev => ({ ...prev, documentosAdjuntos: prev.documentosAdjuntos.filter(doc => doc.id !== documentoId) }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[80vh] overflow-y-auto">
      <div className="sticky top-0 bg-background z-10 pb-4 border-b flex justify-end gap-3">
        <Button type="submit" disabled={uploadingFiles}>
          {uploadingFiles ? "Subiendo archivos..." : gasto ? "Actualizar Gasto" : "Registrar Gasto"}
        </Button>
      </div>

      <div>
        <Label htmlFor="descripcion">Descripción *</Label>
        <Input
          id="descripcion"
          value={formData.descripcion}
          onChange={(e) => handleInputChange("descripcion", e.target.value)}
          placeholder="Ej: Material de oficina, servicios, etc."
          className={errors.descripcion ? "border-red-500" : ""}
        />
        {errors.descripcion && <p className="text-red-500 text-sm mt-1">{errors.descripcion}</p>}
      </div>

      <div>
        <Label htmlFor="monto">Monto *</Label>
        <Input
          id="monto"
          type="number"
          min="0"
          step="0.01"
          value={formData.monto}
          onChange={(e) => handleInputChange("monto", parseFloat(e.target.value) || 0)}
          placeholder="0.00"
          className={errors.monto ? "border-red-500" : ""}
        />
        {errors.monto && <p className="text-red-500 text-sm mt-1">{errors.monto}</p>}
      </div>

      <div>
        <Label>Fecha *</Label>
        <DatePicker
          date={formData.fecha}
          onSelect={(date) => date && handleInputChange("fecha", date)}
          placeholder="Seleccionar fecha"
        />
      </div>

      <div>
        <Label htmlFor="etiqueta">Etiqueta *</Label>
        <Select value={formData.etiqueta} onValueChange={(value) => handleInputChange("etiqueta", value)}>
          <SelectTrigger className={errors.etiqueta ? "border-red-500" : ""}>
            <SelectValue placeholder="Seleccionar etiqueta" />
          </SelectTrigger>
          <SelectContent>
            {etiquetas.map(e => (
              <SelectItem key={e.id} value={e.nombre}>{e.nombre}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.etiqueta && <p className="text-red-500 text-sm mt-1">{errors.etiqueta}</p>}
      </div>

      <div>
        <Label htmlFor="detalleFactura">Detalle de la Factura *</Label>
        <Textarea
          id="detalleFactura"
          value={formData.detalleFactura}
          onChange={(e) => handleInputChange("detalleFactura", e.target.value)}
          placeholder="Descripción detallada del gasto, número de factura, proveedor, etc."
          rows={4}
          className={errors.detalleFactura ? "border-red-500" : ""}
        />
        {errors.detalleFactura && <p className="text-red-500 text-sm mt-1">{errors.detalleFactura}</p>}
      </div>

      <div>
        <Label>Documentos Adjuntos</Label>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Input
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={handleFileUpload}
              disabled={uploadingFiles}
              className="file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/80"
            />
            <Button type="button" variant="outline" size="icon" disabled={uploadingFiles}>
              <Upload className="h-4 w-4" />
            </Button>
          </div>
          
          {formData.documentosAdjuntos.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">
                Documentos seleccionados ({formData.documentosAdjuntos.length})
              </Label>
              <div className="grid grid-cols-1 gap-2">
                {formData.documentosAdjuntos.map((documento) => (
                  <div key={documento.id} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{documento.nombre}</p>
                        <p className="text-xs text-muted-foreground">{(documento.tamaño / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveDocument(documento.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t sticky bottom-0 bg-background">
        <Button type="submit" disabled={uploadingFiles}>
          {uploadingFiles ? "Subiendo archivos..." : gasto ? "Actualizar Gasto" : "Registrar Gasto"}
        </Button>
      </div>

      <UnsavedChangesDialog open={showWarning} onOpenChange={cancelNavigation} onConfirm={confirmNavigation} />
    </form>
  );
}
