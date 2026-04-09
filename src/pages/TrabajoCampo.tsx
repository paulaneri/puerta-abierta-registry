import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ArrowLeft, Plus, Edit, Trash2, MapPin, Calendar, Users, MessageSquare, Archive, ArchiveRestore, Search } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { MultiSelectToolbar } from "@/components/ui/multi-select-toolbar";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { mujeresStore } from "@/lib/mujeresStore";
import { trabajoCampoStore, type TrabajoCampo as TrabajoCampoType } from "@/lib/trabajoCampoStore";
import { format } from "date-fns";
import LugarPredictiveInput from "@/components/LugarPredictiveInput";
import { formatDate } from "@/lib/utils";

interface EncuentroMujer {
  id: number;
  nombre: string;
  apellido: string;
  conversacion: string;
  esRegistrada: boolean;
}

interface TrabajoCampo {
  id: string;
  fecha: string;
  lugar: string;
  descripcion: string;
  actividad: string;
  profesionales: string[];
  encuentros: EncuentroMujer[];
  resultados?: string;
  createdAt?: string;
  updatedAt?: string;
}

const profesionalesDisponibles = [
  "Ana García - Psicóloga",
  "Carlos Rodríguez - Trabajador Social", 
  "María López - Enfermera",
  "Juan Pérez - Terapeuta Ocupacional"
];

const TrabajoCampo = () => {
  const navigate = useNavigate();
  const [trabajosCampo, setTrabajosCampo] = useState<TrabajoCampo[]>([]);
  const [mujeresRegistradas, setMujeresRegistradas] = useState<{id: string, nombre: string, apellido: string}[]>([]);
  const [añoSeleccionado, setAñoSeleccionado] = useState(new Date().getFullYear());
  const [mostrarArchivados, setMostrarArchivados] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [trabajoToDelete, setTrabajoToDelete] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    // Cargar trabajos de campo y mujeres registradas al montar el componente
    const cargarDatos = async () => {
      // Cargar trabajos de campo
      const trabajosGuardados = await trabajoCampoStore.getTrabajosCampo(mostrarArchivados);
      console.log('📋 Trabajos de campo cargados:', trabajosGuardados);
      setTrabajosCampo(trabajosGuardados);

      // Cargar mujeres registradas desde Supabase
      try {
        const mujeres = await mujeresStore.getMujeres();
        const mujeresFormateadas = mujeres.map(m => ({ 
          id: m.id, 
          nombre: m.nombre, 
          apellido: m.apellido 
        }));
        setMujeresRegistradas(mujeresFormateadas);
      } catch (error) {
        console.error('Error cargando mujeres:', error);
        setMujeresRegistradas([]);
      }
    };

    cargarDatos();
  }, [mostrarArchivados]);

  const [searchTerm, setSearchTerm] = useState("");

  const { toast } = useToast();

  const trabajosFiltradosPorAño = trabajosCampo.filter((trabajo) => {
    const fechaTrabajo = new Date(trabajo.fecha);
    return fechaTrabajo.getFullYear() === añoSeleccionado;
  });

  const filteredTrabajos = trabajosFiltradosPorAño.filter((trabajo) =>
    trabajo.lugar.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trabajo.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trabajo.profesionales.some(prof => prof.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const archivarTrabajo = async (id: string, archivado: boolean) => {
    const success = await trabajoCampoStore.archivarTrabajo(id, archivado);
    if (success) {
      const trabajosActualizados = await trabajoCampoStore.getTrabajosCampo(mostrarArchivados);
      setTrabajosCampo(trabajosActualizados);
      toast({
        title: "Éxito",
        description: archivado ? "Trabajo de campo archivado" : "Trabajo de campo restaurado",
      });
    }
  };


  const handleEdit = (trabajo: TrabajoCampo) => {
    navigate(`/trabajo-campo/editar/${trabajo.id}`);
  };

  const handleDelete = async () => {
    if (!trabajoToDelete) return;
    
    const success = await trabajoCampoStore.eliminarTrabajo(trabajoToDelete);
    if (success) {
      const trabajosActualizados = await trabajoCampoStore.getTrabajosCampo();
      setTrabajosCampo(trabajosActualizados);
      toast({
        title: "Éxito",
        description: "Trabajo de campo eliminado correctamente",
      });
    }
    setDeleteConfirmOpen(false);
    setTrabajoToDelete(null);
  };

  const confirmDelete = (id: string) => {
    setTrabajoToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredTrabajos.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredTrabajos.map(t => t.id));
    }
  };

  const toggleSelectItem = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkArchive = async () => {
    for (const id of selectedIds) {
      await trabajoCampoStore.archivarTrabajo(id, true);
    }
    const trabajosActualizados = await trabajoCampoStore.getTrabajosCampo(mostrarArchivados);
    setTrabajosCampo(trabajosActualizados);
    setSelectedIds([]);
    toast({
      title: "Éxito",
      description: `${selectedIds.length} trabajo(s) archivado(s)`,
    });
  };

  const handleBulkDelete = async () => {
    for (const id of selectedIds) {
      await trabajoCampoStore.eliminarTrabajo(id);
    }
    const trabajosActualizados = await trabajoCampoStore.getTrabajosCampo();
    setTrabajosCampo(trabajosActualizados);
    setSelectedIds([]);
    toast({
      title: "Éxito",
      description: `${selectedIds.length} trabajo(s) eliminado(s)`,
    });
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 w-full overflow-x-hidden">
      {/* Header */}
      <header className="bg-card shadow-lg border-b">
        <div className="w-full px-2 sm:px-4 md:px-6 lg:px-8 py-4 md:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-2 sm:gap-4 flex-col sm:flex-row">
              <Link to="/">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Volver
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Trabajo de Campo
                </h1>
                <p className="text-sm text-muted-foreground mt-1">Registro de actividades territoriales</p>
              </div>
            </div>
            <Button onClick={() => navigate('/trabajo-campo/nuevo')} className="gap-2">
              <Plus className="h-4 w-4" />
              Registrar Trabajo de Campo
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full px-2 sm:px-4 md:px-6 lg:px-8 py-4 md:py-8 max-w-7xl mx-auto">
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
                placeholder="Buscar..."
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
                variant={mostrarArchivados ? "default" : "outline"}
                onClick={() => setMostrarArchivados(!mostrarArchivados)}
                className="w-full"
              >
                {mostrarArchivados ? "Ocultar archivados" : "Mostrar archivados"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Stats */}
        <div className="mb-6 space-y-4">
          
          <Card>
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />
                Resumen de Trabajo de Campo
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-primary">{trabajosCampo.length}</p>
                  <p className="text-muted-foreground">Trabajos registrados</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-secondary">
                    {trabajosCampo.reduce((acc, t) => acc + t.encuentros.length, 0)}
                  </p>
                  <p className="text-muted-foreground">Encuentros con mujeres</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-accent">
                    {trabajosCampo.reduce((acc, t) => acc + t.encuentros.filter(e => !e.esRegistrada).length, 0)}
                  </p>
                  <p className="text-muted-foreground">Mujeres nuevas contactadas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        {filteredTrabajos.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                {searchTerm ? "No se encontraron resultados" : "No hay trabajos de campo registrados"}
              </h3>
              <p className="text-muted-foreground">
                {searchTerm ? "Intenta con otros términos de búsqueda" : "Comienza registrando tu primer trabajo de campo"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Listado de Trabajos de Campo</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedIds.length === filteredTrabajos.length && filteredTrabajos.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Día</TableHead>
                    <TableHead>Personas del Equipo</TableHead>
                    <TableHead>Lugar</TableHead>
                    <TableHead>Mujeres</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTrabajos.map((trabajo) => (
                    <TableRow key={trabajo.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(trabajo.id)}
                          onCheckedChange={() => toggleSelectItem(trabajo.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {formatDate(trabajo.fecha)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {trabajo.profesionales.map((profesional, index) => (
                            <Badge key={index} variant="secondary" className="block w-fit">
                              {profesional}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          {trabajo.lugar}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{trabajo.encuentros.length}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <TooltipProvider>
                          <div className="flex justify-end gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" onClick={() => handleEdit(trabajo)}>
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
                                  onClick={() => archivarTrabajo(trabajo.id, !(trabajo as any).archivado)}
                                >
                                  {(trabajo as any).archivado ? (
                                    <ArchiveRestore className="h-4 w-4" />
                                  ) : (
                                    <Archive className="h-4 w-4" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {(trabajo as any).archivado ? "Restaurar" : "Archivar"}
                              </TooltipContent>
                            </Tooltip>
                            
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => confirmDelete(trabajo.id)}
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
            </CardContent>
          </Card>
        )}
      </main>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={handleDelete}
        title="¿Eliminar trabajo de campo?"
        description="Esta acción no se puede deshacer. El registro será eliminado permanentemente."
      />

      <MultiSelectToolbar
        selectedCount={selectedIds.length}
        onClearSelection={() => setSelectedIds([])}
        onArchive={handleBulkArchive}
        onDelete={handleBulkDelete}
      />
    </div>
  );
};

export default TrabajoCampo;