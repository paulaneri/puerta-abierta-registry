import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  Calendar, 
  X, 
  FileText,
  MessageSquare,
  UserCheck,
  Trash2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Ban
} from "lucide-react";
import { format, addMonths, subMonths, getMonth, getYear, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { 
  reunionesStore, 
  type ReunionConAsignaciones, 
  type RolReunion 
} from "@/lib/reunionesStore";
import { type Profesional } from "@/lib/equipoStore";
import { supabase } from "@/integrations/supabase/client";
import { calcularAsignacionesAutomaticas } from "@/lib/rolesAutoAssignment";

const ROLES: { value: RolReunion; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'reflexion', label: 'Reflexión', icon: <MessageSquare className="h-4 w-4" />, color: 'bg-blue-500' },
  { value: 'coordinacion', label: 'Coordinación', icon: <UserCheck className="h-4 w-4" />, color: 'bg-green-500' },
  { value: 'acta', label: 'Acta', icon: <FileText className="h-4 w-4" />, color: 'bg-purple-500' },
];

interface CalendarioMensualProps {
  reuniones: ReunionConAsignaciones[];
  profesionales: Profesional[];
  onReunionesChange: () => void;
  ano: number;
}

export const CalendarioMensual = ({ 
  reuniones, 
  profesionales, 
  onReunionesChange,
  ano 
}: CalendarioMensualProps) => {
  // Inicializar el mes con el mes en curso (dentro del año seleccionado)
  const [mesActual, setMesActual] = useState(() => {
    const now = new Date();
    return new Date(ano, now.getMonth(), 1);
  });
  const [showCancelarDialog, setShowCancelarDialog] = useState(false);
  const [reunionACancelar, setReunionACancelar] = useState<ReunionConAsignaciones | null>(null);
  const [motivoCancelacion, setMotivoCancelacion] = useState("");
  const [disponibilidad, setDisponibilidad] = useState<Map<string, Set<string>>>(new Map());

  // Si cambia el año, mantener el mes actual (p.ej. enero-diciembre) dentro del nuevo año
  useEffect(() => {
    const now = new Date();
    setMesActual(new Date(ano, now.getMonth(), 1));
  }, [ano]);

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

  // Filtrar reuniones del mes actual
  const reunionesDelMes = reuniones.filter(r => {
    const fechaReunion = new Date(r.fecha);
    return getMonth(fechaReunion) === getMonth(mesActual) && 
           getYear(fechaReunion) === getYear(mesActual);
  }).sort((a, b) => a.semana_numero - b.semana_numero);

  // Calcular números de acta (solo reuniones activas, en orden)
  const reunionesActivas = reuniones
    .filter(r => r.estado !== 'cancelada')
    .sort((a, b) => a.semana_numero - b.semana_numero);
  
  const numeroActaMap = new Map<string, number>();
  reunionesActivas.forEach((r, index) => {
    numeroActaMap.set(r.id, index + 1);
  });

  const getNombreProfesional = (id: string) => {
    const p = profesionales.find(p => p.id === id);
    return p ? `${p.nombre} ${p.apellido}` : 'Sin asignar';
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
      motivo_cancelacion: motivoCancelacion,
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
  const recalcularRolesDesdeReunion = async (reunionCancelada: ReunionConAsignaciones) => {
    // Solo recalcular reuniones activas (no canceladas)
    const reunionesActivas = reuniones
      .filter(r => r.estado !== 'cancelada' && r.id !== reunionCancelada.id)
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

  const handleEliminarRol = async (reunion: ReunionConAsignaciones, rol: RolReunion) => {
    const asignacion = reunion.asignaciones.find(a => a.rol === rol);
    if (!asignacion) return;

    // Marcar a esta persona como NO disponible para esta reunión,
    // para que el recalculado no la vuelva a asignar.
    // Importante: además de persistirlo en DB, actualizamos el estado local
    // (si no, el recalculado usa el mapa viejo y puede reasignar a la misma persona).
    let disponibilidadActualizada: Map<string, Set<string>> | null = null;

    try {
      await supabase.from('disponibilidad_reuniones').delete().eq('reunion_id', reunion.id);

      const disponiblesIds = new Set(
        profesionales
          .filter(p => p.id !== asignacion.profesional_id)
          .map(p => p.id)
      );

      const filas = profesionales.map(p => ({
        reunion_id: reunion.id,
        profesional_id: p.id,
        disponible: disponiblesIds.has(p.id)
      }));

      const { error: insError } = await supabase.from('disponibilidad_reuniones').insert(filas);
      if (insError) {
        console.error('Error guardando disponibilidad:', insError);
        toast.error('No se pudo marcar la no disponibilidad');
        return;
      }

      // Actualizar estado local para que el algoritmo use la nueva disponibilidad
      disponibilidadActualizada = new Map(disponibilidad);
      disponibilidadActualizada.set(reunion.id, disponiblesIds);
      setDisponibilidad(disponibilidadActualizada);
    } catch (e) {
      console.error('Error guardando disponibilidad:', e);
      toast.error('No se pudo marcar la no disponibilidad');
      return;
    }

    const disponibilidadParaCalculo = disponibilidadActualizada ?? disponibilidad;

    // Ordenar todas las reuniones activas
    const reunionesOrdenadas = [...reuniones]
      .filter(r => r.estado !== 'cancelada')
      .sort((a, b) => a.semana_numero - b.semana_numero);

    const reunionIndex = reunionesOrdenadas.findIndex(r => r.id === reunion.id);
    if (reunionIndex === -1) return;

    // Reuniones anteriores (para contexto del historial)
    const reunionesAnteriores = reunionesOrdenadas.slice(0, reunionIndex);

    // Reuniones desde la actual hacia adelante (las que hay que recalcular)
    // Importante: en la reunión actual mantenemos los otros roles ya asignados
    // y solo dejamos vacío el rol eliminado.
    const reunionesARecalcular = reunionesOrdenadas.slice(reunionIndex);
    const reunionesARecalcularPreparadas = reunionesARecalcular.map((r, idx) => {
      if (idx === 0) {
        return {
          ...r,
          asignaciones: r.asignaciones.filter(a => a.rol !== rol)
        };
      }
      return {
        ...r,
        asignaciones: []
      };
    });

    const idsARecalcular = reunionesARecalcular.map(r => r.id);

    // Calcular nuevas asignaciones (antes de borrar nada)
    const nuevasAsignaciones = calcularAsignacionesAutomaticas(
      [...reunionesAnteriores, ...reunionesARecalcularPreparadas],
      profesionales,
      disponibilidadParaCalculo,
      reunion.id
    );

    // Validar que haya asignación completa y SIN duplicados para todas las reuniones a recalcular
    const idsARecalcularSet = new Set(idsARecalcular);
    for (const reunionId of idsARecalcular) {
      const asigs = nuevasAsignaciones.get(reunionId);
      if (!asigs || !asigs.reflexion || !asigs.coordinacion || !asigs.acta) {
        toast.error('No se puede reasignar: faltan participantes disponibles para completar roles');
        return;
      }

      const unicos = new Set([asigs.reflexion, asigs.coordinacion, asigs.acta]);
      if (unicos.size < 3) {
        toast.error('No se puede reasignar: se necesitan 3 participantes distintos para Reflexión/Coordinación/Acta');
        return;
      }
    }

    // Borrar asignaciones existentes (solo cuando sabemos que podemos reinsertar)
    const eliminado = await reunionesStore.eliminarAsignacionesMultiples(idsARecalcular);
    if (!eliminado) {
      toast.error('Error al eliminar las asignaciones');
      return;
    }

    // Crear nuevas asignaciones solo para las reuniones que recalculamos
    const asignacionesParaInsertar: { reunion_id: string; profesional_id: string; rol: RolReunion }[] = [];

    nuevasAsignaciones.forEach((asigs, reunionId) => {
      if (!idsARecalcularSet.has(reunionId)) return;

      asignacionesParaInsertar.push({ reunion_id: reunionId, profesional_id: asigs.reflexion, rol: 'reflexion' });
      asignacionesParaInsertar.push({ reunion_id: reunionId, profesional_id: asigs.coordinacion, rol: 'coordinacion' });
      asignacionesParaInsertar.push({ reunion_id: reunionId, profesional_id: asigs.acta, rol: 'acta' });
    });

    if (asignacionesParaInsertar.length > 0) {
      const insertado = await reunionesStore.asignarRolesMultiples(asignacionesParaInsertar);
      if (!insertado) {
        toast.error('Error al guardar los roles en la base de datos');
        onReunionesChange();
        return;
      }
      toast.success('Roles reasignados automáticamente');
    } else {
      toast.warning('No se pudieron calcular asignaciones.');
    }

    onReunionesChange();
  }; 

  return (
    <div className="space-y-4">
      {/* Navegación de mes */}
      <div className="flex items-center justify-between">
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => setMesActual(subMonths(mesActual, 1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-xl font-semibold capitalize">
          {format(mesActual, "MMMM yyyy", { locale: es })}
        </h2>
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => setMesActual(addMonths(mesActual, 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Estadísticas del mes */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="py-3 px-4 text-center">
            <div className="text-2xl font-bold text-primary">{reunionesDelMes.length}</div>
            <div className="text-xs text-muted-foreground">Total Reuniones</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 px-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {reunionesDelMes.filter(r => r.estado === 'planificada').length}
            </div>
            <div className="text-xs text-muted-foreground">Activas</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 px-4 text-center">
            <div className="text-2xl font-bold text-destructive">
              {reunionesDelMes.filter(r => r.estado === 'cancelada').length}
            </div>
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

      {/* Lista de reuniones del mes */}
      <div className="space-y-3">
        {reunionesDelMes.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No hay reuniones programadas para este mes
            </CardContent>
          </Card>
        ) : (
          reunionesDelMes.map((reunion) => {
            const numeroActa = numeroActaMap.get(reunion.id);
            
            return (
              <Card 
                key={reunion.id} 
                className={`${reunion.estado === 'cancelada' ? 'opacity-60 border-destructive/30' : ''}`}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <Calendar className="h-5 w-5 text-primary" />
                        <span className="font-semibold">
                          Semana {reunion.semana_numero}
                        </span>
                        <span className="text-muted-foreground">
                          {format(parseISO(reunion.fecha), "EEEE d 'de' MMMM", { locale: es })}
                        </span>
                        {reunion.estado !== 'cancelada' && numeroActa && (
                          <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                            Acta N° {numeroActa}
                          </Badge>
                        )}
                        {reunion.estado === 'cancelada' && (
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <Ban className="h-3 w-3" />
                            Cancelada
                          </Badge>
                        )}
                        {reunion.estado === 'realizada' && (
                          <Badge variant="default" className="bg-green-600">Realizada</Badge>
                        )}
                      </div>

                      {/* Roles */}
                      {reunion.estado !== 'cancelada' && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3">
                          {ROLES.map(rol => {
                            const asignacion = reunion.asignaciones.find(a => a.rol === rol.value);
                            return (
                              <div 
                                key={rol.value}
                                className="flex items-center justify-between gap-2 p-2 rounded-md bg-muted/50"
                              >
                                <div className="flex items-center gap-2 min-w-0 flex-1 flex-wrap">
                                  <span className={`w-2 h-2 rounded-full shrink-0 ${rol.color}`}></span>
                                  <span className="text-xs sm:text-sm font-medium shrink-0">{rol.label}:</span>
                                  <span className="text-xs sm:text-sm break-words hyphens-auto">
                                    {asignacion ? getNombreProfesional(asignacion.profesional_id) : 'Sin asignar'}
                                  </span>
                                </div>
                                {asignacion && reunion.estado === 'planificada' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 shrink-0"
                                    onClick={() => handleEliminarRol(reunion, rol.value)}
                                    title="Eliminar y reasignar"
                                  >
                                    <Trash2 className="h-3 w-3 text-destructive" />
                                  </Button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {reunion.motivo_cancelacion && (
                        <p className="text-sm text-destructive/80 mt-2 p-2 bg-destructive/5 rounded">
                          <strong>Motivo:</strong> {reunion.motivo_cancelacion}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-row md:flex-col gap-2 mt-2 md:mt-0">
                      {reunion.estado === 'planificada' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive text-xs sm:text-sm"
                          onClick={() => {
                            setReunionACancelar(reunion);
                            setShowCancelarDialog(true);
                          }}
                        >
                          <X className="h-4 w-4 sm:mr-1" />
                          <span className="hidden sm:inline">Cancelar</span>
                        </Button>
                      )}
                      {reunion.estado === 'cancelada' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-green-600 hover:text-green-700 text-xs sm:text-sm"
                          onClick={() => handleReactivarReunion(reunion)}
                        >
                          <RotateCcw className="h-4 w-4 sm:mr-1" />
                          <span className="hidden sm:inline">Reactivar</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Dialog para cancelar reunión */}
      <Dialog open={showCancelarDialog} onOpenChange={setShowCancelarDialog}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle>Cancelar Reunión</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm sm:text-base text-muted-foreground">
              ¿Estás seguro de que deseas cancelar la reunión de la semana {reunionACancelar?.semana_numero}?
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Las reuniones canceladas no consumen número de acta. Los números de acta de las reuniones siguientes se ajustarán automáticamente.
            </p>
            <Textarea
              placeholder="Motivo de la cancelación (opcional)..."
              value={motivoCancelacion}
              onChange={(e) => setMotivoCancelacion(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowCancelarDialog(false)} className="w-full sm:w-auto">
              Volver
            </Button>
            <Button variant="destructive" onClick={handleCancelarReunion} className="w-full sm:w-auto">
              Confirmar Cancelación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
