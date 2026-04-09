import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Calendar, Users, Phone, PhoneCall, FileText, UserCheck, MapPin, Building2 } from "lucide-react";
import { type RegistroCentroDia } from "@/lib/centroDiaStore";
import { trabajoCampoStore } from "@/lib/trabajoCampoStore";

interface DetalleRegistroProps {
  registro: RegistroCentroDia;
  onClose: () => void;
}

const DetalleRegistro = ({ registro, onClose }: DetalleRegistroProps) => {
  const totalTramites = registro.tramites.reduce((sum, tramite) => sum + tramite.cantidad, 0);
  const entrevistasRealizadas = registro.mujeresAsistieron.filter(m => m.entrevistaRealizada).length;
  const [trabajoCampoDelDia, setTrabajoCampoDelDia] = useState<any>(null);

  useEffect(() => {
    const cargarTrabajoCampo = async () => {
      const trabajo = await trabajoCampoStore.getTrabajoByFecha(registro.fecha);
      setTrabajoCampoDelDia(trabajo);
    };
    cargarTrabajoCampo();
  }, [registro.fecha]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Registro del {new Date(registro.fecha).toLocaleDateString()}
            </CardTitle>
            <Button variant="outline" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Resumen de estadísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Mujeres</p>
                    <p className="text-2xl font-bold">{registro.mujeresAsistieron.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Entrevistas</p>
                    <p className="text-2xl font-bold">{entrevistasRealizadas}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-purple-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Llamadas</p>
                    <p className="text-2xl font-bold">{registro.llamadasRecibidas.length + registro.llamadasHechas.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-orange-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Trámites</p>
                    <p className="text-2xl font-bold">{totalTramites}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Mujeres Asistentes */}
          {registro.mujeresAsistieron.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Mujeres Asistentes
              </h3>
              <div className="grid gap-2">
                {registro.mujeresAsistieron.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">{item.mujer.nombre} {item.mujer.apellido}</span>
                    {item.entrevistaRealizada && (
                      <Badge className="bg-green-100 text-green-800">
                        Entrevista realizada
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Talleres y Actividades */}
          {registro.talleresActividades && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Talleres y Actividades</h3>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700">{registro.talleresActividades}</p>
              </div>
            </div>
          )}

          {/* Llamadas */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Actividad Telefónica
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Phone className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Llamadas Recibidas ({registro.llamadasRecibidas.length})</span>
                  </div>
                  {registro.llamadasRecibidas.length > 0 ? (
                    <div className="space-y-1">
                      {registro.llamadasRecibidas.map((llamada, index) => (
                        <div key={index} className="text-sm">
                          <span className="font-medium">{llamada.nombre}</span>
                          {llamada.descripcion && (
                            <span className="text-blue-600"> - {llamada.descripcion}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-blue-600">No hay llamadas recibidas</p>
                  )}
                </div>
              </div>
              <div className="space-y-3">
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <PhoneCall className="h-4 w-4 text-green-600" />
                    <span className="font-medium">Llamadas Realizadas ({registro.llamadasHechas.length})</span>
                  </div>
                  {registro.llamadasHechas.length > 0 ? (
                    <div className="space-y-1">
                      {registro.llamadasHechas.map((llamada, index) => (
                        <div key={index} className="text-sm">
                          <span className="font-medium">{llamada.nombre}</span>
                          {llamada.descripcion && (
                            <span className="text-green-600"> - {llamada.descripcion}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-green-600">No hay llamadas realizadas</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Trámites */}
          {registro.tramites.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Trámites Realizados
              </h3>
              <div className="grid gap-2">
                {registro.tramites.map((tramite, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <span className="font-medium">{tramite.tipo}</span>
                    <Badge variant="outline" className="bg-orange-100 text-orange-800">
                      {tramite.cantidad}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Articulación con Instituciones */}
          {registro.articulacionInstituciones && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Articulación con Instituciones
              </h3>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700">{registro.articulacionInstituciones}</p>
              </div>
            </div>
          )}


          {/* Equipo de Trabajo */}
          {registro.equipoTrabajo && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Equipo de Trabajo
              </h3>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-gray-700">{registro.equipoTrabajo}</p>
              </div>
            </div>
          )}

          {/* Trabajo de Campo */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Trabajo de Campo
            </h3>
            {trabajoCampoDelDia ? (
              <div className="space-y-3">
                <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-green-100 text-green-800">
                      Trabajo de campo realizado
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <p><span className="font-medium">Lugar:</span> {trabajoCampoDelDia.lugar}</p>
                    <p><span className="font-medium">Descripción:</span> {trabajoCampoDelDia.descripcion}</p>
                    <p><span className="font-medium">Profesionales:</span> {trabajoCampoDelDia.profesionales.join(', ')}</p>
                    <p><span className="font-medium">Encuentros:</span> {trabajoCampoDelDia.encuentros.length}</p>
                  </div>
                </div>
                {registro.trabajoCampoResumen && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Resumen en registro de Centro de Día:</p>
                    <p className="text-gray-700">{registro.trabajoCampoResumen}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-gray-50 rounded-lg border-l-4 border-gray-300">
                {registro.trabajoCampoResumen ? (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="bg-gray-100 text-gray-600">
                        Sin registro detallado
                      </Badge>
                    </div>
                    <p className="text-gray-700">{registro.trabajoCampoResumen}</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-gray-100 text-gray-600">
                      No hubo trabajo de campo
                    </Badge>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Comentarios y Observaciones */}
          {registro.comentariosObservaciones && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Comentarios y Observaciones
              </h3>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700 whitespace-pre-wrap">{registro.comentariosObservaciones}</p>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={onClose}>Cerrar</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DetalleRegistro;