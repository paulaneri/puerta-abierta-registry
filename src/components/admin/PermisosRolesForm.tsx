import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, UserCheck, Users } from 'lucide-react';

const sections = [
  { id: 'inicio', name: 'Inicio', description: 'Página principal' },
  { id: 'mujeres', name: 'Participantes', description: 'Gestión de participantes' },
  { id: 'centro-dia', name: 'Centro Día', description: 'Actividades del centro día' },
  { id: 'trabajo-campo', name: 'Trabajo de Campo', description: 'Salidas y trabajo de campo' },
  { id: 'equipo', name: 'Equipo', description: 'Equipo de trabajo y reuniones' },
  { id: 'contactos', name: 'Contactos', description: 'Lista de contactos' },
  { id: 'calendario', name: 'Calendario', description: 'Eventos y calendario' },
  { id: 'galeria', name: 'Galería', description: 'Álbumes de fotos' },
  { id: 'actividades', name: 'Actividades', description: 'Organización de actividades' },
  { id: 'gastos', name: 'Gastos', description: 'Gestión de gastos' },
  { id: 'duplas', name: 'Duplas', description: 'Duplas de acompañamiento' },
  { id: 'estadisticas', name: 'Estadísticas', description: 'Reportes y estadísticas' },
  { id: 'administracion', name: 'Administración', description: 'Panel de administración' }
];

const roles = [
  { 
    id: 'trabajador', 
    name: 'Trabajador', 
    icon: Users,
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    defaultSections: ['inicio', 'mujeres', 'centro-dia', 'calendario', 'contactos', 'trabajo-campo', 'equipo', 'estadisticas', 'galeria', 'actividades']
  },
  { 
    id: 'coordinador', 
    name: 'Coordinador', 
    icon: UserCheck,
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    defaultSections: ['inicio', 'mujeres', 'centro-dia', 'calendario', 'gastos', 'contactos', 'equipo', 'duplas', 'trabajo-campo', 'estadisticas', 'galeria', 'actividades']
  },
  { 
    id: 'administrador', 
    name: 'Administrador', 
    icon: Shield,
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    defaultSections: sections.map(s => s.id) // All sections
  }
];

export function PermisosRolesForm() {
  const [permissions, setPermissions] = useState(() => {
    const initial: Record<string, string[]> = {};
    roles.forEach(role => {
      initial[role.id] = role.defaultSections;
    });
    return initial;
  });

  const handleTogglePermission = (roleId: string, sectionId: string) => {
    setPermissions(prev => {
      const roleSections = prev[roleId] || [];
      const hasPermission = roleSections.includes(sectionId);
      
      return {
        ...prev,
        [roleId]: hasPermission 
          ? roleSections.filter(s => s !== sectionId)
          : [...roleSections, sectionId]
      };
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          <strong>Nota:</strong> Esta es una vista de referencia de los permisos por rol. 
          Los permisos reales están definidos en el código de la aplicación.
          Para modificar los permisos, contacta con el desarrollador.
        </p>
      </div>

      {roles.map((role) => {
        const IconComponent = role.icon;
        return (
          <Card key={role.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-full">
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{role.name}</CardTitle>
                    <CardDescription>
                      Permisos de acceso para el rol {role.name.toLowerCase()}
                    </CardDescription>
                  </div>
                </div>
                <Badge className={role.color}>
                  {role.name}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sections.map((section) => {
                  const hasPermission = permissions[role.id]?.includes(section.id) || false;
                  const isAdmin = role.id === 'administrador';
                  
                  return (
                    <div 
                      key={section.id} 
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        hasPermission ? 'bg-primary/5 border-primary/20' : 'bg-muted/50'
                      }`}
                    >
                      <div className="flex-1">
                        <Label 
                          htmlFor={`${role.id}-${section.id}`}
                          className="cursor-pointer font-medium"
                        >
                          {section.name}
                        </Label>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {section.description}
                        </p>
                      </div>
                      <Switch
                        id={`${role.id}-${section.id}`}
                        checked={hasPermission}
                        onCheckedChange={() => handleTogglePermission(role.id, section.id)}
                        disabled={isAdmin}
                      />
                    </div>
                  );
                })}
              </div>
              {role.id === 'administrador' && (
                <p className="text-xs text-muted-foreground mt-4">
                  Los administradores tienen acceso completo a todas las secciones.
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
