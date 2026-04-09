import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Image as ImageIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { albumesStore, type FotoAlbum, type Album } from "@/lib/albumesStore";

export const PhotoCarousel = () => {
  const [fotos, setFotos] = useState<(FotoAlbum & { album?: Album })[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarFotos = async () => {
      try {
        const [allFotos, allAlbumes] = await Promise.all([
          albumesStore.getAllFotos(),
          albumesStore.getAlbumes()
        ]);
        
        // Enrich fotos with album info
        const fotosConAlbum = allFotos.map(foto => ({
          ...foto,
          album: allAlbumes.find(a => a.id === foto.album_id)
        }));
        
        setFotos(fotosConAlbum);
      } catch (error) {
        console.error('Error cargando fotos:', error);
      } finally {
        setLoading(false);
      }
    };
    
    cargarFotos();
  }, []);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % fotos.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + fotos.length) % fotos.length);
  };

  // Auto-advance every 5 seconds
  useEffect(() => {
    if (fotos.length <= 1) return;
    
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [fotos.length]);

  if (loading) {
    return (
      <Card className="max-w-5xl mx-auto">
        <CardContent className="p-8 flex items-center justify-center min-h-[300px]">
          <div className="animate-pulse flex flex-col items-center gap-4">
            <ImageIcon className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">Cargando galería...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (fotos.length === 0) {
    return (
      <Card className="max-w-5xl mx-auto">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl sm:text-3xl text-primary flex items-center justify-center gap-2">
            <ImageIcon className="h-6 w-6 sm:h-8 sm:w-8" />
            Galería de Fotos
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 flex flex-col items-center justify-center min-h-[250px] gap-4">
          <ImageIcon className="h-16 w-16 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground text-center">
            No hay fotos en la galería todavía
          </p>
          <Link to="/galeria">
            <Button>
              <ImageIcon className="h-4 w-4 mr-2" />
              Ir a la galería
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const currentFoto = fotos[currentIndex];

  return (
    <Card className="max-w-5xl mx-auto overflow-hidden">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl sm:text-3xl text-primary flex items-center justify-center gap-2">
          <ImageIcon className="h-6 w-6 sm:h-8 sm:w-8" />
          Galería de Fotos
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative">
          {/* Main Image */}
          <div className="relative aspect-[16/9] bg-muted overflow-hidden">
            <img
              src={currentFoto.url}
              alt={currentFoto.descripcion || 'Foto de galería'}
              className="w-full h-full object-cover transition-opacity duration-500"
            />
            
            {/* Overlay with info */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 sm:p-6">
              {currentFoto.album && (
                <p className="text-white font-semibold text-lg sm:text-xl">
                  {currentFoto.album.nombre}
                </p>
              )}
              {currentFoto.descripcion && (
                <p className="text-white/80 text-sm sm:text-base mt-1">
                  {currentFoto.descripcion}
                </p>
              )}
            </div>
            
            {/* Navigation Arrows */}
            {fotos.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white h-10 w-10 sm:h-12 sm:w-12"
                  onClick={prevSlide}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white h-10 w-10 sm:h-12 sm:w-12"
                  onClick={nextSlide}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}
          </div>
          
          {/* Dots indicator */}
          {fotos.length > 1 && (
            <div className="flex justify-center gap-2 py-4 bg-card">
              {fotos.slice(0, 10).map((_, index) => (
                <button
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentIndex ? 'bg-primary' : 'bg-muted-foreground/30'
                  }`}
                  onClick={() => setCurrentIndex(index)}
                />
              ))}
              {fotos.length > 10 && (
                <span className="text-xs text-muted-foreground">+{fotos.length - 10}</span>
              )}
            </div>
          )}
        </div>
        
        {/* Link to gallery */}
        <div className="p-4 border-t text-center">
          <Link to="/galeria">
            <Button variant="outline">
              <ImageIcon className="h-4 w-4 mr-2" />
              Ver toda la galería
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};
