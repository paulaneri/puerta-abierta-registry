import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  ChevronDown,
  ChevronRight,
  Calendar,
  Trash2,
  RefreshCw,
  RotateCcw,
  Ban,
  Plus
} from "lucide-react";
import { format, getMonth, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { 
  reunionesStore, 
  getMondayOfWeek,
  type ReunionConAsignaciones, 
  type RolReunion 
} from "@/lib/reunionesStore";
import { type Profesional } from "@/lib/equipoStore";
import { calcularAsignacionesAutomaticas } from "@/lib/rolesAutoAssignment";

// Función para obtener el primer lunes de febrero de un año
const getFirstMondayOfFebruary = (year: number): Date => {
  const feb1 = new Date(year, 1, 1); // 1 de febrero
  const dayOfWeek = feb1.getDay(); // 0 = domingo, 1 = lunes, ..., 6 = sábado
  // Si es lunes (1), usamos ese día
  // Si es domingo (0), el lunes es el día siguiente (+1)
  // Para otros días, calculamos cuántos días faltan para el lunes
  let daysUntilMonday: number;
  if (dayOfWeek === 1) {
    daysUntilMonday = 0; // Ya es lunes
  } else if (dayOfWeek === 0) {
    daysUntilMonday = 1; // Domingo, el lunes es mañana
  } else {
    daysUntilMonday = 8 - dayOfWeek; // Martes(2)->6, Miércoles(3)->5, etc.
  }
  return new Date(year, 1, 1 + daysUntilMonday);
};

// Función para obtener todas las semanas (lunes) desde febrero hasta diciembre
const getMondaysFromFebruaryToDecember = (year: number): Date[] => {
  const mondays: Date[] = [];
  let currentMonday = getFirstMondayOfFebruary(year);
  const endOfYear = new Date(year, 11, 31); // 31 de diciembre
  
  while (currentMonday <= endOfYear) {
    mondays.push(new Date(currentMonday));
    currentMonday.setDate(currentMonday.getDate() + 7);
  }
  
  return mondays;
};

const MESES = [
  { numero: 1, nombre: "Febrero" },
  { numero: 2, nombre: "Marzo" },
  { numero: 3, nombre: "Abril" },
  { numero: 4, nombre: "Mayo" },
  { numero: 5, nombre: "Junio" },
  { numero: 6, nombre: "Julio" },
  { numero: 7, nombre: "Agosto" },
  { numero: 8, nombre: "Septiembre" },
  { numero: 9, nombre: "Octubre" },
  { numero: 10, nombre: "Noviembre" },
  { numero: 11, nombre: "Diciembre" },
];

const ROLES: { value: RolReunion; label: string; color: string }[] = [
  { value: 'reflexion', label: 'Reflexión', color: 'bg-blue-500' },
  { value: 'coordinacion', label: 'Coordinación', color: 'bg-green-500' },
  { value: 'acta', label: 'Acta', color: 'bg-purple-500' },
];

interface CalendarioAnualProps {
  reuniones: ReunionConAsignaciones[];
  profesionales: Profesional[];
  onReunionesChange: () => void;
  ano: number;
}

export const CalendarioAnual = ({ 
  reuniones, 
  profesionales, 
  onReunionesChange,
  ano 
}: CalendarioAnualProps) => {
  const [mesesAbiertos, setMesesAbiertos] = useState<Set<number>>(new Set());
  const [showEliminarDialog, setShowEliminarDialog] = useState(false);
  const [showCancelarDialog, setShowCancelarDialog] = useState(false);
  const [showReiniciarDialog, setShowReiniciarDialog] = useState(false);
  const [reunionAEliminar, setReunionAEliminar] = useState<ReunionConAsignaciones | null>(null);
  const [reunionACancelar, setReunionACancelar] = useState<ReunionConAsignaciones | null>(null);
  const [motivoCancelacion, setMotivoCancelacion] = useState("");
  const [asignando, setAsignando] = useState(false);
  const [reiniciando, setReiniciando] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [disponibilidad, setDisponibilidad] = useState<Map<string, Set<string>>>(new Map());

  // Cargar disponibilidad
  useEffect(() => {
    const cargarDisponibilidad = async () => {
      const reunionIds = reuniones.map(r => r.id);
      if (reunionIds.length === 0) return;

      const { data } = await supabase
        .from('disponibilidad_reuniones')
        .select('*')
        .in('reunion_id', reunionIds);

      const nuevoMapa = new Map<string, Set<string>>();
      (data || []).forEach(d => {
        if (d.disponible) {
          if (!nuevoMapa.has(d.reunion_id)) {
            nuevoMapa.set(d.reunion_id, new Set());
          }
          nuevoMapa.get(d.reunion_id)!.add(d.profesional_id);
        }
      });
      setDisponibilidad(nuevoMapa);
    };

    cargarDisponibilidad();
  }, [reuniones]);

  const toggleMes = (mes: number) => {
    const nuevosAbiertos = new Set(mesesAbiertos);
    if (nuevosAbiertos.has(mes)) {
      nuevosAbiertos.delete(mes);
    } else {
      nuevosAbiertos.add(mes);
    }
    setMesesAbiertos(nuevosAbiertos);
  };

  const getReunionesDelMes = (mesIndex: number) => {
    return reuniones.filter(r => {
      const fechaReunion = new Date(r.fecha);
      return getMonth(fechaReunion) === mesIndex;
    }).sort((a, b) => a.semana_numero - b.semana_numero);
  };

  const getNombreProfesional = (id: string) => {
    const p = profesionales.find(p => p.id === id);
    return p ? `${p.nombre} ${p.apellido}` : 'Sin asignar';
  };

  const handleEliminarReunion = async () => {
    if (!reunionAEliminar) return;

    const success = await reunionesStore.eliminarReunion(reunionAEliminar.id);
    if (success) {
      toast.success('Reunión eliminada');
      onReunionesChange();
      setShowEliminarDialog(false);
      setReunionAEliminar(null);
    }
  };

  // Función para actualizar los números de acta de todas las reuniones activas
  const actualizarNumerosActa = async () => {
    const reunionesActivas = reuniones
      .filter(r => r.estado !== 'cancelada')
      .sort((a, b) => a.semana_numero - b.semana_numero);
    
    for (let i = 0; i < reunionesActivas.length; i++) {
      const reunion = reunionesActivas[i];
      const nuevoNumeroActa = i + 1;
      if (reunion.numero_acta !== nuevoNumeroActa) {
        await reunionesStore.actualizarReunion(reunion.id, { numero_acta: nuevoNumeroActa });
      }
    }
  };

  const handleCancelarReunion = async () => {
    if (!reunionACancelar) return;

    const success = await reunionesStore.actualizarReunion(reunionACancelar.id, {
      estado: 'cancelada',
      motivo_cancelacion: motivoCancelacion || null,
      numero_acta: null // Limpiar número de acta de la reunión cancelada
    });

    if (success) {
      // Recalcular roles: los roles de la reunión cancelada pasan a las siguientes
      await recalcularRolesDesdeReunion(reunionACancelar);
      
      // Actualizar números de acta de todas las reuniones activas
      await actualizarNumerosActa();
      
      toast.success('Reunión cancelada. Los roles y números de acta se han reasignado.');
      onReunionesChange();
      setShowCancelarDialog(false);
      setReunionACancelar(null);
      setMotivoCancelacion("");
    }
  };

  // Función para recalcular roles desde una reunión específica
  const recalcularRolesDesdeReunion = async (reunionDesde: ReunionConAsignaciones) => {
    // Solo recalcular reuniones activas (no canceladas)
    const reunionesActivas = reuniones
      .filter(r => r.estado !== 'cancelada' && r.id !== reunionDesde.id)
      .sort((a, b) => a.semana_numero - b.semana_numero);
    
    if (reunionesActivas.length === 0 || profesionales.length === 0) return;

    const nuevasAsignaciones = calcularAsignacionesAutomaticas(
      reunionesActivas,
      profesionales,
      disponibilidad
    );

    // Eliminar asignaciones existentes de las reuniones activas
    const reunionIds = reunionesActivas.map(r => r.id);
    await reunionesStore.eliminarAsignacionesMultiples(reunionIds);

    // Crear nuevas asignaciones
    const asignacionesParaInsertar: { reunion_id: string; profesional_id: string; rol: RolReunion }[] = [];
    
    nuevasAsignaciones.forEach((asigs, reunionId) => {
      if (asigs.reflexion) {
        asignacionesParaInsertar.push({ reunion_id: reunionId, profesional_id: asigs.reflexion, rol: 'reflexion' });
      }
      if (asigs.coordinacion) {
        asignacionesParaInsertar.push({ reunion_id: reunionId, profesional_id: asigs.coordinacion, rol: 'coordinacion' });
      }
      if (asigs.acta) {
        asignacionesParaInsertar.push({ reunion_id: reunionId, profesional_id: asigs.acta, rol: 'acta' });
      }
    });

    if (asignacionesParaInsertar.length > 0) {
      await reunionesStore.asignarRolesMultiples(asignacionesParaInsertar);
    }
  };

  // Generar reuniones del año y asignar roles automáticamente
  const generarReunionesDelAno = async () => {
    setGenerando(true);
    
    try {
      const mondays = getMondaysFromFebruaryToDecember(ano);
      const semanasExistentes = new Set(reuniones.map(r => r.semana_numero));
      
      let reunionesCreadas = 0;
      
      for (let i = 0; i < mondays.length; i++) {
        const monday = mondays[i];
        // Calcular número de semana (semana 1 = primera semana del año)
        const startOfYear = new Date(ano, 0, 1);
        const diffTime = monday.getTime() - startOfYear.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const semana = Math.floor(diffDays / 7) + 1;
        
        if (!semanasExistentes.has(semana)) {
          // Guardamos como YYYY-MM-DD (sin hora). Se debe parsear con parseISO al mostrar.
          const fecha = format(monday, 'yyyy-MM-dd');
          const nuevaReunion = await reunionesStore.crearReunion(fecha, semana, ano);
          if (nuevaReunion) {
            reunionesCreadas++;
          }
        }
      }

      // Traer el año completo actualizado y asignar roles
      const reunionesActualizadas = await reunionesStore.getReuniones(ano);

      if (profesionales.length === 0) {
        toast.success(`Se crearon ${reunionesCreadas} reuniones para el año ${ano}.`);
        toast.info('No se asignaron roles porque no hay participantes cargados.');
        onReunionesChange();
        return;
      }

      if (reunionesActualizadas.length > 0) {
        const nuevasAsignaciones = calcularAsignacionesAutomaticas(
          reunionesActualizadas,
          profesionales,
          new Map() // ignorar disponibilidad
        );

        const reunionIds = reunionesActualizadas.map(r => r.id);
        await reunionesStore.eliminarAsignacionesMultiples(reunionIds);

        const asignacionesParaInsertar: { reunion_id: string; profesional_id: string; rol: RolReunion }[] = [];
        nuevasAsignaciones.forEach((asigs, reunionId) => {
          if (asigs.reflexion) asignacionesParaInsertar.push({ reunion_id: reunionId, profesional_id: asigs.reflexion, rol: 'reflexion' });
          if (asigs.coordinacion) asignacionesParaInsertar.push({ reunion_id: reunionId, profesional_id: asigs.coordinacion, rol: 'coordinacion' });
          if (asigs.acta) asignacionesParaInsertar.push({ reunion_id: reunionId, profesional_id: asigs.acta, rol: 'acta' });
        });

        const ok = asignacionesParaInsertar.length > 0
          ? await reunionesStore.asignarRolesMultiples(asignacionesParaInsertar)
          : true;

        if (!ok) {
          toast.error('Se generaron las reuniones, pero hubo un error al asignar roles');
        } else {
          toast.success(`Reuniones generadas y roles asignados para ${ano}`);
        }
      }

      onReunionesChange();
    } catch (error) {
      console.error('Error generando reuniones:', error);
      toast.error('Error al generar las reuniones');
    } finally {
      setGenerando(false);
    }
  };

  const handleReactivarReunion = async (reunion: ReunionConAsignaciones) => {
    const success = await reunionesStore.actualizarReunion(reunion.id, {
      estado: 'planificada',
      motivo_cancelacion: null
    });

    if (success) {
      toast.success('Reunión reactivada');
      onReunionesChange();
    }
  };

  const handleAsignarTodosLosRoles = async () => {
    if (profesionales.length === 0) {
      toast.error('No hay profesionales del equipo coordinador disponibles');
      return;
    }

    if (reuniones.length === 0) {
      toast.error('No hay reuniones creadas. Primero genera las reuniones del año.');
      return;
    }

    setAsignando(true);

    try {
      const nuevasAsignaciones = calcularAsignacionesAutomaticas(
        reuniones,
        profesionales,
        disponibilidad
      );

      const reunionIds = reuniones.map(r => r.id);
      await reunionesStore.eliminarAsignacionesMultiples(reunionIds);

      const asignacionesParaInsertar: { reunion_id: string; profesional_id: string; rol: RolReunion }[] = [];
      
      nuevasAsignaciones.forEach((asigs, reunionId) => {
        if (asigs.reflexion) {
          asignacionesParaInsertar.push({ reunion_id: reunionId, profesional_id: asigs.reflexion, rol: 'reflexion' });
        }
        if (asigs.coordinacion) {
          asignacionesParaInsertar.push({ reunion_id: reunionId, profesional_id: asigs.coordinacion, rol: 'coordinacion' });
        }
        if (asigs.acta) {
          asignacionesParaInsertar.push({ reunion_id: reunionId, profesional_id: asigs.acta, rol: 'acta' });
        }
      });

      if (asignacionesParaInsertar.length > 0) {
        const success = await reunionesStore.asignarRolesMultiples(asignacionesParaInsertar);
        if (success) {
          toast.success(`Se asignaron ${asignacionesParaInsertar.length} roles automáticamente`);
          onReunionesChange();
        } else {
          toast.error('Error al asignar los roles');
        }
      }
    } catch (error) {
      console.error('Error asignando roles:', error);
      toast.error('Error al asignar los roles');
    } finally {
      setAsignando(false);
    }
  };

  const handleReiniciarAno = async () => {
    setReiniciando(true);

    try {
      // Eliminar todas las asignaciones del año
      const reunionIds = reuniones.map(r => r.id);
      if (reunionIds.length > 0) {
        await reunionesStore.eliminarAsignacionesMultiples(reunionIds);
      }

      // Reactivar todas las reuniones canceladas
      for (const reunion of reuniones) {
        if (reunion.estado === 'cancelada') {
          await reunionesStore.actualizarReunion(reunion.id, {
            estado: 'planificada',
            motivo_cancelacion: null
          });
        }
      }

      toast.success(`Año ${ano} reiniciado. Las actas comenzarán desde N° 1.`);
      onReunionesChange();
    } catch (error) {
      console.error('Error reiniciando año:', error);
      toast.error('Error al reiniciar el año');
    } finally {
      setReiniciando(false);
      setShowReiniciarDialog(false);
    }
  };

  // Calcular números de acta (solo reuniones NO canceladas, en orden)
  const reunionesActivas = reuniones
    .filter(r => r.estado !== 'cancelada')
    .sort((a, b) => a.semana_numero - b.semana_numero);
  
  const numeroActaMap = new Map<string, number>();
  reunionesActivas.forEach((r, index) => {
    numeroActaMap.set(r.id, index + 1);
  });

  // Estadísticas
  const totalReuniones = reuniones.length;
  const reunionesActivasCount = reuniones.filter(r => r.estado !== 'cancelada').length;
  const reunionesCanceladasCount = reuniones.filter(r => r.estado === 'cancelada').length;

  return (
    <div className="space-y-4">
      {/* Panel de estadísticas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="py-3 px-4 text-center">
            <div className="text-2xl font-bold text-primary">{totalReuniones}</div>
            <div className="text-xs text-muted-foreground">Total Reuniones</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 px-4 text-center">
            <div className="text-2xl font-bold text-green-600">{reunionesActivasCount}</div>
            <div className="text-xs text-muted-foreground">Activas</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 px-4 text-center">
            <div className="text-2xl font-bold text-destructive">{reunionesCanceladasCount}</div>
            <div className="text-xs text-muted-foreground">Canceladas</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 px-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{profesionales.length}</div>
            <div className="text-xs text-muted-foreground">Participantes</div>
          </CardContent>
        </Card>
      </div>

      {/* Botones de acción */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Gestión de Reuniones
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Genera reuniones desde el primer lunes de febrero
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button 
                variant="outline"
                onClick={generarReunionesDelAno}
                disabled={generando}
              >
                {generando ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Generar Reuniones
              </Button>
              <Button 
                variant="outline"
                onClick={() => setShowReiniciarDialog(true)}
                disabled={reiniciando || reuniones.length === 0}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reiniciar Año
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Meses colapsables */}
      {MESES.map((mes) => {
        const reunionesDelMes = getReunionesDelMes(mes.numero);
        const isAbierto = mesesAbiertos.has(mes.numero);
        const activasDelMes = reunionesDelMes.filter(r => r.estado !== 'cancelada').length;
        const canceladasDelMes = reunionesDelMes.filter(r => r.estado === 'cancelada').length;
        
        return (
          <Collapsible key={mes.numero} open={isAbierto} onOpenChange={() => toggleMes(mes.numero)}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isAbierto ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      )}
                      <CardTitle className="text-lg">{mes.nombre}</CardTitle>
                      <Badge variant="outline">
                        {reunionesDelMes.length} reuniones
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      {activasDelMes > 0 && (
                        <Badge variant="default" className="bg-green-600">
                          {activasDelMes} activas
                        </Badge>
                      )}
                      {canceladasDelMes > 0 && (
                        <Badge variant="destructive">
                          {canceladasDelMes} canceladas
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <CardContent className="pt-0">
                  {reunionesDelMes.length === 0 ? (
                    <p className="text-muted-foreground text-sm py-2">
                      No hay reuniones programadas para este mes
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {reunionesDelMes.map(reunion => {
                        const numeroActa = numeroActaMap.get(reunion.id);
                        const esCancelada = reunion.estado === 'cancelada';
                        
                        return (
                          <div 
                            key={reunion.id}
                            className={`p-3 rounded-lg border ${
                              esCancelada 
                                ? 'bg-destructive/5 border-destructive/20 opacity-70' 
                                : reunion.estado === 'realizada'
                                ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
                                : 'bg-muted/30'
                            }`}
                          >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                              <div className="flex items-center gap-3 flex-wrap">
                                <Calendar className="h-4 w-4 text-primary" />
                                <span className="font-medium">
                                  Semana {reunion.semana_numero}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  {format(parseISO(reunion.fecha), "EEEE d MMM", { locale: es })}
                                </span>
                                {!esCancelada && numeroActa && (
                                  <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                                    Acta N° {numeroActa}
                                  </Badge>
                                )}
                                {esCancelada && (
                                  <Badge variant="destructive" className="text-xs flex items-center gap-1">
                                    <Ban className="h-3 w-3" />
                                    Cancelada
                                  </Badge>
                                )}
                              </div>

                              <div className="flex items-center gap-2 flex-wrap">
                                {!esCancelada && ROLES.map(rol => {
                                  const asignacion = reunion.asignaciones.find(a => a.rol === rol.value);
                                  if (!asignacion) return null;
                                  return (
                                    <span 
                                      key={rol.value}
                                      className="inline-flex items-center gap-1 text-xs bg-background px-2 py-1 rounded"
                                      title={`${rol.label}: ${getNombreProfesional(asignacion.profesional_id)}`}
                                    >
                                      <span className={`w-1.5 h-1.5 rounded-full ${rol.color}`}></span>
                                      {getNombreProfesional(asignacion.profesional_id).split(' ')[0]}
                                    </span>
                                  );
                                })}
                                
                                {esCancelada ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-green-600 hover:text-green-700"
                                    onClick={() => handleReactivarReunion(reunion)}
                                  >
                                    <RotateCcw className="h-3 w-3 mr-1" />
                                    Reactivar
                                  </Button>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-orange-600 hover:text-orange-700"
                                    onClick={() => {
                                      setReunionACancelar(reunion);
                                      setShowCancelarDialog(true);
                                    }}
                                  >
                                    <Ban className="h-3 w-3 mr-1" />
                                    Cancelar
                                  </Button>
                                )}
                                
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                  onClick={() => {
                                    setReunionAEliminar(reunion);
                                    setShowEliminarDialog(true);
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            {reunion.motivo_cancelacion && (
                              <p className="text-xs text-muted-foreground mt-2 ml-7">
                                Motivo: {reunion.motivo_cancelacion}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        );
      })}

      {/* Dialog para confirmar eliminación */}
      <Dialog open={showEliminarDialog} onOpenChange={setShowEliminarDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Reunión</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <p className="text-muted-foreground">
            ¿Estás seguro de que deseas eliminar la reunión de la semana {reunionAEliminar?.semana_numero}?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEliminarDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleEliminarReunion}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para cancelar reunión */}
      <Dialog open={showCancelarDialog} onOpenChange={setShowCancelarDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Reunión</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              ¿Cancelar la reunión de la semana {reunionACancelar?.semana_numero}?
            </p>
            <p className="text-sm text-muted-foreground">
              Las reuniones canceladas no consumen número de acta.
            </p>
            <Textarea
              placeholder="Motivo de la cancelación (opcional)..."
              value={motivoCancelacion}
              onChange={(e) => setMotivoCancelacion(e.target.value)}
              rows={2}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelarDialog(false)}>
              Volver
            </Button>
            <Button variant="destructive" onClick={handleCancelarReunion}>
              Cancelar Reunión
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para reiniciar año */}
      <Dialog open={showReiniciarDialog} onOpenChange={setShowReiniciarDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reiniciar Año {ano}</DialogTitle>
            <DialogDescription>
              Esta acción eliminará todas las asignaciones de roles del año.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-muted-foreground">
              Se realizarán las siguientes acciones:
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>Se eliminarán todas las asignaciones de roles</li>
              <li>Se reactivarán las reuniones canceladas</li>
              <li>Las actas comenzarán desde N° 1</li>
            </ul>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReiniciarDialog(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReiniciarAno}
              disabled={reiniciando}
            >
              {reiniciando ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4 mr-2" />
              )}
              Reiniciar Año
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
