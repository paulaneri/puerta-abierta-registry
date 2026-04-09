import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { DatePicker } from "@/components/ui/date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Plus, X, MapPin, Calendar, Users, MessageSquare, Trash2 } from "lucide-react";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { UnsavedChangesDialog } from "@/components/ui/unsaved-changes-dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { trabajoCampoStore, type TrabajoCampo } from "@/lib/trabajoCampoStore";
import { mujeresStore } from "@/lib/mujeresStore";
import LugarPredictiveInput from "@/components/LugarPredictiveInput";

interface EncuentroMujer {
  id: number;
  nombre: string;
  apellido: string;
  conversacion: string;
  esRegistrada: boolean;
}

const profesionalesDisponibles = [
  "Ana García - Psicóloga",
  "Carlos Rodríguez - Trabajador Social", 
  "María López - Enfermera",
  "Juan Pérez - Terapeuta Ocupacional"
];

const TrabajoCampoEditar = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [trabajo, setTrabajo] = useState<TrabajoCampo | null>(null);
  const [cargando, setCargando] = useState(true);
  const [mujeresRegistradas, setMujeresRegistradas] = useState<{id: string, nombre: string, apellido: string}[]>([]);
  
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    lugar: "",
    descripcion: "",
    profesionales: [] as string[],
    encuentros: [] as EncuentroMujer[]
  });

  const [nuevoEncuentro, setNuevoEncuentro] = useState({
    mujerSeleccionada: "",
    nombre: "",
    apellido: "",
    conversacion: "",
    esRegistrada: false
  });
  const [hasChanges, setHasChanges] = useState(false);

  const { showWarning, confirmNavigation, cancelNavigation, handleNavigateBack } = useUnsavedChanges(hasChanges);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        // Cargar mujeres registradas
        const mujeres = await mujeresStore.getMujeres();
        const mujeresFormateadas = mujeres.map(m => ({ 
          id: m.id, 
          nombre: m.nombre, 
          apellido: m.apellido 
        }));
        setMujeresRegistradas(mujeresFormateadas);

        // Cargar trabajo de campo
        if (id) {
          const trabajoEncontrado = await trabajoCampoStore.getTrabajoPorId(id);
          if (trabajoEncontrado) {
            setTrabajo(trabajoEncontrado);
            setFormData({
              fecha: trabajoEncontrado.fecha,
              lugar: trabajoEncontrado.lugar,
              descripcion: trabajoEncontrado.descripcion,
              profesionales: trabajoEncontrado.profesionales,
              encuentros: trabajoEncontrado.encuentros
            });
          } else {
            toast.error("Trabajo de campo no encontrado");
            navigate('/trabajo-campo');
          }
        }
      } catch (error) {
        console.error('Error cargando datos:', error);
        setMujeresRegistradas([]);
      } finally {
        setCargando(false);
      }
    };
    
    cargarDatos();
  }, [id, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!trabajo) return;
    
    if (!formData.fecha || !formData.lugar || !formData.descripcion || formData.profesionales.length === 0) {
      toast.error("Por favor complete todos los campos obligatorios");
      return;
    }

    try {
      const trabajoData = {
        ...formData,
        actividad: formData.descripcion
      };

      const success = await trabajoCampoStore.actualizarTrabajo(trabajo.id, trabajoData);
      if (success) {
        toast.success("Trabajo de campo actualizado exitosamente");
        setHasChanges(false);
        navigate('/trabajo-campo');
      } else {
        toast.error("Error al actualizar el trabajo de campo");
      }
    } catch (error) {
      console.error('Error actualizando trabajo de campo:', error);
      toast.error("Error al actualizar el trabajo de campo. Por favor, intente nuevamente.");
    }
  };

  const toggleProfesional = (profesional: string) => {
    setFormData(prev => ({
      ...prev,
      profesionales: prev.profesionales.includes(profesional)
        ? prev.profesionales.filter(p => p !== profesional)
        : [...prev.profesionales, profesional]
    }));
    setHasChanges(true);
  };

  const agregarEncuentro = () => {
    if (nuevoEncuentro.mujerSeleccionada) {
      const mujer = mujeresRegistradas.find(m => `${m.nombre} ${m.apellido}` === nuevoEncuentro.mujerSeleccionada);
      if (mujer) {
        const encuentro: EncuentroMujer = {
          id: Date.now(),
          nombre: mujer.nombre,
          apellido: mujer.apellido,
          conversacion: nuevoEncuentro.conversacion,
          esRegistrada: true
        };
        setFormData(prev => ({
          ...prev,
          encuentros: [...prev.encuentros, encuentro]
        }));
      }
    } else if (nuevoEncuentro.nombre && nuevoEncuentro.apellido) {
      const encuentro: EncuentroMujer = {
        id: Date.now(),
        nombre: nuevoEncuentro.nombre,
        apellido: nuevoEncuentro.apellido,
        conversacion: nuevoEncuentro.conversacion,
        esRegistrada: false
      };
      setFormData(prev => ({
        ...prev,
        encuentros: [...prev.encuentros, encuentro]
      }));
    }
    
    setNuevoEncuentro({
      mujerSeleccionada: "",
      nombre: "",
      apellido: "",
      conversacion: "",
      esRegistrada: false
    });
  };

  const eliminarEncuentro = (id: number) => {
    setFormData(prev => ({
      ...prev,
      encuentros: prev.encuentros.filter(e => e.id !== id)
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

  if (!trabajo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center">
        <Card className="p-8 max-w-md">
          <div className="text-center space-y-4">
            <h2 className="text-xl font-semibold">Trabajo de campo no encontrado</h2>
            <p className="text-muted-foreground">
              No se pudo encontrar el trabajo de campo con ID: {id}
            </p>
            <Link to="/trabajo-campo">
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
              <Button variant="outline" size="sm" onClick={() => handleNavigateBack('/trabajo-campo')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Editar Trabajo de Campo</h1>
                <p className="text-muted-foreground">Modifica el registro del {new Date(trabajo.fecha).toLocaleDateString()}</p>
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
                    date={formData.fecha ? new Date(formData.fecha) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        const nuevaFecha = format(date, "yyyy-MM-dd");
                        setFormData(prev => ({ ...prev, fecha: nuevaFecha }));
                      }
                    }}
                    placeholder="Seleccionar fecha"
                  />
                </div>
                <div>
                  <Label htmlFor="lugar">Lugar *</Label>
                  <LugarPredictiveInput
                    value={formData.lugar}
                    onChange={(value) => {
                      setFormData(prev => ({ ...prev, lugar: value }));
                    }}
                    placeholder="Escriba o seleccione un lugar..."
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="descripcion">Descripción general *</Label>
                <Textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                  placeholder="Describa qué observaron y las actividades realizadas"
                  rows={3}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Profesionales */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Profesionales que participaron
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {profesionalesDisponibles.map((profesional) => (
                  <label key={profesional} className="flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-muted/50">
                    <input
                      type="checkbox"
                      checked={formData.profesionales.includes(profesional)}
                      onChange={() => toggleProfesional(profesional)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">{profesional}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Encuentros con Mujeres */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Encuentros con Mujeres
                <Badge variant="secondary" className="ml-2">
                  Total: {formData.encuentros.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Agregar Encuentro */}
              <div className="border rounded-lg p-4 bg-muted/20">
                <h4 className="font-medium mb-3">Agregar Encuentro</h4>
                <div className="space-y-3">
                  <div>
                    <Label>Mujer registrada (opcional)</Label>
                    <Select 
                      value={nuevoEncuentro.mujerSeleccionada}
                      onValueChange={(value) => setNuevoEncuentro(prev => ({ ...prev, mujerSeleccionada: value, nombre: "", apellido: "" }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar mujer registrada" />
                      </SelectTrigger>
                      <SelectContent>
                        {mujeresRegistradas.map((mujer) => (
                          <SelectItem key={mujer.id} value={`${mujer.nombre} ${mujer.apellido}`}>
                            {mujer.nombre} {mujer.apellido}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="text-center text-sm text-muted-foreground">O</div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Nombre</Label>
                      <Input
                        value={nuevoEncuentro.nombre}
                        onChange={(e) => setNuevoEncuentro(prev => ({ ...prev, nombre: e.target.value, mujerSeleccionada: "" }))}
                        placeholder="Nombre"
                        disabled={!!nuevoEncuentro.mujerSeleccionada}
                      />
                    </div>
                    <div>
                      <Label>Apellido</Label>
                      <Input
                        value={nuevoEncuentro.apellido}
                        onChange={(e) => setNuevoEncuentro(prev => ({ ...prev, apellido: e.target.value, mujerSeleccionada: "" }))}
                        placeholder="Apellido"
                        disabled={!!nuevoEncuentro.mujerSeleccionada}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Conversación / Notas</Label>
                    <Textarea
                      value={nuevoEncuentro.conversacion}
                      onChange={(e) => setNuevoEncuentro(prev => ({ ...prev, conversacion: e.target.value }))}
                      placeholder="Describe la conversación o notas del encuentro..."
                      rows={2}
                    />
                  </div>

                  <Button type="button" onClick={agregarEncuentro} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Encuentro
                  </Button>
                </div>
              </div>

              {/* Lista de Encuentros */}
              {formData.encuentros.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Encuentros Registrados</h4>
                  {formData.encuentros.map((encuentro) => (
                    <div key={encuentro.id} className="flex items-start gap-3 p-3 border rounded-lg bg-white">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{encuentro.nombre} {encuentro.apellido}</span>
                          <Badge variant={encuentro.esRegistrada ? "default" : "secondary"} className="text-xs">
                            {encuentro.esRegistrada ? "Registrada" : "Nueva"}
                          </Badge>
                        </div>
                        {encuentro.conversacion && (
                          <p className="text-sm text-muted-foreground">{encuentro.conversacion}</p>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => eliminarEncuentro(encuentro.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Acciones */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => handleNavigateBack('/trabajo-campo')}>
              Cancelar
            </Button>
            <Button type="submit">
              <Save className="h-4 w-4 mr-2" />
              Guardar Cambios
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

export default TrabajoCampoEditar;
