import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Edit, Trash2, ArrowLeft, Search, Eye, Download, Paperclip, X, CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { mujeresStore, type Mujer, type Acompanamiento, type Documento } from "@/lib/mujeresStore";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { formatDate, cn } from "@/lib/utils";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { usePagination } from "@/hooks/usePagination";
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from "@/components/ui/pagination";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MultiSelectToolbar } from "@/components/ui/multi-select-toolbar";
import { Checkbox } from "@/components/ui/checkbox";

const calcularEdad = (fecha: string): number => {
  if (!fecha) return 0;
  const hoy = new Date();
  const f = new Date(fecha);
  let edad = hoy.getFullYear() - f.getFullYear();
  const m = hoy.getMonth() - f.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < f.getDate())) edad--;
  return edad;
};
const Mujeres = () => {
  const navigate = useNavigate();
  const [mujeres, setMujeres] = useState<Mujer[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMujer, setEditingMujer] = useState<Mujer | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showMultiSelectToolbar, setShowMultiSelectToolbar] = useState(false);

  // Cargar mujeres al inicializar el componente
  useEffect(() => {
    const cargarMujeres = async () => {
      setLoading(true);
      try {
        const mujeresGuardadas = await mujeresStore.getMujeres();
        
        // Si no hay mujeres guardadas, usar método síncrono de fallback
        if (mujeresGuardadas.length === 0) {
          const mujeresLocales = mujeresStore.getMujeresSync();
          if (mujeresLocales.length === 0) {
            // Solo entonces agregar datos de ejemplo
            const mujeresEjemplo: Mujer[] = [
              {
                id: "ejemplo-1",
                nombre: "Lucía",
                apellido: "Sánchez",
                apodo: "",
                fechaNacimiento: "1985-03-15",
                nacionalidad: "Argentina",
                telefono: "11-2345-6789",
                email: "lucia.sanchez@email.com",
          direccion: "Av. San Martín 123",
          documentacion: "DNI 35.123.456",
          hijosACargo: true,
          fechaRegistro: "2024-01-10",
          origenRegistro: "trabajo-campo",
          acompanamientos: [],
          documentos: []
        },
        {
          id: "ejemplo-2",
          nombre: "Carmen",
          apellido: "Martínez",
          apodo: "",
          fechaNacimiento: "1978-07-22",
          nacionalidad: "Argentina",
          telefono: "11-9876-5432",
          email: "carmen.martinez@email.com",
          direccion: "Calle Rivadavia 456",
          documentacion: "DNI 28.789.012",
          hijosACargo: false,
          fechaRegistro: "2024-01-08",
          origenRegistro: "centro-dia",
          acompanamientos: [],
          documentos: []
        },
        {
          id: "ejemplo-3",
          nombre: "Ana",
          apellido: "González",
          apodo: "Anita",
          fechaNacimiento: "1992-11-03",
          nacionalidad: "Argentina",
          telefono: "11-5555-1234",
          email: "ana.gonzalez@email.com",
          direccion: "Barrio San José",
          documentacion: "DNI 42.345.678",
          hijosACargo: true,
          fechaRegistro: "2024-02-01",
          origenRegistro: "derivacion",
          acompanamientos: [],
          documentos: []
        }
      ];
      
            mujeresEjemplo.forEach(async (mujer) => {
              await mujeresStore.agregarMujer(mujer);
            });
            
            const mujeresActualizadas = await mujeresStore.getMujeres();
            setMujeres(mujeresActualizadas);
          } else {
            setMujeres(mujeresLocales);
          }
        } else {
          setMujeres(mujeresGuardadas);
        }
      } catch (error) {
        console.error('Error cargando mujeres:', error);
        // Fallback a método síncrono
        const mujeresLocales = mujeresStore.getMujeresSync();
        setMujeres(mujeresLocales);
      } finally {
        setLoading(false);
      }
    };
    
    cargarMujeres();
  }, []);
  const [formData, setFormData] = useState({
    nombre: "",
    apodo: "",
    apellido: "",
    fechaNacimiento: "",
    nacionalidad: "",
    telefono: "",
    email: "",
    direccion: "",
    documentacion: "",
    hijosACargo: false,
    alfabetizada: false,
    origenRegistro: "centro-dia" as "trabajo-campo" | "centro-dia" | "derivacion",
    acompanamientos: [] as Acompanamiento[],
    documentos: [] as Documento[],
    observaciones: "",
  });

  const [viewerDoc, setViewerDoc] = useState<Documento | null>(null);
  const [viewerURL, setViewerURL] = useState<string | null>(null);

  // Estado y acciones para documentos
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docDescripcion, setDocDescripcion] = useState<string>("");
  const [uploadingDoc, setUploadingDoc] = useState(false);

  const subirDocumento = async () => {
    if (!docFile) {
      toast.error("Seleccione un archivo");
      return;
    }
    try {
      setUploadingDoc(true);
      const nuevoDoc = await mujeresStore.subirDocumento(docFile, 'new-mujer', docDescripcion);
      
      if (!nuevoDoc) {
        toast.error("Error al subir el archivo");
        return;
      }

      setFormData((prev) => ({ ...prev, documentos: [...prev.documentos, nuevoDoc] }));
      setDocFile(null);
      setDocDescripcion("");
      toast.success("Documento subido exitosamente");
    } catch (error) {
      console.error("Error uploading document:", error);
      toast.error("Error al subir el documento");
    } finally {
      setUploadingDoc(false);
    }
  };

  const verDocumento = async (doc: Documento) => {
    try {
      console.log("Abriendo documento:", doc);
      if (doc.url) {
        window.open(doc.url, '_blank');
      } else {
        toast.error("URL del documento no disponible");
      }
    } catch (error) {
      console.error("Error al obtener documento:", error);
      toast.error("Error al abrir el archivo");
    }
  };

  const descargarDocumento = (doc: Documento, url: string) => {
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.nombre;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Descarga iniciada");
    } catch (error) {
      console.error("Error en descarga:", error);
      toast.error("Error al descargar el archivo");
    }
  };

  const borrarDocumento = async (doc: Documento) => {
    try {
      // Para documentos nuevos, no es necesario eliminar de storage ya que aún no están guardados
      setFormData((prev) => ({
        ...prev,
        documentos: prev.documentos.filter((d) => d.id !== doc.id),
      }));
      toast.success("Documento eliminado");
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Error al eliminar el documento");
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: "",
      apodo: "",
      apellido: "",
      fechaNacimiento: "",
      nacionalidad: "",
      telefono: "",
      email: "",
      direccion: "",
      documentacion: "",
      hijosACargo: false,
      alfabetizada: false,
      origenRegistro: "centro-dia",
      acompanamientos: [],
      documentos: [],
      observaciones: "",
    });
    setEditingMujer(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nombre && !formData.apodo) {
      toast.error("Debe completar Nombre o Apodo");
      return;
    }

    try {
      if (editingMujer) {
        await mujeresStore.actualizarMujer(editingMujer.id, {
          ...formData,
          alfabetizada: formData.alfabetizada,
        });
        const mujeresActualizadas = await mujeresStore.getMujeres();
        setMujeres(mujeresActualizadas);
        toast.success("Mujer actualizada exitosamente");
      } else {
        const newMujer: Mujer = {
          id: crypto.randomUUID(),
          nombre: formData.nombre,
          apodo: formData.apodo || undefined,
          apellido: formData.apellido,
          fechaNacimiento: formData.fechaNacimiento,
          nacionalidad: formData.nacionalidad,
          telefono: formData.telefono,
          email: formData.email,
          direccion: formData.direccion,
          documentacion: formData.documentacion,
          hijosACargo: formData.hijosACargo,
          alfabetizada: formData.alfabetizada,
          fechaRegistro: new Date().toISOString().split('T')[0],
          origenRegistro: formData.origenRegistro,
          acompanamientos: formData.acompanamientos,
          documentos: formData.documentos,
          observaciones: formData.observaciones,
        };

        const agregada = await mujeresStore.agregarMujer(newMujer);
        if (agregada) {
          const mujeresActualizadas = await mujeresStore.getMujeres();
          setMujeres(mujeresActualizadas);
          toast.success("Mujer registrada exitosamente");
        } else {
          toast.error("Esta mujer ya está registrada");
        }
      }

      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error guardando mujer:', error);
      toast.error("Error al guardar la información");
    }
  };


  const handleDelete = async (id: string) => {
    try {
      const result = await mujeresStore.eliminarMujer(id);
      if (result) {
        const mujeresActualizadas = await mujeresStore.getMujeres();
        setMujeres(mujeresActualizadas);
        toast.success("Mujer eliminada exitosamente");
        setDeleteConfirm({ open: false, id: null });
      } else {
        toast.error("Error al eliminar la mujer");
      }
    } catch (error) {
      console.error('Error eliminando mujer:', error);
      toast.error("Error al eliminar la mujer");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    
    if (!confirm(`¿Eliminar ${selectedIds.length} registro${selectedIds.length > 1 ? 's' : ''}? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      for (const id of selectedIds) {
        await mujeresStore.eliminarMujer(id);
      }
      const mujeresActualizadas = await mujeresStore.getMujeres();
      setMujeres(mujeresActualizadas);
      setSelectedIds([]);
      toast.success(`${selectedIds.length} registro${selectedIds.length > 1 ? 's eliminados' : ' eliminado'}`);
    } catch (error) {
      console.error('Error eliminando mujeres:', error);
      toast.error("Error al eliminar los registros");
    }
  };

  const handleBulkArchive = async () => {
    if (selectedIds.length === 0) return;

    try {
      for (const id of selectedIds) {
        await mujeresStore.archivarMujer(id, true);
      }
      const mujeresActualizadas = await mujeresStore.getMujeres();
      setMujeres(mujeresActualizadas);
      setSelectedIds([]);
      toast.success(`${selectedIds.length} registro${selectedIds.length > 1 ? 's archivados' : ' archivado'}`);
    } catch (error) {
      console.error('Error archivando mujeres:', error);
      toast.error("Error al archivar los registros");
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedItems.map(m => m.id));
    }
  };

  const toggleSelectItem = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const filteredMujeres = mujeres.filter(mujer => {
    const fullName = `${mujer.nombre || ''} ${mujer.apellido || ''} ${mujer.apodo || ''}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  const {
    currentPage,
    totalPages,
    paginatedItems,
    goToPage,
    nextPage,
    previousPage,
    hasPreviousPage,
    hasNextPage,
    startIndex,
    endIndex,
    totalItems,
  } = usePagination(filteredMujeres, 50);

  const handleEdit = (mujer: Mujer) => {
    setEditingMujer(mujer);
    setFormData({
      nombre: mujer.nombre || "",
      apodo: mujer.apodo || "",
      apellido: mujer.apellido || "",
      fechaNacimiento: mujer.fechaNacimiento || "",
      nacionalidad: mujer.nacionalidad || "",
      telefono: mujer.telefono || "",
      email: mujer.email || "",
      direccion: mujer.direccion || "",
      documentacion: mujer.documentacion || "",
      hijosACargo: !!mujer.hijosACargo,
      alfabetizada: !!mujer.alfabetizada,
      origenRegistro: mujer.origenRegistro || "centro-dia",
      acompanamientos: mujer.acompanamientos || [],
      documentos: mujer.documentos || [],
      observaciones: mujer.observaciones || "",
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 w-full overflow-x-hidden">
      {/* Header */}
      <header className="bg-card shadow-sm border-b sticky top-0 z-10">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-col sm:flex-row w-full sm:w-auto">
              <Link to="/">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Gestión de Participantes</h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">Administra las participantes registradas</p>
              </div>
            </div>
            <Button onClick={() => navigate('/mujeres/nueva')} className="w-full sm:w-auto" size="default">
              <Plus className="h-4 w-4 mr-2" />
              Registrar Participante
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto z-50">
                <DialogHeader>
                  <DialogTitle>
                    {editingMujer ? "Editar Mujer" : "Registrar Nueva Mujer"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="nombre">Nombre</Label>
                      <Input
                        id="nombre"
                        value={formData.nombre}
                        onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="apellido">Apellido *</Label>
                      <Input
                        id="apellido"
                        value={formData.apellido}
                        onChange={(e) => setFormData({...formData, apellido: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="fechaNacimiento">Fecha de Nacimiento *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !formData.fechaNacimiento && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.fechaNacimiento ? formatDate(formData.fechaNacimiento) : "Seleccionar fecha"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={formData.fechaNacimiento ? (() => {
                              const [y, m, d] = formData.fechaNacimiento.split('-');
                              return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
                            })() : undefined}
                            onSelect={(date) => {
                              if (date) {
                                const año = date.getFullYear().toString();
                                const mes = (date.getMonth() + 1).toString().padStart(2, '0');
                                const dia = date.getDate().toString().padStart(2, '0');
                                setFormData({...formData, fechaNacimiento: `${año}-${mes}-${dia}`});
                              }
                            }}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1940-01-01")
                            }
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                            captionLayout="dropdown-buttons"
                            fromYear={1940}
                            toYear={new Date().getFullYear()}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div>
                      <Label htmlFor="apodo">Apodo</Label>
                      <Input
                        id="apodo"
                        value={formData.apodo}
                        onChange={(e) => setFormData({ ...formData, apodo: e.target.value })}
                        placeholder="Opcional"
                      />
                    </div>
                    <div>
                      <Label htmlFor="nacionalidad">Nacionalidad *</Label>
                      <Input
                        id="nacionalidad"
                        value={formData.nacionalidad}
                        onChange={(e) => setFormData({...formData, nacionalidad: e.target.value})}
                        placeholder="Ej: Colombiana, Venezolana"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="documentacion">Documentación *</Label>
                      <Input
                        id="documentacion"
                        value={formData.documentacion}
                        onChange={(e) => setFormData({...formData, documentacion: e.target.value})}
                        placeholder="Ej: CC 12345678, CE 87654321"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="telefono">Teléfono</Label>
                      <Input
                        id="telefono"
                        value={formData.telefono}
                        onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Hijos a cargo</Label>
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={formData.hijosACargo}
                          onCheckedChange={(v) => setFormData({ ...formData, hijosACargo: !!v })}
                        />
                        <span className="text-sm text-muted-foreground">{formData.hijosACargo ? "Sí" : "No"}</span>
                      </div>
                    </div>
                  </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                       <Label>Alfabetizada</Label>
                       <div className="flex items-center gap-3">
                         <Switch
                           checked={formData.alfabetizada || false}
                           onCheckedChange={(v) => setFormData({ ...formData, alfabetizada: !!v })}
                         />
                         <span className="text-sm text-muted-foreground">{formData.alfabetizada ? "Sí" : "No"}</span>
                       </div>
                     </div>
                     <div>
                       <Label htmlFor="origenRegistro">Origen del Registro</Label>
                       <Select 
                         value={formData.origenRegistro} 
                         onValueChange={(value) => setFormData({...formData, origenRegistro: value as "trabajo-campo" | "centro-dia" | "derivacion"})}
                       >
                         <SelectTrigger>
                           <SelectValue placeholder="Seleccionar origen" />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="centro-dia">Centro de día</SelectItem>
                           <SelectItem value="trabajo-campo">Trabajo de Campo</SelectItem>
                           <SelectItem value="derivacion">Derivación</SelectItem>
                         </SelectContent>
                       </Select>
                     </div>
                   </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                   <div>
                     <Label htmlFor="direccion">Dirección</Label>
                     <Input
                       id="direccion"
                       value={formData.direccion}
                       onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                     />
                   </div>
                   
                   <div>
                     <Label htmlFor="observaciones">Observaciones</Label>
                     <Textarea
                       id="observaciones"
                       value={formData.observaciones}
                       onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                       placeholder="Información adicional importante..."
                       rows={3}
                     />
                   </div>
                   
                   <div className="space-y-2">
                     <Label className="text-base">Documentos</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label>Archivo</Label>
                        <Input type="file" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" onChange={(e) => setDocFile(e.target.files?.[0] || null)} />
                      </div>
                      <div>
                        <Label>Descripción</Label>
                        <Input value={docDescripcion} onChange={(e) => setDocDescripcion(e.target.value)} placeholder="Ej: Documento de identidad" />
                      </div>
                    </div>
                     <div className="flex justify-end">
                       <Button type="button" onClick={subirDocumento} disabled={!docFile || uploadingDoc} className="gap-2">
                         <Paperclip className="h-4 w-4" /> 
                         {uploadingDoc ? "Subiendo..." : "Adjuntar"}
                       </Button>
                     </div>
                    {formData.documentos.length > 0 && (
                      <div className="space-y-2 border rounded-md p-3">
                        {formData.documentos.map((d) => (
                          <div key={d.id} className="flex items-center justify-between gap-3">
                            <div className="space-y-1">
                               <p className="text-sm font-medium">{d.descripcion || d.nombre} <span className="text-muted-foreground text-xs">({d.tipo})</span></p>
                               <p className="text-xs text-muted-foreground">{d.nombre} • Subido: {new Date(d.fechaSubida).toLocaleDateString()}</p>
                            </div>
                            <div className="flex gap-2">
                              <Button type="button" variant="outline" size="sm" onClick={() => verDocumento(d)} className="gap-1">
                                <Eye className="h-4 w-4" /> Ver
                              </Button>
                              <Button type="button" variant="destructive" size="sm" onClick={() => borrarDocumento(d)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">
                      {editingMujer ? "Actualizar" : "Registrar"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full px-6 py-8">
        {/* Search and Stats */}
        <div className="flex justify-between items-center mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por nombre, apellido, email o nacionalidad..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-80"
            />
          </div>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Total Registradas</p>
            <p className="text-2xl font-bold text-primary">{mujeres.length}</p>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              Lista de Mujeres Registradas
              {totalItems > 50 && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  (Mostrando {startIndex}-{endIndex} de {totalItems})
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedIds.length === paginatedItems.length && paginatedItems.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Origen</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                {loading ? (
                  <TableSkeleton rows={10} columns={4} />
                ) : (
                  <TableBody>
                    {paginatedItems.map((mujer) => (
                      <TableRow key={mujer.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.includes(mujer.id)}
                            onCheckedChange={() => toggleSelectItem(mujer.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          <div>
                            <span className="font-semibold">
                              {mujer.nombre || mujer.apodo} {mujer.apellido}
                            </span>
                            {mujer.apodo && mujer.nombre && (
                              <div className="text-xs text-muted-foreground">
                                ({mujer.apodo})
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {mujer.telefono && <div>{mujer.telefono}</div>}
                            {mujer.email && <div className="text-muted-foreground">{mujer.email}</div>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={mujer.origenRegistro === 'trabajo-campo' ? "default" : mujer.origenRegistro === 'centro-dia' ? "secondary" : "outline"}
                            className="text-xs"
                          >
                            {mujer.origenRegistro === 'trabajo-campo' ? "Trabajo de Campo" : 
                             mujer.origenRegistro === 'centro-dia' ? "Centro de Día" :
                             mujer.origenRegistro === 'derivacion' ? "Derivación" : 
                             "Centro de día"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <TooltipProvider>
                            <div className="flex gap-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Link to={`/mujeres/${mujer.id}?edit=true`}>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </Link>
                                </TooltipTrigger>
                                <TooltipContent>Editar</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Link to={`/mujeres/${mujer.id}`}>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </Link>
                                </TooltipTrigger>
                                <TooltipContent>Ver detalle</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setDeleteConfirm({ open: true, id: mujer.id })}
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Eliminar</TooltipContent>
                              </Tooltip>
                            </div>
                          </TooltipProvider>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                )}
              </Table>
            </div>
        {!loading && filteredMujeres.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? "No se encontraron resultados" : "No hay mujeres registradas"}
              </div>
          )}

          {/* Paginación */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
              </div>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <Button variant="outline" size="sm" onClick={previousPage} disabled={!hasPreviousPage}>
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Anterior
                    </Button>
                  </PaginationItem>
                  <PaginationItem>
                    <Button variant="outline" size="sm" onClick={nextPage} disabled={!hasNextPage}>
                      Siguiente
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

        {viewerDoc && viewerURL && (
          <Dialog
            open={!!viewerDoc}
            onOpenChange={(open) => {
              if (!open) {
                setViewerDoc(null)
                if (viewerURL) {
                  URL.revokeObjectURL(viewerURL)
                  setViewerURL(null)
                }
              }
            }}
          >
            <DialogContent className="max-w-4xl w-[90vw] h-[85vh] overflow-hidden">
              <DialogHeader className="space-y-2">
                <DialogTitle className="text-lg font-semibold">{viewerDoc.descripcion || viewerDoc.nombre}</DialogTitle>
                {viewerDoc.nombre && (
                  <p className="text-sm text-muted-foreground font-medium">{viewerDoc.nombre}</p>
                )}
                <div className="text-xs text-muted-foreground">
                  Tipo: {viewerDoc.tipo} • Subido: {new Date(viewerDoc.fechaSubida).toLocaleDateString()}
                </div>
              </DialogHeader>
              
              <div className="flex-1 w-full h-[calc(85vh-180px)] bg-muted/20 rounded-md border overflow-hidden">
                {viewerDoc.tipo?.startsWith("image/") ? (
                  <div className="w-full h-full flex items-center justify-center bg-white p-4">
                    <img 
                      src={viewerURL} 
                      alt={viewerDoc.descripcion || viewerDoc.nombre} 
                      className="max-w-full max-h-full object-contain rounded shadow-sm"
                      onLoad={() => console.log("Imagen cargada correctamente")}
                      onError={(e) => {
                        console.error("Error al cargar imagen:", e);
                        console.log("URL de la imagen:", viewerURL);
                      }}
                      style={{ 
                        maxWidth: '100%',
                        maxHeight: '100%',
                        width: 'auto',
                        height: 'auto'
                      }}
                    />
                  </div>
                ) : viewerDoc.tipo?.includes("pdf") ? (
                  <iframe 
                    src={viewerURL} 
                    className="w-full h-full border-0 bg-white" 
                    title={viewerDoc.nombre}
                    onLoad={() => console.log("PDF cargado correctamente")}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-muted/10">
                    <div className="text-center p-8">
                      <div className="text-6xl mb-4 opacity-50">📄</div>
                      <p className="text-base font-medium text-muted-foreground mb-2">
                        No se puede previsualizar este archivo
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Tipo: {viewerDoc.tipo}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-between items-center pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setViewerDoc(null)
                    if (viewerURL) {
                      URL.revokeObjectURL(viewerURL)
                      setViewerURL(null)
                    }
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cerrar
                </Button>
                <Button 
                  className="gap-2"
                  onClick={() => {
                    try {
                      if (viewerDoc.url) {
                        window.open(viewerDoc.url, '_blank');
                      } else {
                        toast.error("URL del documento no disponible");
                      }
                    } catch (error) {
                      console.error("Error en descarga:", error);
                      toast.error("Error al descargar el archivo");
                    }
                  }}
                >
                  <Download className="h-4 w-4" />
                  Descargar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </main>

      {/* Diálogo de confirmación */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ open, id: null })}
        onConfirm={() => deleteConfirm.id && handleDelete(deleteConfirm.id)}
        title="¿Eliminar mujer?"
        description="Esta acción no se puede deshacer. El registro será eliminado permanentemente."
      />

      {/* Multi-select toolbar */}
      <MultiSelectToolbar
        selectedCount={selectedIds.length}
        onClearSelection={() => setSelectedIds([])}
        onArchive={handleBulkArchive}
        onDelete={handleBulkDelete}
      />
    </div>
  );
};

export default Mujeres;