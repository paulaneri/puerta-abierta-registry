import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormularioContactos } from "@/components/contactos/FormularioContactos";
import { DetalleContacto } from "@/components/contactos/DetalleContacto";
import { contactosStore, type Contacto, tiposContacto } from "@/lib/contactosStore";
import { Plus, Search, Eye, Edit, Trash2, Users, Phone, Mail, Globe, ChevronLeft, ChevronRight } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { MultiSelectToolbar } from "@/components/ui/multi-select-toolbar";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { usePagination } from "@/hooks/usePagination";
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from "@/components/ui/pagination";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";

const Contactos = () => {
  const [contactos, setContactos] = useState<Contacto[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTipo, setFilterTipo] = useState<string>("todos");
  const [isNewContactoOpen, setIsNewContactoOpen] = useState(false);
  const [editingContacto, setEditingContacto] = useState<Contacto | null>(null);
  const [viewingContacto, setViewingContacto] = useState<Contacto | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    loadContactos();
  }, []);

  const loadContactos = async () => {
    setLoading(true);
    const contactosData = await contactosStore.getContactos();
    
    // Si no hay contactos, agregar datos de ejemplo
    if (contactosData.length === 0) {
      const contactosEjemplo = [
        {
          referente: "Dr. María González",
          institucion: "Hospital Municipal",
          tipoContacto: "Salud",
          telefono: "11-4567-8901",
          email: "mgonzalez@hospital.gov.ar",
          paginaWeb: "www.hospitalmunicipal.gov.ar",
          descripcion: "Servicios de salud general y especialidades médicas",
          direccion: "Av. Libertador 1234",
          servicio: "Consultas médicas generales",
          diaAtencion: "Lunes a Viernes",
          horarioAtencion: "8:00 - 16:00",
          ciudad: "Buenos Aires",
          provincia: "Buenos Aires",
          pais: "Argentina"
        },
        {
          referente: "Lic. Carlos Martínez",
          institucion: "Centro de Adicciones",
          tipoContacto: "Adicciones",
          telefono: "11-9876-5432",
          email: "cmartinez@centroadicciones.org",
          paginaWeb: "www.centroadicciones.org",
          descripcion: "Programa de tratamiento integral para adicciones",
          direccion: "Calle San Martín 567",
          servicio: "Terapia individual y grupal",
          diaAtencion: "Lunes a Sábado",
          horarioAtencion: "9:00 - 18:00",
          ciudad: "La Plata",
          provincia: "Buenos Aires",
          pais: "Argentina"
        },
        {
          referente: "Dra. Ana Rodríguez",
          institucion: "Oficina de Migraciones",
          tipoContacto: "Migraciones",
          telefono: "11-2345-6789",
          email: "arodriguez@migraciones.gov.ar",
          paginaWeb: "www.migraciones.gov.ar",
          descripcion: "Trámites de residencia y documentación para migrantes",
          direccion: "Av. Antártida Argentina 1355",
          servicio: "Tramitación de residencias",
          diaAtencion: "Lunes a Viernes",
          horarioAtencion: "8:30 - 15:30",
          ciudad: "CABA",
          provincia: "Buenos Aires",
          pais: "Argentina"
        },
        {
          referente: "Prof. Laura Sánchez",
          institucion: "CESAJ - Centro de Capacitación",
          tipoContacto: "Capacitación",
          telefono: "11-3456-7890",
          email: "lsanchez@cesaj.edu.ar",
          paginaWeb: "www.cesaj.edu.ar",
          descripcion: "Cursos de oficios y capacitación laboral",
          direccion: "Calle Moreno 890",
          servicio: "Cursos de peluquería, gastronomía y costura",
          diaAtencion: "Lunes a Viernes",
          horarioAtencion: "14:00 - 20:00",
          ciudad: "San Isidro",
          provincia: "Buenos Aires",
          pais: "Argentina"
        }
      ];

      // Agregar cada contacto de ejemplo
      for (const contacto of contactosEjemplo) {
        await contactosStore.addContacto(contacto);
      }
      
      // Recargar la lista actualizada
      const contactosActualizados = await contactosStore.getContactos();
      setContactos(contactosActualizados);
    } else {
      setContactos(contactosData);
    }
    setLoading(false);
  };

  const handleNewContacto = () => {
    loadContactos();
    setIsNewContactoOpen(false);
  };

  const handleEditContacto = (contacto: Contacto) => {
    setEditingContacto(contacto);
  };

  const handleSaveEdit = () => {
    loadContactos();
    setEditingContacto(null);
  };

  const handleDeleteContacto = async (id: string) => {
    await contactosStore.deleteContacto(id);
    loadContactos();
    toast.success("Contacto eliminado exitosamente");
    setDeleteConfirm({ open: false, id: null });
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredContactos.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredContactos.map(c => c.id));
    }
  };

  const toggleSelectItem = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    for (const id of selectedIds) {
      await contactosStore.deleteContacto(id);
    }
    loadContactos();
    setSelectedIds([]);
    toast.success(`${selectedIds.length} contacto(s) eliminado(s)`);
  };

  const handleBulkArchive = async () => {
    if (selectedIds.length === 0) return;

    try {
      for (const id of selectedIds) {
        await contactosStore.archivarContacto(id, true);
      }
      loadContactos();
      setSelectedIds([]);
      toast.success(`${selectedIds.length} contacto(s) archivado(s)`);
    } catch (error) {
      console.error('Error archivando contactos:', error);
      toast.error("Error al archivar los contactos");
    }
  };

  const filteredContactos = contactos.filter(contacto => {
    const matchesSearch = 
      (contacto.referente?.toLowerCase().includes(searchTerm.toLowerCase()) || "") ||
      contacto.institucion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contacto.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterTipo === "todos" || contacto.tipoContacto === filterTipo;
    
    return matchesSearch && matchesType;
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
  } = usePagination(filteredContactos, 50);

  const getContactosPorTipo = () => {
    const grupos = tiposContacto.map(tipo => ({
      tipo,
      cantidad: contactos.filter(c => c.tipoContacto === tipo).length
    }));
    return grupos.filter(g => g.cantidad > 0);
  };

  const getTipoBadgeColor = (tipo: string) => {
    const colors: Record<string, string> = {
      "Salud": "bg-red-100 text-red-800",
      "Adicciones": "bg-orange-100 text-orange-800", 
      "Migraciones": "bg-blue-100 text-blue-800",
      "Educación": "bg-green-100 text-green-800",
      "Trabajo": "bg-purple-100 text-purple-800",
      "Vivienda": "bg-yellow-100 text-yellow-800",
      "Legal/Jurídico": "bg-gray-100 text-gray-800",
      "Psicológico": "bg-pink-100 text-pink-800",
      "Social": "bg-indigo-100 text-indigo-800",
      "Alimentación": "bg-emerald-100 text-emerald-800",
      "Capacitación": "bg-cyan-100 text-cyan-800",
      "Otros": "bg-slate-100 text-slate-800"
    };
    return colors[tipo] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary">Red de Contactos</h1>
          <p className="text-muted-foreground">Directorio para derivaciones y trabajo en red</p>
        </div>
        <Dialog open={isNewContactoOpen} onOpenChange={setIsNewContactoOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Contacto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Registrar Nuevo Contacto</DialogTitle>
            </DialogHeader>
            <FormularioContactos onSuccess={handleNewContacto} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Estadísticas por tipo */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {getContactosPorTipo().map(({ tipo, cantidad }) => (
          <Card key={tipo} className="text-center">
            <CardContent className="p-4">
              <Badge className={`${getTipoBadgeColor(tipo)} mb-2`}>
                {tipo}
              </Badge>
              <p className="text-2xl font-bold text-primary">{cantidad}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Búsqueda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Buscar por nombre, institución o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Filtrar por Tipo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={filterTipo} onValueChange={setFilterTipo}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent className="bg-background border shadow-md z-50">
                <SelectItem value="todos">Todos los tipos</SelectItem>
                {tiposContacto.map((tipo) => (
                  <SelectItem key={tipo} value={tipo}>
                    {tipo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {/* Resumen */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardHeader>
          <CardTitle className="text-primary">Resumen de Red de Contactos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{contactos.length}</p>
              <p className="text-muted-foreground">Total de contactos</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-secondary">{tiposContacto.length}</p>
              <p className="text-muted-foreground">Áreas de trabajo</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-accent">{filteredContactos.length}</p>
              <p className="text-muted-foreground">Contactos filtrados</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{getContactosPorTipo().length}</p>
              <p className="text-muted-foreground">Tipos activos</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Contactos */}
      <Card>
        <CardHeader>
          <CardTitle>
            Directorio de Contactos
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
                      checked={selectedIds.length === filteredContactos.length && filteredContactos.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Referente</TableHead>
                  <TableHead>Institución</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Ubicación</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              {loading ? (
                <TableSkeleton rows={10} columns={6} />
              ) : (
                <TableBody>
                  {paginatedItems.map((contacto) => (
                <TableRow key={contacto.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(contacto.id)}
                      onCheckedChange={() => toggleSelectItem(contacto.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{contacto.referente || "Sin referente"}</TableCell>
                  <TableCell>{contacto.institucion}</TableCell>
                  <TableCell>
                    <Badge className={getTipoBadgeColor(contacto.tipoContacto)}>
                      {contacto.tipoContacto}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {contacto.ciudad && contacto.provincia && (
                        <div>{contacto.ciudad}, {contacto.provincia}</div>
                      )}
                      {contacto.direccion && (
                        <div className="text-muted-foreground truncate max-w-32">{contacto.direccion}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 text-sm">
                      {contacto.telefono && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          <span>{contacto.telefono}</span>
                        </div>
                      )}
                      {contacto.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          <span className="truncate max-w-32">{contacto.email}</span>
                        </div>
                      )}
                      {contacto.paginaWeb && (
                        <div className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          <span className="truncate max-w-32">Web</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <div className="flex gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setViewingContacto(contacto)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Ver detalle</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditContacto(contacto)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Editar</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteConfirm({ open: true, id: contacto.id })}
                              className="text-destructive hover:text-destructive"
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
          {!loading && filteredContactos.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No se encontraron contactos
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={previousPage}
                      disabled={!hasPreviousPage}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Anterior
                    </Button>
                  </PaginationItem>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          onClick={() => goToPage(pageNum)}
                          isActive={currentPage === pageNum}
                          className="cursor-pointer"
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  
                  <PaginationItem>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={nextPage}
                      disabled={!hasNextPage}
                    >
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

      {/* Dialogs para Ver y Editar */}
      {viewingContacto && (
        <Dialog open={!!viewingContacto} onOpenChange={() => setViewingContacto(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Detalle del Contacto</DialogTitle>
            </DialogHeader>
            <DetalleContacto contacto={viewingContacto} />
          </DialogContent>
        </Dialog>
      )}

      {editingContacto && (
        <Dialog open={!!editingContacto} onOpenChange={() => setEditingContacto(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Editar Contacto</DialogTitle>
            </DialogHeader>
            <FormularioContactos
              contacto={editingContacto}
              onSuccess={handleSaveEdit}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Diálogo de confirmación */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ open, id: null })}
        onConfirm={() => deleteConfirm.id && handleDeleteContacto(deleteConfirm.id)}
        title="¿Eliminar contacto?"
        description="Esta acción no se puede deshacer. El contacto será eliminado permanentemente."
      />

      <MultiSelectToolbar
        selectedCount={selectedIds.length}
        onClearSelection={() => setSelectedIds([])}
        onArchive={handleBulkArchive}
        onDelete={handleBulkDelete}
      />
    </div>
  );
};

export default Contactos;