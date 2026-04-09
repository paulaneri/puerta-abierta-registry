import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Heart, Plus, Users, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";
import { equipoStore } from "@/lib/equipoStore";
import { mujeresStore } from "@/lib/mujeresStore";

interface DuplaAcompanamiento {
  id: string;
  profesional1Id: string;
  profesional2Id: string;
  mujerAsignada?: string;
  fechaAsignacion: string;
  activa: boolean;
  notas?: string;
}

const DuplasAcompanamiento = () => {
  const [duplas, setDuplas] = useState<DuplaAcompanamiento[]>([]);
  const [profesionales, setProfesionales] = useState<any[]>([]);
  const [mujeres, setMujeres] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDupla, setEditingDupla] = useState<DuplaAcompanamiento | null>(null);
  const [formData, setFormData] = useState({
    profesional1Id: '',
    profesional2Id: '',
    mujerAsignada: '',
    notas: ''
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  // Refrescar datos cuando el componente gana foco
  useEffect(() => {
    const handleFocus = () => {
      cargarDatos();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const cargarDatos = async () => {
    try {
      console.log('Cargando datos actualizados...');
      const profesionalesData = await equipoStore.getProfesionales();
      const mujeresData = await mujeresStore.getMujeres();
      const duplasGuardadas = localStorage.getItem('duplasAcompanamiento');
      
      console.log('Mujeres cargadas desde Supabase:', mujeresData.length, mujeresData.map(m => `${m.nombre} ${m.apellido} (ID: ${m.id})`));
      console.log('IDs de mujeres válidas:', mujeresData.map(m => m.id));
      
      setProfesionales(profesionalesData.filter(p => p.activo));
      setMujeres(mujeresData);
      
      // Limpiar duplas con referencias a mujeres que ya no existen
      if (duplasGuardadas) {
        const duplas = JSON.parse(duplasGuardadas);
        console.log('Duplas en localStorage:', duplas.length);
        duplas.forEach((dupla: DuplaAcompanamiento, index: number) => {
          console.log(`Dupla ${index + 1}:`, {
            id: dupla.id,
            mujerAsignada: dupla.mujerAsignada,
            existeEnSupabase: dupla.mujerAsignada ? mujeresData.find(m => m.id.toString() === dupla.mujerAsignada?.toString()) : 'sin asignar'
          });
        });
        
        const duplasLimpias = duplas.map((dupla: DuplaAcompanamiento) => {
          // Si la mujer asignada ya no existe, eliminarla de la dupla
          if (dupla.mujerAsignada && !mujeresData.find(m => m.id.toString() === dupla.mujerAsignada?.toString())) {
            console.log(`🧹 Limpiando referencia a mujer inexistente en dupla: ${dupla.mujerAsignada}`);
            return { ...dupla, mujerAsignada: undefined };
          }
          return dupla;
        });
        
        // Guardar las duplas limpias si hubo cambios
        const huboLimpias = duplasLimpias.some((dupla: DuplaAcompanamiento, index: number) => 
          dupla.mujerAsignada !== duplas[index].mujerAsignada
        );
        
        if (huboLimpias) {
          localStorage.setItem('duplasAcompanamiento', JSON.stringify(duplasLimpias));
          toast.info('Se eliminaron referencias a mujeres que ya no existen');
        }
        
        setDuplas(duplasLimpias);
      } else {
        setDuplas([]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar los datos');
    }
  };

  const guardarDuplas = (nuevasDuplas: DuplaAcompanamiento[]) => {
    localStorage.setItem('duplasAcompanamiento', JSON.stringify(nuevasDuplas));
    setDuplas(nuevasDuplas);
  };

  const abrirFormulario = (dupla?: DuplaAcompanamiento) => {
    if (dupla) {
      setEditingDupla(dupla);
      setFormData({
        profesional1Id: dupla.profesional1Id,
        profesional2Id: dupla.profesional2Id,
        mujerAsignada: dupla.mujerAsignada || '',
        notas: dupla.notas || ''
      });
    } else {
      setEditingDupla(null);
      setFormData({
        profesional1Id: '',
        profesional2Id: '',
        mujerAsignada: '',
        notas: ''
      });
    }
    setIsDialogOpen(true);
  };

  const guardarDupla = () => {
    if (!formData.profesional1Id || !formData.profesional2Id) {
      toast.error('Debe seleccionar ambos profesionales');
      return;
    }

    if (formData.profesional1Id === formData.profesional2Id) {
      toast.error('Los profesionales deben ser diferentes');
      return;
    }

    const nuevaDupla: DuplaAcompanamiento = {
      id: editingDupla?.id || Date.now().toString(),
      profesional1Id: formData.profesional1Id,
      profesional2Id: formData.profesional2Id,
      mujerAsignada: formData.mujerAsignada || undefined,
      fechaAsignacion: editingDupla?.fechaAsignacion || new Date().toISOString().split('T')[0],
      activa: true,
      notas: formData.notas
    };

    let nuevasDuplas;
    if (editingDupla) {
      nuevasDuplas = duplas.map(d => d.id === editingDupla.id ? nuevaDupla : d);
      toast.success('Dupla actualizada exitosamente');
    } else {
      nuevasDuplas = [...duplas, nuevaDupla];
      toast.success('Dupla creada exitosamente');
    }

    guardarDuplas(nuevasDuplas);
    setIsDialogOpen(false);
  };

  const eliminarDupla = (id: string) => {
    if (confirm('¿Está seguro de que desea eliminar esta dupla?')) {
      const nuevasDuplas = duplas.filter(d => d.id !== id);
      guardarDuplas(nuevasDuplas);
      toast.success('Dupla eliminada exitosamente');
    }
  };

  const toggleActivaDupla = (id: string) => {
    const nuevasDuplas = duplas.map(d => 
      d.id === id ? { ...d, activa: !d.activa } : d
    );
    guardarDuplas(nuevasDuplas);
    toast.success('Estado de dupla actualizado');
  };

  const limpiarTodasLasDuplas = () => {
    if (confirm('¿Está seguro de que desea eliminar TODAS las duplas? Esta acción no se puede deshacer.')) {
      console.log('🗑️ Limpiando todas las duplas del localStorage');
      localStorage.removeItem('duplasAcompanamiento');
      setDuplas([]);
      toast.success('Todas las duplas han sido eliminadas');
    }
  };

  const mostrarDatosDebug = () => {
    console.log('🔍 DEBUG - Estado actual:');
    console.log('Mujeres en estado:', mujeres.map(m => ({ id: m.id, nombre: `${m.nombre} ${m.apellido}` })));
    console.log('Duplas en estado:', duplas.map(d => ({ 
      id: d.id, 
      mujerAsignada: d.mujerAsignada, 
      nombreMostrado: d.mujerAsignada ? getMujerNombre(d.mujerAsignada) : 'Sin asignar'
    })));
    console.log('LocalStorage duplas:', localStorage.getItem('duplasAcompanamiento'));
    toast.info('Revisa la consola para ver los datos de debug');
  };

  const getProfesionalNombre = (id: string) => {
    const profesional = profesionales.find(p => p.id.toString() === id.toString());
    return profesional ? `${profesional.nombre} ${profesional.apellido}` : 'Profesional no encontrado';
  };

  const getMujerNombre = (id: string) => {
    const mujer = mujeres.find(m => m.id.toString() === id.toString());
    return mujer ? `${mujer.nombre || mujer.apodo} ${mujer.apellido}` : 'Mujer no encontrada';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Heart className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-bold text-foreground">Duplas de Acompañamiento</h2>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={cargarDatos}
          >
            🔄 Actualizar
          </Button>
          <Button
            variant="outline"
            onClick={mostrarDatosDebug}
            size="sm"
          >
            🔍 Debug
          </Button>
          <Button
            variant="destructive"
            onClick={limpiarTodasLasDuplas}
            size="sm"
          >
            🗑️ Limpiar Todo
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => abrirFormulario()} className="bg-primary hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                Nueva Dupla
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>
                  {editingDupla ? 'Editar Dupla' : 'Nueva Dupla de Acompañamiento'}
                </DialogTitle>
                <DialogDescription>
                  Asigne una dupla de profesionales para el acompañamiento de una mujer específica.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="profesional1">Profesional 1 *</Label>
                    <Select value={formData.profesional1Id} onValueChange={(value) => setFormData({...formData, profesional1Id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar profesional" />
                      </SelectTrigger>
                      <SelectContent>
                        {profesionales.map((profesional) => (
                          <SelectItem key={profesional.id} value={profesional.id.toString()}>
                            {profesional.nombre} {profesional.apellido} - {profesional.cargo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="profesional2">Profesional 2 *</Label>
                    <Select value={formData.profesional2Id} onValueChange={(value) => setFormData({...formData, profesional2Id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar profesional" />
                      </SelectTrigger>
                      <SelectContent>
                        {profesionales
                          .filter(p => p.id.toString() !== formData.profesional1Id)
                          .map((profesional) => (
                          <SelectItem key={profesional.id} value={profesional.id.toString()}>
                            {profesional.nombre} {profesional.apellido} - {profesional.cargo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="mujerAsignada">Mujer Asignada (Opcional)</Label>
                  <Select value={formData.mujerAsignada} onValueChange={(value) => setFormData({...formData, mujerAsignada: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar mujer (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Sin asignar</SelectItem>
                      {mujeres.length === 0 ? (
                        <SelectItem value="" disabled>No hay mujeres disponibles</SelectItem>
                      ) : (
                        mujeres.map((mujer) => (
                          <SelectItem key={mujer.id} value={mujer.id.toString()}>
                            {mujer.nombre || mujer.apodo} {mujer.apellido} - {mujer.nacionalidad}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={guardarDupla}>
                    {editingDupla ? 'Actualizar' : 'Crear'} Dupla
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {duplas.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">No hay duplas creadas</h3>
            <p className="text-sm text-muted-foreground">Comience creando la primera dupla de acompañamiento</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {duplas.map((dupla) => (
            <Card key={dupla.id} className={`${!dupla.activa ? 'opacity-50' : ''}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Heart className="h-4 w-4 text-primary" />
                    Dupla de Acompañamiento
                  </CardTitle>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => abrirFormulario(dupla)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => eliminarDupla(dupla.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Profesionales:</p>
                  <p className="font-medium">{getProfesionalNombre(dupla.profesional1Id)}</p>
                  <p className="font-medium">{getProfesionalNombre(dupla.profesional2Id)}</p>
                </div>
                
                {dupla.mujerAsignada && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Mujer asignada:</p>
                    <p className="font-medium text-primary">{getMujerNombre(dupla.mujerAsignada)}</p>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Creada: {dupla.fechaAsignacion}</p>
                  </div>
                  <Badge 
                    variant={dupla.activa ? "default" : "secondary"}
                    className="cursor-pointer"
                    onClick={() => toggleActivaDupla(dupla.id)}
                  >
                    {dupla.activa ? 'Activa' : 'Inactiva'}
                  </Badge>
                </div>
                
                {dupla.notas && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Notas:</p>
                    <p className="text-sm">{dupla.notas}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default DuplasAcompanamiento;