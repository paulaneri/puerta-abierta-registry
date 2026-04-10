import { supabase } from "@/integrations/supabase/client";
import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, CalendarDays, List, Plus, Edit, Trash2, CheckSquare } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { eventosStore, type Evento } from '@/lib/eventosStore';
import { equipoStore } from '@/lib/equipoStore';
import { actividadesStore, type Actividad } from '@/lib/actividadesStore';
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TimeInput24h } from "@/components/ui/time-input-24h";
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "sonner";

interface Cumpleanos {
  id: string;
  nombre: string;
  apellido?: string;
  fecha: string; // MM-DD
  tipo: 'participante' | 'equipo';
}

interface PersonaDetalle {
  id: string;
  nombre: string;
  apellido?: string;
  rol?: string;
  telefono?: string;
  email?: string;
  fecha_nacimiento?: string;
  edad?: number;
  tipo: 'participante' | 'equipo';
}

type TipoVista = 'anual' | 'mensual' | 'diaria';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

// Fecha límite lejana para eventos con repetición indefinida
const FECHA_REPETICION_INDEFINIDA = '2099-12-31';

const Calendario = () => {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [cumpleanos, setCumpleanos] = useState<Cumpleanos[]>([]);
  const [profesionales, setProfesionales] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvento, setEditingEvento] = useState<Evento | null>(null);
  const [vistaActual, setVistaActual] = useState<'calendario' | 'lista'>('calendario');
  const [tipoVista, setTipoVista] = useState<TipoVista>('mensual');
  const [isPersonaDialogOpen, setIsPersonaDialogOpen] = useState(false);
  const [personaSeleccionada, setPersonaSeleccionada] = useState<PersonaDetalle | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });

  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "",
    fecha: format(new Date(), 'yyyy-MM-dd'),
    hora_inicio: "09:00",
    hora_fin: "10:00",
    lugar: "",
    tipo: 'reunion' as Evento['tipo'],
    participantes: "",
    recordatorio: false,
    repeticion: 'ninguna' as 'ninguna' | 'semanal' | 'mensual' | 'anualmente',
    fecha_fin_repeticion: "",
    todoElDia: false,
  });

  const [showRecurrenceDialog, setShowRecurrenceDialog] = useState(false);
  const [pendingEventUpdate, setPendingEventUpdate] = useState<any>(null);
  const [fechaEventoEspecifico, setFechaEventoEspecifico] = useState<string>("");


  useEffect(() => {
    console.log("Cargando eventos...");
    const cargarEventos = async () => {
      const eventosGuardados = await eventosStore.getEventos();
      console.log("Eventos encontrados:", eventosGuardados);
      
      if (eventosGuardados.length === 0) {
        const eventosEjemplo = [
          {
            titulo: "Reunión de equipo semanal",
            descripcion: "Planificación de actividades y seguimiento de casos",
            fecha: "2024-03-18",
            hora_inicio: "09:00",
            hora_fin: "10:30",
            lugar: "Sala de reuniones",
            tipo: "reunion" as const,
            participantes: ["Ana García", "Carlos Martínez", "María Rodríguez", "Laura Fernández"],
            recordatorio: true,
            repeticion: "semanal" as const,
            fecha_fin_repeticion: "2024-12-31"
          },
          {
            titulo: "Taller de costura",
            descripcion: "Taller semanal de costura básica para participantes",
            fecha: "2024-03-19",
            hora_inicio: "14:00",
            hora_fin: "16:00",
            lugar: "Aula taller",
            tipo: "taller" as const,
            participantes: ["María Rodríguez"],
            recordatorio: true,
            repeticion: "semanal" as const,
            fecha_fin_repeticion: "2024-12-31"
          }
        ];

        for (const evento of eventosEjemplo) {
          await eventosStore.agregarEvento(evento);
        }
        
        const eventosActualizados = await eventosStore.getEventos();
        setEventos(eventosActualizados);
      } else {
        setEventos(eventosGuardados);
      }

      // Cargar profesionales
      const profesionalesData = await equipoStore.getProfesionales();
      setProfesionales(profesionalesData);

      // Cargar actividades
      const actividadesData = await actividadesStore.getActividades();
      setActividades(actividadesData);

      // Cargar cumpleaños desde la base de datos
      const getCumpleanos = async () => {
        const cumpleanosArray: Cumpleanos[] = [];
        
        const { data: mujeresData } = await supabase
          .from('mujeres')
          .select('id, nombre, apellido, fecha_nacimiento');
        
        mujeresData?.forEach(mujer => {
          if (mujer.fecha_nacimiento) {
            const partes = mujer.fecha_nacimiento.split('-');
            if (partes.length === 3) {
              const mes = partes[1];
              const dia = partes[2];
              cumpleanosArray.push({
                id: `participante-${mujer.id}`,
                nombre: mujer.nombre || '',
                apellido: mujer.apellido || '',
                fecha: `${mes}-${dia}`,
                tipo: 'participante'
              });
            }
          }
        });

        const equipoData = await equipoStore.getProfesionales();
          
        equipoData?.forEach(profesional => {
          if (profesional.fechaNacimiento) {
            const partes = profesional.fechaNacimiento.split('-');
            if (partes.length === 3) {
              const mes = partes[1];
              const dia = partes[2];
              cumpleanosArray.push({
                id: `equipo-${profesional.id}`,
                nombre: profesional.nombre,
                apellido: profesional.apellido || '',
                fecha: `${mes}-${dia}`,
                tipo: 'equipo'
              });
            }
          }
        });

        return cumpleanosArray;
      };

      const cumpleanosData = await getCumpleanos();
      setCumpleanos(cumpleanosData);
    };
    
    cargarEventos();
  }, []);

  const resetForm = () => {
    setFormData({
      titulo: "",
      descripcion: "",
      fecha: format(selectedDate, 'yyyy-MM-dd'),
      hora_inicio: "09:00",
      hora_fin: "10:00",
      lugar: "",
      tipo: 'reunion',
      participantes: "",
      recordatorio: false,
      repeticion: 'ninguna',
      fecha_fin_repeticion: "",
      todoElDia: false,
    });
  };

  const openCreateDialog = (date?: Date) => {
    if (date) {
      setSelectedDate(date);
      setFormData(prev => ({ ...prev, fecha: format(date, 'yyyy-MM-dd') }));
    }
    setEditingEvento(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (evento: Evento, fechaEspecifica?: string) => {
    setEditingEvento(evento);
    setFechaEventoEspecifico(fechaEspecifica || evento.fecha);
    const esTodoElDia = evento.hora_inicio.substring(0, 5) === "00:00" && evento.hora_fin.substring(0, 5) === "23:59";
    setFormData({
      titulo: evento.titulo,
      descripcion: evento.descripcion || "",
      fecha: fechaEspecifica || evento.fecha,
      hora_inicio: evento.hora_inicio.substring(0, 5),
      hora_fin: evento.hora_fin.substring(0, 5),
      lugar: evento.lugar || "",
      tipo: evento.tipo,
      participantes: evento.participantes?.join(', ') || "",
      recordatorio: evento.recordatorio,
      repeticion: evento.repeticion || 'ninguna',
      fecha_fin_repeticion: evento.fecha_fin_repeticion || "",
      todoElDia: esTodoElDia,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const eventData = {
      titulo: formData.titulo,
      descripcion: formData.descripcion,
      fecha: formData.fecha,
      hora_inicio: formData.todoElDia ? "00:00" : formData.hora_inicio,
      hora_fin: formData.todoElDia ? "23:59" : formData.hora_fin,
      lugar: formData.lugar,
      tipo: formData.tipo,
      participantes: formData.participantes.split(',').map(p => p.trim()).filter(p => p),
      recordatorio: formData.recordatorio,
      repeticion: formData.repeticion,
      // Si tiene repetición pero no fecha fin, dejar vacío (será indefinido)
      fecha_fin_repeticion: formData.fecha_fin_repeticion || undefined,
    };

    if (editingEvento) {
      if (editingEvento.repeticion && editingEvento.repeticion !== 'ninguna') {
        setPendingEventUpdate(eventData);
        setShowRecurrenceDialog(true);
        return;
      }
      
      const eventoActualizado = await eventosStore.actualizarEvento(editingEvento.id, eventData);
      if (eventoActualizado) {
        const eventosActualizados = await eventosStore.getEventos();
        setEventos(eventosActualizados);
      }
    } else {
      const nuevoEvento = await eventosStore.agregarEvento(eventData);
      if (nuevoEvento) {
        const eventosActualizados = await eventosStore.getEventos();
        setEventos(eventosActualizados);
      }
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleRecurrenceChoice = async (soloEste: boolean) => {
    if (!editingEvento || !pendingEventUpdate) return;

    if (soloEste) {
      await eventosStore.agregarEvento({
        ...pendingEventUpdate,
        fecha: fechaEventoEspecifico,
        repeticion: 'ninguna',
        fecha_fin_repeticion: undefined,
      });
    } else {
      await eventosStore.actualizarEvento(editingEvento.id, pendingEventUpdate);
    }

    const eventosActualizados = await eventosStore.getEventos();
    setEventos(eventosActualizados);
    setShowRecurrenceDialog(false);
    setIsDialogOpen(false);
    setPendingEventUpdate(null);
    setFechaEventoEspecifico("");
    resetForm();
  };

  const handleEliminarEvento = async (id: string) => {
    const eventoAEliminar = eventos.find(e => e.id === id);
    const eliminado = await eventosStore.eliminarEvento(id);
    if (eliminado) {
      const eventosActualizados = await eventosStore.getEventos();
      setEventos(eventosActualizados);
      setDeleteConfirm({ open: false, id: null });
      toast.success("Evento eliminado", {
        description: eventoAEliminar?.recordatorio && eventoAEliminar?.participantes?.length 
          ? `Se notificará la cancelación a ${eventoAEliminar.participantes.length} participante(s)`
          : "El evento ha sido eliminado correctamente"
      });
    }
  };

  const calcularEdad = (fechaNacimiento: string): number => {
    const hoy = new Date();
    const partes = fechaNacimiento.split('-');
    const nacimiento = new Date(parseInt(partes[0]), parseInt(partes[1]) - 1, parseInt(partes[2]));
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  };

  const handleClickCumpleanos = async (cumple: Cumpleanos) => {
    if (cumple.tipo === 'equipo') {
      const idOriginal = cumple.id.replace('equipo-', '');
      const profesional = profesionales.find(p => p.id === idOriginal);
      
      if (profesional) {
        setPersonaSeleccionada({
          id: profesional.id,
          nombre: profesional.nombre,
          apellido: profesional.apellido,
          rol: profesional.cargo,
          telefono: profesional.telefono,
          email: profesional.email,
          fecha_nacimiento: profesional.fechaNacimiento,
          edad: profesional.fechaNacimiento ? calcularEdad(profesional.fechaNacimiento) : undefined,
          tipo: 'equipo'
        });
        setIsPersonaDialogOpen(true);
      }
    } else {
      const idOriginal = cumple.id.replace('participante-', '');
      const { data: mujerData } = await supabase
        .from('mujeres')
        .select('*')
        .eq('id', idOriginal)
        .single();
      
      if (mujerData) {
        setPersonaSeleccionada({
          id: mujerData.id,
          nombre: mujerData.nombre,
          apellido: mujerData.apellido,
          rol: 'Participante',
          telefono: mujerData.telefono,
          email: mujerData.email,
          fecha_nacimiento: mujerData.fecha_nacimiento,
          edad: mujerData.fecha_nacimiento ? calcularEdad(mujerData.fecha_nacimiento) : undefined,
          tipo: 'participante'
        });
        setIsPersonaDialogOpen(true);
      }
    }
  };

  // Función para obtener eventos de una fecha específica (con soporte para repetición indefinida)
  const getEventosParaFecha = (fecha: Date) => {
    const fechaStr = format(fecha, 'yyyy-MM-dd');
    
    const eventosEncontrados = eventos.filter(evento => {
      if (!evento.repeticion || evento.repeticion === 'ninguna') {
        return evento.fecha === fechaStr;
      }
      
      // Usar fecha límite indefinida si no hay fecha_fin_repeticion
      const fechaFinRepeticion = evento.fecha_fin_repeticion || FECHA_REPETICION_INDEFINIDA;
      
      if (new Date(fechaStr) > new Date(fechaFinRepeticion)) {
        return false;
      }
      
      const fechaEvento = new Date(evento.fecha);
      const fechaBuscada = new Date(fechaStr);
      
      // La fecha buscada debe ser igual o posterior a la fecha del evento
      if (fechaBuscada < fechaEvento) {
        return false;
      }
      
      if (evento.repeticion === 'semanal') {
        const diffTime = fechaBuscada.getTime() - fechaEvento.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays % 7 === 0;
      } else if (evento.repeticion === 'mensual') {
        return fechaEvento.getDate() === fechaBuscada.getDate() && fechaBuscada >= fechaEvento;
      } else if (evento.repeticion === 'anualmente') {
        return fechaEvento.getMonth() === fechaBuscada.getMonth() && 
               fechaEvento.getDate() === fechaBuscada.getDate() &&
               fechaBuscada >= fechaEvento;
      }
      
      return false;
    });

    const tieneExcepcion = eventosEncontrados.some(e => !e.repeticion || e.repeticion === 'ninguna');
    if (tieneExcepcion) {
      return eventosEncontrados.filter(e => !e.repeticion || e.repeticion === 'ninguna');
    }
    
    return eventosEncontrados;
  };

  // Función para obtener actividades con fecha límite
  const getActividadesParaFecha = (fecha: Date) => {
    const fechaStr = format(fecha, 'yyyy-MM-dd');
    return actividades.filter(act => act.fecha_limite === fechaStr && act.estado !== 'completado');
  };

  const getCumpleanosParaFecha = (fecha: Date) => {
    const fechaStr = format(fecha, 'MM-dd');
    return cumpleanos.filter(cumple => cumple.fecha === fechaStr);
  };

  const navegarPeriodo = (direccion: 'anterior' | 'siguiente') => {
    if (tipoVista === 'anual') {
      setSelectedDate(prev => new Date(prev.getFullYear() + (direccion === 'anterior' ? -1 : 1), prev.getMonth(), 1));
    } else if (tipoVista === 'diaria') {
      setSelectedDate(prev => addDays(prev, direccion === 'anterior' ? -1 : 1));
    } else {
      setSelectedDate(prev => new Date(prev.getFullYear(), prev.getMonth() + (direccion === 'anterior' ? -1 : 1), 1));
    }
  };

  // Vista Anual
  const renderVistaAnual = () => (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl sm:text-2xl font-bold">{selectedDate.getFullYear()}</h2>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={() => navegarPeriodo('anterior')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date())}>
            Hoy
          </Button>
          <Button variant="outline" size="sm" onClick={() => navegarPeriodo('siguiente')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {MESES.map((mes, index) => {
          const primerDiaMes = new Date(selectedDate.getFullYear(), index, 1);
          const ultimoDiaMes = endOfMonth(primerDiaMes);
          const diasDelMes = eachDayOfInterval({ start: primerDiaMes, end: ultimoDiaMes });
          
          const eventosDelMes = diasDelMes.reduce((total, dia) => total + getEventosParaFecha(dia).length, 0);
          const actividadesDelMes = diasDelMes.reduce((total, dia) => total + getActividadesParaFecha(dia).length, 0);
          
          return (
            <Card 
              key={mes} 
              className="cursor-pointer hover:bg-accent transition-colors"
              onClick={() => {
                setSelectedDate(primerDiaMes);
                setTipoVista('mensual');
              }}
            >
              <CardContent className="p-3">
                <div className="font-semibold text-sm mb-1">{mes}</div>
                <div className="flex gap-2 text-xs text-muted-foreground">
                  {eventosDelMes > 0 && (
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      {eventosDelMes}
                    </span>
                  )}
                  {actividadesDelMes > 0 && (
                    <span className="flex items-center gap-1 text-amber-600">
                      <CheckSquare className="h-3 w-3" />
                      {actividadesDelMes}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );

  // Vista Mensual (ajustada al tamaño de pantalla)
  const renderVistaMensual = () => (
    <div className="flex flex-col h-[calc(100vh-180px)]">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl sm:text-2xl font-bold capitalize">
          {format(selectedDate, 'MMMM yyyy', { locale: es })}
        </h2>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={() => navegarPeriodo('anterior')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date())}>
            Hoy
          </Button>
          <Button variant="outline" size="sm" onClick={() => navegarPeriodo('siguiente')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-0.5 flex-1">
        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(dia => (
          <div key={dia} className="text-center font-medium text-muted-foreground p-1 text-xs sm:text-sm">
            {dia}
          </div>
        ))}

        {(() => {
          const firstDayOfMonth = startOfMonth(selectedDate);
          const lastDayOfMonth = endOfMonth(selectedDate);
          const startWeekday = (firstDayOfMonth.getDay() + 6) % 7;
          const startDate = addDays(firstDayOfMonth, -startWeekday);
          const endWeekday = (lastDayOfMonth.getDay() + 6) % 7;
          const daysToAdd = endWeekday === 6 ? 0 : 6 - endWeekday;
          const endDate = addDays(lastDayOfMonth, daysToAdd);
          const daysToShow = eachDayOfInterval({ start: startDate, end: endDate });
          
          return daysToShow.map(day => {
            const eventosDelDia = getEventosParaFecha(day);
            const actividadesDelDia = getActividadesParaFecha(day);
            const cumpleanosDelDia = getCumpleanosParaFecha(day);
            const esHoy = isSameDay(day, new Date());
            const esMesActual = isSameMonth(day, selectedDate);

            return (
              <div
                key={day.toISOString()}
                className={`p-1 border rounded cursor-pointer transition-colors overflow-hidden ${
                  esHoy ? 'bg-primary/10 border-primary' : 'hover:bg-accent'
                } ${!esMesActual ? 'opacity-40' : ''}`}
                onClick={() => {
                  setSelectedDate(day);
                  setTipoVista('diaria');
                }}
              >
                <div className="flex justify-between items-start">
                  <span className={`text-xs sm:text-sm font-medium ${esHoy ? 'text-primary' : ''}`}>
                    {format(day, 'd')}
                  </span>
                </div>

                <div className="space-y-0.5 mt-0.5 overflow-hidden">
                  {cumpleanosDelDia.slice(0, 1).map(cumple => (
                    <div
                      key={cumple.id}
                      className={`text-[9px] sm:text-[10px] px-1 py-0.5 rounded truncate cursor-pointer ${
                        cumple.tipo === 'equipo' 
                          ? 'bg-success/20 text-success hover:bg-success/30' 
                          : 'bg-primary/20 text-primary hover:bg-primary/30'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClickCumpleanos(cumple);
                      }}
                    >
                      🎂 {cumple.nombre}
                    </div>
                  ))}

                  {eventosDelDia.slice(0, 1).map(evento => (
                    <div
                      key={evento.id}
                      className="px-1 py-0.5 rounded bg-accent text-accent-foreground cursor-pointer hover:bg-accent/80 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditDialog(evento, format(day, 'yyyy-MM-dd'));
                      }}
                    >
                      <span className="text-[9px] sm:text-[10px] font-medium leading-tight truncate block">{evento.titulo}</span>
                    </div>
                  ))}

                  {actividadesDelDia.slice(0, 1).map(act => (
                    <div
                      key={act.id}
                      className="px-1 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 cursor-pointer hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-0.5">
                        <CheckSquare className="h-2.5 w-2.5 flex-shrink-0" />
                        <span className="text-[9px] sm:text-[10px] font-medium leading-tight truncate">{act.titulo}</span>
                      </div>
                    </div>
                  ))}

                  {(eventosDelDia.length + actividadesDelDia.length + cumpleanosDelDia.length > 2) && (
                    <div className="text-[9px] text-muted-foreground">
                      +{eventosDelDia.length + actividadesDelDia.length + cumpleanosDelDia.length - 2}
                    </div>
                  )}
                </div>
              </div>
            );
          });
        })()}
      </div>
    </div>
  );

  // Vista Diaria
  const renderVistaDiaria = () => {
    const eventosDelDia = getEventosParaFecha(selectedDate);
    const actividadesDelDia = getActividadesParaFecha(selectedDate);
    const cumpleanosDelDia = getCumpleanosParaFecha(selectedDate);
    const esHoy = isSameDay(selectedDate, new Date());

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold capitalize">
              {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
            </h2>
            {esHoy && <Badge className="mt-1">Hoy</Badge>}
          </div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={() => navegarPeriodo('anterior')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date())}>
              Hoy
            </Button>
            <Button variant="outline" size="sm" onClick={() => navegarPeriodo('siguiente')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Cumpleaños */}
          {cumpleanosDelDia.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">🎂 Cumpleaños</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {cumpleanosDelDia.map(cumple => (
                  <div
                    key={cumple.id}
                    className={`p-3 rounded-lg cursor-pointer ${
                      cumple.tipo === 'equipo' 
                        ? 'bg-success/10 hover:bg-success/20' 
                        : 'bg-primary/10 hover:bg-primary/20'
                    }`}
                    onClick={() => handleClickCumpleanos(cumple)}
                  >
                    <span className="font-medium">{cumple.nombre} {cumple.apellido}</span>
                    <Badge variant="outline" className="ml-2">
                      {cumple.tipo === 'equipo' ? 'Equipo' : 'Participante'}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Eventos */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                Eventos ({eventosDelDia.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {eventosDelDia.length === 0 ? (
                <p className="text-muted-foreground text-sm">No hay eventos</p>
              ) : (
                eventosDelDia.map(evento => {
                  const esTodoElDia = evento.hora_inicio.substring(0, 5) === "00:00" && evento.hora_fin.substring(0, 5) === "23:59";
                  return (
                    <div
                      key={evento.id}
                      className="p-3 rounded-lg bg-accent hover:bg-accent/80 cursor-pointer"
                      onClick={() => openEditDialog(evento, format(selectedDate, 'yyyy-MM-dd'))}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{evento.titulo}</div>
                          <div className="text-sm text-muted-foreground">
                            {esTodoElDia ? 'Todo el día' : `${evento.hora_inicio.substring(0, 5)} - ${evento.hora_fin.substring(0, 5)}`}
                          </div>
                          {evento.lugar && <div className="text-sm text-muted-foreground">📍 {evento.lugar}</div>}
                        </div>
                        <Badge variant="secondary">{evento.tipo}</Badge>
                      </div>
                    </div>
                  );
                })
              )}
              <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => openCreateDialog(selectedDate)}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo evento
              </Button>
            </CardContent>
          </Card>

          {/* Actividades */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <CheckSquare className="h-5 w-5" />
                Tareas ({actividadesDelDia.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {actividadesDelDia.length === 0 ? (
                <p className="text-muted-foreground text-sm">No hay tareas con fecha límite hoy</p>
              ) : (
                actividadesDelDia.map(act => (
                  <div
                    key={act.id}
                    className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
                  >
                    <div className="flex items-start gap-2">
                      <CheckSquare className="h-4 w-4 text-amber-600 mt-0.5" />
                      <div>
                        <div className="font-medium text-amber-900 dark:text-amber-200">{act.titulo}</div>
                        {act.descripcion && (
                          <div className="text-sm text-amber-700 dark:text-amber-400">{act.descripcion}</div>
                        )}
                        <Badge variant="outline" className="mt-1 text-amber-600 border-amber-300">
                          {act.estado === 'planificado' ? 'Planificado' : 'En curso'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderVistaLista = () => {
    const todosLosEventos = eventos.map(e => ({ ...e }));
    const eventosOrdenados = todosLosEventos.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Lista de Eventos</h2>
        
        {eventosOrdenados.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No hay eventos programados
          </div>
        ) : (
          <div className="space-y-3">
            {eventosOrdenados.map((evento, index) => (
              <Card key={`${evento.id}-${index}`} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold">{evento.titulo}</h3>
                        <Badge variant="secondary">{evento.tipo}</Badge>
                        {evento.repeticion && evento.repeticion !== 'ninguna' && (
                          <Badge variant="outline">
                            {evento.repeticion}
                            {!evento.fecha_fin_repeticion && ' (indefinido)'}
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>📅 {format(new Date(evento.fecha), 'dd/MM/yyyy', { locale: es })}</div>
                        <div>🕒 {evento.hora_inicio.substring(0, 5) === "00:00" && evento.hora_fin.substring(0, 5) === "23:59" 
                          ? "Todo el día" 
                          : `${evento.hora_inicio.substring(0, 5)} - ${evento.hora_fin.substring(0, 5)}`}
                        </div>
                        {evento.lugar && <div>📍 {evento.lugar}</div>}
                      </div>
                    </div>
                    <TooltipProvider>
                      <div className="flex space-x-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(evento)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Editar evento</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDeleteConfirm({ open: true, id: evento.id })}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Eliminar evento</TooltipContent>
                        </Tooltip>
                      </div>
                    </TooltipProvider>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderVistaCalendario = () => {
    if (tipoVista === 'anual') return renderVistaAnual();
    if (tipoVista === 'diaria') return renderVistaDiaria();
    return renderVistaMensual();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-2 sm:p-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Calendario de Eventos</h1>
        <div className="flex flex-wrap gap-2">
          {/* Selector de tipo de vista */}
          {vistaActual === 'calendario' && (
            <Select value={tipoVista} onValueChange={(v) => setTipoVista(v as TipoVista)}>
              <SelectTrigger className="w-[110px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="anual">Año</SelectItem>
                <SelectItem value="mensual">Mes</SelectItem>
                <SelectItem value="diaria">Día</SelectItem>
              </SelectContent>
            </Select>
          )}
          
          {/* Vista calendario/lista */}
          <div className="flex rounded-lg border bg-background">
            <Button
              variant={vistaActual === 'calendario' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setVistaActual('calendario')}
              className="rounded-r-none h-8"
            >
              <CalendarDays className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Calendario</span>
            </Button>
            <Button
              variant={vistaActual === 'lista' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setVistaActual('lista')}
              className="rounded-l-none h-8"
            >
              <List className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Lista</span>
            </Button>
          </div>
          <Button size="sm" className="h-8" onClick={() => openCreateDialog()}>
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Nuevo Evento</span>
          </Button>
        </div>
      </div>

      {vistaActual === 'calendario' ? renderVistaCalendario() : renderVistaLista()}

      {/* Dialog para crear/editar eventos */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto">
          <DialogHeader className="pb-2">
            <DialogTitle>
              {editingEvento ? 'Editar Evento' : 'Crear Nuevo Evento'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <Label htmlFor="titulo" className="text-sm">Título *</Label>
              <Input
                id="titulo"
                value={formData.titulo}
                onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                required
                className="h-9"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-sm">Fecha *</Label>
                <DatePicker
                  date={(() => {
                    if (!formData.fecha) return undefined;
                    const [year, month, day] = formData.fecha.split('-').map(Number);
                    return new Date(year, month - 1, day);
                  })()}
                  onSelect={(date) => {
                    if (date) {
                      setFormData(prev => ({ ...prev, fecha: format(date, 'yyyy-MM-dd') }));
                    }
                  }}
                  placeholder="Fecha"
                  className="h-9"
                />
              </div>
              <div>
                <Label className="text-sm">Tipo *</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, tipo: value as Evento['tipo'] }))}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reunion">Reunión</SelectItem>
                    <SelectItem value="taller">Taller</SelectItem>
                    <SelectItem value="actividad">Actividad</SelectItem>
                    <SelectItem value="seguimiento">Seguimiento</SelectItem>
                    <SelectItem value="celebracion">Celebración</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end pb-1">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="todoElDia"
                    checked={formData.todoElDia}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, todoElDia: checked as boolean }))}
                  />
                  <Label htmlFor="todoElDia" className="text-sm">Todo el día</Label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {!formData.todoElDia ? (
                <>
                  <div>
                    <Label className="text-sm">Hora inicio *</Label>
                    <TimeInput24h
                      value={formData.hora_inicio}
                      onChange={(value) => setFormData(prev => ({ ...prev, hora_inicio: value }))}
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Hora fin *</Label>
                    <TimeInput24h
                      value={formData.hora_fin}
                      onChange={(value) => setFormData(prev => ({ ...prev, hora_fin: value }))}
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Lugar</Label>
                    <Input
                      value={formData.lugar}
                      onChange={(e) => setFormData(prev => ({ ...prev, lugar: e.target.value }))}
                      className="h-9"
                    />
                  </div>
                </>
              ) : (
                <div className="col-span-3">
                  <Label className="text-sm">Lugar</Label>
                  <Input
                    value={formData.lugar}
                    onChange={(e) => setFormData(prev => ({ ...prev, lugar: e.target.value }))}
                    className="h-9"
                  />
                </div>
              )}
            </div>

            <div>
              <Label className="text-sm">Descripción</Label>
              <Textarea
                value={formData.descripcion}
                onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                rows={2}
                className="resize-none"
              />
            </div>

            <div>
              <Label className="text-sm">Participantes</Label>
              <div className="grid grid-cols-2 gap-2">
                <Select onValueChange={(value) => {
                  const profesionalesActivos = profesionales.filter(p => p.estado === 'activo');
                  let nombres: string[] = [];
                  if (value === 'todos_activos') {
                    nombres = profesionalesActivos.map(p => `${p.nombre} ${p.apellido}`);
                  } else if (value === 'equipo_ampliado') {
                    nombres = profesionalesActivos.filter(p => p.equipoAmpliado).map(p => `${p.nombre} ${p.apellido}`);
                  } else if (value === 'equipo_coordinador') {
                    nombres = profesionalesActivos.filter(p => !p.equipoAmpliado).map(p => `${p.nombre} ${p.apellido}`);
                  }
                  if (nombres.length > 0) {
                    setFormData(prev => ({ ...prev, participantes: nombres.join(', ') }));
                  }
                }}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Grupo..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos_activos">Todos Activos</SelectItem>
                    <SelectItem value="equipo_ampliado">Equipo Ampliado</SelectItem>
                    <SelectItem value="equipo_coordinador">Equipo Coordinador</SelectItem>
                  </SelectContent>
                </Select>
                <Select onValueChange={(value) => {
                  const profesionalesActivos = profesionales.filter(p => p.estado === 'activo');
                  const profesional = profesionalesActivos.find(p => p.id.toString() === value);
                  if (profesional) {
                    const nombreCompleto = `${profesional.nombre} ${profesional.apellido}`;
                    const participantesActuales = formData.participantes ? formData.participantes.split(',').map(p => p.trim()) : [];
                    if (!participantesActuales.includes(nombreCompleto)) {
                      setFormData(prev => ({ ...prev, participantes: [...participantesActuales, nombreCompleto].join(', ') }));
                    }
                  }
                }}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Agregar miembro..." />
                  </SelectTrigger>
                  <SelectContent>
                    {profesionales.filter(p => p.estado === 'activo').map(profesional => (
                      <SelectItem key={profesional.id} value={profesional.id.toString()}>
                        {profesional.nombre} {profesional.apellido}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Input
                value={formData.participantes}
                onChange={(e) => setFormData(prev => ({ ...prev, participantes: e.target.value }))}
                placeholder="Nombres separados por comas..."
                className="h-9 mt-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 items-end">
              <div className="flex items-center space-x-2 pb-1">
                <Checkbox
                  id="recordatorio"
                  checked={formData.recordatorio}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, recordatorio: checked as boolean }))}
                />
                <Label htmlFor="recordatorio" className="text-sm">Recordatorio</Label>
              </div>
              <div>
                <Label className="text-sm">Repetición</Label>
                <Select
                  value={formData.repeticion}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, repeticion: value as any }))}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ninguna">Sin repetición</SelectItem>
                    <SelectItem value="semanal">Semanal</SelectItem>
                    <SelectItem value="mensual">Mensual</SelectItem>
                    <SelectItem value="anualmente">Anualmente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.repeticion && formData.repeticion !== 'ninguna' && (
              <div>
                <Label className="text-sm">Fecha fin repetición (dejar vacío para indefinido)</Label>
                <DatePicker
                  date={(() => {
                    if (!formData.fecha_fin_repeticion) return undefined;
                    const [year, month, day] = formData.fecha_fin_repeticion.split('-').map(Number);
                    return new Date(year, month - 1, day);
                  })()}
                  onSelect={(date) => {
                    if (date) {
                      setFormData(prev => ({ ...prev, fecha_fin_repeticion: format(date, 'yyyy-MM-dd') }));
                    } else {
                      setFormData(prev => ({ ...prev, fecha_fin_repeticion: '' }));
                    }
                  }}
                  placeholder="Sin fecha fin (indefinido)"
                  className="h-9"
                />
              </div>
            )}

            <div className="flex justify-between pt-3 border-t">
              {editingEvento ? (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setDeleteConfirm({ open: true, id: editingEvento.id });
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Eliminar
                </Button>
              ) : (
                <div></div>
              )}
              <div className="flex space-x-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" size="sm">
                  {editingEvento ? 'Actualizar' : 'Crear'}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de recurrencia */}
      <Dialog open={showRecurrenceDialog} onOpenChange={setShowRecurrenceDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Modificar evento recurrente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Este evento se repite. ¿Deseas modificar solo esta instancia o todas las futuras?
            </p>
            <div className="flex flex-col gap-2">
              <Button 
                onClick={() => handleRecurrenceChoice(true)}
                variant="outline"
              >
                Solo este evento ({formData.fecha})
              </Button>
              <Button 
                onClick={() => handleRecurrenceChoice(false)}
              >
                Todos los eventos de esta serie
              </Button>
            </div>
            <div className="flex justify-end">
              <Button 
                variant="ghost" 
                onClick={() => {
                  setShowRecurrenceDialog(false);
                  setPendingEventUpdate(null);
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de detalles de persona */}
      <Dialog open={isPersonaDialogOpen} onOpenChange={setIsPersonaDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {personaSeleccionada?.tipo === 'equipo' ? '👤 Miembro del Equipo' : '💜 Participante'}
            </DialogTitle>
          </DialogHeader>
          {personaSeleccionada && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm text-muted-foreground">Nombre completo</Label>
                <p className="text-lg font-semibold">
                  {personaSeleccionada.nombre} {personaSeleccionada.apellido}
                </p>
              </div>

              {personaSeleccionada.rol && (
                <div>
                  <Label className="text-sm text-muted-foreground">Rol</Label>
                  <p className="font-medium">{personaSeleccionada.rol}</p>
                </div>
              )}

              {personaSeleccionada.fecha_nacimiento && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Fecha de nacimiento</Label>
                    <p className="font-medium">
                      {format(new Date(personaSeleccionada.fecha_nacimiento), 'dd/MM/yyyy', { locale: es })}
                    </p>
                  </div>
                  {personaSeleccionada.edad !== undefined && (
                    <div>
                      <Label className="text-sm text-muted-foreground">Edad</Label>
                      <p className="font-medium">{personaSeleccionada.edad} años</p>
                    </div>
                  )}
                </div>
              )}

              <div className="border-t pt-4">
                <Label className="text-sm text-muted-foreground mb-2 block">Datos de contacto</Label>
                <div className="space-y-2">
                  {personaSeleccionada.telefono && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm">📞</span>
                      <p className="text-sm">{personaSeleccionada.telefono}</p>
                    </div>
                  )}
                  {personaSeleccionada.email && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm">📧</span>
                      <p className="text-sm">{personaSeleccionada.email}</p>
                    </div>
                  )}
                  {!personaSeleccionada.telefono && !personaSeleccionada.email && (
                    <p className="text-sm text-muted-foreground italic">
                      No hay datos de contacto registrados
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={() => setIsPersonaDialogOpen(false)}>
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ open, id: null })}
        onConfirm={() => deleteConfirm.id && handleEliminarEvento(deleteConfirm.id)}
        title="¿Eliminar evento?"
        description="Esta acción no se puede deshacer. El evento será eliminado permanentemente. Si el evento tenía recordatorio habilitado, se notificará la cancelación a los participantes."
      />
    </div>
  );
};

export default Calendario;
