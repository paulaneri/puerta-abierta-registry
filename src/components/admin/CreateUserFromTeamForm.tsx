import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { UserRole, UserProfile } from '@/hooks/useRoles';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, Check, Eye, EyeOff } from 'lucide-react';

interface CreateUserFromTeamFormProps {
  teamMembers: any[];
  existingUsers: UserProfile[];
  onCreate: (teamMember: any, role: UserRole, password?: string) => Promise<{ password?: string } | null>;
  onCancel: () => void;
}

export function CreateUserFromTeamForm({ teamMembers, existingUsers, onCreate, onCancel }: CreateUserFromTeamFormProps) {
  const [selectedMember, setSelectedMember] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('trabajador');
  const [customPassword, setCustomPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);
  const [copiedPassword, setCopiedPassword] = useState(false);

  // Filtrar miembros que ya tienen usuario
  const availableMembers = teamMembers.filter(member => 
    member.email && !existingUsers.some(user => user.email === member.email)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedMember) {
      toast.error('Por favor selecciona un miembro del equipo');
      return;
    }

    if (customPassword && customPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    const member = availableMembers.find(m => m.id === selectedMember);
    if (!member) return;

    setCreating(true);
    setCreatedPassword(null);
    try {
      const result = await onCreate(member, selectedRole, customPassword || undefined);
      if (result?.password) {
        setCreatedPassword(result.password);
      }
      setSelectedMember('');
      setSelectedRole('trabajador');
      setCustomPassword('');
    } finally {
      setCreating(false);
    }
  };

  const handleCopyPassword = () => {
    if (createdPassword) {
      navigator.clipboard.writeText(createdPassword);
      setCopiedPassword(true);
      toast.success('Contraseña copiada al portapapeles');
      setTimeout(() => setCopiedPassword(false), 2000);
    }
  };

  if (availableMembers.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          No hay miembros del equipo disponibles para crear usuarios.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Todos los miembros con email ya tienen cuenta de usuario o no tienen email registrado.
        </p>
        <Button onClick={onCancel} className="mt-4">
          Cerrar
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {createdPassword && (
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium text-green-900">¡Usuario creado exitosamente!</p>
              <p className="text-sm text-green-800">Contraseña temporal generada:</p>
              <div className="flex items-center gap-2 bg-white p-3 rounded border border-green-300">
                <code className="flex-1 font-mono text-sm">{createdPassword}</code>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleCopyPassword}
                  className="shrink-0"
                >
                  {copiedPassword ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-green-700">
                ⚠️ Comparte esta contraseña con el usuario. Podrá cambiarla al iniciar sesión.
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="member">Seleccionar Miembro del Equipo</Label>
          <Select value={selectedMember} onValueChange={setSelectedMember}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un miembro del equipo" />
            </SelectTrigger>
            <SelectContent>
              {availableMembers.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.nombre} {member.apellido} - {member.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground mt-2">
            {availableMembers.length} miembro(s) disponible(s)
          </p>
        </div>

        <div>
          <Label htmlFor="role">Rol del Usuario</Label>
          <Select value={selectedRole} onValueChange={(value: UserRole) => setSelectedRole(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="trabajador">Trabajador</SelectItem>
              <SelectItem value="coordinador">Coordinador</SelectItem>
              <SelectItem value="administrador">Administrador</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="password">Contraseña Temporal (opcional)</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={customPassword}
              onChange={(e) => setCustomPassword(e.target.value)}
              placeholder="Dejar vacío para generar automáticamente"
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {customPassword ? 'Usando contraseña personalizada' : 'Se generará una contraseña automáticamente'}
          </p>
        </div>

        {selectedMember && (
          <Card className="bg-muted/50">
            <CardContent className="pt-4">
              <h4 className="font-medium mb-2">Vista Previa</h4>
              {(() => {
                const member = availableMembers.find(m => m.id === selectedMember);
                return member ? (
                  <div className="text-sm space-y-1">
                    <p><span className="font-medium">Nombre:</span> {member.nombre} {member.apellido}</p>
                    <p><span className="font-medium">Email:</span> {member.email}</p>
                    <p><span className="font-medium">Rol:</span> {selectedRole}</p>
                    <p className="text-muted-foreground text-xs mt-2">
                      Se enviará un email de confirmación a esta dirección
                    </p>
                  </div>
                ) : null;
              })()}
            </CardContent>
          </Card>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={!selectedMember || creating}>
          {creating ? 'Creando...' : 'Crear Usuario'}
        </Button>
      </div>
    </form>
  );
}
