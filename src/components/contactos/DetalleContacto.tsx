import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type Contacto } from "@/lib/contactosStore";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { User, Building, Phone, Mail, Globe, FileText, Tag, MapPin, Clock, Calendar } from "lucide-react";

interface DetalleContactoProps {
  contacto: Contacto;
}

export function DetalleContacto({ contacto }: DetalleContactoProps) {
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

  const handlePhoneCall = () => {
    if (contacto.telefono) {
      window.open(`tel:${contacto.telefono}`);
    }
  };

  const handleEmailSend = () => {
    if (contacto.email) {
      window.open(`mailto:${contacto.email}`);
    }
  };

  const handleWebsiteOpen = () => {
    if (contacto.paginaWeb) {
      let url = contacto.paginaWeb;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      window.open(url, '_blank');
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <User className="h-5 w-5" />
              Información Personal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Referente</label>
              <p className="text-lg font-medium">{contacto.referente || "No especificado"}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Building className="h-4 w-4" />
                Institución
              </label>
              <p className="text-lg">{contacto.institucion}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Tipo de Contacto
              </label>
              <Badge className={`${getTipoBadgeColor(contacto.tipoContacto)} text-base px-3 py-1`}>
                {contacto.tipoContacto}
              </Badge>
            </div>

            {contacto.servicio && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Servicio</label>
                <p className="text-base">{contacto.servicio}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-secondary">
              <MapPin className="h-5 w-5" />
              Ubicación
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(contacto.pais || contacto.provincia || contacto.ciudad) && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Ubicación</label>
                <p className="text-lg">
                  {[contacto.ciudad, contacto.provincia, contacto.pais].filter(Boolean).join(", ")}
                </p>
              </div>
            )}
            
            {contacto.direccion && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Dirección</label>
                <p className="text-base">{contacto.direccion}</p>
              </div>
            )}

            {(contacto.diaAtencion || contacto.horarioAtencion) && (
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Horarios de Atención
                </label>
                <div className="space-y-1">
                  {contacto.diaAtencion && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      <span className="text-sm">{contacto.diaAtencion}</span>
                    </div>
                  )}
                  {contacto.horarioAtencion && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      <span className="text-sm">{contacto.horarioAtencion}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-secondary">
            <Phone className="h-5 w-5" />
            Información de Contacto
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {contacto.telefono && (
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Teléfono
                </label>
                <p className="text-lg font-mono">{contacto.telefono}</p>
              </div>
            )}
            
            {contacto.email && (
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </label>
                <p className="text-sm break-all">{contacto.email}</p>
              </div>
            )}
            
            {contacto.paginaWeb && (
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Página Web
                </label>
                <div className="flex flex-col gap-2">
                  <p className="text-sm break-all">{contacto.paginaWeb}</p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleWebsiteOpen}
                  >
                    Visitar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {contacto.descripcion && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-accent">
              <FileText className="h-5 w-5" />
              Descripción
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="whitespace-pre-wrap leading-relaxed">{contacto.descripcion}</p>
            </div>
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
              <p className="font-mono text-sm">{contacto.id}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Fecha de Registro</label>
              <p className="text-sm">
                {format(new Date(contacto.createdAt), "dd/MM/yyyy HH:mm", { locale: es })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}