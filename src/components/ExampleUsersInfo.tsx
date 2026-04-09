import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, UserCheck, Shield } from 'lucide-react';

export function ExampleUsersInfo() {
  const exampleUsers = [
    {
      email: 'admin@ejemplo.com',
      password: 'AdminTest123!',
      role: 'Administrador',
      nombre: 'María González',
      icon: Shield,
      color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    },
    {
      email: 'coordinador@ejemplo.com',
      password: 'CoordTest123!',
      role: 'Coordinador',
      nombre: 'Juan Pérez',
      icon: UserCheck,
      color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
    },
    {
      email: 'trabajador@ejemplo.com',
      password: 'TrabTest123!',
      role: 'Trabajador',
      nombre: 'Ana Rodríguez',
      icon: Users,
      color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
    }
  ];

  return (
    <Card className="border-dashed border-2 border-purple-300 bg-purple-50/50 dark:bg-purple-950/20">
      <CardHeader>
        <CardTitle className="text-purple-800 dark:text-purple-300">
          Usuarios de Ejemplo Creados
        </CardTitle>
        <CardDescription>
          Utiliza estas credenciales para probar diferentes niveles de acceso
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {exampleUsers.map((user) => {
          const IconComponent = user.icon;
          return (
            <div key={user.email} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-full">
                  <IconComponent className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="font-medium">{user.nombre}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={user.color}>
                  {user.role}
                </Badge>
                <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                  {user.password}
                </code>
              </div>
            </div>
          );
        })}
        <div className="text-xs text-muted-foreground mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="font-medium text-blue-800 dark:text-blue-300 mb-1">¿Cómo usar?</p>
          <p>1. Haz clic en "Crear Usuarios de Ejemplo" en la sección de arriba si no están creados</p>
          <p>2. Copia el email y contraseña de cualquiera de estos usuarios</p>
          <p>3. Ve a la página de login (/auth) y úsalos para ingresar</p>
        </div>
        <div className="text-xs text-muted-foreground mt-2 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
          <p className="font-medium text-amber-800 dark:text-amber-300 mb-1">Nota:</p>
          <p>Estos usuarios son solo para pruebas. En producción, elimina o cambia estas credenciales.</p>
        </div>
      </CardContent>
    </Card>
  );
}