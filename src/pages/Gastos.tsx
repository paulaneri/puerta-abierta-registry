import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FormularioGastos } from "@/components/gastos/FormularioGastos";
import { DetalleGasto } from "@/components/gastos/DetalleGasto";
import { GestionEtiquetas } from "@/components/gastos/GestionEtiquetas";
import { gastosStore, type Gasto } from "@/lib/gastosStore";

import { Plus, Search, Eye, Edit, Trash2, ChevronLeft, ChevronRight, Archive, ArchiveRestore, Download, Calendar, Tag, Settings } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { MultiSelectToolbar } from "@/components/ui/multi-select-toolbar";
import { formatCurrency, formatDate } from "@/lib/utils";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { usePagination } from "@/hooks/usePagination";
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from "@/components/ui/pagination";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Gastos = () => {
  const currentYear = new Date().getFullYear();
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isNewGastoOpen, setIsNewGastoOpen] = useState(false);
  const [editingGasto, setEditingGasto] = useState<Gasto | null>(null);
  const [viewingGasto, setViewingGasto] = useState<Gasto | null>(null);
  const [mostrarArchivados, setMostrarArchivados] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [añoSeleccionado, setAñoSeleccionado] = useState<number>(currentYear);
  const [etiquetaFiltro, setEtiquetaFiltro] = useState<string>("todas");
  const [isGestionEtiquetasOpen, setIsGestionEtiquetasOpen] = useState(false);

  const añosDisponibles = [...new Set(gastos.map(g => new Date(g.fecha).getFullYear()))].sort((a, b) => b - a);
  if (!añosDisponibles.includes(currentYear)) añosDisponibles.unshift(currentYear);

  useEffect(() => { loadGastos(); }, [mostrarArchivados]);

  const gastosDelAnoSeleccionado = gastos.filter(gasto => new Date(gasto.fecha).getFullYear() === añoSeleccionado);
  const sumatoriaAnual = gastosDelAnoSeleccionado.reduce((total, gasto) => total + gasto.monto, 0);

  // Totales por etiqueta del año seleccionado
  const totalesPorEtiqueta = gastosDelAnoSeleccionado.reduce((acc: Record<string, number>, gasto) => {
    const etiqueta = gasto.etiqueta || 'Sin etiqueta';
    acc[etiqueta] = (acc[etiqueta] || 0) + gasto.monto;
    return acc;
  }, {});

  // Etiquetas únicas disponibles en el año
  const etiquetasDisponibles = [...new Set(gastosDelAnoSeleccionado.map(g => g.etiqueta || 'Sin etiqueta'))].sort();

  const loadGastos = async () => {
    setLoading(true);
    const gastosData = await gastosStore.getGastos(mostrarArchivados);
    setGastos(gastosData);
    setLoading(false);
  };

  const handleNewGasto = () => { loadGastos(); setIsNewGastoOpen(false); };
  const handleEditGasto = (gasto: Gasto) => setEditingGasto(gasto);
  const handleSaveEdit = () => { loadGastos(); setEditingGasto(null); };

  const handleArchivarGasto = async (id: string, archivado: boolean) => {
    try {
      await gastosStore.archivarGasto(id, archivado);
      loadGastos();
      toast.success(archivado ? "Gasto archivado" : "Gasto restaurado");
    } catch {
      toast.error("Error al archivar el gasto");
    }
  };

  const handleDeleteGasto = async (id: string) => {
    await gastosStore.deleteGasto(id);
    loadGastos();
    toast.success("Gasto eliminado exitosamente");
    setDeleteConfirm({ open: false, id: null });
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredGastos.length) setSelectedIds([]);
    else setSelectedIds(filteredGastos.map(g => g.id));
  };

  const toggleSelectItem = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkArchive = async () => {
    for (const id of selectedIds) await gastosStore.archivarGasto(id, true);
    loadGastos(); setSelectedIds([]);
    toast.success(`${selectedIds.length} gasto(s) archivado(s)`);
  };

  const handleBulkDelete = async () => {
    for (const id of selectedIds) await gastosStore.deleteGasto(id);
    loadGastos(); setSelectedIds([]);
    toast.success(`${selectedIds.length} gasto(s) eliminado(s)`);
  };

  const filteredGastos = gastosDelAnoSeleccionado.filter(gasto => {
    const matchSearch = gasto.descripcion && gasto.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
    const matchEtiqueta = etiquetaFiltro === "todas" || (gasto.etiqueta || 'Sin etiqueta') === etiquetaFiltro;
    return matchSearch && matchEtiqueta;
  });

  const exportarAExcel = () => {
    const headers = ['Fecha', 'Descripción', 'Etiqueta', 'Monto', 'Detalle de Factura'];
    const rows = filteredGastos.map(gasto => [
      formatDate(gasto.fecha),
      gasto.descripcion,
      gasto.etiqueta || '',
      gasto.monto.toString(),
      gasto.detalleFactura || ''
    ]);
    const csvContent = [headers.join(';'), ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(';'))].join('\n');
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gastos_${añoSeleccionado}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Archivo exportado correctamente');
  };

  const { currentPage, totalPages, paginatedItems, goToPage, nextPage, previousPage, hasPreviousPage, hasNextPage, startIndex, endIndex, totalItems } = usePagination(filteredGastos, 50);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary">Gastos del Centro</h1>
          <p className="text-muted-foreground">Gestión de gastos y facturación</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isGestionEtiquetasOpen} onOpenChange={setIsGestionEtiquetasOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Etiquetas</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Gestionar Etiquetas</DialogTitle>
              </DialogHeader>
              <GestionEtiquetas onClose={() => setIsGestionEtiquetasOpen(false)} onChanged={loadGastos} />
            </DialogContent>
          </Dialog>
          <Dialog open={isNewGastoOpen} onOpenChange={setIsNewGastoOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nuevo Gasto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Registrar Nuevo Gasto</DialogTitle>
              </DialogHeader>
              <FormularioGastos onSuccess={handleNewGasto} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Search className="h-4 w-4" />Búsqueda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input placeholder="Buscar por descripción..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4" />Año
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={añoSeleccionado.toString()} onValueChange={(v) => setAñoSeleccionado(parseInt(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {añosDisponibles.map(año => <SelectItem key={año} value={año.toString()}>{año}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Tag className="h-4 w-4" />Etiqueta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={etiquetaFiltro} onValueChange={setEtiquetaFiltro}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                {etiquetasDisponibles.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Archive className="h-4 w-4" />Opciones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant={mostrarArchivados ? "default" : "outline"} onClick={() => setMostrarArchivados(!mostrarArchivados)} className="w-full text-xs">
              {mostrarArchivados ? "Ocultar archivados" : "Mostrar archivados"}
            </Button>
            <Button variant="outline" onClick={exportarAExcel} className="w-full gap-2 text-xs" disabled={filteredGastos.length === 0}>
              <Download className="h-4 w-4" />Exportar
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Total General + Totales por Etiqueta */}
      <div className="space-y-3">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 pt-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total General {añoSeleccionado}</p>
              <p className="text-3xl md:text-4xl font-bold text-primary">${formatCurrency(sumatoriaAnual)}</p>
            </div>
            <p className="text-muted-foreground">{gastosDelAnoSeleccionado.length} gastos registrados</p>
          </CardContent>
        </Card>

      </div>

      {/* Totales por Etiqueta — lista */}
      {Object.keys(totalesPorEtiqueta).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Tag className="h-4 w-4 text-primary" />
              Totales por Etiqueta — {añoSeleccionado}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(totalesPorEtiqueta)
                .sort((a, b) => b[1] - a[1])
                .map(([etiqueta, monto], index) => {
                  const maxMonto = Math.max(...Object.values(totalesPorEtiqueta));
                  const pct = Math.round((monto / maxMonto) * 100);
                  return (
                    <div key={etiqueta} className="flex items-center gap-3">
                      <span className="w-36 shrink-0 text-sm font-medium truncate">{etiqueta}</span>
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: `hsl(${(index * 67 + 200) % 360}, 60%, 50%)` }}
                        />
                      </div>
                      <span className="w-28 shrink-0 text-right text-sm font-mono font-semibold">
                        ${formatCurrency(monto)}
                      </span>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabla de Gastos */}
      <Card>
        <CardHeader>
          <CardTitle>
            Lista de Gastos
            {totalItems > 50 && (
              <span className="text-sm font-normal text-muted-foreground ml-2">(Mostrando {startIndex}-{endIndex} de {totalItems})</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox checked={selectedIds.length === filteredGastos.length && filteredGastos.length > 0} onCheckedChange={toggleSelectAll} />
                  </TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Etiqueta</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Detalle de Factura</TableHead>
                  <TableHead>Docs</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              {loading ? (
                <TableSkeleton rows={10} columns={7} />
              ) : (
                <TableBody>
                  {paginatedItems.map((gasto) => (
                    <TableRow key={gasto.id}>
                      <TableCell>
                        <Checkbox checked={selectedIds.includes(gasto.id)} onCheckedChange={() => toggleSelectItem(gasto.id)} />
                      </TableCell>
                      <TableCell>{formatDate(gasto.fecha)}</TableCell>
                      <TableCell className="font-medium">{gasto.descripcion}</TableCell>
                      <TableCell>
                        {gasto.etiqueta && (
                          <Badge variant="secondary" className="text-xs whitespace-nowrap">
                            {gasto.etiqueta}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-mono">${formatCurrency(gasto.monto)}</TableCell>
                      <TableCell className="max-w-xs truncate">{gasto.detalleFactura}</TableCell>
                      <TableCell>
                        {gasto.documentosAdjuntos && gasto.documentosAdjuntos.length > 0 ? (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">{gasto.documentosAdjuntos.length}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <div className="flex gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" onClick={() => setViewingGasto(gasto)}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Ver detalle</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" onClick={() => handleEditGasto(gasto)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Editar</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" onClick={() => handleArchivarGasto(gasto.id, !(gasto as any).archivado)}>
                                  {(gasto as any).archivado ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{(gasto as any).archivado ? "Restaurar" : "Archivar"}</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm({ open: true, id: gasto.id })} className="text-destructive hover:text-destructive">
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
          {!loading && filteredGastos.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">No se encontraron gastos</div>
          )}

          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">Página {currentPage} de {totalPages}</div>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <Button variant="outline" size="sm" onClick={previousPage} disabled={!hasPreviousPage}>
                      <ChevronLeft className="h-4 w-4 mr-1" />Anterior
                    </Button>
                  </PaginationItem>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) pageNum = i + 1;
                    else if (currentPage <= 3) pageNum = i + 1;
                    else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                    else pageNum = currentPage - 2 + i;
                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink onClick={() => goToPage(pageNum)} isActive={currentPage === pageNum} className="cursor-pointer">{pageNum}</PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  <PaginationItem>
                    <Button variant="outline" size="sm" onClick={nextPage} disabled={!hasNextPage}>
                      Siguiente<ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {viewingGasto && (
        <Dialog open={!!viewingGasto} onOpenChange={() => setViewingGasto(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Detalle del Gasto</DialogTitle></DialogHeader>
            <DetalleGasto gasto={viewingGasto} />
          </DialogContent>
        </Dialog>
      )}

      {editingGasto && (
        <Dialog open={!!editingGasto} onOpenChange={() => setEditingGasto(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Editar Gasto</DialogTitle></DialogHeader>
            <FormularioGastos gasto={editingGasto} onSuccess={handleSaveEdit} />
          </DialogContent>
        </Dialog>
      )}

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ open, id: null })}
        onConfirm={() => deleteConfirm.id && handleDeleteGasto(deleteConfirm.id)}
        title="¿Eliminar gasto?"
        description="Esta acción no se puede deshacer. El gasto será eliminado permanentemente."
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

export default Gastos;
