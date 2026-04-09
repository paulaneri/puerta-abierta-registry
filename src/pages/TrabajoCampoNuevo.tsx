import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Plus, Trash2, ArrowLeft, Save, Calendar, Users, MapPin } from "lucide-react";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { UnsavedChangesDialog } from "@/components/ui/unsaved-changes-dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { trabajoCampoStore, type TrabajoCampo as TrabajoCampoType } from "@/lib/trabajoCampoStore";
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

const TrabajoCampoNuevo = () => {
  const navigate = useNavigate();
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
    const cargarMujeres = async () => {
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

    cargarMujeres();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fecha || !formData.lugar || !formData.descripcion || formData.profesionales.length === 0) {
      toast.error('Por favor complete todos los campos obligatorios');
      return;
    }

    const trabajoData: Omit<TrabajoCampoType, 'id' | 'createdAt' | 'updatedAt'> = {
      ...formData,
      actividad: formData.descripcion
    };

    console.log('💾 Guardando trabajo de campo:', trabajoData);

    // Agregar mujeres nuevas a la lista global
    const mujeresNuevas = formData.encuentros.filter(encuentro => !encuentro.esRegistrada);
    
    for (const encuentro of mujeresNuevas) {
      const nuevaMujer = {
        id: crypto.randomUUID(),
        nombre: encuentro.nombre,
        apellido: encuentro.apellido,
        apodo: "",
        fechaNacimiento: "",
        nacionalidad: "",
        telefono: "",
        email: "",
        direccion: "",
        documentacion: "",
        hijosACargo: false,
        fechaRegistro: formData.fecha,
        origenRegistro: 'trabajo-campo' as const,
        acompanamientos: [],
        documentos: []
      };
      
      try {
        const agregada = await mujeresStore.agregarMujer(nuevaMujer);
        if (agregada) {
          toast.success(`${nuevaMujer.nombre} ${nuevaMujer.apellido} fue agregada a la Lista de Mujeres`);
        }
      } catch (error) {
        toast.error('Hubo un problema al procesar las mujeres nuevas');
      }
    }

    const nuevoTrabajo = await trabajoCampoStore.agregarTrabajo(trabajoData);
    if (nuevoTrabajo) {
      toast.success('Trabajo de campo registrado correctamente');
      setHasChanges(false);
      navigate('/trabajo-campo');
    } else {
      toast.error('Error al guardar el registro');
    }
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

  const toggleProfesional = (profesional: string) => {
    setFormData(prev => ({
      ...prev,
      profesionales: prev.profesionales.includes(profesional)
        ? prev.profesionales.filter(p => p !== profesional)
        : [...prev.profesionales, profesional]
    }));
    setHasChanges(true);
  };

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
                <h1 className="text-3xl font-bold text-foreground">Registrar Trabajo de Campo</h1>
                <p className="text-muted-foreground">Complete la información del trabajo de campo realizado</p>
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
                        const fechaFormateada = format(date, "yyyy-MM-dd");
                        setFormData(prev => ({ ...prev, fecha: fechaFormateada }));
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
                Profesionales que participaron *
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {profesionalesDisponibles.map((profesional) => (
                  <label key={profesional} className="flex items-center space-x-2 cursor-pointer p-2 hover:bg-muted/50 rounded">
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
                <Users className="h-5 w-5" />
                Encuentros con Mujeres
                <Badge variant="secondary" className="ml-2">
                  Total: {formData.encuentros.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Agregar Encuentro */}
              <Card className="bg-muted/50 border-2">
                <CardHeader>
                  <CardTitle className="text-base">Agregar Encuentro</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Seleccionar mujer registrada</Label>
                    <Select 
                      value={nuevoEncuentro.mujerSeleccionada} 
                      onValueChange={(value) => setNuevoEncuentro(prev => ({ 
                        ...prev, 
                        mujerSeleccionada: value,
                        nombre: "",
                        apellido: ""
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Buscar en mujeres registradas..." />
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

                  <div className="text-center text-muted-foreground">
                    <span>O registrar nueva mujer</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Nombre</Label>
                      <Input
                        value={nuevoEncuentro.nombre}
                        onChange={(e) => setNuevoEncuentro(prev => ({ 
                          ...prev, 
                          nombre: e.target.value,
                          mujerSeleccionada: ""
                        }))}
                        placeholder="Nombre de la nueva mujer"
                        disabled={!!nuevoEncuentro.mujerSeleccionada}
                      />
                    </div>
                    <div>
                      <Label>Apellido</Label>
                      <Input
                        value={nuevoEncuentro.apellido}
                        onChange={(e) => setNuevoEncuentro(prev => ({ 
                          ...prev, 
                          apellido: e.target.value,
                          mujerSeleccionada: ""
                        }))}
                        placeholder="Apellido de la nueva mujer"
                        disabled={!!nuevoEncuentro.mujerSeleccionada}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Conversación / Observaciones</Label>
                    <Textarea
                      value={nuevoEncuentro.conversacion}
                      onChange={(e) => setNuevoEncuentro(prev => ({ ...prev, conversacion: e.target.value }))}
                      placeholder="Describa la conversación o lo observado..."
                      rows={3}
                    />
                  </div>

                  <Button 
                    type="button" 
                    onClick={agregarEncuentro}
                    disabled={!nuevoEncuentro.mujerSeleccionada && (!nuevoEncuentro.nombre || !nuevoEncuentro.apellido)}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Encuentro
                  </Button>
                </CardContent>
              </Card>

              {/* Lista de encuentros agregados */}
              {formData.encuentros.length > 0 && (
                <div className="space-y-2">
                  <Label>Encuentros Agregados:</Label>
                  {formData.encuentros.map((encuentro) => (
                    <Card key={encuentro.id} className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold">
                              {encuentro.nombre} {encuentro.apellido}
                            </span>
                            <Badge variant={encuentro.esRegistrada ? "default" : "secondary"}>
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
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Botones de acción */}
          <div className="flex justify-end gap-4 sticky bottom-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => handleNavigateBack('/trabajo-campo')}
            >
              Cancelar
            </Button>
            <Button type="submit">
              <Save className="h-4 w-4 mr-2" />
              Guardar Trabajo de Campo
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

export default TrabajoCampoNuevo;
