import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Plus, LayoutGrid, Calendar, User, Trash2, GripVertical, Edit, AlertTriangle } from "lucide-react";
import { format, parseISO, isPast, isToday } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { DatePicker } from "@/components/ui/date-picker";
import { useAuth } from "@/hooks/useAuth";
import { actividadesStore, type Actividad, type EstadoActividad, COLUMNAS_KANBAN, PRIORIDADES } from "@/lib/actividadesStore";
import { equipoStore, type Profesional } from "@/lib/equipoStore";

const Actividades = () => {
  const { user } = useAuth();
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editando, setEditando] = useState<Actividad | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [actividadAEliminar, setActividadAEliminar] = useState<Actividad | null>(null);
  const [draggedItem, setDraggedItem] = useState<Actividad | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    estado: 'planificado' as EstadoActividad,
    prioridad: '' as string,
    fecha_limite: '',
    responsable_id: ''
  });

  const RESPONSABLE_NONE_VALUE = "__none__";

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [actividadesData, equipoData] = await Promise.all([
        actividadesStore.getActividades(),
        equipoStore.getProfesionales()
      ]);
      setActividades(actividadesData);
      setProfesionales(equipoData.filter(p => p.activo));
    } catch (error) {
      console.error('Error cargando datos:', error);
      toast.error('Error al cargar las actividades');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      titulo: '',
      descripcion: '',
      estado: 'planificado',
      prioridad: '',
      fecha_limite: '',
      responsable_id: ''
    });
    setEditando(null);
  };

  const openEditDialog = (actividad: Actividad) => {
    setEditando(actividad);
    setFormData({
      titulo: actividad.titulo,
      descripcion: actividad.descripcion || '',
      estado: actividad.estado,
      prioridad: actividad.prioridad || '',
      fecha_limite: actividad.fecha_limite || '',
      responsable_id: actividad.responsable_id || ''
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.titulo.trim()) {
      toast.error('El título es obligatorio');
      return;
    }

    if (!user) {
      toast.error('Debes iniciar sesión');
      return;
    }

    try {
      if (editando) {
        const updated = await actividadesStore.updateActividad(editando.id, {
          titulo: formData.titulo,
          descripcion: formData.descripcion || null,
          estado: formData.estado,
          prioridad: (formData.prioridad || null) as any,
          fecha_limite: formData.fecha_limite || null,
          responsable_id: formData.responsable_id || null
        });
        
        if (updated) {
          setActividades(prev => prev.map(a => a.id === editando.id ? updated : a));
          toast.success('Actividad actualizada');
        }
      } else {
        const actividadesEnColumna = actividades.filter(a => a.estado === formData.estado);
        const maxOrden = actividadesEnColumna.length > 0 
          ? Math.max(...actividadesEnColumna.map(a => a.orden)) 
          : -1;

        const { data: nueva, error } = await actividadesStore.createActividad({
          titulo: formData.titulo,
          descripcion: formData.descripcion || null,
          estado: formData.estado,
          prioridad: (formData.prioridad || null) as any,
          fecha_limite: formData.fecha_limite || null,
          responsable_id: formData.responsable_id || null,
          creado_por: user.id,
          orden: maxOrden + 1
        });
        
        if (error) {
          toast.error(error);
          return;
        }
        
        if (nueva) {
          setActividades(prev => [...prev, nueva]);
          toast.success('Actividad creada');
        }
      }
      
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error guardando actividad:', error);
      toast.error('Error al guardar la actividad');
    }
  };

  const handleDelete = async () => {
    if (!actividadAEliminar) return;
    
    const success = await actividadesStore.deleteActividad(actividadAEliminar.id);
    if (success) {
      setActividades(prev => prev.filter(a => a.id !== actividadAEliminar.id));
      toast.success('Actividad eliminada');
    } else {
      toast.error('Error al eliminar la actividad');
    }
    setDeleteConfirmOpen(false);
    setActividadAEliminar(null);
  };

  const handleDragStart = (e: React.DragEvent, actividad: Actividad) => {
    setDraggedItem(actividad);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, nuevoEstado: EstadoActividad) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem.estado === nuevoEstado) {
      setDraggedItem(null);
      return;
    }

    // Check permissions
    if (draggedItem.creado_por !== user?.id) {
      toast.error('Solo puedes mover tus propias actividades');
      setDraggedItem(null);
      return;
    }

    const actividadesEnNuevaColumna = actividades.filter(a => a.estado === nuevoEstado);
    const maxOrden = actividadesEnNuevaColumna.length > 0 
      ? Math.max(...actividadesEnNuevaColumna.map(a => a.orden)) 
      : -1;

    const updated = await actividadesStore.updateActividad(draggedItem.id, {
      estado: nuevoEstado,
      orden: maxOrden + 1
    });

    if (updated) {
      setActividades(prev => prev.map(a => a.id === draggedItem.id ? updated : a));
      toast.success(`Movido a ${COLUMNAS_KANBAN.find(c => c.estado === nuevoEstado)?.titulo}`);
    }
    
    setDraggedItem(null);
  };

  const getActividadesPorEstado = (estado: EstadoActividad) => {
    return actividades
      .filter(a => a.estado === estado)
      .sort((a, b) => a.orden - b.orden);
  };

  const getResponsableNombre = (responsableId: string | null) => {
    if (!responsableId) return null;
    const profesional = profesionales.find(p => p.id === responsableId);
    return profesional ? `${profesional.nombre} ${profesional.apellido}` : null;
  };

  const canEdit = (actividad: Actividad) => {
    return actividad.creado_por === user?.id;
  };

  const getPrioridadBorderClass = (prioridad: string | null) => {
    const p = PRIORIDADES.find(pr => pr.value === prioridad);
    return p ? `border-2 ${p.borderColor}` : 'border';
  };

  const isOverdue = (actividad: Actividad) => {
    if (!actividad.fecha_limite || actividad.estado === 'completado') return false;
    const fechaLimite = parseISO(actividad.fecha_limite);
    return isPast(fechaLimite) && !isToday(fechaLimite);
  };

  const PRIORIDAD_NONE_VALUE = "__none__";

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-4 sm:p-6">
        <div className="max-w-full mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-pulse flex flex-col items-center gap-4">
              <LayoutGrid className="h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">Cargando tablero...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-4 sm:p-6">
      <div className="max-w-full mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
              <LayoutGrid className="h-7 w-7 text-primary" />
              Organización de Actividades
            </h1>
            <p className="text-muted-foreground mt-1">
              Tablero para gestionar y organizar actividades del equipo
            </p>
          </div>
          
          {user && (
            <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Actividad
            </Button>
          )}
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COLUMNAS_KANBAN.map((columna) => (
            <div
              key={columna.estado}
              className="min-w-0"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, columna.estado)}
            >
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${columna.color}`} />
                    {columna.titulo}
                    <span className="ml-auto text-sm font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      {getActividadesPorEstado(columna.estado).length}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 min-h-[200px]">
                  {getActividadesPorEstado(columna.estado).map((actividad) => {
                    const overdue = isOverdue(actividad);
                    return (
                      <div
                        key={actividad.id}
                        draggable={canEdit(actividad)}
                        onDragStart={(e) => handleDragStart(e, actividad)}
                        className={`p-3 ${overdue ? 'bg-destructive/10' : 'bg-card'} ${getPrioridadBorderClass(actividad.prioridad)} rounded-lg shadow-sm transition-all hover:shadow-md ${
                          canEdit(actividad) ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
                        } ${draggedItem?.id === actividad.id ? 'opacity-50' : ''}`}
                      >
                        <div className="flex items-start gap-2">
                          {canEdit(actividad) && (
                            <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              {overdue && (
                                <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
                              )}
                              <h4 className={`font-medium text-sm line-clamp-2 ${overdue ? 'text-destructive' : 'text-foreground'}`}>
                                {actividad.titulo}
                              </h4>
                            </div>
                            {actividad.descripcion && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {actividad.descripcion}
                            </p>
                          )}
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              {actividad.fecha_limite && (
                                <div className={`flex items-center gap-1 text-xs ${overdue ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                                  <Calendar className="h-3 w-3" />
                                  {format(parseISO(actividad.fecha_limite), "d MMM", { locale: es })}
                                </div>
                              )}
                              {getResponsableNombre(actividad.responsable_id) && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <User className="h-3 w-3" />
                                  <span className="truncate max-w-[80px]">
                                    {getResponsableNombre(actividad.responsable_id)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          {canEdit(actividad) && (
                            <div className="flex flex-col gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => openEditDialog(actividad)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-destructive hover:text-destructive"
                                onClick={() => {
                                  setActividadAEliminar(actividad);
                                  setDeleteConfirmOpen(true);
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  
                  {getActividadesPorEstado(columna.estado).length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      Sin actividades
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editando ? 'Editar Actividad' : 'Nueva Actividad'}</DialogTitle>
              <DialogDescription>
                {editando ? 'Modifica los detalles de la actividad' : 'Crea una nueva actividad para el tablero'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="titulo">Título *</Label>
                <Input
                  id="titulo"
                  value={formData.titulo}
                  onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                  placeholder="Ej: Preparar taller de costura"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                  placeholder="Detalles de la actividad..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Select
                    value={formData.estado}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, estado: value as EstadoActividad }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COLUMNAS_KANBAN.map((col) => (
                        <SelectItem key={col.estado} value={col.estado}>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${col.color}`} />
                            {col.titulo}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Fecha límite</Label>
                  <DatePicker
                    date={formData.fecha_limite ? parseISO(formData.fecha_limite) : undefined}
                    onSelect={(date) => setFormData(prev => ({ 
                      ...prev, 
                      fecha_limite: date ? format(date, 'yyyy-MM-dd') : '' 
                    }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Prioridad</Label>
                <Select
                  value={formData.prioridad || PRIORIDAD_NONE_VALUE}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      prioridad: value === PRIORIDAD_NONE_VALUE ? '' : value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar prioridad..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={PRIORIDAD_NONE_VALUE}>Sin prioridad</SelectItem>
                    {PRIORIDADES.map((p) => (
                      <SelectItem key={p.value} value={p.value!}>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${p.bgColor}`} />
                          {p.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Responsable</Label>
                <Select
                  value={formData.responsable_id || RESPONSABLE_NONE_VALUE}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      responsable_id: value === RESPONSABLE_NONE_VALUE ? '' : value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar responsable..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={RESPONSABLE_NONE_VALUE}>Sin asignar</SelectItem>
                    {profesionales.map((prof) => (
                      <SelectItem key={prof.id} value={prof.id}>
                        {prof.nombre} {prof.apellido}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit}>
                {editando ? 'Guardar Cambios' : 'Crear Actividad'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <ConfirmDialog
          open={deleteConfirmOpen}
          onOpenChange={setDeleteConfirmOpen}
          title="Eliminar actividad"
          description={`¿Estás seguro de eliminar "${actividadAEliminar?.titulo}"? Esta acción no se puede deshacer.`}
          confirmText="Eliminar"
          cancelText="Cancelar"
          onConfirm={handleDelete}
        />
      </div>
    </div>
  );
};

export default Actividades;
