import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  Calendar, 
  Users, 
  CalendarDays
} from "lucide-react";
import { 
  reunionesStore, 
  type ReunionConAsignaciones,
  type RolReunion
} from "@/lib/reunionesStore";
import { equipoStore, type Profesional } from "@/lib/equipoStore";
import { CalendarioMensual } from "@/components/reuniones/CalendarioMensual";
import { CalendarioAnual } from "@/components/reuniones/CalendarioAnual";
import { GestionParticipantes } from "@/components/reuniones/GestionParticipantes";
import { supabase } from "@/integrations/supabase/client";
import { calcularAsignacionesAutomaticas } from "@/lib/rolesAutoAssignment";

const Reuniones = () => {
  const currentYear = new Date().getFullYear();
  
  // Siempre mostrar el año en curso
  const [ano] = useState(currentYear);
  const [reuniones, setReuniones] = useState<ReunionConAsignaciones[]>([]);
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("mensual");

  const autoFixInProgressRef = useRef(false);

  // Cargar datos
  const cargarDatos = async () => {
    setLoading(true);
    try {
      let [reunionesData, profesionalesData] = await Promise.all([
        reunionesStore.getReuniones(ano),
        equipoStore.getProfesionalesActivos()
      ]);

      // Filtrar solo profesionales del Equipo Coordinador (equipoAmpliado = false)
      const profesionalesCoordinador = profesionalesData.filter(p => !p.equipoAmpliado);

      // Cargar disponibilidad explícita (si existe) para respetarla en el auto-asignador
      const reunionIds = reunionesData.map(r => r.id);
      const disponibilidadMap = new Map<string, Set<string>>();
      if (reunionIds.length > 0) {
        const { data: dispRows, error: dispError } = await supabase
          .from('disponibilidad_reuniones')
          .select('reunion_id, profesional_id, disponible')
          .in('reunion_id', reunionIds);

        if (dispError) {
          console.error('Error cargando disponibilidad:', dispError);
        } else {
          (dispRows || []).forEach(row => {
            if (!row.disponible) return;
            if (!disponibilidadMap.has(row.reunion_id)) {
              disponibilidadMap.set(row.reunion_id, new Set());
            }
            disponibilidadMap.get(row.reunion_id)!.add(row.profesional_id);
          });
        }
      }

      const ROLES: RolReunion[] = ['reflexion', 'coordinacion', 'acta'];
      const reunionesActivasOrdenadas = reunionesData
        .filter(r => r.estado !== 'cancelada')
        .slice()
        .sort((a, b) => a.semana_numero - b.semana_numero);

      const hayRolesSinAsignar = reunionesActivasOrdenadas.some(r =>
        ROLES.some(rol => !r.asignaciones.some(a => a.rol === rol))
      );

      const hayRepeticionConsecutiva = reunionesActivasOrdenadas.some((r, idx) => {
        if (idx === 0) return false;
        const prev = reunionesActivasOrdenadas[idx - 1];
        return ROLES.some(rol => {
          const a1 = prev.asignaciones.find(a => a.rol === rol)?.profesional_id;
          const a2 = r.asignaciones.find(a => a.rol === rol)?.profesional_id;
          return !!a1 && !!a2 && a1 === a2;
        });
      });

      // Auto-corrección (solo si detectamos problemas y hay profesionales para asignar)
      if (
        (hayRolesSinAsignar || hayRepeticionConsecutiva) &&
        profesionalesCoordinador.length > 0 &&
        !autoFixInProgressRef.current
      ) {
        autoFixInProgressRef.current = true;

        const nuevasAsignaciones = calcularAsignacionesAutomaticas(
          reunionesActivasOrdenadas,
          profesionalesCoordinador,
          disponibilidadMap
        );

        const idsActivas = reunionesActivasOrdenadas.map(r => r.id);
        const okDelete = await reunionesStore.eliminarAsignacionesMultiples(idsActivas);
        if (okDelete) {
          const asignacionesParaInsertar: { reunion_id: string; profesional_id: string; rol: RolReunion }[] = [];
          nuevasAsignaciones.forEach((asigs, reunionId) => {
            asignacionesParaInsertar.push({ reunion_id: reunionId, profesional_id: asigs.reflexion, rol: 'reflexion' });
            asignacionesParaInsertar.push({ reunion_id: reunionId, profesional_id: asigs.coordinacion, rol: 'coordinacion' });
            asignacionesParaInsertar.push({ reunion_id: reunionId, profesional_id: asigs.acta, rol: 'acta' });
          });

          const okInsert = await reunionesStore.asignarRolesMultiples(asignacionesParaInsertar);
          if (!okInsert) {
            toast.error('No se pudo corregir la asignación automática de roles');
          } else {
            // Releer ya corregido
            reunionesData = await reunionesStore.getReuniones(ano);
            toast.success('Roles corregidos automáticamente');
          }
        } else {
          toast.error('No se pudieron limpiar asignaciones para recalcular');
        }

        autoFixInProgressRef.current = false;
      }

      setReuniones(reunionesData);
      setProfesionales(profesionalesCoordinador);
    } catch (error) {
      console.error('Error cargando datos:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [ano]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-3">
              <Calendar className="h-7 w-7 text-primary" />
              Roles de Reuniones
            </h1>
            <p className="text-muted-foreground mt-1">
              Asignación semanal de roles para reuniones de equipo coordinador
            </p>
          </div>
          
          {/* Año actual */}
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold min-w-[60px] text-center bg-primary/10 px-4 py-2 rounded-md">{ano}</span>
          </div>
        </div>

        {/* Pestañas */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="mensual" className="flex items-center gap-2 py-3">
              <CalendarDays className="h-4 w-4" />
              <span className="hidden sm:inline">Calendario Mensual</span>
              <span className="sm:hidden">Mensual</span>
            </TabsTrigger>
            <TabsTrigger value="anual" className="flex items-center gap-2 py-3">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Calendario Anual</span>
              <span className="sm:hidden">Anual</span>
            </TabsTrigger>
            <TabsTrigger value="participantes" className="flex items-center gap-2 py-3">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Participantes</span>
              <span className="sm:hidden">Equipo</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="mensual" className="mt-6">
            <CalendarioMensual 
              reuniones={reuniones}
              profesionales={profesionales}
              onReunionesChange={cargarDatos}
              ano={ano}
            />
          </TabsContent>

          <TabsContent value="anual" className="mt-6">
            <CalendarioAnual 
              reuniones={reuniones}
              profesionales={profesionales}
              onReunionesChange={cargarDatos}
              ano={ano}
            />
          </TabsContent>

          <TabsContent value="participantes" className="mt-6">
            <GestionParticipantes profesionales={profesionales} reuniones={reuniones} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Reuniones;
