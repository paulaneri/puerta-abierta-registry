import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Users, UserCheck, Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface TestCredential {
  email: string;
  password: string;
  role: string;
  nombre: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  available: boolean;
  note?: string;
}

interface TestCredentialsProps {
  onCredentialSelect?: (email: string, password: string) => void;
}

export function TestCredentials({ onCredentialSelect }: TestCredentialsProps) {
  const testUsers: TestCredential[] = [
    // Usuarios reales que funcionan
    {
      email: 'paulaneri@gmail.com',
      password: 'Tu contraseña',
      role: 'Administrador',
      nombre: 'Paula Neri',
      icon: Shield,
      color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      available: true,
      note: 'Usuario principal - administrador'
    },
    {
      email: 'puertaabiertarecreando@gmail.com',
      password: 'CoordTest123!',
      role: 'Coordinador',
      nombre: 'Paula Coordinadora',
      icon: UserCheck,
      color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      available: true,
      note: 'Usuario de ejemplo - crear desde Administración'
    },
    {
      email: 'comunicacion@puertaabiertarecreando.org.ar',
      password: 'TrabTest123!',
      role: 'Trabajador',
      nombre: 'Comunicación (Trabajador)',
      icon: Users,
      color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      available: true,
      note: 'Usuario real - funciona inmediatamente'
    },
    // Usuario admin de ejemplo
    {
      email: 'admin.test@example.com',
      password: 'AdminTest123!',
      role: 'Administrador',
      nombre: 'María González (Admin Test)',
      icon: Shield,
      color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      available: true,
      note: 'Usuario de ejemplo - necesita ser creado'
    }
  ];

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${type} copiado al portapapeles`);
    } catch (error) {
      toast.error('Error al copiar al portapapeles');
    }
  };

  const handleUseCredentials = (email: string, password: string) => {
    if (onCredentialSelect) {
      onCredentialSelect(email, password);
      toast.success('Credenciales cargadas en el formulario');
    }
  };

  const availableUsers = testUsers.filter(user => user.available);
  const unavailableUsers = testUsers.filter(user => !user.available);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-center text-primary flex items-center justify-center gap-2">
          <Users className="h-5 w-5" />
          Credenciales de Acceso
        </CardTitle>
        <CardDescription className="text-center">
          Usuarios disponibles para probar la aplicación
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Usuarios que funcionan inmediatamente */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-green-700 dark:text-green-300">
            <CheckCircle className="h-4 w-4" />
            Disponibles ahora (funcionan inmediatamente)
          </div>
          
          {availableUsers.map((user) => {
            const IconComponent = user.icon;
            return (
              <div key={user.email} className="p-4 border rounded-lg space-y-3 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
                    <IconComponent className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{user.nombre}</p>
                      <Badge className={user.color}>{user.role}</Badge>
                    </div>
                    <p className="text-xs text-green-600 dark:text-green-400">{user.note}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <div className="flex items-center gap-2">
                      <code className="bg-muted px-2 py-1 rounded text-xs">{user.email}</code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(user.email, 'Email')}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Contraseña:</span>
                    <div className="flex items-center gap-2">
                      <code className="bg-muted px-2 py-1 rounded text-xs">{user.password}</code>
                    </div>
                  </div>
                </div>

                {onCredentialSelect && (
                  <Button
                    size="sm"
                    onClick={() => handleUseCredentials(user.email, user.password)}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    Usar estas credenciales
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {/* Usuarios que requieren confirmación */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-orange-700 dark:text-orange-300">
            <AlertTriangle className="h-4 w-4" />
            Requieren configuración adicional
          </div>
          
          {unavailableUsers.map((user) => {
            const IconComponent = user.icon;
            return (
              <div key={user.email} className="p-4 border rounded-lg space-y-3 bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800 opacity-75">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-full">
                    <IconComponent className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{user.nombre}</p>
                      <Badge className={user.color}>{user.role}</Badge>
                    </div>
                    <p className="text-xs text-orange-600 dark:text-orange-400">{user.note}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <code className="bg-muted px-2 py-1 rounded text-xs">{user.email}</code>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Contraseña:</span>
                    <code className="bg-muted px-2 py-1 rounded text-xs">{user.password}</code>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-800 dark:text-blue-300 font-medium mb-2">
            💡 Para usar los usuarios de ejemplo:
          </p>
          <ol className="text-xs text-blue-800 dark:text-blue-300 space-y-1 ml-4 list-decimal">
            <li>Ve a <strong>Administración</strong> desde el menú</li>
            <li>Haz clic en <strong>"Crear Ejemplos"</strong></li>
            <li>Espera la confirmación de creación</li>
            <li>Regresa aquí e intenta hacer login</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}