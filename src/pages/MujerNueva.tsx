import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Save, Paperclip, X, CalendarIcon } from "lucide-react";
import { mujeresStore, type Mujer, type Documento } from "@/lib/mujeresStore";
import { nacionalidadesStore, type Nacionalidad } from "@/lib/nacionalidadesStore";
import { DatePicker } from "@/components/ui/date-picker";
import { format, differenceInYears } from "date-fns";
import { cn } from "@/lib/utils";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { UnsavedChangesDialog } from "@/components/ui/unsaved-changes-dialog";

const MujerNueva = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("datos");
  const [hasChanges, setHasChanges] = useState(false);

  const {
    showWarning,
    confirmNavigation,
    cancelNavigation,
    handleNavigateBack,
  } = useUnsavedChanges(hasChanges);

  // Estados para el formulario de datos personales
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
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docDescripcion, setDocDescripcion] = useState<string>("");
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // Estados para nacionalidades
  const [nacionalidades, setNacionalidades] = useState<Nacionalidad[]>([]);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const nacionalidadesData = await nacionalidadesStore.getNacionalidadesActivas();
        setNacionalidades(nacionalidadesData);
      } catch (error) {
        console.error("Error cargando nacionalidades:", error);
      }
    };
    
    cargarDatos();
  }, []);

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
  const edadActual = calcularEdad(formData.fechaNacimiento);

  // Marcar cambios cuando se modifica el formulario
  useEffect(() => {
    const hasFormChanges = 
      formData.nombre !== "" ||
      formData.apellido !== "" ||
      formData.apodo !== "" ||
      formData.fechaNacimiento !== "" ||
      formData.nacionalidad !== "" ||
      formData.telefono !== "" ||
      formData.email !== "" ||
      formData.direccion !== "" ||
      formData.documentacion !== "" ||
      documentos.length > 0;
    
    setHasChanges(hasFormChanges);
  }, [formData, documentos]);

  const handleSavePersonalData = async () => {
    // Validaciones básicas
    if (!formData.apellido.trim()) {
      toast.error("El apellido es obligatorio");
      return;
    }

    if (!formData.fechaNacimiento) {
      toast.error("La fecha de nacimiento es obligatoria");
      return;
    }

    if (!formData.nacionalidad.trim()) {
      toast.error("La nacionalidad es obligatoria");
      return;
    }

    if (formData.tieneDocumentacion && !formData.tipoDocumentacion.trim()) {
      toast.error("La documentación es obligatoria cuando se selecciona 'Sí'");
      return;
    }
    
    try {
      const nuevaMujer: Mujer = {
        id: crypto.randomUUID(),
        nombre: formData.nombre,
        apodo: formData.apodo || undefined,
        apellido: formData.apellido,
        fechaNacimiento: formData.fechaNacimiento,
        nacionalidad: formData.nacionalidad,
        tieneDocumentacion: formData.tieneDocumentacion,
        tipoDocumentacion: formData.tipoDocumentacion || undefined,
        tipoResidencia: formData.tipoResidencia || undefined,
        telefono: formData.telefono,
        email: formData.email,
        direccion: formData.direccion,
        documentacion: formData.documentacion,
        hijosACargo: formData.hijosACargo,
        alfabetizada: formData.alfabetizada,
        fechaRegistro: new Date().toISOString().split('T')[0],
        origenRegistro: formData.origenRegistro,
        fechaPrimerContacto: formData.fechaPrimerContacto || undefined,
        descripcionRasgos: formData.descripcionRasgos || undefined,
        paradaZona: formData.paradaZona || undefined,
        personaContactoReferencia: formData.personaContactoReferencia || undefined,
        observacionesHistoria: formData.observacionesHistoria || undefined,
        acompanamientos: [],
        documentos: documentos,
        observaciones: formData.observaciones,
        viviendaTipo: formData.viviendaTipo || undefined,
        viviendaContrato: formData.viviendaContrato || undefined,
        ayudaHabitacional: formData.ayudaHabitacional || undefined,
        coberturaSalud: formData.coberturaSalud || undefined,
        aportePrevisional: formData.aportePrevisional || undefined,
      };

      const agregada = await mujeresStore.agregarMujer(nuevaMujer);
      if (agregada) {
        setHasChanges(false);
        toast.success("Mujer registrada exitosamente");
        navigate('/mujeres');
      } else {
        toast.error("Esta mujer ya está registrada");
      }
    } catch (error) {
      console.error('Error guardando mujer:', error);
      toast.error("Error al guardar la información");
    }
  };

  // Funciones de documentos
  const subirDocumento = async () => {
    if (!docFile) {
      toast.error("Seleccione un archivo");
      return;
    }
    
    if (!docDescripcion.trim()) {
      toast.error("La descripción es obligatoria");
      return;
    }
    
    setUploadingDoc(true);
    try {
      const nuevoDoc = await mujeresStore.subirDocumento(docFile, 'new-mujer', docDescripcion);
      
      if (!nuevoDoc) {
        toast.error("Error al subir el archivo");
        return;
      }
      
      setDocumentos([...documentos, nuevoDoc]);
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

  const verDocumento = (doc: Documento) => {
    if (doc.url) {
      window.open(doc.url, '_blank');
    } else {
      toast.error("URL del documento no disponible");
    }
  };

  const borrarDocumento = (doc: Documento) => {
    setDocumentos(documentos.filter(d => d.id !== doc.id));
    toast.success("Documento eliminado");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      {/* Header */}
      <header className="bg-card shadow-lg border-b">
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
                <h1 className="text-3xl font-bold text-foreground">Registrar Nueva Participante</h1>
                <p className="text-muted-foreground">Complete la información de la nueva participante</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSavePersonalData}>
                <Save className="h-4 w-4 mr-2" />
                Guardar
              </Button>
              <Button variant="outline" onClick={() => navigate('/mujeres')}>
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="datos">Datos Personales</TabsTrigger>
            <TabsTrigger value="documentos">Documentos</TabsTrigger>
          </TabsList>

          {/* Tab: Datos Personales */}
          <TabsContent value="datos">
            <Card>
              <CardHeader>
                <CardTitle>Información Personal</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Botones superiores en formularios largos */}
                <div className="flex justify-end gap-2 pb-4 mb-4 border-b sticky top-0 bg-background z-10">
                  <Button onClick={handleSavePersonalData}>
                    <Save className="h-4 w-4 mr-2" />
                    Guardar
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/mujeres')}>
                    Cancelar
                  </Button>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="nombre">Nombre</Label>
                      <Input
                        id="nombre"
                        value={formData.nombre}
                        onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                        placeholder="Nombre de pila"
                      />
                    </div>

                    <div>
                      <Label htmlFor="apellido">Apellido *</Label>
                      <Input
                        id="apellido"
                        value={formData.apellido}
                        onChange={(e) => setFormData({...formData, apellido: e.target.value})}
                        placeholder="Apellido"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="apodo">Apodo</Label>
                      <Input
                        id="apodo"
                        value={formData.apodo}
                        onChange={(e) => setFormData({...formData, apodo: e.target.value})}
                        placeholder="Apodo o sobrenombre"
                      />
                    </div>

                    <div>
                      <Label>Fecha de Nacimiento *</Label>
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
                      {edadActual !== null && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Edad: {edadActual} años
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="nacionalidad">Nacionalidad *</Label>
                      <Select
                        value={formData.nacionalidad}
                        onValueChange={(value) => setFormData({...formData, nacionalidad: value, tipoResidencia: value === "Argentina" ? "" : formData.tipoResidencia})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar nacionalidad" />
                        </SelectTrigger>
                        <SelectContent>
                          {nacionalidades.map((nac) => (
                            <SelectItem key={nac.id} value={nac.nombre}>
                              {nac.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {formData.nacionalidad && formData.nacionalidad !== "Argentina" && (
                      <div>
                        <Label htmlFor="tipoResidencia">Tipo de Residencia</Label>
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
                      </div>
                    )}

                    <div className={formData.nacionalidad && formData.nacionalidad !== "Argentina" ? "" : "md:col-span-2"}>
                      <Label className="mb-2 block">¿Tiene documentación? *</Label>
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
                    </div>

                    <div>
                      <Label htmlFor="telefono">Teléfono</Label>
                      <Input
                        id="telefono"
                        value={formData.telefono}
                        onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                        placeholder="Número de contacto"
                      />
                    </div>

                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        placeholder="correo@ejemplo.com"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="direccion">Dirección</Label>
                    <Textarea
                      id="direccion"
                      value={formData.direccion}
                      onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                      placeholder="Dirección completa"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-0.5">
                        <Label>¿Tiene hijos a cargo?</Label>
                        <p className="text-sm text-muted-foreground">
                          Indica si la participante tiene hijos a su cargo
                        </p>
                      </div>
                      <Switch
                        checked={formData.hijosACargo}
                        onCheckedChange={(checked) => setFormData({...formData, hijosACargo: checked})}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-0.5">
                        <Label>¿Está alfabetizada?</Label>
                        <p className="text-sm text-muted-foreground">
                          Indica si la participante sabe leer y escribir
                        </p>
                      </div>
                      <Switch
                        checked={formData.alfabetizada}
                        onCheckedChange={(checked) => setFormData({...formData, alfabetizada: checked})}
                      />
                    </div>
                  </div>

                  {/* Sección: Vivienda y Situación Social */}
                  <div className="border-t pt-4 mt-2">
                    <h3 className="font-semibold text-foreground mb-3">Vivienda y Situación Social</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Vivienda - Tipo</Label>
                        <Select value={formData.viviendaTipo} onValueChange={(v) => setFormData({...formData, viviendaTipo: v})}>
                          <SelectTrigger><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="casa">Casa</SelectItem>
                            <SelectItem value="departamento">Departamento</SelectItem>
                            <SelectItem value="hotel-familiar">Hotel Familiar</SelectItem>
                            <SelectItem value="sin-dato">Sin dato</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Vivienda - Contrato</Label>
                        <Select value={formData.viviendaContrato} onValueChange={(v) => setFormData({...formData, viviendaContrato: v})}>
                          <SelectTrigger><SelectValue placeholder="Seleccionar contrato" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="alquilado">Alquilado</SelectItem>
                            <SelectItem value="hotel-tomado">Hotel tomado</SelectItem>
                            <SelectItem value="propietaria">Propietaria</SelectItem>
                            <SelectItem value="sin-dato">Sin dato</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Ayuda Habitacional</Label>
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
                      </div>
                      <div>
                        <Label>Cobertura de Salud</Label>
                        <Select value={formData.coberturaSalud} onValueChange={(v) => setFormData({...formData, coberturaSalud: v})}>
                          <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="publico">Público</SelectItem>
                            <SelectItem value="prepaga">Prepaga</SelectItem>
                            <SelectItem value="obra-social">Obra Social</SelectItem>
                            <SelectItem value="sin-dato">Sin dato</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Aporte Previsional</Label>
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
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="origenRegistro">Origen del Registro</Label>
                    <Select
                      value={formData.origenRegistro}
                      onValueChange={(value: "trabajo-campo" | "centro-dia" | "derivacion") => 
                        setFormData({...formData, origenRegistro: value})
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="trabajo-campo">Trabajo de Campo</SelectItem>
                        <SelectItem value="centro-dia">Centro de Día</SelectItem>
                        <SelectItem value="derivacion">Derivación</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Fecha del Primer Contacto</Label>
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
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="descripcionRasgos">Descripción (Rasgos identificativos)</Label>
                    <Textarea
                      id="descripcionRasgos"
                      value={formData.descripcionRasgos}
                      onChange={(e) => setFormData({...formData, descripcionRasgos: e.target.value})}
                      placeholder="Rasgos o elementos que ayudan a identificar (sin juicios)..."
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label htmlFor="paradaZona">Parada (Zona habitual / punto de encuentro)</Label>
                    <Input
                      id="paradaZona"
                      value={formData.paradaZona}
                      onChange={(e) => setFormData({...formData, paradaZona: e.target.value})}
                      placeholder="Ubicación donde se encuentra habitualmente"
                    />
                  </div>

                  <div>
                    <Label htmlFor="personaContactoReferencia">Persona de Contacto / Referencia</Label>
                    <Input
                      id="personaContactoReferencia"
                      value={formData.personaContactoReferencia}
                      onChange={(e) => setFormData({...formData, personaContactoReferencia: e.target.value})}
                      placeholder="Nombre y teléfono de contacto de referencia"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="observacionesHistoria">Observaciones sobre su Historia o Contexto</Label>
                    <Textarea
                      id="observacionesHistoria"
                      value={formData.observacionesHistoria}
                      onChange={(e) => setFormData({...formData, observacionesHistoria: e.target.value})}
                      placeholder="Breve descripción que ayude a identificar su historia o contexto..."
                      rows={3}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="observaciones">Observaciones Generales</Label>
                    <Textarea
                      id="observaciones"
                      value={formData.observaciones}
                      onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                      placeholder="Notas adicionales sobre la participante..."
                      rows={4}
                    />
                  </div>
                </div>

                {/* Botones inferiores */}
                <div className="flex justify-end gap-2 pt-4 mt-4 border-t sticky bottom-0 bg-background">
                  <Button onClick={handleSavePersonalData}>
                    <Save className="h-4 w-4 mr-2" />
                    Guardar
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/mujeres')}>
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Documentos */}
          <TabsContent value="documentos">
            <Card>
              <CardHeader>
                <CardTitle>Documentos Adjuntos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Formulario para subir documentos */}
                  <div className="border rounded-lg p-4 bg-muted/20">
                    <h3 className="font-medium mb-4">Adjuntar Nuevo Documento</h3>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="doc-file">Archivo</Label>
                        <Input
                          id="doc-file"
                          type="file"
                          onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Formatos aceptados: PDF, DOC, DOCX, JPG, PNG (máx. 5MB)
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="doc-descripcion">Descripción *</Label>
                        <Input
                          id="doc-descripcion"
                          value={docDescripcion}
                          onChange={(e) => setDocDescripcion(e.target.value)}
                          placeholder="Ej: DNI frente, certificado de domicilio, etc."
                        />
                      </div>
                      <Button 
                        type="button" 
                        onClick={subirDocumento}
                        disabled={!docFile || uploadingDoc}
                      >
                        <Paperclip className="h-4 w-4 mr-2" />
                        {uploadingDoc ? "Subiendo..." : "Adjuntar Documento"}
                      </Button>
                    </div>
                  </div>

                  {/* Lista de documentos */}
                  {documentos.length > 0 ? (
                    <div className="space-y-2">
                      <h3 className="font-medium">Documentos Adjuntados</h3>
                      {documentos.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                          <div className="flex items-center gap-3 flex-1">
                            <Paperclip className="h-4 w-4 text-muted-foreground" />
                            <div className="flex-1">
                              <p className="font-medium">{doc.nombre}</p>
                              <p className="text-sm text-muted-foreground">{doc.descripcion}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => verDocumento(doc)}
                            >
                              Ver
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => borrarDocumento(doc)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Paperclip className="h-12 w-12 mx-auto mb-2 opacity-20" />
                      <p>No hay documentos adjuntados</p>
                      <p className="text-sm">Los documentos adjuntados aparecerán aquí</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Diálogo de advertencia de cambios no guardados */}
      <UnsavedChangesDialog
        open={showWarning}
        onOpenChange={cancelNavigation}
        onConfirm={confirmNavigation}
      />
    </div>
  );
};

export default MujerNueva;
