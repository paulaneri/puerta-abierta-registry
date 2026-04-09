import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Users, Calendar, Building2, Edit, ArrowLeft, Eye, Archive, ArchiveRestore } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { centroDiaStore, type RegistroCentroDia } from "@/lib/centroDiaStore";
import DetalleRegistro from "@/components/centroDia/DetalleRegistro";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MultiSelectToolbar } from "@/components/ui/multi-select-toolbar";

const CentroDia = () => {
  const [registros, setRegistros] = useState<RegistroCentroDia[]>([]);
  const [registroDetalle, setRegistroDetalle] = useState<RegistroCentroDia | null>(null);
  const [estadisticasAnio, setEstadisticasAnio] = useState({
    mujeresUnicas: 0,
    totalAsistencias: 0,
    diasConActividad: 0
  });
  const [añoSeleccionado, setAñoSeleccionado] = useState(new Date().getFullYear());
  const [mostrarArchivados, setMostrarArchivados] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const registrosData = await centroDiaStore.getRegistros(mostrarArchivados);
      setRegistros(registrosData);
      calcularEstadisticasAnio(registrosData);
    } catch (error) {
      console.error('Error cargando registros:', error);
      toast.error("Error al cargar los registros");
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [mostrarArchivados]);

  useEffect(() => {
    calcularEstadisticasAnio(registros);
  }, [añoSeleccionado, registros]);

  const calcularEstadisticasAnio = (registros: RegistroCentroDia[]) => {
    // Filtrar registros del año seleccionado que no estén archivados
    const registrosAnioActual = registros.filter(registro => {
      const fechaRegistro = new Date(registro.fecha);
      return fechaRegistro.getFullYear() === añoSeleccionado && !(registro as any).archivado;
    });

    // Contar días con actividad
    const diasConActividad = registrosAnioActual.length;

    // Contar mujeres únicas y total de asistencias
    const mujeresUnicas = new Set<string>();
    let totalAsistencias = 0;
    
    registrosAnioActual.forEach(registro => {
      registro.mujeresAsistieron.forEach(asistencia => {
        if (asistencia.mujer && asistencia.mujer.id) {
          mujeresUnicas.add(asistencia.mujer.id);
          totalAsistencias++;
        }
      });
    });

    setEstadisticasAnio({
      mujeresUnicas: mujeresUnicas.size,
      totalAsistencias,
      diasConActividad
    });
  };

  const abrirFormularioNuevo = () => {
    navigate('/centro-dia/nuevo');
  };

  const abrirFormularioEditar = (registro: RegistroCentroDia) => {
    navigate(`/centro-dia/editar/${registro.id}`);
  };

  const verDetalle = (registro: RegistroCentroDia) => {
    setRegistroDetalle(registro);
  };

  const cerrarDetalle = () => {
    setRegistroDetalle(null);
  };

  const archivarRegistro = async (id: string, archivado: boolean) => {
    try {
      await centroDiaStore.archivarRegistro(id, archivado);
      await cargarDatos();
      toast.success(archivado ? "Registro archivado" : "Registro restaurado");
    } catch (error) {
      console.error('Error archivando registro:', error);
      toast.error("Error al archivar el registro");
    }
  };

  const eliminarRegistro = async (id: string) => {
    try {
      await centroDiaStore.eliminarRegistro(id);
      await cargarDatos();
      toast.success("Registro eliminado exitosamente");
      setDeleteConfirm({ open: false, id: null });
    } catch (error) {
      console.error('Error eliminando registro:', error);
      toast.error("Error al eliminar el registro");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    
    if (!confirm(`¿Eliminar ${selectedIds.length} registro${selectedIds.length > 1 ? 's' : ''}? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      for (const id of selectedIds) {
        await centroDiaStore.eliminarRegistro(id);
      }
      await cargarDatos();
      setSelectedIds([]);
      toast.success(`${selectedIds.length} registro${selectedIds.length > 1 ? 's eliminados' : ' eliminado'}`);
    } catch (error) {
      console.error('Error eliminando registros:', error);
      toast.error("Error al eliminar los registros");
    }
  };

  const handleBulkArchive = async () => {
    if (selectedIds.length === 0) return;

    try {
      for (const id of selectedIds) {
        await centroDiaStore.archivarRegistro(id, true);
      }
      await cargarDatos();
      setSelectedIds([]);
      toast.success(`${selectedIds.length} registro${selectedIds.length > 1 ? 's archivados' : ' archivado'}`);
    } catch (error) {
      console.error('Error archivando registros:', error);
      toast.error("Error al archivar los registros");
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === registrosFiltrados.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(registrosFiltrados.map(r => r.id));
    }
  };

  const toggleSelectItem = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const registrosFiltrados = registros
    .filter(registro => {
      const fechaRegistro = new Date(registro.fecha);
      return fechaRegistro.getFullYear() === añoSeleccionado;
    })
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  const formatearFecha = (fecha: string) => {
    try {
      const date = parseISO(fecha);
      return format(date, 'dd-MM-yyyy');
    } catch {
      return fecha;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <Building2 className="h-8 w-8 text-primary" />
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Centro de Día</h1>
          </div>
          <Button onClick={abrirFormularioNuevo}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Registro
          </Button>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <Label htmlFor="año">Año</Label>
                <Input
                  id="año"
                  type="number"
                  value={añoSeleccionado}
                  onChange={(e) => setAñoSeleccionado(Number(e.target.value))}
                  min="2020"
                  max="2030"
                />
              </div>
              <Button
                variant={mostrarArchivados ? "default" : "outline"}
                onClick={() => setMostrarArchivados(!mostrarArchivados)}
              >
                <Archive className="h-4 w-4 mr-2" />
                {mostrarArchivados ? "Ocultar archivados" : "Mostrar archivados"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Estadísticas del Año */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-card border-primary/20 hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary-foreground" />
                </div>
                <CardTitle className="text-primary text-lg">
                  Mujeres Participantes {añoSeleccionado}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-foreground">{estadisticasAnio.mujeresUnicas}</p>
                <p className="text-lg text-muted-foreground">únicas</p>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {estadisticasAnio.totalAsistencias} asistencias totales este año
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-success/20 hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-success rounded-full flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-success-foreground" />
                </div>
                <CardTitle className="text-success text-lg">
                  Días de Actividad {añoSeleccionado}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground mb-1">{estadisticasAnio.diasConActividad}</p>
              <p className="text-sm text-muted-foreground">Días con actividades registradas este año</p>
            </CardContent>
          </Card>
        </div>


        {/* Tabla CRUD de Registros */}
        <Card>
          <CardHeader>
            <CardTitle>Registros del Centro de Día</CardTitle>
          </CardHeader>
          <CardContent>
            {registrosFiltrados.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No hay registros del Centro de Día</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedIds.length === registrosFiltrados.length}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Talleres y Actividades</TableHead>
                    <TableHead>Mujeres Asistentes</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registrosFiltrados.map((registro) => (
                    <TableRow 
                      key={registro.id} 
                      className="hover:bg-muted/50"
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedIds.includes(registro.id)}
                          onCheckedChange={() => toggleSelectItem(registro.id)}
                        />
                      </TableCell>
                      <TableCell 
                        className="font-medium cursor-pointer"
                        onClick={() => verDetalle(registro)}
                      >
                        {formatearFecha(registro.fecha)}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-40 truncate">
                          {registro.talleresActividades || "Sin actividades"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {registro.mujeresAsistieron.length}
                          </Badge>
                          {registro.mujeresAsistieron.filter(m => m.entrevistaRealizada).length > 0 && (
                            <Badge variant="default" className="bg-success/20 text-success">
                              {registro.mujeresAsistieron.filter(m => m.entrevistaRealizada).length} entrevistas
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => verDetalle(registro)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Ver detalle</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => abrirFormularioEditar(registro)}
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
                                  onClick={() => archivarRegistro(registro.id, !(registro as any).archivado)}
                                >
                                  {(registro as any).archivado ? (
                                    <ArchiveRestore className="h-4 w-4" />
                                  ) : (
                                    <Archive className="h-4 w-4" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {(registro as any).archivado ? "Restaurar" : "Archivar"}
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => setDeleteConfirm({ open: true, id: registro.id })}
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
            )}
          </CardContent>
        </Card>

        {/* Modal de detalle */}
        {registroDetalle && (
          <DetalleRegistro
            registro={registroDetalle}
            onClose={cerrarDetalle}
          />
        )}

        {/* Diálogo de confirmación */}
        <ConfirmDialog
          open={deleteConfirm.open}
          onOpenChange={(open) => setDeleteConfirm({ open, id: null })}
          onConfirm={() => deleteConfirm.id && eliminarRegistro(deleteConfirm.id)}
          title="¿Eliminar registro?"
          description="Esta acción no se puede deshacer. El registro será eliminado permanentemente."
        />

        {/* Multi-select toolbar */}
        <MultiSelectToolbar
          selectedCount={selectedIds.length}
          onClearSelection={() => setSelectedIds([])}
          onArchive={handleBulkArchive}
          onDelete={handleBulkDelete}
        />
      </div>
    </div>
  );
};

export default CentroDia;