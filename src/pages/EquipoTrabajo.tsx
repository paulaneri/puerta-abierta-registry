import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, Edit, Trash2, ArrowLeft, Search, UserCheck, CalendarIcon, Archive, UserX, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";
import { equipoStore, type Profesional } from "@/lib/equipoStore";
import { cargosProfesionalesStore, type CargoProfesional } from "@/lib/cargosProfesionalesStore";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DatePicker } from "@/components/ui/date-picker";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useRoles } from "@/hooks/useRoles";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MultiSelectToolbar } from "@/components/ui/multi-select-toolbar";


const EquipoTrabajo = () => {
  const { userRole } = useRoles();
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [cargosDisponibles, setCargosDisponibles] = useState<CargoProfesional[]>([]);

  useEffect(() => {
    const loadData = async () => {
      // Check if there's localStorage data to migrate (only once)
      const migrated = localStorage.getItem('equipo_migrated');
      if (!migrated) {
        await equipoStore.migrateFromLocalStorage();
        localStorage.setItem('equipo_migrated', 'true');
      }
      
      // Load profesionales from Supabase
      const profesionalesGuardados = await equipoStore.getProfesionales();
      
      // Load cargos from Supabase
      const cargosData = await cargosProfesionalesStore.getCargos();
      setCargosDisponibles(cargosData);
      
      // Solo agregar datos de ejemplo si NO hay profesionales Y no se han agregado antes
      const exampleDataAdded = localStorage.getItem('equipo_example_data_added');
      if (profesionalesGuardados.length === 0 && !exampleDataAdded) {
          const profesionalesEjemplo = [
            {
              nombre: "Ana",
              apellido: "García",
              cargo: "Psicólogo/a",
              especialidad: "Psicología Clínica",
              telefono: "11-5555-1001",
              email: "ana.garcia@centropuertaabierta.org",
              fechaIngreso: "2023-03-15",
              fechaNacimiento: "1985-07-15",
              estado: "activo" as const,
              experiencia: "5 años trabajando en centros de día con mujeres en situación de vulnerabilidad. Especialista en terapia individual y grupal.",
              certificaciones: ["Psicología Clínica", "Terapia Grupal", "Violencia de Género"],
              equipoAmpliado: false
            },
            {
              nombre: "Carlos",
              apellido: "Martínez",
              cargo: "Trabajador/a Social",
              especialidad: "Intervención Social",
              telefono: "11-5555-1002",
              email: "carlos.martinez@centropuertaabierta.org",
              fechaIngreso: "2023-01-10",
              fechaNacimiento: "1990-03-22",
              estado: "activo" as const,
              experiencia: "7 años en trabajo comunitario y acompañamiento social. Experto en gestión de recursos y articulación institucional.",
              certificaciones: ["Trabajo Social", "Mediación Familiar", "Derechos Humanos"],
              equipoAmpliado: true
            },
            {
              nombre: "María",
              apellido: "Rodríguez",
              cargo: "Terapeuta Ocupacional",
              especialidad: "Terapia Ocupacional",
              telefono: "11-5555-1003",
              email: "maria.rodriguez@centropuertaabierta.org",
              fechaIngreso: "2023-02-20",
              fechaNacimiento: "1988-11-08",
              estado: "activo" as const,
              experiencia: "4 años en rehabilitación y talleres terapéuticos. Especialista en actividades de la vida diaria.",
              certificaciones: ["Terapia Ocupacional", "Estimulación Cognitiva", "Talleres Creativos"],
              equipoAmpliado: false
            },
            {
              nombre: "Laura",
              apellido: "Fernández",
              cargo: "Educador/a Social",
              especialidad: "Educación Social",
              telefono: "11-5555-1004",
              email: "laura.fernandez@centropuertaabierta.org",
              fechaIngreso: "2023-04-10",
              fechaNacimiento: "1992-05-30",
              estado: "activo" as const,
              experiencia: "3 años en trabajo comunitario y educación popular. Coordinadora de talleres educativos.",
              certificaciones: ["Educación Social", "Talleres Grupales", "Alfabetización"],
              equipoAmpliado: true
            }
          ];

        // Agregar cada profesional de ejemplo
        for (const profesional of profesionalesEjemplo) {
          try {
            await equipoStore.agregarProfesional(profesional);
          } catch (error) {
            console.error("Error agregando profesional:", error);
          }
        }
        
        // Marcar que se agregaron los datos de ejemplo
        localStorage.setItem('equipo_example_data_added', 'true');
        
        // Recargar la lista actualizada
        const profesionalesActualizados = await equipoStore.getProfesionales();
        setProfesionales(profesionalesActualizados);
      } else {
        setProfesionales(profesionalesGuardados);
      }
    };
    loadData();
  }, []);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProfesional, setEditingProfesional] = useState<Profesional | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    cargo: "",
    especialidad: "",
    telefono: "",
    email: "",
    fechaNacimiento: "",
    experiencia: "",
    certificaciones: "",
    estado: "activo" as "activo" | "inactivo",
    equipoAmpliado: true
  });

  const filteredProfesionales = profesionales.filter(profesional => {
    // Si es trabajador, solo mostrar profesionales activos
    if (userRole === 'trabajador' && profesional.estado !== 'activo') {
      return false;
    }
    
    return (
      profesional.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profesional.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profesional.cargo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profesional.especialidad.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const resetForm = () => {
    setFormData({
      nombre: "",
      apellido: "",
      cargo: "",
      especialidad: "",
      telefono: "",
      email: "",
      fechaNacimiento: "",
      experiencia: "",
      certificaciones: "",
      estado: "activo",
      equipoAmpliado: true
    });
    setEditingProfesional(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const profesionalData = {
        nombre: formData.nombre,
        apellido: formData.apellido,
        cargo: formData.cargo,
        especialidad: formData.especialidad,
        telefono: formData.telefono,
        email: formData.email,
        fechaNacimiento: formData.fechaNacimiento,
        experiencia: formData.experiencia,
        certificaciones: formData.certificaciones.split(",").map(c => c.trim()).filter(c => c),
        estado: formData.estado,
        equipoAmpliado: formData.equipoAmpliado
      };

      console.log('Guardando profesional con equipoAmpliado:', profesionalData.equipoAmpliado);

      if (editingProfesional) {
        await equipoStore.actualizarProfesional(editingProfesional.id, profesionalData);
        toast.success("Profesional actualizado exitosamente");
      } else {
        await equipoStore.agregarProfesional({
          ...profesionalData,
          fechaIngreso: new Date().toISOString().split('T')[0]
        });
        toast.success("Profesional registrado exitosamente");
      }
      
      const updatedProfesionales = await equipoStore.getProfesionales();
      setProfesionales(updatedProfesionales);
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      toast.error("Error al guardar el profesional");
      console.error('Error guardando profesional:', error);
    }
  };

  const handleEdit = (profesional: Profesional) => {
    setEditingProfesional(profesional);
    setFormData({
      nombre: profesional.nombre,
      apellido: profesional.apellido,
      cargo: profesional.cargo,
      especialidad: profesional.especialidad,
      telefono: profesional.telefono,
      email: profesional.email,
      fechaNacimiento: profesional.fechaNacimiento || "",
      experiencia: profesional.experiencia,
      certificaciones: profesional.certificaciones.join(", "),
      estado: profesional.estado,
      equipoAmpliado: profesional.equipoAmpliado
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await equipoStore.eliminarProfesional(id);
      const updatedProfesionales = await equipoStore.getProfesionales();
      setProfesionales(updatedProfesionales);
      toast.success("Profesional eliminado exitosamente");
      setDeleteConfirm({ open: false, id: null });
    } catch (error) {
      toast.error("Error al eliminar el profesional");
      console.error(error);
    }
  };

  const getEstadoBadge = (estado: string) => {
    return estado === "activo" 
      ? <Badge className="bg-success text-success-foreground">Activo</Badge>
      : <Badge variant="secondary">Inactivo</Badge>;
  };

  const toggleEquipoAmpliado = async (profesional: Profesional) => {
    try {
      const nextEquipoAmpliado = !profesional.equipoAmpliado;
      await equipoStore.actualizarProfesional(profesional.id, {
        equipoAmpliado: nextEquipoAmpliado
      });
      const updatedProfesionales = await equipoStore.getProfesionales();
      setProfesionales(updatedProfesionales);

      const nextIsCoordinador = !nextEquipoAmpliado;
      toast.success(
        `${profesional.nombre} ${nextIsCoordinador ? 'marcado como' : 'movido a'} ${nextIsCoordinador ? 'Equipo Coordinador' : 'Equipo Ampliado'}`
      );
    } catch (error) {
      toast.error("Error al actualizar el tipo de equipo");
      console.error(error);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredProfesionales.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProfesionales.map(p => p.id));
    }
  };

  const toggleSelectItem = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    
    if (!confirm(`¿Eliminar ${selectedIds.length} profesional${selectedIds.length > 1 ? 'es' : ''}? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      for (const id of selectedIds) {
        await equipoStore.eliminarProfesional(id);
      }
      const updatedProfesionales = await equipoStore.getProfesionales();
      setProfesionales(updatedProfesionales);
      setSelectedIds([]);
      toast.success(`${selectedIds.length} profesional${selectedIds.length > 1 ? 'es eliminados' : ' eliminado'}`);
    } catch (error) {
      console.error('Error eliminando profesionales:', error);
      toast.error("Error al eliminar los registros");
    }
  };

  const handleBulkToggleActive = async (nuevoEstado: 'activo' | 'inactivo') => {
    if (selectedIds.length === 0) return;

    try {
      for (const id of selectedIds) {
        await equipoStore.actualizarProfesional(id, { estado: nuevoEstado });
      }
      const updatedProfesionales = await equipoStore.getProfesionales();
      setProfesionales(updatedProfesionales);
      setSelectedIds([]);
      toast.success(`${selectedIds.length} profesional${selectedIds.length > 1 ? 'es' : ''} marcado${selectedIds.length > 1 ? 's' : ''} como ${nuevoEstado}${selectedIds.length > 1 ? 's' : ''}`);
    } catch (error) {
      console.error('Error actualizando estado:', error);
      toast.error("Error al actualizar el estado");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 w-full overflow-x-hidden">
      {/* Header */}
      <header className="bg-card shadow-sm border-b sticky top-0 z-10">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-col sm:flex-row w-full sm:w-auto">
              <Link to="/">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Equipo de Trabajo</h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">Gestiona los profesionales del centro de día</p>
              </div>
            </div>
            {userRole !== 'trabajador' && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => resetForm()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Profesional
                  </Button>
                </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingProfesional ? "Editar Profesional" : "Registrar Nuevo Profesional"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Información Personal */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground border-b pb-2">Información Personal</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="nombre">Nombre *</Label>
                        <Input
                          id="nombre"
                          value={formData.nombre}
                          onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="apellido">Apellido *</Label>
                        <Input
                          id="apellido"
                          value={formData.apellido}
                          onChange={(e) => setFormData({...formData, apellido: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label className="text-base font-semibold text-accent flex items-center gap-2">
                          🎂 Cumpleaños
                        </Label>
                        <DatePicker
                          date={formData.fechaNacimiento ? (() => {
                            const [y, m, d] = formData.fechaNacimiento.split('-');
                            return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
                          })() : undefined}
                          onSelect={(date) => {
                            if (date) {
                              const año = date.getFullYear().toString();
                              const mes = (date.getMonth() + 1).toString().padStart(2, '0');
                              const dia = date.getDate().toString().padStart(2, '0');
                              setFormData({...formData, fechaNacimiento: `${año}-${mes}-${dia}`});
                            }
                          }}
                          placeholder="Seleccionar fecha de nacimiento"
                          fromYear={1940}
                          toYear={new Date().getFullYear()}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1940-01-01")
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Información Profesional */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground border-b pb-2">Información Profesional</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="cargo">Cargo *</Label>
                        <Select value={formData.cargo} onValueChange={(value) => setFormData({...formData, cargo: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar cargo" />
                          </SelectTrigger>
                          <SelectContent>
                            {cargosDisponibles.map((cargo) => (
                              <SelectItem key={cargo.id} value={cargo.nombre}>
                                {cargo.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="especialidad">Especialidad</Label>
                        <Input
                          id="especialidad"
                          value={formData.especialidad}
                          onChange={(e) => setFormData({...formData, especialidad: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="estado">Estado</Label>
                        <Select value={formData.estado} onValueChange={(value: "activo" | "inactivo") => setFormData({...formData, estado: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="activo">Activo</SelectItem>
                            <SelectItem value="inactivo">Inactivo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="tipoEquipo">Tipo de Equipo</Label>
                        <Select 
                          value={formData.equipoAmpliado ? "ampliado" : "coordinador"} 
                          onValueChange={(value) => setFormData({...formData, equipoAmpliado: value === "ampliado"})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="coordinador">Equipo Coordinador</SelectItem>
                            <SelectItem value="ampliado">Equipo Ampliado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Información de Contacto */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground border-b pb-2">Información de Contacto</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="telefono">Teléfono *</Label>
                        <Input
                          id="telefono"
                          value={formData.telefono}
                          onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Experiencia y certificaciones */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground border-b pb-2">Experiencia y Certificaciones</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="experiencia">Experiencia</Label>
                        <Textarea
                          id="experiencia"
                          value={formData.experiencia}
                          onChange={(e) => setFormData({...formData, experiencia: e.target.value})}
                          placeholder="Describe la experiencia profesional..."
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label htmlFor="certificaciones">Certificaciones</Label>
                        <Textarea
                          id="certificaciones"
                          value={formData.certificaciones}
                          onChange={(e) => setFormData({...formData, certificaciones: e.target.value})}
                          placeholder="Separar por comas (ej: Psicología Clínica, Terapia Grupal)"
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">
                      {editingProfesional ? "Actualizar" : "Registrar"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-8 max-w-7xl mx-auto">
        {/* Multi-Select Toolbar */}
        {selectedIds.length > 0 && userRole !== 'trabajador' && (
          <MultiSelectToolbar
            selectedCount={selectedIds.length}
            onClearSelection={() => setSelectedIds([])}
            onDelete={handleBulkDelete}
            showArchive={false}
            customActions={[
              {
                label: "Marcar como Activos",
                icon: UserPlus,
                onClick: () => handleBulkToggleActive('activo'),
                variant: "default"
              },
              {
                label: "Marcar como Inactivos",
                icon: UserX,
                onClick: () => handleBulkToggleActive('inactivo'),
                variant: "secondary"
              }
            ]}
          />
        )}

        {/* Search and Stats */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-4">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full sm:w-80"
            />
          </div>
          <div className="flex gap-2 sm:gap-4 w-full sm:w-auto">
            <Card className="p-3 sm:p-4 flex-1 sm:flex-none">
              <p className="text-xs sm:text-sm text-muted-foreground">Total Profesionales</p>
              <p className="text-xl sm:text-2xl font-bold text-primary">{profesionales.length}</p>
            </Card>
            <Card className="p-3 sm:p-4 flex-1 sm:flex-none">
              <p className="text-xs sm:text-sm text-muted-foreground">Activos</p>
              <p className="text-xl sm:text-2xl font-bold text-success">{profesionales.filter(p => p.estado === "activo").length}</p>
            </Card>
          </div>
        </div>

        {/* Table */}
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <UserCheck className="h-4 w-4 sm:h-5 sm:w-5" />
              Equipo de Profesionales
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 sm:px-4 md:px-6">
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {userRole !== 'trabajador' && (
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedIds.length === filteredProfesionales.length && filteredProfesionales.length > 0}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Seleccionar todos"
                      />
                    </TableHead>
                  )}
                  <TableHead>Profesional</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Equipo Coordinador</TableHead>
                  <TableHead>Estado</TableHead>
                  {userRole !== 'trabajador' && <TableHead>Acciones</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProfesionales.map((profesional) => (
                  <TableRow key={profesional.id}>
                    {userRole !== 'trabajador' && (
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(profesional.id)}
                          onCheckedChange={() => toggleSelectItem(profesional.id)}
                          aria-label={`Seleccionar ${profesional.nombre} ${profesional.apellido}`}
                        />
                      </TableCell>
                    )}
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-semibold">{profesional.nombre} {profesional.apellido}</div>
                        <div className="text-sm text-muted-foreground">{profesional.especialidad}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{profesional.cargo}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{profesional.telefono}</div>
                        <div className="text-muted-foreground">{profesional.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const isCoordinador = !profesional.equipoAmpliado;
                        const badgeVariant = isCoordinador ? "default" : "secondary";
                        const badgeText = isCoordinador ? "SÍ" : "NO";

                        if (userRole !== 'trabajador') {
                          return (
                            <button 
                              onClick={() => toggleEquipoAmpliado(profesional)}
                              className="cursor-pointer"
                              type="button"
                            >
                              <Badge variant={badgeVariant}>{badgeText}</Badge>
                            </button>
                          );
                        }

                        return <Badge variant={badgeVariant}>{badgeText}</Badge>;
                      })()}
                    </TableCell>
                    <TableCell>{getEstadoBadge(profesional.estado)}</TableCell>
                    {userRole !== 'trabajador' && (
                      <TableCell>
                        <TooltipProvider>
                          <div className="flex gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(profesional)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Editar</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDeleteConfirm({ open: true, id: profesional.id })}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Eliminar</TooltipContent>
                            </Tooltip>
                          </div>
                        </TooltipProvider>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
            {filteredProfesionales.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? "No se encontraron resultados" : "No hay profesionales registrados"}
              </div>
            )}
          </CardContent>
        </Card>

      </main>

      {/* Diálogo de confirmación */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ open, id: null })}
        onConfirm={() => deleteConfirm.id && handleDelete(deleteConfirm.id)}
        title="¿Eliminar profesional?"
        description="Esta acción no se puede deshacer. El profesional será eliminado permanentemente."
      />
    </div>
  );
};

export default EquipoTrabajo;