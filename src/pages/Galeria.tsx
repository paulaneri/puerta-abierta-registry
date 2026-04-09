import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Image as ImageIcon, Calendar, Upload, Trash2, FolderOpen, X, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { albumesStore, type Album, type FotoAlbum } from "@/lib/albumesStore";
import { DatePicker } from "@/components/ui/date-picker";
import { useAuth } from "@/hooks/useAuth";

const Galeria = () => {
  const { user } = useAuth();
  const [albumes, setAlbumes] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [albumSeleccionado, setAlbumSeleccionado] = useState<Album | null>(null);
  const [fotosAlbum, setFotosAlbum] = useState<FotoAlbum[]>([]);
  const [loadingFotos, setLoadingFotos] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  
  // Form state
  const [nuevoAlbum, setNuevoAlbum] = useState({
    nombre: '',
    fecha: '',
    evento: '',
    descripcion: ''
  });

  useEffect(() => {
    cargarAlbumes();
  }, []);

  const cargarAlbumes = async () => {
    try {
      const data = await albumesStore.getAlbumes();
      setAlbumes(data);
    } catch (error) {
      console.error('Error cargando álbumes:', error);
      toast.error('Error al cargar los álbumes');
    } finally {
      setLoading(false);
    }
  };

  const cargarFotosAlbum = async (album: Album) => {
    setAlbumSeleccionado(album);
    setLoadingFotos(true);
    try {
      const fotos = await albumesStore.getFotosAlbum(album.id);
      setFotosAlbum(fotos);
    } catch (error) {
      console.error('Error cargando fotos:', error);
      toast.error('Error al cargar las fotos');
    } finally {
      setLoadingFotos(false);
    }
  };

  const crearAlbum = async () => {
    if (!nuevoAlbum.nombre || !nuevoAlbum.fecha) {
      toast.error('El nombre y la fecha son obligatorios');
      return;
    }

    try {
      const album = await albumesStore.createAlbum({
        nombre: nuevoAlbum.nombre,
        fecha: nuevoAlbum.fecha,
        evento: nuevoAlbum.evento || undefined,
        descripcion: nuevoAlbum.descripcion || undefined
      });
      
      if (album) {
        setAlbumes(prev => [album, ...prev]);
        setNuevoAlbum({ nombre: '', fecha: '', evento: '', descripcion: '' });
        setDialogOpen(false);
        toast.success('Álbum creado correctamente');
      }
    } catch (error) {
      console.error('Error creando álbum:', error);
      toast.error('Error al crear el álbum');
    }
  };

  const subirFotos = async (files: FileList) => {
    if (!albumSeleccionado || !user) return;
    
    setUploading(true);
    const nuevasFotos: FotoAlbum[] = [];
    
    try {
      for (const file of Array.from(files)) {
        const url = await albumesStore.uploadFoto(file, albumSeleccionado.id);
        if (url) {
          const foto = await albumesStore.addFoto({
            album_id: albumSeleccionado.id,
            url,
            nombre_archivo: file.name,
            orden: fotosAlbum.length + nuevasFotos.length
          });
          if (foto) {
            nuevasFotos.push(foto);
          }
        }
      }
      
      setFotosAlbum(prev => [...prev, ...nuevasFotos]);
      
      // Update album cover if it's the first photo
      if (fotosAlbum.length === 0 && nuevasFotos.length > 0) {
        await albumesStore.updateAlbum(albumSeleccionado.id, {
          foto_portada_url: nuevasFotos[0].url
        });
        setAlbumes(prev => prev.map(a => 
          a.id === albumSeleccionado.id 
            ? { ...a, foto_portada_url: nuevasFotos[0].url }
            : a
        ));
      }
      
      toast.success(`${nuevasFotos.length} foto(s) subida(s) correctamente`);
    } catch (error) {
      console.error('Error subiendo fotos:', error);
      toast.error('Error al subir las fotos');
    } finally {
      setUploading(false);
    }
  };

  const eliminarFoto = async (foto: FotoAlbum) => {
    try {
      await albumesStore.deleteFotoStorage(foto.url);
      await albumesStore.deleteFoto(foto.id);
      setFotosAlbum(prev => prev.filter(f => f.id !== foto.id));
      toast.success('Foto eliminada');
    } catch (error) {
      console.error('Error eliminando foto:', error);
      toast.error('Error al eliminar la foto');
    }
  };

  const eliminarAlbum = async (album: Album) => {
    if (!confirm(`¿Estás seguro de eliminar el álbum "${album.nombre}"? Se eliminarán todas las fotos.`)) {
      return;
    }
    
    try {
      // First delete all photos from storage
      const fotos = await albumesStore.getFotosAlbum(album.id);
      for (const foto of fotos) {
        await albumesStore.deleteFotoStorage(foto.url);
      }
      
      await albumesStore.deleteAlbum(album.id);
      setAlbumes(prev => prev.filter(a => a.id !== album.id));
      
      if (albumSeleccionado?.id === album.id) {
        setAlbumSeleccionado(null);
        setFotosAlbum([]);
      }
      
      toast.success('Álbum eliminado');
    } catch (error) {
      console.error('Error eliminando álbum:', error);
      toast.error('Error al eliminar el álbum');
    }
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-pulse flex flex-col items-center gap-4">
              <ImageIcon className="h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">Cargando galería...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
              <ImageIcon className="h-7 w-7 text-primary" />
              Galería de Fotos
            </h1>
            <p className="text-muted-foreground mt-1">
              Álbumes y fotos de eventos y actividades
            </p>
          </div>
          
          {user && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Álbum
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear Nuevo Álbum</DialogTitle>
                  <DialogDescription>
                    Crea un álbum para organizar tus fotos por evento o fecha
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre del álbum *</Label>
                    <Input
                      id="nombre"
                      value={nuevoAlbum.nombre}
                      onChange={(e) => setNuevoAlbum(prev => ({ ...prev, nombre: e.target.value }))}
                      placeholder="Ej: Taller de Navidad 2024"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha *</Label>
                    <DatePicker
                      date={nuevoAlbum.fecha ? parseISO(nuevoAlbum.fecha) : undefined}
                      onSelect={(date) => setNuevoAlbum(prev => ({ 
                        ...prev, 
                        fecha: date ? format(date, 'yyyy-MM-dd') : '' 
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="evento">Evento</Label>
                    <Input
                      id="evento"
                      value={nuevoAlbum.evento}
                      onChange={(e) => setNuevoAlbum(prev => ({ ...prev, evento: e.target.value }))}
                      placeholder="Ej: Celebración, Taller, Actividad..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="descripcion">Descripción</Label>
                    <Textarea
                      id="descripcion"
                      value={nuevoAlbum.descripcion}
                      onChange={(e) => setNuevoAlbum(prev => ({ ...prev, descripcion: e.target.value }))}
                      placeholder="Descripción opcional del álbum..."
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={crearAlbum}>
                    Crear Álbum
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Album View or Album List */}
        {albumSeleccionado ? (
          <div className="space-y-4">
            {/* Album Header */}
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="flex items-start gap-4">
                    <Button variant="ghost" size="icon" onClick={() => {
                      setAlbumSeleccionado(null);
                      setFotosAlbum([]);
                    }}>
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <div>
                      <CardTitle className="text-xl">{albumSeleccionado.nombre}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4" />
                        {format(parseISO(albumSeleccionado.fecha), "d 'de' MMMM 'de' yyyy", { locale: es })}
                        {albumSeleccionado.evento && (
                          <span className="ml-2 px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs">
                            {albumSeleccionado.evento}
                          </span>
                        )}
                      </CardDescription>
                      {albumSeleccionado.descripcion && (
                        <p className="text-muted-foreground mt-2 text-sm">
                          {albumSeleccionado.descripcion}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {user && (
                    <div className="flex gap-2">
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => e.target.files && subirFotos(e.target.files)}
                          disabled={uploading}
                        />
                        <Button variant="outline" asChild disabled={uploading}>
                          <span>
                            <Upload className="h-4 w-4 mr-2" />
                            {uploading ? 'Subiendo...' : 'Subir Fotos'}
                          </span>
                        </Button>
                      </label>
                    </div>
                  )}
                </div>
              </CardHeader>
            </Card>

            {/* Photos Grid */}
            {loadingFotos ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-pulse text-muted-foreground">Cargando fotos...</div>
              </div>
            ) : fotosAlbum.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <ImageIcon className="h-16 w-16 text-muted-foreground opacity-50 mb-4" />
                  <p className="text-muted-foreground mb-4">No hay fotos en este álbum</p>
                  {user && (
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => e.target.files && subirFotos(e.target.files)}
                      />
                      <Button asChild>
                        <span>
                          <Upload className="h-4 w-4 mr-2" />
                          Subir primera foto
                        </span>
                      </Button>
                    </label>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                {fotosAlbum.map((foto, index) => (
                  <div 
                    key={foto.id} 
                    className="relative group aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer"
                    onClick={() => openLightbox(index)}
                  >
                    <img
                      src={foto.url}
                      alt={foto.descripcion || 'Foto'}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          const link = document.createElement('a');
                          link.href = foto.url;
                          link.download = foto.nombre_archivo || 'foto.jpg';
                          link.target = '_blank';
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      {user && (
                        <Button
                          variant="destructive"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            eliminarFoto(foto);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Albums Grid */
          albumes.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FolderOpen className="h-16 w-16 text-muted-foreground opacity-50 mb-4" />
                <p className="text-muted-foreground mb-4">No hay álbumes creados</p>
                {user && (
                  <Button onClick={() => setDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear primer álbum
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {albumes.map((album) => (
                <Card 
                  key={album.id} 
                  className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                  onClick={() => cargarFotosAlbum(album)}
                >
                  <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                    {album.foto_portada_url ? (
                      <img
                        src={album.foto_portada_url}
                        alt={album.nombre}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="h-12 w-12 text-muted-foreground opacity-50" />
                      </div>
                    )}
                    {user && (
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          eliminarAlbum(album);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-foreground truncate">{album.nombre}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Calendar className="h-3 w-3" />
                      {format(parseISO(album.fecha), "d MMM yyyy", { locale: es })}
                    </div>
                    {album.evento && (
                      <span className="inline-block mt-2 px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs">
                        {album.evento}
                      </span>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        )}

        {/* Lightbox */}
        {lightboxOpen && fotosAlbum.length > 0 && (
          <div 
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
            onClick={() => setLightboxOpen(false)}
          >
            <div className="absolute top-4 right-4 flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  const link = document.createElement('a');
                  link.href = fotosAlbum[lightboxIndex].url;
                  link.download = fotosAlbum[lightboxIndex].nombre_archivo || 'foto.jpg';
                  link.target = '_blank';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
              >
                <Download className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={() => setLightboxOpen(false)}
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
            
            {fotosAlbum.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex((prev) => (prev - 1 + fotosAlbum.length) % fotosAlbum.length);
                  }}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex((prev) => (prev + 1) % fotosAlbum.length);
                  }}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </>
            )}
            
            <img
              src={fotosAlbum[lightboxIndex].url}
              alt={fotosAlbum[lightboxIndex].descripcion || 'Foto'}
              className="max-w-[90vw] max-h-[90vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
              {lightboxIndex + 1} / {fotosAlbum.length}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Galeria;
