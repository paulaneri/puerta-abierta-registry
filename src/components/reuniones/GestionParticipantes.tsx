import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Users, Mail, Phone, Briefcase, FileText, MessageSquare, UserCheck } from "lucide-react";
import { type Profesional } from "@/lib/equipoStore";
import { type ReunionConAsignaciones, type RolReunion } from "@/lib/reunionesStore";

interface GestionParticipantesProps {
  profesionales: Profesional[];
  reuniones?: ReunionConAsignaciones[];
}

export const GestionParticipantes = ({ profesionales, reuniones = [] }: GestionParticipantesProps) => {
  // Calcular estadísticas de roles por profesional
  const calcularEstadisticas = () => {
    const stats = new Map<string, { reflexion: number; coordinacion: number; acta: number; total: number }>();
    
    profesionales.forEach(p => {
      stats.set(p.id, { reflexion: 0, coordinacion: 0, acta: 0, total: 0 });
    });
    
    reuniones.forEach(reunion => {
      reunion.asignaciones.forEach(asig => {
        const stat = stats.get(asig.profesional_id);
        if (stat) {
          stat[asig.rol]++;
          stat.total++;
        }
      });
    });
    
    return stats;
  };

  const estadisticas = calcularEstadisticas();
  const totalRolesAsignados = reuniones.reduce((acc, r) => acc + r.asignaciones.length, 0);
  const maxRoles = Math.max(...Array.from(estadisticas.values()).map(s => s.total), 1);

  return (
    <div className="space-y-4">
      {/* Resumen general */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="py-3 px-4 text-center">
            <div className="text-2xl font-bold text-primary">{profesionales.length}</div>
            <div className="text-xs text-muted-foreground">Participantes</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 px-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {Array.from(estadisticas.values()).reduce((acc, s) => acc + s.reflexion, 0)}
            </div>
            <div className="text-xs text-muted-foreground">Reflexiones</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 px-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {Array.from(estadisticas.values()).reduce((acc, s) => acc + s.coordinacion, 0)}
            </div>
            <div className="text-xs text-muted-foreground">Coordinaciones</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 px-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {Array.from(estadisticas.values()).reduce((acc, s) => acc + s.acta, 0)}
            </div>
            <div className="text-xs text-muted-foreground">Actas</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Equipo Coordinador
          </CardTitle>
          <CardDescription>
            Profesionales que participan en las reuniones semanales de coordinación
          </CardDescription>
        </CardHeader>
        <CardContent>
          {profesionales.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No hay profesionales marcados como parte del Equipo Coordinador.
              <br />
              <span className="text-sm">
                Ve a "Equipo de Trabajo" y marca a los profesionales como "Equipo Coordinador" en el campo "Tipo de equipo".
              </span>
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profesionales.map(profesional => {
                const stats = estadisticas.get(profesional.id) || { reflexion: 0, coordinacion: 0, acta: 0, total: 0 };
                const progressPercent = maxRoles > 0 ? (stats.total / maxRoles) * 100 : 0;
                
                return (
                  <Card key={profesional.id} className="bg-muted/30">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-primary/10 text-primary font-medium">
                            {profesional.nombre[0]}{profesional.apellido[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="font-semibold truncate">
                              {profesional.nombre} {profesional.apellido}
                            </h3>
                            <Badge variant="secondary" className="text-xs shrink-0">
                              {stats.total} roles
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Briefcase className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground truncate">
                              {profesional.cargo || 'Sin cargo'}
                            </span>
                          </div>
                          
                          {/* Estadísticas de roles */}
                          <div className="flex items-center gap-3 mt-3">
                            <div className="flex items-center gap-1" title="Reflexiones">
                              <MessageSquare className="h-3 w-3 text-blue-500" />
                              <span className="text-xs font-medium">{stats.reflexion}</span>
                            </div>
                            <div className="flex items-center gap-1" title="Coordinaciones">
                              <UserCheck className="h-3 w-3 text-green-500" />
                              <span className="text-xs font-medium">{stats.coordinacion}</span>
                            </div>
                            <div className="flex items-center gap-1" title="Actas">
                              <FileText className="h-3 w-3 text-purple-500" />
                              <span className="text-xs font-medium">{stats.acta}</span>
                            </div>
                          </div>
                          
                          {/* Barra de progreso de participación */}
                          <div className="mt-2">
                            <Progress value={progressPercent} className="h-1.5" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              <strong>Total de participantes:</strong> {profesionales.length} profesionales del Equipo Coordinador
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Roles asignados:</strong> {totalRolesAsignados}
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* Leyenda de colores */}
      <Card>
        <CardContent className="py-3">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="text-muted-foreground font-medium">Leyenda:</span>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
              <span>Reflexión</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-green-500"></span>
              <span>Coordinación</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-purple-500"></span>
              <span>Acta</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
