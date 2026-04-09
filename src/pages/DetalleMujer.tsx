import { useState, useEffect } from "react";
import { useParams, Link, useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { ArrowLeft, Edit, Trash2, Plus, Eye, Download, Paperclip, X, Save, CalendarIcon, MapPin, RefreshCw } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { mujeresStore, type Mujer, type Acompanamiento, type Documento } from "@/lib/mujeresStore";
import { equipoStore, type Profesional } from "@/lib/equipoStore";
import { nacionalidadesStore, type Nacionalidad } from "@/lib/nacionalidadesStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DatePicker } from "@/components/ui/date-picker";
import { DocumentViewer } from "@/components/DocumentViewer";
import { format, differenceInYears } from "date-fns";
import { cn } from "@/lib/utils";
import { trabajoCampoStore, type TrabajoCampo } from "@/lib/trabajoCampoStore";
import { Checkbox } from "@/components/ui/checkbox";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { UnsavedChangesDialog } from "@/components/ui/unsaved-changes-dialog";

const DetalleMujer = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [mujer, setMujer] = useState<Mujer | null>(null);
  const [cargando, setCargando] = useState(true);
  const [errorRed, setErrorRed] = useState(false);
  const [editMode, setEditMode] = useState(searchParams.get('edit') === 'true');
  const [activeTab, setActiveTab] = useState("datos");
  const [hasChanges, setHasChanges] = useState(false);
  
  const { showWarning, confirmNavigation, cancelNavigation, handleNavigateBack } = useUnsavedChanges(hasChanges);

  // Estados para edición de datos personales
  const [formData, setFormData] = useState({
    nombre: "",
    apodo: "",
    apellido: "",
    fechaNacimiento: "",
    dia: "",
    mes: "",
    año: "",
    nacionalidad: "",
    tieneDocumentacion: false,
    tipoDocumentacion: "",
    tipoResidencia: "",
    telefono: "",
    email: "",
    direccion: "",
    documentacion: "",
    hijosACargo: false,
    alfabetizada: false,
    origenRegistro: "centro-dia" as "trabajo-campo" | "centro-dia" | "derivacion",
    fechaPrimerContacto: "",
    descripcionRasgos: "",
    paradaZona: "",
    personaContactoReferencia: "",
    observacionesHistoria: "",
    observaciones: "",
    viviendaTipo: "",
    viviendaContrato: "",
    ayudaHabitacional: "",
    coberturaSalud: "",
    aportePrevisional: "",
  });

  // Estados para documentos
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docDescripcion, setDocDescripcion] = useState<string>("");
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [viewerDoc, setViewerDoc] = useState<Documento | null>(null);

  // Estados para acompañamientos
  const [editingAcomp, setEditingAcomp] = useState<Acompanamiento | null>(null);
  const [acompForm, setAcompForm] = useState({
    fecha: "",
    equipo: [] as string[],
    notas: "",
  });
  const [showAcompModal, setShowAcompModal] = useState(false);
  const [isViewingAcomp, setIsViewingAcomp] = useState(false);
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [filtroProfesional, setFiltroProfesional] = useState("");
  const [deleteAcompConfirm, setDeleteAcompConfirm] = useState<{ open: boolean; id: number | null }>({ open: false, id: null });

  // Estados para nacionalidades
  const [nacionalidades, setNacionalidades] = useState<Nacionalidad[]>([]);

  useEffect(() => {
    console.log("DetalleMujer - activeTab:", activeTab, "editMode:", editMode);
    const cargarDatos = async () => {
      setErrorRed(false);
      let huboErrorRed = false;
      
      try {
        // Cargar profesionales
        try {
          const profesionalesData = await equipoStore.getProfesionalesActivos();
          setProfesionales(profesionalesData);
          console.log("Profesionales cargados:", profesionalesData.length);
        } catch (error) {
          console.error("Error cargando profesionales:", error);
          huboErrorRed = true;
        }

        // Cargar nacionalidades
        try {
          const nacionalidadesData = await nacionalidadesStore.getNacionalidadesActivas();
          setNacionalidades(nacionalidadesData);
          console.log("Nacionalidades cargadas:", nacionalidadesData.length);
        } catch (error) {
          console.error("Error cargando nacionalidades:", error);
          huboErrorRed = true;
        }

        // Cargar mujer
        if (id) {
          console.log("Buscando mujer con ID:", id);
          try {
            const mujeres = await mujeresStore.getMujeres();
            console.log("Mujeres disponibles:", mujeres.length);
            // Buscar por ID como string
            const mujerEncontrada = mujeres.find(m => m.id === id);
            console.log("Mujer encontrada:", mujerEncontrada);
            if (mujerEncontrada) {
              setMujer(mujerEncontrada);
              const fechaParts = mujerEncontrada.fechaNacimiento ? mujerEncontrada.fechaNacimiento.split('-') : ['', '', ''];
              setFormData({
                nombre: mujerEncontrada.nombre || "",
                apodo: mujerEncontrada.apodo || "",
                apellido: mujerEncontrada.apellido || "",
                fechaNacimiento: mujerEncontrada.fechaNacimiento || "",
                dia: fechaParts[2] || "",
                mes: fechaParts[1] || "",
                año: fechaParts[0] || "",
                nacionalidad: mujerEncontrada.nacionalidad || "",
                tieneDocumentacion: !!mujerEncontrada.tieneDocumentacion,
                tipoDocumentacion: mujerEncontrada.tipoDocumentacion || "",
                tipoResidencia: mujerEncontrada.tipoResidencia || "",
                telefono: mujerEncontrada.telefono || "",
                email: mujerEncontrada.email || "",
                direccion: mujerEncontrada.direccion || "",
                documentacion: mujerEncontrada.documentacion || "",
                hijosACargo: !!mujerEncontrada.hijosACargo,
                alfabetizada: !!mujerEncontrada.alfabetizada,
                origenRegistro: mujerEncontrada.origenRegistro || "centro-dia",
                fechaPrimerContacto: mujerEncontrada.fechaPrimerContacto || "",
                descripcionRasgos: mujerEncontrada.descripcionRasgos || "",
                paradaZona: mujerEncontrada.paradaZona || "",
                personaContactoReferencia: mujerEncontrada.personaContactoReferencia || "",
                observacionesHistoria: mujerEncontrada.observacionesHistoria || "",
                observaciones: mujerEncontrada.observaciones || "",
                viviendaTipo: mujerEncontrada.viviendaTipo || "",
                viviendaContrato: mujerEncontrada.viviendaContrato || "",
                ayudaHabitacional: mujerEncontrada.ayudaHabitacional || "",
                coberturaSalud: mujerEncontrada.coberturaSalud || "",
                aportePrevisional: mujerEncontrada.aportePrevisional || "",
              });
            } else if (mujeres.length === 0) {
              // Si no hay mujeres cargadas, probablemente hubo error de red
              huboErrorRed = true;
              console.log("No hay mujeres cargadas - posible error de red");
            } else {
              console.log("Mujer no encontrada para ID:", id);
              toast.error("Mujer no encontrada");
            }
          } catch (error) {
            console.error("Error cargando mujer:", error);
            huboErrorRed = true;
            // Fallback to sync method
            const mujeres = mujeresStore.getMujeresSync();
            const mujerEncontrada = mujeres.find(m => m.id === id);
            if (mujerEncontrada) {
              setMujer(mujerEncontrada);
              const fechaParts = mujerEncontrada.fechaNacimiento ? mujerEncontrada.fechaNacimiento.split('-') : ['', '', ''];
              setFormData({
                nombre: mujerEncontrada.nombre || "",
                apodo: mujerEncontrada.apodo || "",
                apellido: mujerEncontrada.apellido || "",
                fechaNacimiento: mujerEncontrada.fechaNacimiento || "",
                dia: fechaParts[2] || "",
                mes: fechaParts[1] || "",
                año: fechaParts[0] || "",
                nacionalidad: mujerEncontrada.nacionalidad || "",
                tieneDocumentacion: !!mujerEncontrada.tieneDocumentacion,
                tipoDocumentacion: mujerEncontrada.tipoDocumentacion || "",
                tipoResidencia: mujerEncontrada.tipoResidencia || "",
                telefono: mujerEncontrada.telefono || "",
                email: mujerEncontrada.email || "",
                direccion: mujerEncontrada.direccion || "",
                documentacion: mujerEncontrada.documentacion || "",
                hijosACargo: !!mujerEncontrada.hijosACargo,
                alfabetizada: !!mujerEncontrada.alfabetizada,
                origenRegistro: mujerEncontrada.origenRegistro || "centro-dia",
                fechaPrimerContacto: mujerEncontrada.fechaPrimerContacto || "",
                descripcionRasgos: mujerEncontrada.descripcionRasgos || "",
                paradaZona: mujerEncontrada.paradaZona || "",
                personaContactoReferencia: mujerEncontrada.personaContactoReferencia || "",
                observacionesHistoria: mujerEncontrada.observacionesHistoria || "",
                observaciones: mujerEncontrada.observaciones || "",
                viviendaTipo: mujerEncontrada.viviendaTipo || "",
                viviendaContrato: mujerEncontrada.viviendaContrato || "",
                ayudaHabitacional: mujerEncontrada.ayudaHabitacional || "",
                coberturaSalud: mujerEncontrada.coberturaSalud || "",
                aportePrevisional: mujerEncontrada.aportePrevisional || "",
              });
            }
          }
        }
      } finally {
        setErrorRed(huboErrorRed && !mujer);
        setCargando(false);
      }
    };
    
    cargarDatos();
  }, [id]);

  // Detectar cambios en formData
  useEffect(() => {
    if (!mujer) return;
    
    const isDifferent = 
      formData.nombre !== (mujer.nombre || "") ||
      formData.apellido !== (mujer.apellido || "") ||
      formData.apodo !== (mujer.apodo || "") ||
      formData.fechaNacimiento !== (mujer.fechaNacimiento || "") ||
      formData.nacionalidad !== (mujer.nacionalidad || "") ||
      formData.tieneDocumentacion !== !!mujer.tieneDocumentacion ||
      formData.tipoDocumentacion !== (mujer.tipoDocumentacion || "") ||
      formData.tipoResidencia !== (mujer.tipoResidencia || "") ||
      formData.telefono !== (mujer.telefono || "") ||
      formData.email !== (mujer.email || "") ||
      formData.direccion !== (mujer.direccion || "") ||
      formData.documentacion !== (mujer.documentacion || "") ||
      formData.hijosACargo !== !!mujer.hijosACargo ||
      formData.alfabetizada !== !!mujer.alfabetizada ||
      formData.fechaPrimerContacto !== (mujer.fechaPrimerContacto || "") ||
      formData.descripcionRasgos !== (mujer.descripcionRasgos || "") ||
      formData.paradaZona !== (mujer.paradaZona || "") ||
      formData.personaContactoReferencia !== (mujer.personaContactoReferencia || "") ||
      formData.observacionesHistoria !== (mujer.observacionesHistoria || "") ||
      formData.observaciones !== (mujer.observaciones || "") ||
      formData.viviendaTipo !== (mujer.viviendaTipo || "") ||
      formData.viviendaContrato !== (mujer.viviendaContrato || "") ||
      formData.ayudaHabitacional !== (mujer.ayudaHabitacional || "") ||
      formData.coberturaSalud !== (mujer.coberturaSalud || "") ||
      formData.aportePrevisional !== (mujer.aportePrevisional || "");
    
    setHasChanges(isDifferent && editMode);
  }, [formData, mujer, editMode]);

  // Función para calcular la edad
  const calcularEdad = (fechaNacimiento: string) => {
    if (!fechaNacimiento) return null;
    try {
      const fechaNac = new Date(fechaNacimiento);
      const edad = differenceInYears(new Date(), fechaNac);
      return edad;
    } catch {
      return null;
    }
  };

  // Calcular edad actual
  const edadActual = calcularEdad(formData.fechaNacimiento || mujer?.fechaNacimiento || "");
  const edadMostrar = calcularEdad(mujer?.fechaNacimiento || "");

  const handleSavePersonalData = async () => {
    if (!mujer) return;
    
    // Construir fecha si los campos separados están completos
    if (formData.dia && formData.mes && formData.año) {
      const fechaCompleta = `${formData.año}-${formData.mes.padStart(2, '0')}-${formData.dia.padStart(2, '0')}`;
      formData.fechaNacimiento = fechaCompleta;
    }
    
    try {
      await mujeresStore.actualizarMujer(mujer.id, formData);
      const mujeresActualizadas = await mujeresStore.getMujeres();
      const mujerActualizada = mujeresActualizadas.find(m => m.id === mujer.id);
      if (mujerActualizada) {
        setMujer(mujerActualizada);
        // Actualizar también formData con los valores guardados
        const fechaParts = mujerActualizada.fechaNacimiento ? mujerActualizada.fechaNacimiento.split('-') : ['', '', ''];
        setFormData({
          nombre: mujerActualizada.nombre || "",
          apodo: mujerActualizada.apodo || "",
          apellido: mujerActualizada.apellido || "",
          fechaNacimiento: mujerActualizada.fechaNacimiento || "",
          dia: fechaParts[2] || "",
          mes: fechaParts[1] || "",
          año: fechaParts[0] || "",
          nacionalidad: mujerActualizada.nacionalidad || "",
          tieneDocumentacion: !!mujerActualizada.tieneDocumentacion,
          tipoDocumentacion: mujerActualizada.tipoDocumentacion || "",
          tipoResidencia: mujerActualizada.tipoResidencia || "",
          telefono: mujerActualizada.telefono || "",
          email: mujerActualizada.email || "",
          direccion: mujerActualizada.direccion || "",
          documentacion: mujerActualizada.documentacion || "",
          hijosACargo: !!mujerActualizada.hijosACargo,
          alfabetizada: !!mujerActualizada.alfabetizada,
          origenRegistro: mujerActualizada.origenRegistro || "centro-dia",
          fechaPrimerContacto: mujerActualizada.fechaPrimerContacto || "",
          descripcionRasgos: mujerActualizada.descripcionRasgos || "",
          paradaZona: mujerActualizada.paradaZona || "",
          personaContactoReferencia: mujerActualizada.personaContactoReferencia || "",
          observacionesHistoria: mujerActualizada.observacionesHistoria || "",
          observaciones: mujerActualizada.observaciones || "",
          viviendaTipo: mujerActualizada.viviendaTipo || "",
          viviendaContrato: mujerActualizada.viviendaContrato || "",
          ayudaHabitacional: mujerActualizada.ayudaHabitacional || "",
          coberturaSalud: mujerActualizada.coberturaSalud || "",
          aportePrevisional: mujerActualizada.aportePrevisional || "",
        });
      }
      setEditMode(false);
      toast.success("Datos personales actualizados");
    } catch (error) {
      console.error('Error actualizando mujer:', error);
      toast.error("Error al actualizar los datos");
    }
  };

  // Funciones de documentos
  const subirDocumento = async () => {
    if (!docFile || !mujer) {
      toast.error("Seleccione un archivo");
      return;
    }
    
    if (!docDescripcion.trim()) {
      toast.error("La descripción es obligatoria");
      return;
    }
    
    setUploadingDoc(true);
    try {
      const nuevoDoc = await mujeresStore.subirDocumento(docFile, mujer.id, docDescripcion);
      
      if (!nuevoDoc) {
        toast.error("Error al subir el archivo");
        return;
      }
      
      const documentosActualizados = [...(mujer.documentos || []), nuevoDoc];
      await mujeresStore.actualizarMujer(mujer.id, { documentos: documentosActualizados });
      
      const mujeresActualizadas = await mujeresStore.getMujeres();
      const mujerActualizada = mujeresActualizadas.find(m => m.id === mujer.id);
      if (mujerActualizada) {
        setMujer(mujerActualizada);
      }
      
      setDocFile(null);
      setDocDescripcion("");
      toast.success("Documento adjuntado exitosamente");
    } catch (error) {
      console.error("Error uploading document:", error);
      toast.error("Error al subir el documento");
    } finally {
      setUploadingDoc(false);
    }
  };

  const verDocumento = async (doc: Documento) => {
    setViewerDoc(doc);
  };

  const borrarDocumento = async (doc: Documento) => {
    if (!mujer) return;
    
    try {
      // Extraer el nombre del archivo de la URL para eliminarlo de storage
      const fileName = doc.url?.split('/').pop()?.split('?')[0];
      if (fileName) {
        await mujeresStore.eliminarDocumento(`${mujer.id}/${fileName}`);
      }
      const documentosFiltrados = mujer.documentos?.filter(d => d.id !== doc.id) || [];
      await mujeresStore.actualizarMujer(mujer.id, { documentos: documentosFiltrados });
      
      const mujeresActualizadas = await mujeresStore.getMujeres();
      const mujerActualizada = mujeresActualizadas.find(m => m.id === mujer.id);
      if (mujerActualizada) {
        setMujer(mujerActualizada);
      }
      
      toast.success("Documento eliminado");
    } catch (error) {
      console.error("Error al borrar documento:", error);
      toast.error("Error al eliminar el documento");
    }
  };

  // Funciones de acompañamientos
  const handleSaveAcompanamiento = async () => {
    if (!mujer || !acompForm.fecha) {
      toast.error("Complete la fecha del acompañamiento");
      return;
    }

    if (acompForm.equipo.length === 0) {
      toast.error("Seleccione al menos un profesional");
      return;
    }

    try {
      if (editingAcomp) {
        const acompanamientosActualizados = mujer.acompanamientos?.map(a => 
          a.id === editingAcomp.id 
            ? { ...a, fecha: acompForm.fecha, equipo: acompForm.equipo, notas: acompForm.notas }
            : a
        ) || [];
        
        await mujeresStore.actualizarMujer(mujer.id, { acompanamientos: acompanamientosActualizados });
        toast.success("Acompañamiento actualizado");
      } else {
        const nuevoAcomp: Acompanamiento = {
          id: Date.now(),
          fecha: acompForm.fecha,
          equipo: acompForm.equipo,
          notas: acompForm.notas,
        };
        
        const acompanamientosActualizados = [...(mujer.acompanamientos || []), nuevoAcomp];
        await mujeresStore.actualizarMujer(mujer.id, { acompanamientos: acompanamientosActualizados });
        toast.success("Acompañamiento agregado");
      }

      const mujeresActualizadas = await mujeresStore.getMujeres();
      const mujerActualizada = mujeresActualizadas.find(m => m.id === mujer.id);
      if (mujerActualizada) {
        setMujer(mujerActualizada);
      }

      resetAcompForm();
    } catch (error) {
      console.error('Error guardando acompañamiento:', error);
      toast.error("Error al guardar el acompañamiento");
    }
  };

  const editarAcompanamiento = (acomp: Acompanamiento) => {
    setEditingAcomp(acomp);
    setAcompForm({
      fecha: acomp.fecha,
      equipo: acomp.equipo,
      notas: acomp.notas,
    });
    setShowAcompModal(true);
  };

  const eliminarAcompanamiento = async (acompId: number) => {
    if (!mujer) return;
    
    try {
      const acompanamientosFiltrados = mujer.acompanamientos?.filter(a => a.id !== acompId) || [];
      await mujeresStore.actualizarMujer(mujer.id, { acompanamientos: acompanamientosFiltrados });
      
      const mujeresActualizadas = await mujeresStore.getMujeres();
      const mujerActualizada = mujeresActualizadas.find(m => m.id === mujer.id);
      if (mujerActualizada) {
        setMujer(mujerActualizada);
      }
      
      toast.success("Acompañamiento eliminado");
    } catch (error) {
      console.error('Error eliminando acompañamiento:', error);
      toast.error("Error al eliminar el acompañamiento");
    }
  };

  const resetAcompForm = () => {
    setAcompForm({ fecha: "", equipo: [], notas: "" });
    setEditingAcomp(null);
    setShowAcompModal(false);
    setIsViewingAcomp(false);
    setFiltroProfesional("");
  };

  const visualizarAcompanamiento = (acomp: any) => {
    setEditingAcomp(acomp);
    setAcompForm({
      fecha: acomp.fecha,
      equipo: acomp.equipo,
      notas: acomp.notas,
    });
    setIsViewingAcomp(true);
    setShowAcompModal(true);
  };

  // Función para toggle de profesional en el equipo
  const toggleProfesional = (profesionalName: string) => {
    const newEquipo = acompForm.equipo.includes(profesionalName)
      ? acompForm.equipo.filter(p => p !== profesionalName)
      : [...acompForm.equipo, profesionalName];
    
    setAcompForm({ ...acompForm, equipo: newEquipo });
  };

  // Función para obtener historial de trabajo de campo
  const getHistorialTrabajoCampo = async () => {
    if (!mujer) return [];
    
    let trabajosCampo = await trabajoCampoStore.getTrabajosCampo();
    
    // Si no hay trabajos de campo, agregar datos de ejemplo
    if (trabajosCampo.length === 0) {
      const trabajosEjemplo = [
        {
          id: "1",
          fecha: "2024-01-15",
          lugar: "Barrio San José",
          descripcion: "Visita de reconocimiento del territorio, identificación de necesidades básicas en la comunidad",
          actividad: "Trabajo de campo",
          profesionales: ["Ana García - Psicóloga", "Carlos Rodríguez - Trabajador Social"],
          encuentros: [
            { id: 1, nombre: "Carmen", apellido: "Martínez", conversacion: "Habló sobre su situación habitacional, necesita apoyo para gestiones", esRegistrada: true },
            { id: 2, nombre: "Lucía", apellido: "Sánchez", conversacion: "Primera vez que la vemos, mostró interés en participar del centro", esRegistrada: false }
          ]
        },
        {
          id: "2",
          fecha: "2024-02-20",
          lugar: "Plaza Central",
          descripcion: "Jornada de salud comunitaria y registro de nuevas participantes",
          actividad: "Jornada de salud",
          profesionales: ["María López - Enfermera", "Juan Pérez - Psicólogo"],
          encuentros: [
            { id: 3, nombre: "Lucía", apellido: "Sánchez", conversacion: "Se acercó para consultar sobre talleres disponibles, mostró mucho interés", esRegistrada: false },
            { id: 4, nombre: "Ana", apellido: "González", conversacion: "Consulta sobre documentación", esRegistrada: true }
          ]
        }
      ];
      // Note: We can't call setTrabajosCampo anymore as it's deprecated, but this is just for displaying example data
      trabajosCampo = trabajosEjemplo;
    }
    
    console.log("Trabajos de campo disponibles:", trabajosCampo);
    console.log("Buscando para mujer:", mujer.nombre, mujer.apellido, "Apodo:", mujer.apodo);
    
    const historial: Array<{
      fecha: string;
      lugar: string;
      profesionales: string[];
      conversacion: string;
      descripcion: string;
    }> = [];
    
    trabajosCampo.forEach(trabajo => {
      console.log("Revisando trabajo del", trabajo.fecha, "con encuentros:", trabajo.encuentros);
      trabajo.encuentros.forEach(encuentro => {
        console.log("Comparando encuentro:", encuentro.nombre, encuentro.apellido);
        
        // Normalizar strings para comparación (quitar acentos y convertir a minúsculas)
        const normalizar = (str: string) => str.toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .trim();
        
        const nombreEncuentro = normalizar(encuentro.nombre);
        const apellidoEncuentro = normalizar(encuentro.apellido);
        const nombreMujer = normalizar(mujer.nombre);
        const apellidoMujer = normalizar(mujer.apellido);
        const apodoMujer = mujer.apodo ? normalizar(mujer.apodo) : '';
        
        console.log("Comparando normalizado:", 
          `${nombreEncuentro} ${apellidoEncuentro}`, 
          "vs", 
          `${nombreMujer} ${apellidoMujer}`,
          apodoMujer ? `o ${apodoMujer} ${apellidoMujer}` : ''
        );
        
        // Comparar nombre y apellido por separado para mayor precisión
        const matchNombre = (nombreEncuentro === nombreMujer || nombreEncuentro === apodoMujer) && apellidoEncuentro === apellidoMujer;
        
        if (matchNombre) {
          console.log("¡Encontrado match!");
          historial.push({
            fecha: trabajo.fecha,
            lugar: trabajo.lugar,
            profesionales: trabajo.profesionales,
            conversacion: encuentro.conversacion,
            descripcion: trabajo.descripcion,
          });
        }
      });
    });
    
    console.log("Historial encontrado:", historial);
    
    // Ordenar por fecha (más reciente primero)
    return historial.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  };

  const [historialTrabajoCampo, setHistorialTrabajoCampo] = useState<Array<{
    fecha: string;
    lugar: string;
    profesionales: string[];
    conversacion: string;
    descripcion: string;
  }>>([]);

  useEffect(() => {
    const cargarHistorialTrabajoCampo = async () => {
      const historial = await getHistorialTrabajoCampo();
      setHistorialTrabajoCampo(historial);
    };
    
    if (mujer) {
      cargarHistorialTrabajoCampo();
    }
  }, [mujer]);

  if (cargando) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <Card className="p-8 max-w-md">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <h2 className="text-xl font-semibold">Buscando información</h2>
            <p className="text-muted-foreground">
              Cargando datos...
            </p>
          </div>
        </Card>
      </div>
    );
  }

  if (!mujer) {
    const handleRetry = () => {
      setCargando(true);
      setErrorRed(false);
      window.location.reload();
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <Card className="p-8 max-w-md">
          <div className="text-center space-y-4">
            <h2 className="text-xl font-semibold">
              {errorRed ? "Error de conexión" : "Mujer no encontrada"}
            </h2>
            <p className="text-muted-foreground">
              {errorRed 
                ? "No se pudo cargar la información. Verifica tu conexión a internet."
                : `No se pudo encontrar una mujer con el ID especificado.`}
            </p>
            <div className="text-xs text-muted-foreground">
              {errorRed 
                ? "Intenta recargar la página o verifica tu conexión."
                : "Verifica que la URL sea correcta o que la mujer esté registrada en el sistema."}
            </div>
            <div className="flex gap-2 justify-center mt-4">
              {errorRed && (
                <Button onClick={handleRetry}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reintentar
                </Button>
              )}
              <Link to="/mujeres">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver a la lista
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white shadow-lg border-b">
        <div className="w-full px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleNavigateBack('/mujeres')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  {mujer.nombre || mujer.apodo} {mujer.apellido}
                </h1>
                <p className="text-muted-foreground">
                  Detalle de participante • 
                  <Badge variant={mujer.origenRegistro === 'trabajo-campo' ? "default" : mujer.origenRegistro === 'derivacion' ? "outline" : "secondary"} className="ml-2">
                    {mujer.origenRegistro === 'trabajo-campo' ? "Trabajo de Campo" : 
                     mujer.origenRegistro === 'centro-dia' ? "Centro de Día" :
                     mujer.origenRegistro === 'derivacion' ? "Derivación" : 
                     "Centro de día"}
                  </Badge>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={editMode ? "default" : "outline"}
                onClick={() => editMode ? handleSavePersonalData() : setEditMode(true)}
              >
                {editMode ? (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Guardar Cambios
                  </>
                ) : (
                  <>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </>
                )}
              </Button>
              {editMode && (
                <Button
                  variant="outline"
                  onClick={() => navigate('/mujeres')}
                >
                  Cancelar
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="datos" className="text-sm font-medium">Datos Personales</TabsTrigger>
            <TabsTrigger value="acompanamiento" className="text-sm font-medium">Acompañamientos</TabsTrigger>
            <TabsTrigger value="trabajo-campo" className="text-sm font-medium">Trabajo de Campo</TabsTrigger>
          </TabsList>

          {/* Datos Personales Tab */}
          <TabsContent value="datos" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Información Personal</CardTitle>
                  {editMode && (
                    <Button
                      onClick={handleSavePersonalData}
                      variant="default"
                      size="sm"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Guardar
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Nombre</Label>
                    {editMode ? (
                      <Input
                        value={formData.nombre}
                        onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                      />
                    ) : (
                      <p className="text-sm py-2">{mujer.nombre || "No especificado"}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label>Apellido</Label>
                    {editMode ? (
                      <Input
                        value={formData.apellido}
                        onChange={(e) => setFormData({...formData, apellido: e.target.value})}
                      />
                    ) : (
                      <p className="text-sm py-2">{mujer.apellido}</p>
                    )}
                  </div>

                  <div>
                    <Label>Apodo</Label>
                    {editMode ? (
                      <Input
                        value={formData.apodo}
                        onChange={(e) => setFormData({...formData, apodo: e.target.value})}
                      />
                    ) : (
                      <p className="text-sm py-2">{mujer.apodo || "No especificado"}</p>
                    )}
                  </div>

                  <div>
                    <Label>Fecha de Nacimiento</Label>
                    {editMode ? (
                        <DatePicker
                          date={formData.fechaNacimiento ? (() => {
                            const [y, m, d] = formData.fechaNacimiento.split('-');
                            return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
                          })() : undefined}
                          onSelect={(date) => {
                            if (date) {
                              const año = date.getFullYear().toString();
                              const mes = (date.getMonth() + 1).toString().padStart(2, '0');
                              const dia = date.getDate().toString().padStart(2, '0');
                              const fechaFormateada = `${año}-${mes}-${dia}`;
                              setFormData({
                                ...formData, 
                                fechaNacimiento: fechaFormateada,
                                año,
                                mes,
                                dia
                              });
                            }
                          }}
                          placeholder="Seleccionar fecha de nacimiento"
                          fromYear={1940}
                          toYear={new Date().getFullYear()}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1940-01-01")
                          }
                        />
                     ) : (
                       <p className="text-sm py-2">
                         {mujer.fechaNacimiento ? (() => {
                           const [y, m, d] = mujer.fechaNacimiento.split('-');
                           return `${d}/${m}/${y}`;
                         })() : "No especificado"}
                       </p>
                     )}
                   </div>

                   <div>
                     <Label>Edad</Label>
                     <p className="text-sm py-2 font-medium text-primary">
                       {editMode ? (
                         edadActual !== null ? `${edadActual} años` : "No calculada"
                       ) : (
                         edadMostrar !== null ? `${edadMostrar} años` : "No calculada"
                       )}
                     </p>
                   </div>

                   <div>
                     <Label>Origen</Label>
                     {editMode ? (
                       <Select value={formData.origenRegistro} onValueChange={(value: "trabajo-campo" | "centro-dia" | "derivacion") => setFormData({...formData, origenRegistro: value})}>
                         <SelectTrigger>
                           <SelectValue placeholder="Seleccionar origen" />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="trabajo-campo">Trabajo de Campo</SelectItem>
                           <SelectItem value="centro-dia">Centro de Día</SelectItem>
                           <SelectItem value="derivacion">Derivación</SelectItem>
                         </SelectContent>
                       </Select>
                     ) : (
                       <p className="text-sm py-2">
                         {mujer.origenRegistro === 'trabajo-campo' ? 'Trabajo de Campo' : 
                          mujer.origenRegistro === 'centro-dia' ? 'Centro de Día' : 
                          mujer.origenRegistro === 'derivacion' ? 'Derivación' : 
                          'No especificado'}
                       </p>
                     )}
                   </div>

                   <div>
                     <Label>Nacionalidad</Label>
                     {editMode ? (
                       <Select value={formData.nacionalidad} onValueChange={(value) => setFormData({...formData, nacionalidad: value, tipoResidencia: value === "Argentina" ? "" : formData.tipoResidencia})}>
                         <SelectTrigger>
                           <SelectValue placeholder="Seleccionar nacionalidad" />
                         </SelectTrigger>
                         <SelectContent className="bg-background border shadow-md z-50">
                           {nacionalidades.map((nacionalidad) => (
                             <SelectItem key={nacionalidad.id} value={nacionalidad.nombre}>
                               {nacionalidad.nombre}
                             </SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                     ) : (
                       <p className="text-sm py-2">{mujer.nacionalidad}</p>
                     )}
                   </div>

                   {((editMode && formData.nacionalidad && formData.nacionalidad !== "Argentina") || (!editMode && mujer.nacionalidad && mujer.nacionalidad !== "Argentina")) && (
                     <div>
                       <Label>Tipo de Residencia</Label>
                       {editMode ? (
                         <Select
                           value={formData.tipoResidencia}
                           onValueChange={(value) => setFormData({...formData, tipoResidencia: value})}
                         >
                           <SelectTrigger>
                             <SelectValue placeholder="Seleccionar tipo de residencia" />
                           </SelectTrigger>
                           <SelectContent>
                             <SelectItem value="sin-datos">Sin datos</SelectItem>
                             <SelectItem value="nacionalizada">Nacionalizada</SelectItem>
                             <SelectItem value="precaria">Precaria</SelectItem>
                             <SelectItem value="residencia-permanente">Residencia Permanente</SelectItem>
                           </SelectContent>
                         </Select>
                       ) : (
                         <p className="text-sm py-2">
                           {mujer.tipoResidencia === "sin-datos" ? "Sin datos" :
                            mujer.tipoResidencia === "nacionalizada" ? "Nacionalizada" : 
                            mujer.tipoResidencia === "precaria" ? "Precaria" : 
                            mujer.tipoResidencia === "residencia-permanente" ? "Residencia Permanente" : 
                            "No especificado"}
                         </p>
                       )}
                     </div>
                   )}

                   <div className={((editMode && formData.nacionalidad && formData.nacionalidad !== "Argentina") || (!editMode && mujer.nacionalidad && mujer.nacionalidad !== "Argentina")) ? "" : "md:col-span-2"}>
                     <Label className="mb-2 block">¿Tiene documentación?</Label>
                     {editMode ? (
                       <div className="flex items-center gap-4">
                         <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30">
                           <span className={cn("text-sm font-medium", !formData.tieneDocumentacion ? "text-foreground" : "text-muted-foreground")}>No</span>
                           <Switch
                             checked={formData.tieneDocumentacion}
                             onCheckedChange={(checked) => setFormData({...formData, tieneDocumentacion: checked, tipoDocumentacion: checked ? formData.tipoDocumentacion : ""})}
                           />
                           <span className={cn("text-sm font-medium", formData.tieneDocumentacion ? "text-foreground" : "text-muted-foreground")}>Sí</span>
                         </div>
                         {formData.tieneDocumentacion && (
                           <div className="flex-1">
                             <Input
                               id="tipoDocumentacion"
                               value={formData.tipoDocumentacion}
                               onChange={(e) => setFormData({...formData, tipoDocumentacion: e.target.value})}
                               placeholder="Tipo: DNI, Pasaporte, etc."
                               className="border-primary/50"
                             />
                           </div>
                         )}
                       </div>
                     ) : (
                       <div className="flex items-center gap-3">
                         <Badge variant={mujer.tieneDocumentacion ? "default" : "secondary"}>
                           {mujer.tieneDocumentacion ? "Sí" : "No"}
                         </Badge>
                         {mujer.tieneDocumentacion && mujer.tipoDocumentacion && (
                           <span className="text-sm text-muted-foreground">
                             Tipo: {mujer.tipoDocumentacion}
                           </span>
                         )}
                       </div>
                     )}
                   </div>


                   <div>
                     <Label>Fecha del Primer Contacto</Label>
                     {editMode ? (
                       <DatePicker
                         date={formData.fechaPrimerContacto ? (() => {
                           const [y, m, d] = formData.fechaPrimerContacto.split('-');
                           return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
                         })() : undefined}
                         onSelect={(date) => {
                           if (date) {
                             const año = date.getFullYear().toString();
                             const mes = (date.getMonth() + 1).toString().padStart(2, '0');
                             const dia = date.getDate().toString().padStart(2, '0');
                             const fechaFormateada = `${año}-${mes}-${dia}`;
                             setFormData({...formData, fechaPrimerContacto: fechaFormateada});
                           }
                         }}
                         placeholder="Seleccionar fecha del primer contacto"
                         fromYear={2000}
                         toYear={new Date().getFullYear()}
                         disabled={(date) =>
                           date > new Date() || date < new Date("2000-01-01")
                         }
                       />
                     ) : (
                       <p className="text-sm py-2">
                         {mujer.fechaPrimerContacto ? (() => {
                           const [y, m, d] = mujer.fechaPrimerContacto.split('-');
                           return `${d}/${m}/${y}`;
                         })() : "No especificado"}
                       </p>
                     )}
                   </div>

                  <div>
                    <Label>Teléfono</Label>
                    {editMode ? (
                      <Input
                        value={formData.telefono}
                        onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                      />
                    ) : (
                      <p className="text-sm py-2">{mujer.telefono || "No especificado"}</p>
                    )}
                  </div>

                  <div>
                    <Label>Email</Label>
                    {editMode ? (
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                      />
                    ) : (
                      <p className="text-sm py-2">{mujer.email || "No especificado"}</p>
                    )}
                  </div>
                 </div>

                 <div>
                   <Label>Dirección</Label>
                   {editMode ? (
                     <Input
                       value={formData.direccion}
                       onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                     />
                   ) : (
                     <p className="text-sm py-2">{mujer.direccion || "No especificada"}</p>
                   )}
                 </div>

                 <div>
                   <Label>Descripción (Rasgos identificativos)</Label>
                   {editMode ? (
                     <Textarea
                       value={formData.descripcionRasgos}
                       onChange={(e) => setFormData({...formData, descripcionRasgos: e.target.value})}
                       placeholder="Rasgos o elementos que ayudan a identificar (sin juicios)..."
                       rows={2}
                     />
                   ) : (
                     <p className="text-sm py-2 whitespace-pre-wrap">
                       {mujer.descripcionRasgos || "No especificado"}
                     </p>
                   )}
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                     <Label>Parada (Zona habitual / punto de encuentro)</Label>
                     {editMode ? (
                       <Input
                         value={formData.paradaZona}
                         onChange={(e) => setFormData({...formData, paradaZona: e.target.value})}
                         placeholder="Ubicación donde se encuentra habitualmente"
                       />
                     ) : (
                       <p className="text-sm py-2">{mujer.paradaZona || "No especificado"}</p>
                     )}
                   </div>

                   <div>
                     <Label>Persona de Contacto / Referencia</Label>
                     {editMode ? (
                       <Input
                         value={formData.personaContactoReferencia}
                         onChange={(e) => setFormData({...formData, personaContactoReferencia: e.target.value})}
                         placeholder="Nombre y teléfono de contacto de referencia"
                       />
                     ) : (
                       <p className="text-sm py-2">{mujer.personaContactoReferencia || "No especificado"}</p>
                     )}
                   </div>
                 </div>

                 <div>
                   <Label>Observaciones sobre su Historia o Contexto</Label>
                   {editMode ? (
                     <Textarea
                       value={formData.observacionesHistoria}
                       onChange={(e) => setFormData({...formData, observacionesHistoria: e.target.value})}
                       placeholder="Breve descripción que ayude a identificar su historia o contexto..."
                       rows={3}
                     />
                   ) : (
                     <p className="text-sm py-2 whitespace-pre-wrap">
                       {mujer.observacionesHistoria || "No especificado"}
                     </p>
                   )}
                 </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Hijos a cargo</Label>
                    {editMode ? (
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={formData.hijosACargo}
                          onCheckedChange={(v) => setFormData({ ...formData, hijosACargo: !!v })}
                        />
                        <span className="text-sm text-muted-foreground">{formData.hijosACargo ? "Sí" : "No"}</span>
                      </div>
                    ) : (
                      <p className="text-sm py-2">{mujer.hijosACargo ? "Sí" : "No"}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label>Alfabetizada</Label>
                    {editMode ? (
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={formData.alfabetizada}
                          onCheckedChange={(v) => setFormData({ ...formData, alfabetizada: !!v })}
                        />
                        <span className="text-sm text-muted-foreground">{formData.alfabetizada ? "Sí" : "No"}</span>
                      </div>
                    ) : (
                      <p className="text-sm py-2">{mujer.alfabetizada ? "Sí" : "No"}</p>
                    )}
                  </div>
                </div>

                {/* Sección: Vivienda y Situación Social */}
                <div className="border-t pt-4 mt-2">
                  <h3 className="font-semibold text-foreground mb-3">Vivienda y Situación Social</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Vivienda - Tipo</Label>
                      {editMode ? (
                        <Select value={formData.viviendaTipo} onValueChange={(v) => setFormData({...formData, viviendaTipo: v})}>
                          <SelectTrigger><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="casa">Casa</SelectItem>
                            <SelectItem value="departamento">Departamento</SelectItem>
                            <SelectItem value="hotel-familiar">Hotel Familiar</SelectItem>
                            <SelectItem value="sin-dato">Sin dato</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-sm py-2">{
                          mujer.viviendaTipo === 'casa' ? 'Casa' :
                          mujer.viviendaTipo === 'departamento' ? 'Departamento' :
                          mujer.viviendaTipo === 'hotel-familiar' ? 'Hotel Familiar' :
                          mujer.viviendaTipo === 'sin-dato' ? 'Sin dato' : 'No especificado'
                        }</p>
                      )}
                    </div>
                    <div>
                      <Label>Vivienda - Contrato</Label>
                      {editMode ? (
                        <Select value={formData.viviendaContrato} onValueChange={(v) => setFormData({...formData, viviendaContrato: v})}>
                          <SelectTrigger><SelectValue placeholder="Seleccionar contrato" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="alquilado">Alquilado</SelectItem>
                            <SelectItem value="hotel-tomado">Hotel tomado</SelectItem>
                            <SelectItem value="propietaria">Propietaria</SelectItem>
                            <SelectItem value="sin-dato">Sin dato</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-sm py-2">{
                          mujer.viviendaContrato === 'alquilado' ? 'Alquilado' :
                          mujer.viviendaContrato === 'hotel-tomado' ? 'Hotel tomado' :
                          mujer.viviendaContrato === 'propietaria' ? 'Propietaria' :
                          mujer.viviendaContrato === 'sin-dato' ? 'Sin dato' : 'No especificado'
                        }</p>
                      )}
                    </div>
                    <div>
                      <Label>Ayuda Habitacional</Label>
                      {editMode ? (
                        <Select value={formData.ayudaHabitacional} onValueChange={(v) => setFormData({...formData, ayudaHabitacional: v})}>
                          <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="no">No</SelectItem>
                            <SelectItem value="amparo">Amparo</SelectItem>
                            <SelectItem value="subsidio">Subsidio</SelectItem>
                            <SelectItem value="sim">Sí</SelectItem>
                            <SelectItem value="sin-dato">Sin dato</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-sm py-2">{
                          mujer.ayudaHabitacional === 'no' ? 'No' :
                          mujer.ayudaHabitacional === 'amparo' ? 'Amparo' :
                          mujer.ayudaHabitacional === 'subsidio' ? 'Subsidio' :
                          mujer.ayudaHabitacional === 'sim' ? 'Sí' :
                          mujer.ayudaHabitacional === 'sin-dato' ? 'Sin dato' : 'No especificado'
                        }</p>
                      )}
                    </div>
                    <div>
                      <Label>Cobertura de Salud</Label>
                      {editMode ? (
                        <Select value={formData.coberturaSalud} onValueChange={(v) => setFormData({...formData, coberturaSalud: v})}>
                          <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="publico">Público</SelectItem>
                            <SelectItem value="prepaga">Prepaga</SelectItem>
                            <SelectItem value="obra-social">Obra Social</SelectItem>
                            <SelectItem value="sin-dato">Sin dato</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-sm py-2">{
                          mujer.coberturaSalud === 'publico' ? 'Público' :
                          mujer.coberturaSalud === 'prepaga' ? 'Prepaga' :
                          mujer.coberturaSalud === 'obra-social' ? 'Obra Social' :
                          mujer.coberturaSalud === 'sin-dato' ? 'Sin dato' : 'No especificado'
                        }</p>
                      )}
                    </div>
                    <div>
                      <Label>Aporte Previsional</Label>
                      {editMode ? (
                        <Select value={formData.aportePrevisional} onValueChange={(v) => setFormData({...formData, aportePrevisional: v})}>
                          <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="monotributo">Monotributo</SelectItem>
                            <SelectItem value="jubilacion">Jubilación</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                            <SelectItem value="pensionada">Pensionada</SelectItem>
                            <SelectItem value="sin-dato">Sin dato</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-sm py-2">{
                          mujer.aportePrevisional === 'monotributo' ? 'Monotributo' :
                          mujer.aportePrevisional === 'jubilacion' ? 'Jubilación' :
                          mujer.aportePrevisional === 'no' ? 'No' :
                          mujer.aportePrevisional === 'pensionada' ? 'Pensionada' :
                          mujer.aportePrevisional === 'sin-dato' ? 'Sin dato' : 'No especificado'
                        }</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="col-span-full">
                  <Label>Observaciones</Label>
                  {editMode ? (
                    <Textarea
                      value={formData.observaciones}
                      onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                      placeholder="Información adicional importante..."
                      rows={3}
                    />
                  ) : (
                    <p className="text-sm py-2 whitespace-pre-wrap">
                      {mujer.observaciones || "No hay observaciones"}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Documentos */}
            <Card>
              <CardHeader>
                <CardTitle>Documentos Adjuntos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Formulario para subir documentos */}
                <div className="border rounded-lg p-4 bg-muted/20">
                  <h4 className="font-medium mb-3">Adjuntar nuevo documento</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label>Archivo</Label>
                      <Input 
                        type="file" 
                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" 
                        onChange={(e) => setDocFile(e.target.files?.[0] || null)} 
                      />
                    </div>
                    <div>
                      <Label>Descripción *</Label>
                      <Input 
                        value={docDescripcion} 
                        onChange={(e) => setDocDescripcion(e.target.value)} 
                        placeholder="Ej: Documento de identidad" 
                        required
                      />
                    </div>
                  </div>
                  <div className="flex justify-end mt-3">
                    <Button onClick={subirDocumento} disabled={!docFile} className="gap-2">
                      <Paperclip className="h-4 w-4" /> Adjuntar
                    </Button>
                  </div>
                </div>

                {/* Lista de documentos */}
                {mujer.documentos && mujer.documentos.length > 0 ? (
                  <div className="space-y-3">
                    {mujer.documentos.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between border rounded-lg p-3">
                          <div className="space-y-1">
                            <p className="text-sm font-medium">{doc.descripcion || doc.nombre}</p>
                            <p className="text-xs text-muted-foreground">
                              {doc.nombre} • {doc.tipo} • {new Date(doc.fechaSubida).toLocaleDateString()}
                            </p>
                          </div>
                           <div className="flex gap-2">
                             <Button variant="outline" size="sm" onClick={() => setViewerDoc(doc)}>
                               <Eye className="h-4 w-4" />
                             </Button>
                             <Button variant="destructive" size="sm" onClick={() => borrarDocumento(doc)}>
                               <Trash2 className="h-4 w-4" />
                             </Button>
                           </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">No hay documentos adjuntos</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Acompañamientos Tab */}
          <TabsContent value="acompanamiento" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle>Historial de Acompañamientos</CardTitle>
                <Button onClick={() => setShowAcompModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Acompañamiento
                </Button>
              </CardHeader>
              <CardContent>
                {/* Lista de acompañamientos */}
                {mujer.acompanamientos && mujer.acompanamientos.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[100px]">Fecha</TableHead>
                          <TableHead>Equipo</TableHead>
                          <TableHead className="w-[200px]">Notas</TableHead>
                          <TableHead className="w-[150px]">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mujer.acompanamientos.map((acomp) => (
                          <TableRow key={acomp.id}>
                            <TableCell className="whitespace-nowrap">{new Date(acomp.fecha).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {acomp.equipo.map((persona, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {persona}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell className="max-w-[200px]">
                              <p className="text-sm line-clamp-2">{acomp.notas || "Sin notas"}</p>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => visualizarAcompanamiento(acomp)}
                                  title="Ver"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => editarAcompanamiento(acomp)}
                                  title="Editar"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => setDeleteAcompConfirm({ open: true, id: acomp.id })}
                                  title="Borrar"
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No hay acompañamientos registrados</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trabajo de Campo Tab */}
          <TabsContent value="trabajo-campo" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Historial de Trabajo de Campo</CardTitle>
              </CardHeader>
              <CardContent>
                {historialTrabajoCampo.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Día</TableHead>
                        <TableHead>Lugar</TableHead>
                        <TableHead>Equipo</TableHead>
                        <TableHead>¿Qué conversaron?</TableHead>
                        <TableHead>Descripción del trabajo de campo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {historialTrabajoCampo.map((registro, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            <div className="text-sm">
                              {new Date(registro.fecha).toLocaleDateString('es-ES', { 
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              {registro.lugar}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {registro.profesionales.map((profesional, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {profesional}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            {registro.conversacion ? (
                              <div className="max-w-xs">
                                <p className="text-sm leading-relaxed">{registro.conversacion}</p>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm italic">Sin conversación registrada</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {registro.descripcion ? (
                              <div className="max-w-xs">
                                <p className="text-sm text-muted-foreground leading-relaxed">{registro.descripcion}</p>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm italic">Sin descripción</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-6xl mb-4 opacity-50">🔍</div>
                    <p className="text-muted-foreground font-medium">
                      No hay registros de trabajo de campo
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Esta participante no ha sido registrada en actividades de trabajo de campo
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <DocumentViewer 
        document={viewerDoc} 
        isOpen={!!viewerDoc} 
        onClose={() => setViewerDoc(null)} 
      />

      {/* Modal de Acompañamiento */}
      <Dialog open={showAcompModal} onOpenChange={(open) => {
        setShowAcompModal(open);
        if (!open) {
          setIsViewingAcomp(false);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isViewingAcomp ? "Detalles del Acompañamiento" : editingAcomp ? "Editar Acompañamiento" : "Nuevo Acompañamiento"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Fecha</Label>
              {isViewingAcomp ? (
                <div className="text-sm py-2">
                  {acompForm.fecha ? new Date(acompForm.fecha).toLocaleDateString() : "Sin fecha"}
                </div>
              ) : (
                <DatePicker
                  date={acompForm.fecha ? new Date(acompForm.fecha) : undefined}
                  onSelect={(date) => {
                    if (date) {
                      setAcompForm({...acompForm, fecha: format(date, "yyyy-MM-dd")});
                    }
                  }}
                  placeholder="Seleccionar fecha"
                />
              )}
            </div>
            <div>
              <Label>Equipo</Label>
              {isViewingAcomp ? (
                <div className="flex flex-wrap gap-2 py-2">
                  {acompForm.equipo.length > 0 ? (
                    acompForm.equipo.map((persona, idx) => (
                      <Badge key={idx} variant="outline">
                        {persona}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">Sin equipo asignado</span>
                  )}
                </div>
              ) : (
                <>
                  <Input
                    placeholder="Buscar profesional..."
                    value={filtroProfesional}
                    onChange={(e) => setFiltroProfesional(e.target.value)}
                    className="mb-2"
                  />
                  <div className="border rounded-md p-3 bg-background max-h-40 overflow-y-auto">
                    {profesionales.length > 0 ? (
                      <div className="space-y-2">
                        {profesionales
                          .filter((profesional) => {
                            const nombreCompleto = `${profesional.nombre} ${profesional.apellido}`.toLowerCase();
                            const cargo = profesional.cargo?.toLowerCase() || "";
                            const busqueda = filtroProfesional.toLowerCase();
                            return nombreCompleto.includes(busqueda) || cargo.includes(busqueda);
                          })
                          .map((profesional) => {
                            const nombreCompleto = `${profesional.nombre} ${profesional.apellido}`;
                            return (
                              <div key={profesional.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`modal-${profesional.id}`}
                                  checked={acompForm.equipo.includes(nombreCompleto)}
                                  onCheckedChange={() => toggleProfesional(nombreCompleto)}
                                />
                                <Label
                                  htmlFor={`modal-${profesional.id}`}
                                  className="text-sm cursor-pointer flex-1"
                                >
                                  {nombreCompleto} - {profesional.cargo}
                                </Label>
                              </div>
                            );
                          })}
                        {profesionales.filter((profesional) => {
                          const nombreCompleto = `${profesional.nombre} ${profesional.apellido}`.toLowerCase();
                          const cargo = profesional.cargo?.toLowerCase() || "";
                          const busqueda = filtroProfesional.toLowerCase();
                          return nombreCompleto.includes(busqueda) || cargo.includes(busqueda);
                        }).length === 0 && filtroProfesional && (
                          <p className="text-sm text-muted-foreground text-center">
                            No se encontraron profesionales
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No hay profesionales registrados en el equipo
                      </p>
                    )}
                  </div>
                  {acompForm.equipo.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {acompForm.equipo.map((nombre, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {nombre}
                        </Badge>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
            <div>
              <Label>Notas</Label>
              {isViewingAcomp ? (
                <div className="text-sm py-2 whitespace-pre-wrap border rounded-md p-3 bg-muted/50">
                  {acompForm.notas || "Sin notas"}
                </div>
              ) : (
                <Textarea
                  value={acompForm.notas}
                  onChange={(e) => setAcompForm({...acompForm, notas: e.target.value})}
                  placeholder="Descripción del acompañamiento..."
                  rows={4}
                />
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            {isViewingAcomp ? (
              <>
                <Button variant="outline" onClick={resetAcompForm}>Cerrar</Button>
                <Button onClick={() => setIsViewingAcomp(false)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={resetAcompForm}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveAcompanamiento}>
                  {editingAcomp ? "Actualizar" : "Guardar"}
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo de advertencia de cambios no guardados */}
      <UnsavedChangesDialog
        open={showWarning}
        onOpenChange={(open) => !open && cancelNavigation()}
        onConfirm={confirmNavigation}
      />

      {/* Diálogo de confirmación para eliminar acompañamiento */}
      <ConfirmDialog
        open={deleteAcompConfirm.open}
        onOpenChange={(open) => setDeleteAcompConfirm({ open, id: null })}
        onConfirm={() => {
          if (deleteAcompConfirm.id !== null) {
            eliminarAcompanamiento(deleteAcompConfirm.id);
          }
          setDeleteAcompConfirm({ open: false, id: null });
        }}
        title="¿Eliminar acompañamiento?"
        description="Esta acción no se puede deshacer. El registro de acompañamiento será eliminado permanentemente."
      />
    </div>
  );
};

export default DetalleMujer;