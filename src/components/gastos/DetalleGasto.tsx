import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type Gasto } from "@/lib/gastosStore";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, DollarSign, FileText, Receipt, Download, Eye, Image as ImageIcon } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useState } from "react";

interface DetalleGastoProps {
  gasto: Gasto;
}

export function DetalleGasto({ gasto }: DetalleGastoProps) {
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});

  const loadPreview = async (documento: any) => {
    if (!previewUrls[documento.id]) {
      const { gastosStore } = await import('@/lib/gastosStore');
      const signedUrl = await gastosStore.getDocumentUrl(documento.url);
      if (signedUrl) {
        setPreviewUrls(prev => ({ ...prev, [documento.id]: signedUrl }));
      }
    }
  };

  const isImage = (filename: string) => {
    const ext = filename.toLowerCase().split('.').pop();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext || '');
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <FileText className="h-5 w-5" />
              Información General
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Descripción</label>
              <p className="text-lg font-medium">{gasto.descripcion}</p>
            </div>

            {gasto.etiqueta && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Etiqueta</label>
                <div className="mt-1">
                  <Badge variant="secondary">{gasto.etiqueta}</Badge>
                </div>
              </div>
            )}
            
            <div>
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Monto
              </label>
              <p className="text-2xl font-bold text-primary">
                ${formatCurrency(gasto.monto)}
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Fecha
              </label>
              <p className="text-lg">
                {format(new Date(gasto.fecha), "PPPP", { locale: es })}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-secondary">
              <Receipt className="h-5 w-5" />
              Detalle de Factura
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="whitespace-pre-wrap">{gasto.detalleFactura}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {gasto.documentosAdjuntos && gasto.documentosAdjuntos.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <FileText className="h-5 w-5" />
              Documentos Adjuntos ({gasto.documentosAdjuntos.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4">
              {gasto.documentosAdjuntos.map((documento) => {
                const imgUrl = previewUrls[documento.id];
                const isImg = isImage(documento.nombre);
                
                // Cargar preview si es imagen y no está cargada
                if (isImg && !imgUrl) {
                  loadPreview(documento);
                }

                return (
                  <div
                    key={documento.id}
                    className="flex flex-col sm:flex-row gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    {/* Vista previa */}
                    <div className="flex-shrink-0 w-full sm:w-32 h-32 bg-muted rounded-md overflow-hidden flex items-center justify-center">
                      {isImg && imgUrl ? (
                        <img 
                          src={imgUrl} 
                          alt={documento.nombre}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FileText className="h-12 w-12 text-muted-foreground" />
                      )}
                    </div>

                    {/* Información del documento */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <p className="font-medium text-sm break-words">{documento.nombre}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {(documento.tamaño / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      
                      {/* Botones de acción */}
                      <div className="flex gap-2 mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            const { gastosStore } = await import('@/lib/gastosStore');
                            const signedUrl = await gastosStore.getDocumentUrl(documento.url);
                            if (signedUrl) {
                              window.open(signedUrl, '_blank');
                            } else {
                              console.error('No se pudo obtener la URL del documento');
                            }
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            const { gastosStore } = await import('@/lib/gastosStore');
                            const signedUrl = await gastosStore.getDocumentUrl(documento.url);
                            if (signedUrl) {
                              const link = document.createElement('a');
                              link.href = signedUrl;
                              link.download = documento.nombre;
                              link.click();
                            } else {
                              console.error('No se pudo obtener la URL del documento');
                            }
                          }}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Descargar
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-muted-foreground">
              <FileText className="h-5 w-5" />
              Documentos Adjuntos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center py-4">No hay documentos adjuntos para este gasto</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-muted-foreground">Información del Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-muted-foreground">ID del Registro</label>
              <p className="font-mono text-sm">{gasto.id}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Fecha de Creación</label>
              <p className="text-sm">
                {format(new Date(gasto.createdAt), "dd/MM/yyyy HH:mm", { locale: es })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}