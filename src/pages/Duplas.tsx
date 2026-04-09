import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import { Plus, Edit, Trash2, ArrowLeft, Search, Users, Calendar, Shield, Archive, ArchiveRestore, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useRoles } from "@/hooks/useRoles";
import { equipoStore } from "@/lib/equipoStore";
import { mujeresStore } from "@/lib/mujeresStore";
import { duplasStore, type DuplaConNombres } from "@/lib/duplasStore";

interface Profesional {
  id: string;
  nombre: string;
  apellido: string;
  cargo?: string;
  profesion?: string;
  activo?: boolean;
  estado?: "activo" | "inactivo";
}

interface Mujer {
  id: string;
  nombre: string;
  apellido: string;
  apodo?: string;
  nacionalidad?: string;
}

const Duplas = () => {
  const { canAccessSection } = useRoles();
  
  const [duplas, setDuplas] = useState<DuplaConNombres[]>([]);
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [mujeres, setMujeres] = useState<Mujer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDupla, setEditingDupla] = useState<DuplaConNombres | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [añoSeleccionado, setAñoSeleccionado] = useState(new Date().getFullYear());
  const [mostrarArchivadas, setMostrarArchivadas] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [duplaToDelete, setDuplaToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    profesional1Id: "",
    profesional2Id: "",
    mujerId: "",
    observaciones: "",
    activa: true
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Cargando datos desde Supabase...');
      
      // Migrar datos de localStorage si existen
      await duplasStore.migrateFromLocalStorage();
      
      // Cargar profesionales y mujeres
      const profesionalesData = await equipoStore.getProfesionales();
      const mujeresData = await mujeresStore.getMujeres();
      const duplasData = await duplasStore.getDuplas(mostrarArchivadas);
      
      console.log('👥 Profesionales cargados:', profesionalesData.length);
      console.log('🚺 Mujeres cargadas:', mujeresData.length);
      console.log('👫 Duplas cargadas:', duplasData.length);
      
      setProfesionales(profesionalesData.filter(p => p.activo || p.estado === 'activo'));
      setMujeres(mujeresData);
      setDuplas(duplasData);
    } catch (error) {
      console.error('❌ Error cargando datos:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [mostrarArchivadas]);

  const filteredDuplas = duplas.filter(dupla => {
    const cumpleAño = new Date(dupla.fechaFormacion).getFullYear() === añoSeleccionado;
    const cumpleBusqueda = dupla.profesional1Nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dupla.profesional2Nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (dupla.mujerNombre && dupla.mujerNombre.toLowerCase().includes(searchTerm.toLowerCase()));
    return cumpleAño && cumpleBusqueda;
  });

  const archivarDupla = async (id: string, archivado: boolean) => {
    const success = await duplasStore.archivarDupla(id, archivado);
    if (success) {
      await cargarDatos();
      toast.success(archivado ? "Dupla archivada" : "Dupla restaurada");
    } else {
      toast.error("Error al archivar la dupla");
    }
  };

  const resetForm = () => {
    setFormData({
      profesional1Id: "",
      profesional2Id: "",
      mujerId: "",
      observaciones: "",
      activa: true
    });
    setEditingDupla(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.profesional1Id || !formData.profesional2Id) {
      toast.error('Debe seleccionar ambos profesionales');
      return;
    }

    if (formData.profesional1Id === formData.profesional2Id) {
      toast.error('Los profesionales deben ser diferentes');
      return;
    }
    
    try {
      if (editingDupla) {
        // Editar dupla existente
        const success = await duplasStore.actualizarDupla(editingDupla.id, {
          profesional1Id: formData.profesional1Id,
          profesional2Id: formData.profesional2Id,
          mujerId: formData.mujerId && formData.mujerId !== "sin-asignar" ? formData.mujerId : null,
          observaciones: formData.observaciones,
          activa: formData.activa
        });
        
        if (success) {
          toast.success("Dupla actualizada exitosamente");
          await cargarDatos(); // Recargar datos
        } else {
          toast.error("Error al actualizar la dupla");
        }
      } else {
        // Crear nueva dupla
        const newDupla = await duplasStore.agregarDupla({
          profesional1Id: formData.profesional1Id,
          profesional2Id: formData.profesional2Id,
          mujerId: formData.mujerId && formData.mujerId !== "sin-asignar" ? formData.mujerId : null,
          fechaFormacion: new Date().toISOString().split('T')[0],
          observaciones: formData.observaciones,
          activa: formData.activa
        });
        
        if (newDupla) {
          toast.success("Dupla creada exitosamente");
          await cargarDatos(); // Recargar datos
        } else {
          toast.error("Error al crear la dupla");
        }
      }
      
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error en handleSubmit:', error);
      toast.error('Error al procesar la dupla');
    }
  };

  const handleEdit = (dupla: DuplaConNombres) => {
    setEditingDupla(dupla);
    setFormData({
      profesional1Id: dupla.profesional1Id,
      profesional2Id: dupla.profesional2Id,
      mujerId: dupla.mujerId || "sin-asignar",
      observaciones: dupla.observaciones,
      activa: dupla.activa
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!duplaToDelete) return;
    
    try {
      const success = await duplasStore.eliminarDupla(duplaToDelete);
      if (success) {
        toast.success("Dupla eliminada exitosamente");
        await cargarDatos();
      } else {
        toast.error("Error al eliminar la dupla");
      }
    } catch (error) {
      console.error('Error al eliminar dupla:', error);
      toast.error('Error al eliminar la dupla');
    }
    setDeleteConfirmOpen(false);
    setDuplaToDelete(null);
  };

  const confirmDelete = (id: string) => {
    setDuplaToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const getEstadoBadge = (activa: boolean) => {
    return activa 
      ? <Badge className="bg-success text-success-foreground">Activa</Badge>
      : <Badge variant="destructive">Inactiva</Badge>;
  };

  if (!canAccessSection('duplas')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <CardTitle>Acceso Denegado</CardTitle>
            <CardDescription>
              No tienes permisos para acceder a esta sección.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      {/* Header */}
      <header className="bg-card shadow-lg border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Gestión de Duplas</h1>
                <p className="text-muted-foreground">Administra las duplas de acompañamiento profesional</p>
              </div>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => resetForm()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Dupla
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingDupla ? "Editar Dupla" : "Crear Nueva Dupla"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="profesional1Id">Profesional 1 *</Label>
                      <Select value={formData.profesional1Id} onValueChange={(value) => setFormData({...formData, profesional1Id: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar primer profesional" />
                        </SelectTrigger>
                        <SelectContent>
                          {profesionales.map((profesional) => (
                            <SelectItem key={profesional.id} value={profesional.id}>
                              {profesional.nombre} {profesional.apellido} - {profesional.cargo || profesional.profesion}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="profesional2Id">Profesional 2 *</Label>
                      <Select value={formData.profesional2Id} onValueChange={(value) => setFormData({...formData, profesional2Id: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar segundo profesional" />
                        </SelectTrigger>
                        <SelectContent>
                          {profesionales.filter(p => p.id !== formData.profesional1Id).map((profesional) => (
                            <SelectItem key={profesional.id} value={profesional.id}>
                              {profesional.nombre} {profesional.apellido} - {profesional.cargo || profesional.profesion}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="mujerId">Mujer Acompañada</Label>
                      <Select value={formData.mujerId} onValueChange={(value) => setFormData({...formData, mujerId: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar mujer" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sin-asignar">Sin asignar</SelectItem>
                          {mujeres.length === 0 ? (
                            <SelectItem value="no-disponibles" disabled>No hay mujeres disponibles</SelectItem>
                          ) : (
                            mujeres.map((mujer) => (
                              <SelectItem key={mujer.id} value={mujer.id}>
                                {mujer.nombre || mujer.apodo} {mujer.apellido} {mujer.nacionalidad ? `- ${mujer.nacionalidad}` : ''}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="activa">Estado</Label>
                      <Select value={formData.activa ? "activa" : "inactiva"} onValueChange={(value) => setFormData({...formData, activa: value === "activa"})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="activa">Activa</SelectItem>
                          <SelectItem value="inactiva">Inactiva</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="observaciones">Observaciones</Label>
                    <Textarea
                      id="observaciones"
                      value={formData.observaciones}
                      onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                      placeholder="Notas adicionales sobre el progreso o situaciones especiales..."
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">
                      {editingDupla ? "Actualizar" : "Crear"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Búsqueda
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Buscar por profesionales o mujer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Año
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                type="number"
                value={añoSeleccionado}
                onChange={(e) => setAñoSeleccionado(Number(e.target.value))}
                min="2020"
                max="2030"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Archive className="h-5 w-5" />
                Archivo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant={mostrarArchivadas ? "default" : "outline"}
                onClick={() => setMostrarArchivadas(!mostrarArchivadas)}
                className="w-full"
              >
                {mostrarArchivadas ? "Ocultar archivadas" : "Mostrar archivadas"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total Duplas</p>
              <p className="text-3xl font-bold text-primary">{filteredDuplas.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Duplas Activas</p>
              <p className="text-3xl font-bold text-success">{filteredDuplas.filter(d => d.activa).length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Duplas de Acompañamiento
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">Buscando registros...</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha Formación</TableHead>
                      <TableHead>Profesionales</TableHead>
                      <TableHead>Mujer Acompañada</TableHead>
                      <TableHead>Observaciones</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDuplas.map((dupla) => (
                    <TableRow key={dupla.id}>
                        <TableCell className="font-medium">
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(dupla.fechaFormacion).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            <div className="text-sm">
                              <div className="text-muted-foreground">{dupla.profesional1Nombre}</div>
                            </div>
                            <div className="text-sm">
                              <div className="text-muted-foreground">{dupla.profesional2Nombre}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="text-muted-foreground">{dupla.mujerNombre || 'Sin asignar'}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm max-w-48">
                            {dupla.observaciones || "Sin observaciones"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <TooltipProvider>
                            <div className="flex gap-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEdit(dupla)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Editar</TooltipContent>
                              </Tooltip>
                              
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => archivarDupla(dupla.id, !(dupla as any).archivado)}
                                  >
                                    {(dupla as any).archivado ? (
                                      <ArchiveRestore className="h-4 w-4" />
                                    ) : (
                                      <Archive className="h-4 w-4" />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {(dupla as any).archivado ? "Restaurar" : "Archivar"}
                                </TooltipContent>
                              </Tooltip>
                              
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => confirmDelete(dupla.id)}
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
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredDuplas.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchTerm ? "No se encontraron resultados" : "No hay duplas creadas"}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </main>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={handleDelete}
        title="¿Eliminar dupla?"
        description="Esta acción no se puede deshacer. La dupla será eliminada permanentemente."
      />
    </div>
  );
};

export default Duplas;