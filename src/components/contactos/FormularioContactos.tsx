import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { contactosStore, type Contacto, tiposContacto } from "@/lib/contactosStore";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { UnsavedChangesDialog } from "@/components/ui/unsaved-changes-dialog";

interface FormularioContactosProps {
  contacto?: Contacto;
  onSuccess: () => void;
}

export function FormularioContactos({ contacto, onSuccess }: FormularioContactosProps) {
  const [hasChanges, setHasChanges] = useState(false);
  const [formData, setFormData] = useState({
    referente: contacto?.referente || "",
    institucion: contacto?.institucion || "",
    tipoContacto: contacto?.tipoContacto || "",
    telefono: contacto?.telefono || "",
    email: contacto?.email || "",
    paginaWeb: contacto?.paginaWeb || "",
    descripcion: contacto?.descripcion || "",
    direccion: contacto?.direccion || "",
    servicio: contacto?.servicio || "",
    diasHorarioAtencion: contacto?.diaAtencion && contacto?.horarioAtencion 
      ? `${contacto.diaAtencion} - ${contacto.horarioAtencion}` 
      : contacto?.diaAtencion || contacto?.horarioAtencion || "",
    dependenciaNacional: contacto?.pais === "nacional" || false,
    dependenciaProvincial: contacto?.provincia === "provincial" || false,
    dependenciaMunicipal: contacto?.ciudad === "municipal" || false,
    dependenciaIglesia: contacto?.pais === "iglesia" || contacto?.provincia === "iglesia" || contacto?.ciudad === "iglesia" || false,
    dependenciaPrivado: contacto?.pais === "privado" || contacto?.provincia === "privado" || contacto?.ciudad === "privado" || false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const {
    showWarning,
    confirmNavigation,
    cancelNavigation,
  } = useUnsavedChanges(hasChanges);

  const dependenciasGubernamentales = [
    { value: "nacional", label: "Nacional" },
    { value: "provincial", label: "Provincial" },
    { value: "municipal", label: "Municipal/Ciudad" }
  ];

  const diasSemana = [
    "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};
    
    if (!formData.institucion.trim()) {
      newErrors.institucion = "La institución es obligatoria";
    }
    
    if (!formData.tipoContacto) {
      newErrors.tipoContacto = "El tipo de contacto es obligatorio";
    }

    // Contacto no es obligatorio

    if (formData.email && !formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      newErrors.email = "El email no tiene un formato válido";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const contactoData = {
      referente: formData.referente,
      institucion: formData.institucion,
      tipoContacto: formData.tipoContacto,
      telefono: formData.telefono,
      email: formData.email,
      paginaWeb: formData.paginaWeb,
      descripcion: formData.descripcion,
      direccion: formData.direccion,
      servicio: formData.servicio,
      diaAtencion: formData.diasHorarioAtencion,
      horarioAtencion: "",
      ciudad: formData.dependenciaMunicipal ? "municipal" : formData.dependenciaIglesia ? "iglesia" : formData.dependenciaPrivado ? "privado" : "",
      provincia: formData.dependenciaProvincial ? "provincial" : formData.dependenciaIglesia ? "iglesia" : formData.dependenciaPrivado ? "privado" : "",
      pais: formData.dependenciaNacional ? "nacional" : formData.dependenciaIglesia ? "iglesia" : formData.dependenciaPrivado ? "privado" : ""
    };

    if (contacto) {
      await contactosStore.updateContacto(contacto.id, contactoData);
    } else {
      await contactosStore.addContacto(contactoData);
    }

    onSuccess();
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
    // Limpiar error general de contacto si se llena teléfono o email
    if ((field === 'telefono' || field === 'email') && errors.contacto) {
      setErrors(prev => ({ ...prev, contacto: "" }));
    }
  };

  return (
    <div className="w-full max-w-full mx-auto p-2 sm:p-4 overflow-y-auto max-h-[85vh]">
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Botones superiores - sticky */}
        <div className="sticky top-0 bg-background z-10 pb-3 border-b flex justify-end gap-3">
          <Button type="submit" className="min-w-[120px]">
            {contacto ? "Actualizar" : "Registrar"}
          </Button>
        </div>

        {/* Referente e Institución */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="referente">Referente</Label>
            <Input
              id="referente"
              value={formData.referente}
              onChange={(e) => handleInputChange("referente", e.target.value)}
              placeholder="Nombre del referente o contacto"
            />
          </div>

          <div>
            <Label htmlFor="institucion">Institución *</Label>
            <Input
              id="institucion"
              value={formData.institucion}
              onChange={(e) => handleInputChange("institucion", e.target.value)}
              placeholder="Nombre de la institución u organización"
              className={errors.institucion ? "border-red-500" : ""}
            />
            {errors.institucion && (
              <p className="text-red-500 text-sm mt-1">{errors.institucion}</p>
            )}
          </div>
        </div>

        {/* Tipo de contacto y Servicio */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm">Tipo *</Label>
            <Select 
              value={formData.tipoContacto} 
              onValueChange={(value) => handleInputChange("tipoContacto", value)}
            >
              <SelectTrigger 
                className={`bg-background ${errors.tipoContacto ? "border-red-500" : ""}`}
              >
                <SelectValue placeholder="Tipo de contacto" />
              </SelectTrigger>
              <SelectContent className="bg-background border shadow-md z-50">
                {tiposContacto.map((tipo) => (
                  <SelectItem key={tipo} value={tipo}>
                    {tipo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.tipoContacto && (
              <p className="text-red-500 text-sm mt-1">{errors.tipoContacto}</p>
            )}
          </div>

          <div>
            <Label htmlFor="servicio">Servicio</Label>
            <Input
              id="servicio"
              value={formData.servicio}
              onChange={(e) => handleInputChange("servicio", e.target.value)}
              placeholder="Descripción del servicio que ofrece"
            />
          </div>
        </div>

        {/* Dependencia Gubernamental */}
        <div>
          <Label className="text-base font-medium">Dependencia</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="dependenciaNacional"
                checked={formData.dependenciaNacional}
                onCheckedChange={(checked) => handleInputChange("dependenciaNacional", checked)}
              />
              <Label htmlFor="dependenciaNacional" className="text-sm">Nación</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="dependenciaProvincial"
                checked={formData.dependenciaProvincial}
                onCheckedChange={(checked) => handleInputChange("dependenciaProvincial", checked)}
              />
              <Label htmlFor="dependenciaProvincial" className="text-sm">Provincia</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="dependenciaMunicipal"
                checked={formData.dependenciaMunicipal}
                onCheckedChange={(checked) => handleInputChange("dependenciaMunicipal", checked)}
              />
              <Label htmlFor="dependenciaMunicipal" className="text-sm">Ciudad</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="dependenciaIglesia"
                checked={formData.dependenciaIglesia}
                onCheckedChange={(checked) => handleInputChange("dependenciaIglesia", checked)}
              />
              <Label htmlFor="dependenciaIglesia" className="text-sm">Iglesia</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="dependenciaPrivado"
                checked={formData.dependenciaPrivado}
                onCheckedChange={(checked) => handleInputChange("dependenciaPrivado", checked)}
              />
              <Label htmlFor="dependenciaPrivado" className="text-sm">Privado</Label>
            </div>
          </div>
        </div>

        {/* Dirección */}
        <div>
          <Label htmlFor="direccion">Dirección</Label>
          <Input
            id="direccion"
            value={formData.direccion}
            onChange={(e) => handleInputChange("direccion", e.target.value)}
            placeholder="Dirección completa"
          />
        </div>

        {/* Días y Horarios de Atención */}
        <div>
          <Label htmlFor="diasHorarioAtencion">Días y Horarios de Atención</Label>
          <Input
            id="diasHorarioAtencion"
            value={formData.diasHorarioAtencion}
            onChange={(e) => handleInputChange("diasHorarioAtencion", e.target.value)}
            placeholder="Ej: Lunes a Viernes 8:00 - 16:00"
          />
        </div>

        {/* Contacto: Teléfono, Email y Web */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="telefono">Teléfono</Label>
            <Input
              id="telefono"
              value={formData.telefono}
              onChange={(e) => handleInputChange("telefono", e.target.value)}
              placeholder="Número de teléfono"
              
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="correo@ejemplo.com"
              className={errors.email ? "border-red-500" : ""}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <Label htmlFor="paginaWeb" className="text-sm">Web</Label>
            <Input
              id="paginaWeb"
              value={formData.paginaWeb}
              onChange={(e) => handleInputChange("paginaWeb", e.target.value)}
              placeholder="https://www.ejemplo.com"
            />
          </div>
        </div>

        {/* Descripción */}
        <div>
          <Label htmlFor="descripcion">Descripción</Label>
          <Textarea
            id="descripcion"
            value={formData.descripcion}
            onChange={(e) => handleInputChange("descripcion", e.target.value)}
            placeholder="Información adicional sobre el contacto, servicios que ofrece, etc."
            rows={3}
          />
        </div>

        {/* Botones inferiores */}
        <div className="flex justify-end gap-3 pt-4 pb-6 sticky bottom-0 bg-background border-t">
          <Button type="submit" className="min-w-[120px]">
            {contacto ? "Actualizar" : "Registrar"}
          </Button>
        </div>
      </form>

      {/* Diálogo de advertencia de cambios no guardados */}
      <UnsavedChangesDialog
        open={showWarning}
        onOpenChange={cancelNavigation}
        onConfirm={confirmNavigation}
      />
    </div>
  );
}