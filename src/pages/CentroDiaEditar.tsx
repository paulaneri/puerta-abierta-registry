import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DatePicker } from "@/components/ui/date-picker";
import { Plus, Trash2, Users, Calendar, Phone, PhoneCall, Building2, FileText, UserCheck, MapPin, X, ArrowLeft, Save, Search } from "lucide-react";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { UnsavedChangesDialog } from "@/components/ui/unsaved-changes-dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { centroDiaStore, type RegistroCentroDia } from "@/lib/centroDiaStore";
import { mujeresStore, type Mujer } from "@/lib/mujeresStore";
import { trabajoCampoStore } from "@/lib/trabajoCampoStore";
import { equipoStore, type Profesional } from "@/lib/equipoStore";

const CentroDiaEditar = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [registro, setRegistro] = useState<RegistroCentroDia | null>(null);
  const [cargando, setCargando] = useState(true);
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
  const [nuevaMujer, setNuevaMujer] = useState({ nombre: '', apellido: '', apodo: '' });
  const [mostrarFormularioMujer, setMostrarFormularioMujer] = useState(false);
  const [busquedaMujer, setBusquedaMujer] = useState('');
  const [nuevaLlamadaRecibida, setNuevaLlamadaRecibida] = useState({ nombre: '', descripcion: '' });
  const [nuevaLlamadaHecha, setNuevaLlamadaHecha] = useState({ nombre: '', descripcion: '' });
  const [hasChanges, setHasChanges] = useState(false);

  const { showWarning, confirmNavigation, cancelNavigation, handleNavigateBack } = useUnsavedChanges(hasChanges);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const mujeresData = await mujeresStore.getMujeres();
        setMujeres(mujeresData);
        const profesionalesData = await equipoStore.getProfesionalesActivos();
        setProfesionales(profesionalesData);
        
        if (id) {
          const registroEncontrado = await centroDiaStore.getRegistroPorId(id);
          if (registroEncontrado) {
            setRegistro(registroEncontrado);
            setRegistroActual({
              fecha: registroEncontrado.fecha,
              mujeresAsistieron: registroEncontrado.mujeresAsistieron,
              talleresActividades: registroEncontrado.talleresActividades,
              llamadasRecibidas: registroEncontrado.llamadasRecibidas || [],
              llamadasHechas: registroEncontrado.llamadasHechas || [],
              articulacionInstituciones: registroEncontrado.articulacionInstituciones,
              tramites: registroEncontrado.tramites,
              trabajoCampoResumen: '',
              equipoTrabajo: registroEncontrado.equipoTrabajo,
              comentariosObservaciones: registroEncontrado.comentariosObservaciones || ''
            });
            
            // Parsear y cargar equipo de trabajo
            if (registroEncontrado.equipoTrabajo) {
              const profesionalesEnEquipo = profesionalesData.filter(prof => {
                const nombreCompleto = `${prof.nombre} ${prof.apellido}`;
                return registroEncontrado.equipoTrabajo.includes(nombreCompleto);
              });
              setEquipoSeleccionado(profesionalesEnEquipo);
            }
            
            // Cargar automáticamente el trabajo de campo para la fecha del registro
            cargarTrabajoCampoDia(registroEncontrado.fecha);
          } else {
            toast.error("Registro no encontrado");
            navigate('/centro-dia');
          }
        } else {
          // Cargar trabajo de campo automáticamente
          cargarTrabajoCampoDia(registroActual.fecha);
        }
      } catch (error) {
        console.error('Error cargando datos:', error);
        // Usar arrays vacíos como fallback
        setMujeres([]);
        setProfesionales([]);
      } finally {
        setCargando(false);
      }
    };
    
    cargarDatos();
  }, [id, navigate]);

  const cargarTrabajoCampoDia = async (fecha: string) => {
    const trabajosCampo = await trabajoCampoStore.getTrabajosCampo();
    const trabajosHoy = trabajosCampo.filter(trabajo => trabajo.fecha === fecha);
    
    if (trabajosHoy.length > 0) {
      const resumenCompleto = trabajosHoy.map(trabajo => {
        const equipoText = trabajo.profesionales.length > 0 
          ? ` (Equipo: ${trabajo.profesionales.join(', ')})` 
          : '';
        
        const encuentrosText = trabajo.encuentros.length > 0
          ? `\nEncuentros: ${trabajo.encuentros.map(e => 
              `${e.nombre} ${e.apellido}${e.conversacion ? ` - ${e.conversacion}` : ''}`
            ).join('; ')}`
          : '';
          
        return `${trabajo.lugar}${equipoText}: ${trabajo.descripcion}${encuentrosText}`;
      }).join('\n\n');
      
      setRegistroActual(prev => ({
        ...prev,
        trabajoCampoResumen: resumenCompleto
      }));
    } else {
      // Si no hay trabajo de campo para esa fecha, limpiar el campo
      setRegistroActual(prev => ({
        ...prev,
        trabajoCampoResumen: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!registro) return;
    
    try {
      const equipoNombres = equipoSeleccionado.map(p => `${p.nombre} ${p.apellido} - ${p.cargo}`).join(', ');
      
      const registroCompleto = {
        ...registroActual,
        equipoTrabajo: equipoNombres
      };

      await centroDiaStore.actualizarRegistro(registro.id, registroCompleto);
      toast.success("Registro actualizado exitosamente");
      setHasChanges(false);
      navigate('/centro-dia');
    } catch (error) {
      console.error('Error actualizando registro:', error);
      toast.error("Error al actualizar el registro. Por favor, intente nuevamente.");
    }
  };

  const agregarMujer = (mujer: Mujer) => {
    const yaEsta = registroActual.mujeresAsistieron.some(m => m.mujer.id === mujer.id);
    if (!yaEsta) {
      setRegistroActual(prev => ({
        ...prev,
        mujeresAsistieron: [...prev.mujeresAsistieron, { mujer, entrevistaRealizada: false }]
      }));
      setHasChanges(true);
    }
  };

  const quitarMujer = (mujerIndex: number) => {
    const mujerAEliminar = registroActual.mujeresAsistieron[mujerIndex];
    console.log('Eliminando mujer:', mujerAEliminar);
    console.log('Índice a eliminar:', mujerIndex);
    console.log('Estado antes de eliminar:', registroActual.mujeresAsistieron);
    
    setRegistroActual(prev => {
      const nuevoEstado = {
        ...prev,
        mujeresAsistieron: prev.mujeresAsistieron.filter((_, index) => index !== mujerIndex)
      };
      console.log('Estado después de eliminar:', nuevoEstado.mujeresAsistieron);
      return nuevoEstado;
    });
  };

  const toggleEntrevista = (mujerIndex: number) => {
    setRegistroActual(prev => ({
      ...prev,
      mujeresAsistieron: prev.mujeresAsistieron.map((item, index) => 
        index === mujerIndex ? { ...item, entrevistaRealizada: !item.entrevistaRealizada } : item
      )
    }));
  };

  const agregarTramite = () => {
    if (nuevoTramite.tipo.trim()) {
      setRegistroActual(prev => ({
        ...prev,
        tramites: [...prev.tramites, nuevoTramite]
      }));
      setNuevoTramite({ tipo: '', cantidad: 1 });
    }
  };

  const quitarTramite = (index: number) => {
    setRegistroActual(prev => ({
      ...prev,
      tramites: prev.tramites.filter((_, i) => i !== index)
    }));
  };

  const agregarProfesional = (profesional: Profesional) => {
    if (!equipoSeleccionado.find(p => p.id === profesional.id)) {
      setEquipoSeleccionado(prev => [...prev, profesional]);
    }
  };

  const quitarProfesional = (profesionalId: string) => {
    setEquipoSeleccionado(prev => prev.filter(p => p.id !== profesionalId));
  };

  const agregarNuevaMujer = async () => {
    if (nuevaMujer.nombre.trim() && nuevaMujer.apellido.trim()) {
      const nuevaMujerCompleta: Mujer = {
        id: crypto.randomUUID(),
        nombre: nuevaMujer.nombre,
        apellido: nuevaMujer.apellido,
        apodo: nuevaMujer.apodo,
        fechaNacimiento: '',
        nacionalidad: '',
        telefono: '',
        email: '',
        direccion: '',
        documentacion: '',
        hijosACargo: false,
        fechaRegistro: new Date().toISOString().split('T')[0],
        origenRegistro: 'centro-dia',
        acompanamientos: [],
        documentos: []
      };
      
      try {
        const success = await mujeresStore.agregarMujer(nuevaMujerCompleta);
        if (success) {
          const mujeresActualizadas = await mujeresStore.getMujeres();
          setMujeres(mujeresActualizadas);
          
          // Buscar la mujer recién agregada en la lista actualizada
          const mujerAgregada = mujeresActualizadas.find(m => 
            m.nombre === nuevaMujer.nombre && m.apellido === nuevaMujer.apellido
          );
          
          if (mujerAgregada) {
            agregarMujer(mujerAgregada);
          }
          
          setNuevaMujer({ nombre: '', apellido: '', apodo: '' });
          setMostrarFormularioMujer(false);
          toast.success("Nueva mujer registrada y agregada al registro");
        } else {
          toast.error("Error al registrar la mujer");
        }
      } catch (error) {
        console.error('Error agregando mujer:', error);
        toast.error("Error al registrar la mujer");
      }
    }
  };

  const mujeresFiltradas = mujeres.filter(mujer => {
    const busqueda = busquedaMujer.toLowerCase();
    const cumpleFiltro = (
      mujer.nombre.toLowerCase().includes(busqueda) ||
      mujer.apellido.toLowerCase().includes(busqueda) ||
      (mujer.apodo && mujer.apodo.toLowerCase().includes(busqueda))
    );
    
    // Log especial para Juana Repeto
    if (mujer.nombre === 'Juana' && mujer.apellido === 'Repeto') {
      console.log('Juana Repeto en lista completa de mujeres:', mujer);
      console.log('Cumple filtro de búsqueda:', cumpleFiltro);
    }
    
    return cumpleFiltro;
  });

  const agregarLlamadaRecibida = () => {
    if (nuevaLlamadaRecibida.nombre.trim()) {
      setRegistroActual(prev => ({
        ...prev,
        llamadasRecibidas: [...prev.llamadasRecibidas, nuevaLlamadaRecibida]
      }));
      setNuevaLlamadaRecibida({ nombre: '', descripcion: '' });
    }
  };

  const quitarLlamadaRecibida = (index: number) => {
    setRegistroActual(prev => ({
      ...prev,
      llamadasRecibidas: prev.llamadasRecibidas.filter((_, i) => i !== index)
    }));
  };

  const agregarLlamadaHecha = () => {
    if (nuevaLlamadaHecha.nombre.trim()) {
      setRegistroActual(prev => ({
        ...prev,
        llamadasHechas: [...prev.llamadasHechas, nuevaLlamadaHecha]
      }));
      setNuevaLlamadaHecha({ nombre: '', descripcion: '' });
    }
  };

  const quitarLlamadaHecha = (index: number) => {
    setRegistroActual(prev => ({
      ...prev,
      llamadasHechas: prev.llamadasHechas.filter((_, i) => i !== index)
    }));
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center">
        <Card className="p-8 max-w-md">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <h2 className="text-xl font-semibold">Buscando registro</h2>
            <p className="text-muted-foreground">
              Cargando información...
            </p>
          </div>
        </Card>
      </div>
    );
  }

  if (!registro) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center">
        <Card className="p-8 max-w-md">
          <div className="text-center space-y-4">
            <h2 className="text-xl font-semibold">Registro no encontrado</h2>
            <p className="text-muted-foreground">
              No se pudo encontrar el registro con ID: {id}
            </p>
            <Link to="/centro-dia">
              <Button variant="outline" className="mt-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver a la lista
              </Button>
            </Link>
          </div>
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
              <Button variant="outline" size="sm" onClick={() => handleNavigateBack('/centro-dia')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Editar Registro - Centro de Día</h1>
                <p className="text-muted-foreground">Modifica el registro del {new Date(registro.fecha).toLocaleDateString()}</p>
              </div>
            </div>
            <Button type="submit" onClick={handleSubmit}>
              <Save className="h-4 w-4 mr-2" />
              Guardar
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información Básica */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Información Básica
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fecha">Fecha *</Label>
                <DatePicker
                  date={registroActual.fecha ? new Date(registroActual.fecha) : undefined}
                  onSelect={(date) => {
                    if (date) {
                      const nuevaFecha = format(date, "yyyy-MM-dd");
                      setRegistroActual(prev => ({ ...prev, fecha: nuevaFecha }));
                      cargarTrabajoCampoDia(nuevaFecha);
                    }
                  }}
                  placeholder="Seleccionar fecha"
                />
                </div>
                <div>
                  <Label htmlFor="talleresActividades">Talleres y Actividades</Label>
                  <Textarea
                    id="talleresActividades"
                    value={registroActual.talleresActividades}
                    onChange={(e) => setRegistroActual(prev => ({ ...prev, talleresActividades: e.target.value }))}
                    placeholder="Describe las actividades realizadas..."
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mujeres que Asistieron y Equipo de Trabajo */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Mujeres que Asistieron */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 flex-wrap">
                  <Users className="h-5 w-5" />
                  Mujeres que Asistieron
                  <Badge variant="secondary" className="ml-2">
                    Total: {registroActual.mujeresAsistieron.length}
                  </Badge>
                  <Badge variant="outline" className="ml-1">
                    Entrevistas: {registroActual.mujeresAsistieron.filter(m => m.entrevistaRealizada).length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border rounded-lg p-4 bg-muted/20">
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <h4 className="font-medium">Agregar Participante</h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setMostrarFormularioMujer(!mostrarFormularioMujer)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Registrar Nueva
                    </Button>
                  </div>
                  
                  {mostrarFormularioMujer && (
                    <div className="mb-4 p-3 border rounded-lg bg-white">
                      <h5 className="font-medium mb-2">Registrar Nueva Mujer</h5>
                      <div className="grid grid-cols-1 gap-2 mb-2">
                        <Input
                          placeholder="Nombre"
                          value={nuevaMujer.nombre}
                          onChange={(e) => setNuevaMujer(prev => ({ ...prev, nombre: e.target.value }))}
                        />
                        <Input
                          placeholder="Apellido"
                          value={nuevaMujer.apellido}
                          onChange={(e) => setNuevaMujer(prev => ({ ...prev, apellido: e.target.value }))}
                        />
                        <Input
                          placeholder="Apodo (opcional)"
                          value={nuevaMujer.apodo}
                          onChange={(e) => setNuevaMujer(prev => ({ ...prev, apodo: e.target.value }))}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button type="button" size="sm" onClick={agregarNuevaMujer}>
                          <Save className="h-4 w-4 mr-2" />
                          Guardar
                        </Button>
                        <Button 
                          type="button" 
                          size="sm" 
                          variant="outline" 
                          onClick={() => setMostrarFormularioMujer(false)}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  <div className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar..."
                        value={busquedaMujer}
                        onChange={(e) => setBusquedaMujer(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div className="max-h-48 overflow-y-auto border rounded-lg p-2">
                    <div className="grid grid-cols-1 gap-1">
                      {mujeresFiltradas.length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground text-sm">
                          {busquedaMujer ? 'No se encontraron' : 'No hay registradas'}
                        </div>
                      ) : (
                        mujeresFiltradas.map((mujer) => {
                          const yaAgregada = registroActual.mujeresAsistieron.some(m => m.mujer.id === mujer.id);
                          return (
                            <Button
                              key={mujer.id}
                              type="button"
                              variant={yaAgregada ? "secondary" : "outline"}
                              onClick={() => agregarMujer(mujer)}
                              disabled={yaAgregada}
                              className="justify-start text-left h-auto py-2"
                            >
                              <UserCheck className={`h-4 w-4 mr-2 ${yaAgregada ? 'text-green-600' : ''}`} />
                              <div className="flex flex-col items-start">
                                <span className="font-medium text-sm">
                                  {mujer.nombre} {mujer.apellido}
                                </span>
                                {mujer.apodo && (
                                  <span className="text-xs text-muted-foreground">
                                    ({mujer.apodo})
                                  </span>
                                )}
                              </div>
                              {yaAgregada && (
                                <span className="ml-auto text-xs text-green-600 font-medium">✓</span>
                              )}
                            </Button>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                {registroActual.mujeresAsistieron.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Participantes ({registroActual.mujeresAsistieron.length})</h4>
                    {registroActual.mujeresAsistieron.map((item, index) => (
                      <div key={item.mujer.id} className="border rounded-lg p-3 bg-white">
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="font-medium text-sm">{item.mujer.nombre} {item.mujer.apellido}</h5>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => quitarMujer(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`entrevista-${index}`}
                            checked={item.entrevistaRealizada}
                            onCheckedChange={() => toggleEntrevista(index)}
                          />
                          <Label htmlFor={`entrevista-${index}`} className="text-sm">Entrevista realizada</Label>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Equipo de Trabajo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Equipo de Trabajo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border rounded-lg p-4 bg-muted/20">
                  <h4 className="font-medium mb-3">Agregar Profesional</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {profesionales.map((profesional) => (
                      <Button
                        key={profesional.id}
                        type="button"
                        variant="outline"
                        onClick={() => agregarProfesional(profesional)}
                        disabled={equipoSeleccionado.some(p => p.id === profesional.id)}
                        className="justify-start text-sm"
                      >
                        <UserCheck className="h-4 w-4 mr-2" />
                        {profesional.nombre} {profesional.apellido} - {profesional.cargo}
                      </Button>
                    ))}
                  </div>
                </div>

                {equipoSeleccionado.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Equipo Seleccionado</h4>
                    {equipoSeleccionado.map((profesional) => (
                      <div key={profesional.id} className="flex items-center justify-between bg-white p-3 rounded-lg border">
                        <span className="text-sm">{profesional.nombre} {profesional.apellido} - {profesional.cargo}</span>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => quitarProfesional(profesional.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Comunicaciones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Comunicaciones
                <Badge variant="secondary" className="ml-2">
                  Total: {registroActual.llamadasRecibidas.length + registroActual.llamadasHechas.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Llamadas Recibidas */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Phone className="h-4 w-4" />
                    <Label className="font-medium">Llamadas Recibidas ({registroActual.llamadasRecibidas.length})</Label>
                  </div>
                  
                  <div className="border rounded-lg p-4 bg-muted/20 mb-3">
                    <h5 className="font-medium mb-2">Agregar Llamada</h5>
                    <div className="space-y-2">
                      <Input
                        placeholder="Nombre o institución"
                        value={nuevaLlamadaRecibida.nombre}
                        onChange={(e) => setNuevaLlamadaRecibida(prev => ({ ...prev, nombre: e.target.value }))}
                      />
                      <Input
                        placeholder="Descripción (opcional)"
                        value={nuevaLlamadaRecibida.descripcion}
                        onChange={(e) => setNuevaLlamadaRecibida(prev => ({ ...prev, descripcion: e.target.value }))}
                      />
                      <Button type="button" onClick={agregarLlamadaRecibida} className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar
                      </Button>
                    </div>
                  </div>

                  {registroActual.llamadasRecibidas.length > 0 && (
                    <div className="space-y-2">
                      {registroActual.llamadasRecibidas.map((llamada, index) => (
                        <div key={index} className="flex items-center justify-between bg-white p-3 rounded-lg border">
                          <div>
                            <span className="font-medium">{llamada.nombre}</span>
                            {llamada.descripcion && (
                              <p className="text-sm text-muted-foreground">{llamada.descripcion}</p>
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => quitarLlamadaRecibida(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Llamadas Realizadas */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <PhoneCall className="h-4 w-4" />
                    <Label className="font-medium">Llamadas Realizadas ({registroActual.llamadasHechas.length})</Label>
                  </div>
                  
                  <div className="border rounded-lg p-4 bg-muted/20 mb-3">
                    <h5 className="font-medium mb-2">Agregar Llamada</h5>
                    <div className="space-y-2">
                      <Input
                        placeholder="Nombre o institución"
                        value={nuevaLlamadaHecha.nombre}
                        onChange={(e) => setNuevaLlamadaHecha(prev => ({ ...prev, nombre: e.target.value }))}
                      />
                      <Input
                        placeholder="Descripción (opcional)"
                        value={nuevaLlamadaHecha.descripcion}
                        onChange={(e) => setNuevaLlamadaHecha(prev => ({ ...prev, descripcion: e.target.value }))}
                      />
                      <Button type="button" onClick={agregarLlamadaHecha} className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar
                      </Button>
                    </div>
                  </div>

                  {registroActual.llamadasHechas.length > 0 && (
                    <div className="space-y-2">
                      {registroActual.llamadasHechas.map((llamada, index) => (
                        <div key={index} className="flex items-center justify-between bg-white p-3 rounded-lg border">
                          <div>
                            <span className="font-medium">{llamada.nombre}</span>
                            {llamada.descripcion && (
                              <p className="text-sm text-muted-foreground">{llamada.descripcion}</p>
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => quitarLlamadaHecha(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Trámites y Articulación */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Trámites */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Trámites
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border rounded-lg p-4 bg-muted/20">
                  <h4 className="font-medium mb-3">Agregar Trámite</h4>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Tipo de trámite"
                      value={nuevoTramite.tipo}
                      onChange={(e) => setNuevoTramite(prev => ({ ...prev, tipo: e.target.value }))}
                    />
                    <Input
                      type="number"
                      placeholder="Cant."
                      min="1"
                      value={nuevoTramite.cantidad}
                      onChange={(e) => setNuevoTramite(prev => ({ ...prev, cantidad: parseInt(e.target.value) || 1 }))}
                      className="w-20"
                    />
                    <Button type="button" onClick={agregarTramite}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {registroActual.tramites.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Trámites Registrados</h4>
                    {registroActual.tramites.map((tramite, index) => (
                      <div key={index} className="flex items-center justify-between bg-white p-3 rounded-lg border">
                        <Badge variant="secondary">
                          {tramite.tipo} ({tramite.cantidad})
                        </Badge>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => quitarTramite(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Articulación con Instituciones */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Articulación con Instituciones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={registroActual.articulacionInstituciones}
                  onChange={(e) => setRegistroActual(prev => ({ ...prev, articulacionInstituciones: e.target.value }))}
                  placeholder="Describe las articulaciones realizadas con otras instituciones..."
                  rows={6}
                />
              </CardContent>
            </Card>
          </div>

          {/* Trabajo de Campo y Visitas Realizadas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Trabajo de Campo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="trabajoCampoResumen">Trabajo de Campo del Día</Label>
                <div className="text-sm text-muted-foreground mb-2">
                  Se muestra automáticamente el trabajo de campo registrado para esta fecha
                </div>
                <Textarea
                  id="trabajoCampoResumen"
                  value={registroActual.trabajoCampoResumen}
                  onChange={(e) => setRegistroActual(prev => ({ ...prev, trabajoCampoResumen: e.target.value }))}
                  placeholder={registroActual.trabajoCampoResumen ? "" : "No hay trabajo de campo registrado para esta fecha"}
                  rows={4}
                  className="bg-muted/30"
                  readOnly
                />
              </div>
            </CardContent>
          </Card>

          {/* Comentarios y Observaciones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Comentarios y Observaciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={registroActual.comentariosObservaciones}
                onChange={(e) => setRegistroActual(prev => ({ ...prev, comentariosObservaciones: e.target.value }))}
                placeholder="Agregar comentarios, observaciones o notas adicionales sobre el día..."
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Acciones de envío */}
          <div className="flex justify-end gap-4 pt-6 border-t">
            <Button type="button" variant="outline" onClick={() => handleNavigateBack('/centro-dia')}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
              <Save className="h-4 w-4 mr-2" />
              Actualizar Registro
            </Button>
          </div>
        </form>
      </main>

      <UnsavedChangesDialog
        open={showWarning}
        onOpenChange={cancelNavigation}
        onConfirm={confirmNavigation}
      />
    </div>
  );
};


export default CentroDiaEditar;