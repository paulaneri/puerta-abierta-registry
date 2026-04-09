import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Download, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { type Documento } from "@/lib/mujeresStore";
import { useState, useEffect } from "react";

interface DocumentViewerProps {
  document: Documento | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DocumentViewer({ document, isOpen, onClose }: DocumentViewerProps) {
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Determinar si es una imagen
  const isImage = document?.tipo?.startsWith('image/');

  useEffect(() => {
    if (document && isOpen) {
      loadDocumentUrl();
    }
  }, [document, isOpen]);

  const loadDocumentUrl = async () => {
    if (!document) return;
    
    setLoading(true);
    try {
      const documentPath = document.url || document.fileId;
      console.log('📄 Loading document:', { nombre: document.nombre, path: documentPath, tipo: document.tipo });
      
      if (documentPath) {
        const { mujeresStore } = await import('@/lib/mujeresStore');
        const signedUrl = await mujeresStore.getDocumentUrl(documentPath);
        console.log('✅ Signed URL generated:', signedUrl ? 'Success' : 'Failed');
        
        if (signedUrl) {
          setDocumentUrl(signedUrl);
        } else {
          console.error('❌ No se pudo generar URL firmada');
          toast.error("No se pudo generar la URL del documento");
        }
      } else {
        console.error('❌ No document path found');
        toast.error("Ruta del documento no disponible");
      }
    } catch (error) {
      console.error("❌ Error loading document:", error);
      toast.error("Error al cargar el documento");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDocument = async () => {
    if (!document) return;
    
    try {
      const documentPath = document.url || document.fileId;
      if (documentPath) {
        const { mujeresStore } = await import('@/lib/mujeresStore');
        const signedUrl = await mujeresStore.getDocumentUrl(documentPath);
        
        if (signedUrl) {
          window.open(signedUrl, '_blank');
          toast.success("Abriendo documento");
          onClose(); // Cerrar el modal después de abrir el documento
        } else {
          toast.error("Error al obtener la URL del documento");
        }
      } else {
        toast.error("URL del documento no disponible");
      }
    } catch (error) {
      console.error("Error al abrir documento:", error);
      toast.error("Error al abrir el documento");
    }
  };

  if (!document) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="px-4 sm:px-6 py-3 sm:py-4 border-b flex-shrink-0">
          <DialogTitle className="text-base sm:text-lg font-semibold truncate pr-8">
            {document.descripcion || document.nombre}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto p-3 sm:p-6 min-h-0">
          {loading ? (
            <div className="flex items-center justify-center h-48 sm:h-64 bg-muted/10 rounded-lg">
              <div className="text-center p-4 sm:p-8">
                <div className="text-4xl sm:text-6xl mb-4 opacity-50">⏳</div>
                <p className="text-sm sm:text-base font-medium text-muted-foreground">
                  Cargando documento...
                </p>
              </div>
            </div>
          ) : documentUrl ? (
            isImage ? (
              <div className="flex items-center justify-center bg-muted/10 rounded-lg p-2 sm:p-4">
                <img 
                  src={documentUrl} 
                  alt={document.nombre}
                  className="max-w-full w-auto h-auto object-contain rounded shadow-lg"
                  style={{ 
                    maxWidth: '100%',
                    maxHeight: 'calc(90vh - 10rem)'
                  }}
                  onError={() => {
                    toast.error("Error al cargar la imagen");
                    setDocumentUrl(null);
                  }}
                />
              </div>
            ) : (
              <div className="w-full bg-muted/10 rounded-lg overflow-hidden flex flex-col">
                <iframe 
                  src={documentUrl}
                  className="w-full border-0 rounded-lg flex-1"
                  style={{ height: 'calc(90vh - 14rem)', minHeight: '300px' }}
                  title={document.nombre}
                  onError={(e) => {
                    console.error("Error loading iframe:", e);
                    toast.error("Error al cargar el documento en el visor");
                  }}
                />
                <div className="p-2 sm:p-3 text-center border-t bg-background">
                  <p className="text-xs text-muted-foreground mb-2">
                    ¿No se ve el PDF? 
                  </p>
                  <Button variant="outline" size="sm" onClick={handleOpenDocument} className="gap-2">
                    <ExternalLink className="h-4 w-4" />
                    <span className="hidden sm:inline">Abrir en nueva pestaña</span>
                    <span className="sm:hidden">Abrir</span>
                  </Button>
                </div>
              </div>
            )
          ) : (
            <div className="flex items-center justify-center h-48 sm:h-64 bg-muted/10 rounded-lg">
              <div className="text-center p-4 sm:p-8">
                <div className="text-4xl sm:text-6xl mb-4 opacity-50">❌</div>
                <p className="text-sm sm:text-base font-medium text-muted-foreground mb-2">
                  Error al cargar el documento
                </p>
                <Button variant="outline" size="sm" onClick={handleOpenDocument}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Abrir en nueva pestaña
                </Button>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-3 sm:p-6 border-t bg-background flex-shrink-0">
          <div className="text-xs sm:text-sm text-muted-foreground truncate max-w-full sm:max-w-[60%]">
            <div className="font-medium truncate">{document.nombre}</div>
            <div className="truncate">Tipo: {document.tipo} • Tamaño: {(document.tamaño / 1024).toFixed(1)} KB</div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" size="sm" onClick={onClose} className="flex-1 sm:flex-none">
              <X className="h-4 w-4 mr-1 sm:mr-2" />
              Cerrar
            </Button>
            <Button size="sm" onClick={handleOpenDocument} className="gap-1 sm:gap-2 flex-1 sm:flex-none">
              <ExternalLink className="h-4 w-4" />
              <span className="hidden sm:inline">Abrir documento</span>
              <span className="sm:hidden">Abrir</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}