import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DatePicker } from "@/components/ui/date-picker";
import { Plus, Trash2, Users, Calendar, Phone, PhoneCall, Building2, FileText, UserCheck, MapPin, X } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { centroDiaStore, type RegistroCentroDia } from "@/lib/centroDiaStore";
import { mujeresStore, type Mujer } from "@/lib/mujeresStore";
import { trabajoCampoStore } from "@/lib/trabajoCampoStore";
import { equipoStore, type Profesional } from "@/lib/equipoStore";

interface FormularioCentroDiaProps {
  registro?: RegistroCentroDia;
  onClose: () => void;
  onSave: () => void;
}

const FormularioCentroDia = ({ registro, onClose, onSave }: FormularioCentroDiaProps) => {
  const [registroActual, setRegistroActual] = useState<Omit<RegistroCentroDia, 'id'>>({
    fecha: new Date().toISOString().split('T')[0],
    mujeresAsistieron: [],
    talleresActividades: '',
    llamadasRecibidas: [],
    llamadasHechas: [],
    articulacionInstituciones: '',
    tramites: [],
    trabajoCampoResumen: '',
    equipoTrabajo: '',
    comentariosObservaciones: ''
  });
  const [mujeres, setMujeres] = useState<Mujer[]>([]);
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [nuevoTramite, setNuevoTramite] = useState({ tipo: '', cantidad: 1 });
  const [equipoSeleccionado, setEquipoSeleccionado] = useState<Profesional[]>([]);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const mujeresData = await mujeresStore.getMujeres();
        setMujeres(mujeresData);
        const profesionalesData = await equipoStore.getProfesionalesActivos();
        setProfesionales(profesionalesData);
      } catch (error) {
        console.error('Error cargando datos:', error);
        setMujeres(mujeresStore.getMujeresSync());
        const profesionalesData = await equipoStore.getProfesionalesActivos();
        setProfesionales(profesionalesData);
      }
    };
    
    cargarDatos();
    
    if (registro) {
      setRegistroActual({
        fecha: registro.fecha,
        mujeresAsistieron: registro.mujeresAsistieron,
        talleresActividades: registro.talleresActividades,
        llamadasRecibidas: registro.llamadasRecibidas,
        llamadasHechas: registro.llamadasHechas,
        articulacionInstituciones: registro.articulacionInstituciones,
        tramites: registro.tramites,
        trabajoCampoResumen: registro.trabajoCampoResumen,
        equipoTrabajo: registro.equipoTrabajo || '',
        comentariosObservaciones: registro.comentariosObservaciones || ''
      });
      
      // Cargar equipo seleccionado desde el texto (será cargado en otro useEffect)
    }
  }, [registro]);

  // Efecto separado para cargar el equipo seleccionado
  useEffect(() => {
    const cargarEquipoSeleccionado = async () => {
      if (registro?.equipoTrabajo) {
        const nombresEquipo = registro.equipoTrabajo.split(',').map(n => n.trim());
        const profesionalesActivos = await equipoStore.getProfesionalesActivos();
        const equipoEncontrado = profesionalesActivos.filter(p => 
          nombresEquipo.some(nombre => `${p.nombre} ${p.apellido}` === nombre)
        );
        setEquipoSeleccionado(equipoEncontrado);
      }
    };
    
    cargarEquipoSeleccionado();
  }, [registro?.equipoTrabajo]);

  useEffect(() => {
    // Auto-cargar trabajo de campo si existe para la fecha actual
    const cargarTrabajoCampo = async () => {
      if (registroActual.fecha) {
        const trabajoCampo = await trabajoCampoStore.getTrabajoByFecha(registroActual.fecha);
        if (trabajoCampo) {
          setRegistroActual(prev => ({
            ...prev,
            trabajoCampoResumen: trabajoCampo.descripcion
          }));
        }
      }
    };
    cargarTrabajoCampo();
  }, [registroActual.fecha]);

  const agregarMujerAsistencia = (mujer: Mujer) => {
    const yaEsta = registroActual.mujeresAsistieron.some(m => m.mujer.id === mujer.id);
    if (!yaEsta) {
      setRegistroActual(prev => ({
        ...prev,
        mujeresAsistieron: [...prev.mujeresAsistieron, { mujer, entrevistaRealizada: false }]
      }));
    }
  };

  const toggleEntrevista = (mujerIndex: number) => {
    setRegistroActual(prev => ({
      ...prev,
      mujeresAsistieron: prev.mujeresAsistieron.map((item, index) => 
        index === mujerIndex ? { ...item, entrevistaRealizada: !item.entrevistaRealizada } : item
      )
    }));
  };

  const removerMujerAsistencia = (mujerIndex: number) => {
    setRegistroActual(prev => ({
      ...prev,
      mujeresAsistieron: prev.mujeresAsistieron.filter((_, index) => index !== mujerIndex)
    }));
  };

  const agregarTramite = () => {
    if (nuevoTramite.tipo.trim() && nuevoTramite.cantidad > 0) {
      setRegistroActual(prev => ({
        ...prev,
        tramites: [...prev.tramites, { ...nuevoTramite }]
      }));
      setNuevoTramite({ tipo: '', cantidad: 1 });
    }
  };

  const removerTramite = (index: number) => {
    setRegistroActual(prev => ({
      ...prev,
      tramites: prev.tramites.filter((_, i) => i !== index)
    }));
  };

  const agregarProfesionalEquipo = (profesional: Profesional) => {
    const yaEsta = equipoSeleccionado.some(p => p.id === profesional.id);
    if (!yaEsta) {
      const nuevoEquipo = [...equipoSeleccionado, profesional];
      setEquipoSeleccionado(nuevoEquipo);
      setRegistroActual(prev => ({
        ...prev,
        equipoTrabajo: nuevoEquipo.map(p => `${p.nombre} ${p.apellido}`).join(', ')
      }));
    }
  };

  const removerProfesionalEquipo = (profesionalId: string) => {
    const nuevoEquipo = equipoSeleccionado.filter(p => p.id !== profesionalId);
    setEquipoSeleccionado(nuevoEquipo);
    setRegistroActual(prev => ({
      ...prev,
      equipoTrabajo: nuevoEquipo.map(p => `${p.nombre} ${p.apellido}`).join(', ')
    }));
  };

  const guardarRegistro = async () => {
    // Validación del campo obligatorio Equipo de Trabajo
    if (!registroActual.equipoTrabajo || registroActual.equipoTrabajo.trim() === '') {
      toast.error("El campo 'Equipo de Trabajo' es obligatorio");
      return;
    }

    try {
      if (registro) {
        await centroDiaStore.actualizarRegistro(registro.id, registroActual);
        toast.success("Registro actualizado exitosamente");
      } else {
        await centroDiaStore.agregarRegistro(registroActual);
        toast.success("Registro del Centro de Día guardado exitosamente");
      }
      onSave();
      onClose();
    } catch (error) {
      console.error('Error al guardar registro:', error);
      toast.error("Error al guardar el registro");
    }
  };

  const totalTramites = registroActual.tramites.reduce((sum, tramite) => sum + tramite.cantidad, 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {registro ? 'Editar Registro del Centro de Día' : 'Nuevo Registro del Centro de Día'}
            </CardTitle>
            <Button variant="outline" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Fecha */}
          <div>
            <Label htmlFor="fecha">Fecha</Label>
            <DatePicker
              date={registroActual.fecha ? new Date(registroActual.fecha) : undefined}
              onSelect={(date) => {
                if (date) {
                  const nuevaFecha = format(date, "yyyy-MM-dd");
                  setRegistroActual(prev => ({ ...prev, fecha: nuevaFecha }));
                }
              }}
              placeholder="Seleccionar fecha"
            />
          </div>

          {/* Mujeres Asistentes */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-5 w-5" />
              <Label>Mujeres Asistentes ({registroActual.mujeresAsistieron.length})</Label>
            </div>
            
            <div className="mb-3">
              <Select onValueChange={(value) => {
                const mujer = mujeres.find(m => m.id.toString() === value);
                if (mujer) agregarMujerAsistencia(mujer);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar mujer registrada" />
                </SelectTrigger>
                <SelectContent>
                  {mujeres.map(mujer => (
                    <SelectItem key={mujer.id} value={mujer.id.toString()}>
                      {mujer.nombre} {mujer.apellido}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {registroActual.mujeresAsistieron.length > 0 && (
              <div className="border rounded-lg p-4 space-y-2">
                {registroActual.mujeresAsistieron.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-3">
                      <span>{item.mujer.nombre} {item.mujer.apellido}</span>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={item.entrevistaRealizada}
                          onCheckedChange={() => toggleEntrevista(index)}
                        />
                        <Label className="text-sm">Entrevista realizada</Label>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removerMujerAsistencia(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Talleres y Actividades */}
          <div>
            <Label htmlFor="talleres">Talleres y Actividades</Label>
            <Textarea
              id="talleres"
              value={registroActual.talleresActividades}
              onChange={(e) => setRegistroActual(prev => ({ ...prev, talleresActividades: e.target.value }))}
              placeholder="Describir talleres y actividades realizadas..."
            />
          </div>

          {/* Llamadas */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="llamadas-recibidas" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Llamadas Recibidas
              </Label>
              <Input
                id="llamadas-recibidas"
                type="number"
                min="0"
                value={registroActual.llamadasRecibidas?.length || 0}
                onChange={(e) => {
                  const cantidad = parseInt(e.target.value) || 0;
                  const nuevasLlamadas = Array.from({length: cantidad}, (_, i) => ({
                    nombre: `Llamada ${i + 1}`,
                    descripcion: ''
                  }));
                  setRegistroActual(prev => ({ ...prev, llamadasRecibidas: nuevasLlamadas }));
                }}
              />
            </div>
            <div>
              <Label htmlFor="llamadas-hechas" className="flex items-center gap-2">
                <PhoneCall className="h-4 w-4" />
                Llamadas Realizadas
              </Label>
              <Input
                id="llamadas-hechas"
                type="number"
                min="0"
                value={registroActual.llamadasHechas?.length || 0}
                onChange={(e) => {
                  const cantidad = parseInt(e.target.value) || 0;
                  const nuevasLlamadas = Array.from({length: cantidad}, (_, i) => ({
                    nombre: `Llamada ${i + 1}`,
                    descripcion: ''
                  }));
                  setRegistroActual(prev => ({ ...prev, llamadasHechas: nuevasLlamadas }));
                }}
              />
            </div>
          </div>

          {/* Articulación con Instituciones */}
          <div>
            <Label htmlFor="articulacion">Articulación con Otras Instituciones</Label>
            <Textarea
              id="articulacion"
              value={registroActual.articulacionInstituciones}
              onChange={(e) => setRegistroActual(prev => ({ ...prev, articulacionInstituciones: e.target.value }))}
              placeholder="Describir articulaciones realizadas con otras instituciones..."
            />
          </div>

          {/* Trámites */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-5 w-5" />
              <Label>Trámites Realizados ({totalTramites})</Label>
            </div>
            
            <div className="grid md:grid-cols-3 gap-2 mb-3">
              <Input
                placeholder="Tipo de trámite"
                value={nuevoTramite.tipo}
                onChange={(e) => setNuevoTramite(prev => ({ ...prev, tipo: e.target.value }))}
              />
              <Input
                type="number"
                min="1"
                placeholder="Cantidad"
                value={nuevoTramite.cantidad}
                onChange={(e) => setNuevoTramite(prev => ({ ...prev, cantidad: parseInt(e.target.value) || 1 }))}
              />
              <Button onClick={agregarTramite} type="button">
                <Plus className="h-4 w-4 mr-1" />
                Agregar
              </Button>
            </div>

            {registroActual.tramites.length > 0 && (
              <div className="space-y-2">
                {registroActual.tramites.map((tramite, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span>{tramite.tipo}: {tramite.cantidad}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removerTramite(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Equipo de Trabajo */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4" />
              <Label>Equipo de Trabajo ({equipoSeleccionado.length}) *</Label>
            </div>
            
            <div className="mb-3">
              <Select onValueChange={(value) => {
                const profesional = profesionales.find(p => p.id.toString() === value);
                if (profesional) agregarProfesionalEquipo(profesional);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar profesional del equipo" />
                </SelectTrigger>
                <SelectContent>
                  {profesionales.map(profesional => (
                    <SelectItem key={profesional.id} value={profesional.id.toString()}>
                      {profesional.nombre} {profesional.apellido} - {profesional.cargo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {equipoSeleccionado.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {equipoSeleccionado.map((profesional) => (
                  <Badge key={profesional.id} variant="secondary" className="flex items-center gap-2">
                    {profesional.nombre} {profesional.apellido}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 ml-1"
                      onClick={() => removerProfesionalEquipo(profesional.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Trabajo de Campo */}
          <div>
            <Label htmlFor="trabajo-campo" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Resumen del Trabajo de Campo
            </Label>
            <Textarea
              id="trabajo-campo"
              value={registroActual.trabajoCampoResumen}
              onChange={(e) => setRegistroActual(prev => ({ ...prev, trabajoCampoResumen: e.target.value }))}
              placeholder="Resumen del trabajo de campo realizado este día..."
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={guardarRegistro}>
              {registro ? 'Actualizar Registro' : 'Guardar Registro'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FormularioCentroDia;