import { useState, useEffect } from 'react';
import { useRoles, UserProfile, UserRole } from '@/hooks/useRoles';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Users, UserCheck, Settings, Shield, Briefcase, Plus, Edit, Trash2, UserPlus, MapPin, Eye, EyeOff, Copy, Check, HardDriveDownload, RefreshCw, CheckCircle2, Circle, AlertTriangle, Loader2, ArrowUpCircle } from 'lucide-react';
import { cargosProfesionalesStore, type CargoProfesional } from '@/lib/cargosProfesionalesStore';
import { nacionalidadesStore, type Nacionalidad } from '@/lib/nacionalidadesStore';
import { equipoStore } from '@/lib/equipoStore';
import { supabase } from '@/integrations/supabase/client';
import { CreateUserFromTeamForm } from '@/components/admin/CreateUserFromTeamForm';
import { PermisosRolesForm } from '@/components/admin/PermisosRolesForm';
import { lugaresStore, type Lugar } from '@/lib/lugaresStore';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  VERSIONS,
  CURRENT_VERSION,
  getInstalledVersion,
  getPendingUpdates,
  markVersionInstalled,
  isNewerThan,
  type AppVersion,
} from '@/lib/appVersion';

export default function Administracion() {
  const { hasPermission, getAllUsers, updateUserRole, updateUserProfile, inviteUser, deleteUser, updateUserEmail } = useRoles();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);

  // Estados para gestión de cargos
  const [cargos, setCargos] = useState<CargoProfesional[]>([]);
  const [editingCargo, setEditingCargo] = useState<CargoProfesional | null>(null);
  const [isCargoDialogOpen, setIsCargoDialogOpen] = useState(false);
  const [loadingCargos, setLoadingCargos] = useState(false);

  // Estados para gestión de nacionalidades
  const [nacionalidades, setNacionalidades] = useState<Nacionalidad[]>([]);
  const [editingNacionalidad, setEditingNacionalidad] = useState<Nacionalidad | null>(null);
  const [isNacionalidadDialogOpen, setIsNacionalidadDialogOpen] = useState(false);
  const [loadingNacionalidades, setLoadingNacionalidades] = useState(false);

  // Estados para gestión de lugares
  const [lugares, setLugares] = useState<Lugar[]>([]);
  const [editingLugar, setEditingLugar] = useState<Lugar | null>(null);
  const [isLugarDialogOpen, setIsLugarDialogOpen] = useState(false);
  const [loadingLugares, setLoadingLugares] = useState(false);

  // Estados para crear usuarios desde equipo
  const [isCreateUserFromTeamOpen, setIsCreateUserFromTeamOpen] = useState(false);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  useEffect(() => {
    loadUsers();
    loadCargos();
    loadNacionalidades();
    loadLugares();
    loadTeamMembers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const usersList = await getAllUsers();
    setUsers(usersList);
    setLoading(false);
  };

  const loadCargos = async () => {
    setLoadingCargos(true);
    const cargosList = await cargosProfesionalesStore.getTodosCargos();
    setCargos(cargosList);
    setLoadingCargos(false);
  };

  const loadNacionalidades = async () => {
    setLoadingNacionalidades(true);
    const nacionalidadesList = await nacionalidadesStore.getNacionalidades();
    setNacionalidades(nacionalidadesList);
    setLoadingNacionalidades(false);
  };

  const loadLugares = async () => {
    setLoadingLugares(true);
    const lugaresList = await lugaresStore.getLugares();
    setLugares(lugaresList);
    setLoadingLugares(false);
  };

  const loadTeamMembers = async () => {
    const { data, error } = await supabase
      .from('equipo')
      .select('*')
      .eq('activo', true)
      .order('apellido');
    
    if (!error && data) {
      setTeamMembers(data);
    }
  };

  const handleUpdateUser = async (userId: string, updates: Partial<UserProfile> & { email?: string }) => {
    try {
      let hasErrors = false;

      if (updates.role) {
        await updateUserRole(userId, updates.role);
      }

      if (updates.email) {
        const result = await updateUserEmail(userId, updates.email);
        if (!result.success) {
          toast.error(`Error al actualizar email: ${result.error}`);
          hasErrors = true;
        }
      }
      
      const profileUpdates = { ...updates };
      delete profileUpdates.role;
      delete profileUpdates.email;
      
      if (Object.keys(profileUpdates).length > 0) {
        await updateUserProfile(userId, profileUpdates);
      }

      if (!hasErrors) {
        await loadUsers();
        setIsDialogOpen(false);
        setEditingUser(null);
        toast.success('Usuario actualizado correctamente');
      }
    } catch (error) {
      toast.error('Error al actualizar usuario');
      console.error(error);
    }
  };

  const handleInviteUser = async (userData: { email: string; nombre: string; apellido: string; role: UserRole; password?: string }) => {
    try {
      const result = await inviteUser(userData.email, {
        nombre: userData.nombre,
        apellido: userData.apellido,
        role: userData.role,
        password: userData.password
      });

      if (result.success) {
        await loadUsers();
        // No cerrar el diálogo inmediatamente si se generó una contraseña
        if (!userData.password && result.password) {
          // El formulario mostrará la contraseña generada
          toast.success('Usuario invitado correctamente.');
        } else {
          setIsInviteDialogOpen(false);
          toast.success('Usuario invitado correctamente.');
        }
        return result;
      } else {
        toast.error(result.error || 'Error al invitar usuario');
        return null;
      }
    } catch (error) {
      toast.error('Error al invitar usuario');
      console.error(error);
      return null;
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (confirm(`¿Está seguro de que desea eliminar al usuario ${userEmail}? Esta acción no se puede deshacer.`)) {
      try {
        const success = await deleteUser(userId);
        
        if (success) {
          await loadUsers();
          toast.success('Usuario eliminado correctamente');
        } else {
          toast.error('Error al eliminar usuario');
        }
      } catch (error) {
        toast.error('Error al eliminar usuario');
        console.error(error);
      }
    }
  };

  // Funciones para gestión de cargos
  const handleCreateCargo = async (cargoData: { nombre: string; descripcion: string }) => {
    try {
      const result = await cargosProfesionalesStore.agregarCargo({
        nombre: cargoData.nombre,
        descripcion: cargoData.descripcion,
        activo: true
      });

      if (result) {
        await loadCargos();
        setIsCargoDialogOpen(false);
        toast.success('Cargo creado correctamente');
      } else {
        toast.error('Error al crear cargo');
      }
    } catch (error) {
      toast.error('Error al crear cargo');
      console.error(error);
    }
  };

  const handleUpdateCargo = async (id: string, cargoData: { nombre: string; descripcion: string }) => {
    try {
      const result = await cargosProfesionalesStore.actualizarCargo(id, cargoData);

      if (result) {
        await loadCargos();
        setIsCargoDialogOpen(false);
        setEditingCargo(null);
        toast.success('Cargo actualizado correctamente');
      } else {
        toast.error('Error al actualizar cargo');
      }
    } catch (error) {
      toast.error('Error al actualizar cargo');
      console.error(error);
    }
  };

  const handleToggleCargoActivo = async (id: string, activo: boolean) => {
    try {
      const result = await cargosProfesionalesStore.toggleActivo(id, activo);

      if (result) {
        await loadCargos();
        toast.success(activo ? 'Cargo activado' : 'Cargo desactivado');
      } else {
        toast.error('Error al cambiar estado del cargo');
      }
    } catch (error) {
      toast.error('Error al cambiar estado del cargo');
      console.error(error);
    }
  };

  const handleDeleteCargo = async (id: string) => {
    if (confirm('¿Está seguro de que desea eliminar este cargo?')) {
      try {
        const result = await cargosProfesionalesStore.eliminarCargo(id);

        if (result) {
          await loadCargos();
          toast.success('Cargo eliminado correctamente');
        } else {
          toast.error('Error al eliminar cargo');
        }
      } catch (error) {
        toast.error('Error al eliminar cargo');
        console.error(error);
      }
    }
  };

  // Funciones para gestión de nacionalidades
  const handleCreateNacionalidad = async (nacionalidadData: { nombre: string }) => {
    try {
      const result = await nacionalidadesStore.agregarNacionalidad({
        nombre: nacionalidadData.nombre,
        activa: true
      });

      if (result) {
        await loadNacionalidades();
        setIsNacionalidadDialogOpen(false);
        toast.success('Nacionalidad creada correctamente');
      } else {
        toast.error('Error al crear nacionalidad');
      }
    } catch (error) {
      toast.error('Error al crear nacionalidad');
      console.error(error);
    }
  };

  const handleUpdateNacionalidad = async (id: string, nacionalidadData: { nombre: string }) => {
    try {
      const result = await nacionalidadesStore.actualizarNacionalidad(id, nacionalidadData);

      if (result) {
        await loadNacionalidades();
        setIsNacionalidadDialogOpen(false);
        setEditingNacionalidad(null);
        toast.success('Nacionalidad actualizada correctamente');
      } else {
        toast.error('Error al actualizar nacionalidad');
      }
    } catch (error) {
      toast.error('Error al actualizar nacionalidad');
      console.error(error);
    }
  };

  const handleToggleNacionalidadActiva = async (id: string, activa: boolean) => {
    try {
      const result = await nacionalidadesStore.toggleActiva(id, activa);

      if (result) {
        await loadNacionalidades();
        toast.success(activa ? 'Nacionalidad activada' : 'Nacionalidad desactivada');
      } else {
        toast.error('Error al cambiar estado de la nacionalidad');
      }
    } catch (error) {
      toast.error('Error al cambiar estado de la nacionalidad');
      console.error(error);
    }
  };

  const handleDeleteNacionalidad = async (id: string) => {
    if (confirm('¿Está seguro de que desea eliminar esta nacionalidad?')) {
      try {
        const result = await nacionalidadesStore.eliminarNacionalidad(id);

        if (result) {
          await loadNacionalidades();
          toast.success('Nacionalidad eliminada correctamente');
        } else {
          toast.error('Error al eliminar nacionalidad');
        }
      } catch (error) {
        toast.error('Error al eliminar nacionalidad');
        console.error(error);
      }
    }
  };

  // Funciones para gestión de lugares
  const handleCreateLugar = async (lugarData: { nombre: string }) => {
    try {
      const result = await lugaresStore.agregarLugar(lugarData.nombre);

      if (result) {
        await loadLugares();
        setIsLugarDialogOpen(false);
        toast.success('Lugar creado correctamente');
      } else {
        toast.error('Error al crear lugar');
      }
    } catch (error) {
      toast.error('Error al crear lugar');
      console.error(error);
    }
  };

  const handleUpdateLugar = async (id: string, lugarData: { nombre: string }) => {
    try {
      const result = await lugaresStore.actualizarLugar(id, lugarData);

      if (result) {
        await loadLugares();
        setIsLugarDialogOpen(false);
        setEditingLugar(null);
        toast.success('Lugar actualizado correctamente');
      } else {
        toast.error('Error al actualizar lugar');
      }
    } catch (error) {
      toast.error('Error al actualizar lugar');
      console.error(error);
    }
  };

  const handleToggleLugarActivo = async (id: string, activo: boolean) => {
    try {
      const result = await lugaresStore.toggleActivo(id, activo);

      if (result) {
        await loadLugares();
        toast.success(activo ? 'Lugar activado' : 'Lugar desactivado');
      } else {
        toast.error('Error al cambiar estado del lugar');
      }
    } catch (error) {
      toast.error('Error al cambiar estado del lugar');
      console.error(error);
    }
  };

  const handleDeleteLugar = async (id: string) => {
    if (confirm('¿Está seguro de que desea eliminar este lugar?')) {
      try {
        const result = await lugaresStore.eliminarLugar(id);

        if (result) {
          await loadLugares();
          toast.success('Lugar eliminado correctamente');
        } else {
          toast.error('Error al eliminar lugar');
        }
      } catch (error) {
        toast.error('Error al eliminar lugar');
        console.error(error);
      }
    }
  };

  const handleCreateUserFromTeam = async (teamMember: any, role: UserRole, password?: string) => {
    try {
      const email = teamMember.email;

      if (!email) {
        toast.error('El miembro del equipo no tiene email registrado');
        return null;
      }

      const result = await inviteUser(email, {
        nombre: teamMember.nombre,
        apellido: teamMember.apellido,
        role,
        password
      });

      if (result.success) {
        await loadUsers();
        toast.success(`Usuario creado correctamente para ${teamMember.nombre} ${teamMember.apellido}`);
        return { password: result.password };
      } else {
        toast.error(result.error || 'Error al crear usuario');
        return null;
      }
    } catch (error) {
      toast.error('Error al crear usuario');
      console.error(error);
      return null;
    }
  };

  const [downloadingBackup, setDownloadingBackup] = useState(false);

  const handleDownloadExport = async (mode: 'full' | 'catalogs' | 'json_summary' = 'full') => {
    setDownloadingBackup(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const url = `https://${projectId}.supabase.co/functions/v1/database-backup?mode=${mode}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Error al generar el archivo');
      const blob = await response.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      const today = new Date().toISOString().slice(0, 10);
      const ext = mode === 'json_summary' ? 'json' : 'sql';
      const label = mode === 'catalogs' ? 'catalogos' : mode === 'json_summary' ? 'resumen' : 'backup_completo';
      a.download = `${label}_${today}.${ext}`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast.success('Archivo descargado correctamente');
    } catch (error) {
      toast.error('Error al descargar el archivo');
      console.error(error);
    } finally {
      setDownloadingBackup(false);
    }
  };

  // Kept for backward compatibility (backup button in header)
  const handleDownloadBackup = () => handleDownloadExport('full');

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'administrador':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'coordinador':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'trabajador':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'administrador':
        return 'Administrador';
      case 'coordinador':
        return 'Coordinador';
      case 'trabajador':
        return 'Trabajador';
      default:
        return 'Sin rol';
    }
  };

  if (!hasPermission('administrador')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <CardTitle>Acceso Denegado</CardTitle>
            <CardDescription>
              No tienes permisos para acceder al panel de administración.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full px-2 sm:px-4 md:px-6 lg:px-8 py-4 md:py-8 space-y-8 max-w-7xl mx-auto overflow-x-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Panel de Administración</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona usuarios, permisos y configuraciones del sistema
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleDownloadBackup}
          disabled={downloadingBackup}
          className="flex items-center gap-2"
        >
          <HardDriveDownload className="h-4 w-4" />
          {downloadingBackup ? 'Generando backup...' : 'Descargar Backup .sql'}
        </Button>
      </div>

      <Tabs defaultValue="usuarios" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-1">
          <TabsTrigger value="usuarios" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <Users className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Usuarios</span>
            <span className="sm:hidden">Users</span>
          </TabsTrigger>
          <TabsTrigger value="cargos" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <Briefcase className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Cargos</span>
            <span className="sm:hidden">Jobs</span>
          </TabsTrigger>
          <TabsTrigger value="nacionalidades" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <Shield className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Nacionalidades</span>
            <span className="sm:hidden">Nac</span>
          </TabsTrigger>
          <TabsTrigger value="lugares" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Lugares TC</span>
            <span className="sm:hidden">Locs</span>
          </TabsTrigger>
          <TabsTrigger value="permisos" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Permisos</span>
            <span className="sm:hidden">Perms</span>
          </TabsTrigger>
          <TabsTrigger value="configuracion" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <HardDriveDownload className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Configuración</span>
            <span className="sm:hidden">Config</span>
          </TabsTrigger>
          <TabsTrigger value="actualizaciones" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm relative">
            <ArrowUpCircle className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Actualizaciones</span>
            <span className="sm:hidden">Updates</span>
            {getPendingUpdates().length > 0 && (
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-destructive" />
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="usuarios" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Gestión de Usuarios</h2>
              <p className="text-muted-foreground">
                Administra los usuarios registrados y sus niveles de acceso
              </p>
            </div>
            <div className="flex gap-2">
              <Dialog open={isCreateUserFromTeamOpen} onOpenChange={setIsCreateUserFromTeamOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline"
                    className="bg-green-600 hover:bg-green-700 text-white border-green-600 hover:border-green-700"
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Crear Usuarios
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Crear Usuarios desde Equipo de Trabajo</DialogTitle>
                    <DialogDescription>
                      Selecciona miembros del equipo para crear sus cuentas de usuario
                    </DialogDescription>
                  </DialogHeader>
                  <CreateUserFromTeamForm 
                    teamMembers={teamMembers}
                    existingUsers={users}
                    onCreate={handleCreateUserFromTeam}
                    onCancel={() => setIsCreateUserFromTeamOpen(false)}
                  />
                </DialogContent>
              </Dialog>
              <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Users className="mr-2 h-4 w-4" />
                    Invitar Usuario
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invitar Nuevo Usuario</DialogTitle>
                    <DialogDescription>
                      Envía una invitación por email para que un nuevo usuario acceda al sistema
                    </DialogDescription>
                  </DialogHeader>
                  <InviteUserForm 
                    onInvite={handleInviteUser}
                    onCancel={() => setIsInviteDialogOpen(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{users.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Administradores</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {users.filter(u => u.role === 'administrador').length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Coordinadores</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {users.filter(u => u.role === 'coordinador').length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Trabajadores</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {users.filter(u => u.role === 'trabajador').length}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Lista de Usuarios</CardTitle>
              <CardDescription>
                Usuarios registrados en el sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-4 text-muted-foreground">Cargando usuarios...</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.email}</TableCell>
                        <TableCell>
                          {user.nombre && user.apellido 
                            ? `${user.nombre} ${user.apellido}` 
                            : 'Sin nombre'
                          }
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role || 'trabajador')}`}>
                            {getRoleLabel(user.role || 'trabajador')}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <TooltipProvider>
                            <div className="flex justify-end gap-2">
                              <Dialog open={isDialogOpen && editingUser?.id === user.id} onOpenChange={(open) => {
                                setIsDialogOpen(open);
                                if (!open) setEditingUser(null);
                              }}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <DialogTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => {
                                          setEditingUser(user);
                                          setIsDialogOpen(true);
                                        }}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                    </DialogTrigger>
                                  </TooltipTrigger>
                                  <TooltipContent>Editar</TooltipContent>
                                </Tooltip>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Editar Usuario</DialogTitle>
                                    <DialogDescription>
                                      Modifica la información y permisos del usuario
                                    </DialogDescription>
                                  </DialogHeader>
                                  {editingUser && (
                                    <EditUserForm 
                                      user={editingUser} 
                                      onUpdate={handleUpdateUser}
                                      onCancel={() => {
                                        setIsDialogOpen(false);
                                        setEditingUser(null);
                                      }}
                                    />
                                  )}
                                </DialogContent>
                              </Dialog>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteUser(user.id, user.email)}
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Eliminar</TooltipContent>
                              </Tooltip>
                            </div>
                          </TooltipProvider>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cargos" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Cargos Profesionales</h2>
              <p className="text-muted-foreground">
                Gestiona los cargos disponibles para los profesionales del equipo
              </p>
            </div>
            <Dialog open={isCargoDialogOpen} onOpenChange={setIsCargoDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Cargo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingCargo ? 'Editar Cargo' : 'Agregar Nuevo Cargo'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingCargo ? 'Modifica la información del cargo' : 'Crea un nuevo cargo profesional'}
                  </DialogDescription>
                </DialogHeader>
                <CargoForm 
                  cargo={editingCargo}
                  onSave={editingCargo ? 
                    (data) => handleUpdateCargo(editingCargo.id, data) : 
                    handleCreateCargo
                  }
                  onCancel={() => {
                    setIsCargoDialogOpen(false);
                    setEditingCargo(null);
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Lista de Cargos</CardTitle>
              <CardDescription>
                Cargos disponibles para asignar a los profesionales
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingCargos ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-4 text-muted-foreground">Cargando cargos...</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cargos.map((cargo) => (
                      <TableRow key={cargo.id}>
                        <TableCell className="font-medium">{cargo.nombre}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {cargo.descripcion || 'Sin descripción'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={cargo.activo}
                              onCheckedChange={(checked) => handleToggleCargoActivo(cargo.id, checked)}
                            />
                            <Badge variant={cargo.activo ? "default" : "secondary"}>
                              {cargo.activo ? "Activo" : "Inactivo"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <TooltipProvider>
                            <div className="flex gap-2 justify-end">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setEditingCargo(cargo);
                                      setIsCargoDialogOpen(true);
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Editar</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteCargo(cargo.id)}
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Eliminar</TooltipContent>
                              </Tooltip>
                            </div>
                          </TooltipProvider>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nacionalidades" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Nacionalidades</h2>
              <p className="text-muted-foreground">
                Gestiona las nacionalidades disponibles en los formularios
              </p>
            </div>
            <Dialog open={isNacionalidadDialogOpen} onOpenChange={setIsNacionalidadDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Nacionalidad
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingNacionalidad ? 'Editar Nacionalidad' : 'Agregar Nueva Nacionalidad'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingNacionalidad ? 'Modifica la nacionalidad' : 'Crea una nueva nacionalidad'}
                  </DialogDescription>
                </DialogHeader>
                <NacionalidadForm 
                  nacionalidad={editingNacionalidad}
                  onSave={editingNacionalidad ? 
                    (data) => handleUpdateNacionalidad(editingNacionalidad.id, data) : 
                    handleCreateNacionalidad
                  }
                  onCancel={() => {
                    setIsNacionalidadDialogOpen(false);
                    setEditingNacionalidad(null);
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Lista de Nacionalidades</CardTitle>
              <CardDescription>
                Nacionalidades disponibles en los formularios del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingNacionalidades ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-4 text-muted-foreground">Cargando nacionalidades...</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {nacionalidades.map((nacionalidad) => (
                      <TableRow key={nacionalidad.id}>
                        <TableCell className="font-medium">{nacionalidad.nombre}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={nacionalidad.activa}
                              onCheckedChange={(checked) => handleToggleNacionalidadActiva(nacionalidad.id, checked)}
                            />
                            <Badge variant={nacionalidad.activa ? "default" : "secondary"}>
                              {nacionalidad.activa ? 'Activa' : 'Inactiva'}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingNacionalidad(nacionalidad);
                                setIsNacionalidadDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteNacionalidad(nacionalidad.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lugares" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Lugares</h2>
              <p className="text-muted-foreground">
                Gestiona los lugares disponibles para trabajo de campo
              </p>
            </div>
            <Dialog open={isLugarDialogOpen} onOpenChange={setIsLugarDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Lugar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingLugar ? 'Editar Lugar' : 'Crear Nuevo Lugar'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingLugar 
                      ? 'Modifica la información del lugar seleccionado'
                      : 'Agrega un nuevo lugar disponible para trabajo de campo'
                    }
                  </DialogDescription>
                </DialogHeader>
                <LugarForm 
                  lugar={editingLugar}
                  onSubmit={editingLugar ? 
                    (data) => handleUpdateLugar(editingLugar.id, data) : 
                    handleCreateLugar
                  }
                  onCancel={() => {
                    setIsLugarDialogOpen(false);
                    setEditingLugar(null);
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Lista de Lugares</CardTitle>
              <CardDescription>
                Lugares disponibles para registrar trabajo de campo
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingLugares ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-4 text-muted-foreground">Cargando lugares...</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha Creación</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lugares.map((lugar) => (
                      <TableRow key={lugar.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                            {lugar.nombre}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={lugar.activo}
                              onCheckedChange={(checked) => 
                                handleToggleLugarActivo(lugar.id, checked)
                              }
                            />
                            <Badge 
                              variant={lugar.activo ? "default" : "secondary"}
                              className={lugar.activo ? "bg-green-100 text-green-800" : ""}
                            >
                              {lugar.activo ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(lugar.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingLugar(lugar);
                                setIsLugarDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteLugar(lugar.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permisos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Permisos por Rol</CardTitle>
              <CardDescription>
                Configura qué secciones puede ver cada tipo de usuario
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PermisosRolesForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configuracion" className="space-y-6">
          {/* Resumen del sistema */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDriveDownload className="h-5 w-5 text-primary" />
                Exportar configuración y datos
              </CardTitle>
              <CardDescription>
                Descargá un backup completo para replicar esta aplicación en otro servidor o entorno.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Backup completo */}
              <div className="border rounded-lg p-4 space-y-2">
                <h3 className="font-semibold text-sm">Backup completo (datos + configuración)</h3>
                <p className="text-xs text-muted-foreground">
                  Incluye todos los registros de todas las tablas: mujeres, gastos, contactos, equipo, etc.
                  Ideal para migrar la base de datos completa a un nuevo entorno.
                </p>
                <Button
                  onClick={() => handleDownloadExport('full')}
                  disabled={downloadingBackup}
                  className="gap-2"
                >
                  <HardDriveDownload className="h-4 w-4" />
                  {downloadingBackup ? 'Generando...' : 'Descargar backup completo (.sql)'}
                </Button>
              </div>

              {/* Solo catálogos */}
              <div className="border rounded-lg p-4 space-y-2">
                <h3 className="font-semibold text-sm">Solo catálogos de configuración</h3>
                <p className="text-xs text-muted-foreground">
                  Exporta únicamente los datos de configuración: etiquetas de gastos, cargos profesionales, nacionalidades y lugares. 
                  Útil para inicializar un nuevo entorno con la misma configuración base.
                </p>
                <Button
                  variant="outline"
                  onClick={() => handleDownloadExport('catalogs')}
                  disabled={downloadingBackup}
                  className="gap-2"
                >
                  <HardDriveDownload className="h-4 w-4" />
                  {downloadingBackup ? 'Generando...' : 'Descargar catálogos (.sql)'}
                </Button>
              </div>

              {/* Resumen JSON */}
              <div className="border rounded-lg p-4 space-y-2">
                <h3 className="font-semibold text-sm">Resumen de conteo por tabla</h3>
                <p className="text-xs text-muted-foreground">
                  Genera un archivo JSON con el conteo de registros por tabla. Útil para verificar que la migración fue exitosa.
                </p>
                <Button
                  variant="outline"
                  onClick={() => handleDownloadExport('json_summary')}
                  disabled={downloadingBackup}
                  className="gap-2"
                >
                  <HardDriveDownload className="h-4 w-4" />
                  {downloadingBackup ? 'Generando...' : 'Descargar resumen (.json)'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Guía de despliegue */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-muted-foreground" />
                Variables de entorno necesarias
              </CardTitle>
              <CardDescription>
                Configurá estas variables en el nuevo servidor para conectar con Supabase.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-md p-4 font-mono text-xs space-y-1">
                <p className="text-muted-foreground"># Archivo .env</p>
                <p>VITE_SUPABASE_URL=https://TU_PROJECT_ID.supabase.co</p>
                <p>VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...tu_anon_key...</p>
                <p>VITE_SUPABASE_PROJECT_ID=tu_project_id</p>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Encontrá estos valores en tu proyecto Supabase → Settings → API.
                El archivo completo de instrucciones está en <code className="bg-muted px-1 rounded">DEPLOYMENT.md</code> en la raíz del repositorio.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── ACTUALIZACIONES TAB ─────────────────────────────────────── */}
        <TabsContent value="actualizaciones" className="space-y-6">
          <UpdatesPanel />
        </TabsContent>

      </Tabs>
    </div>
  );
}

// ─── UpdatesPanel Component ────────────────────────────────────────────────────

function UpdatesPanel() {
  const [installedVersion, setInstalledVersion] = useState(getInstalledVersion);
  const [runningMigration, setRunningMigration] = useState<string | null>(null);
  const [migrationResults, setMigrationResults] = useState<Record<string, { success: boolean; message: string }>>({});

  const pending = VERSIONS.filter((v) => isNewerThan(v.version, installedVersion));
  const applied = VERSIONS.filter((v) => !isNewerThan(v.version, installedVersion));

  const typeBadge: Record<AppVersion['type'], string> = {
    major: 'bg-destructive/10 text-destructive border-destructive/20',
    minor: 'bg-primary/10 text-primary border-primary/20',
    patch: 'bg-muted text-muted-foreground border-border',
    hotfix: 'bg-secondary/10 text-secondary border-secondary/20',
  };

  const handleApply = async (version: AppVersion) => {
    setRunningMigration(version.version);
    let result = { success: true, message: 'Actualización aplicada correctamente.' };
    if (version.migrate) {
      try {
        result = await version.migrate();
      } catch (e) {
        result = { success: false, message: e instanceof Error ? e.message : 'Error desconocido' };
      }
    }
    markVersionInstalled(version.version);
    setInstalledVersion(version.version);
    setMigrationResults((prev) => ({ ...prev, [version.version]: result }));
    setRunningMigration(null);
    if (result.success) {
      toast.success(`v${version.version} aplicada: ${result.message}`);
    } else {
      toast.error(`v${version.version}: ${result.message}`);
    }
  };

  const handleApplyAll = async () => {
    for (const v of pending) {
      await handleApply(v);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUpCircle className="h-5 w-5 text-primary" />
            Sistema de Actualizaciones
          </CardTitle>
          <CardDescription>
            Seguimiento de versiones al estilo WordPress. Cada actualización puede incluir migraciones opcionales.
            Versión instalada: <span className="font-mono font-semibold">v{installedVersion}</span> — 
            Versión actual: <span className="font-mono font-semibold">v{CURRENT_VERSION}</span>
          </CardDescription>
        </CardHeader>
        {pending.length > 0 && (
          <CardContent>
            <div className="flex items-center justify-between p-3 rounded-lg border border-destructive/20 bg-destructive/5">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span className="text-sm font-medium">
                  {pending.length} actualización{pending.length > 1 ? 'es' : ''} pendiente{pending.length > 1 ? 's' : ''}
                </span>
              </div>
              <Button
                size="sm"
                onClick={handleApplyAll}
                disabled={runningMigration !== null}
                className="gap-2"
              >
                {runningMigration ? <Loader2 className="h-3 w-3 animate-spin" /> : <ArrowUpCircle className="h-3 w-3" />}
                Aplicar todas
              </Button>
            </div>
          </CardContent>
        )}
        {pending.length === 0 && (
          <CardContent>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/40 border text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              La aplicación está actualizada a la última versión disponible.
            </div>
          </CardContent>
        )}
      </Card>

      {/* Pending updates */}
      {pending.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Circle className="h-3 w-3 text-destructive fill-destructive" />
            Actualizaciones pendientes
          </h3>
          {pending.map((v) => (
            <VersionCard
              key={v.version}
              version={v}
              status="pending"
              typeBadge={typeBadge}
              onApply={handleApply}
              isRunning={runningMigration === v.version}
              result={migrationResults[v.version]}
            />
          ))}
        </div>
      )}

      {/* Applied versions */}
      {applied.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            <CheckCircle2 className="h-3 w-3 text-primary" />
            Versiones instaladas
          </h3>
          {[...applied].reverse().map((v) => (
            <VersionCard
              key={v.version}
              version={v}
              status="applied"
              typeBadge={typeBadge}
              onApply={handleApply}
              isRunning={false}
              result={migrationResults[v.version]}
            />
          ))}
        </div>
      )}

      {/* Developer note */}
      <Card className="border-dashed">
        <CardContent className="pt-4">
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold">Para desarrolladores:</span> Para agregar una nueva versión, editá el archivo{' '}
            <code className="bg-muted px-1 rounded">src/lib/appVersion.ts</code> y agregá un nuevo objeto al array{' '}
            <code className="bg-muted px-1 rounded">VERSIONS</code> con el número de versión, descripción y
            opcionalmente una función <code className="bg-muted px-1 rounded">migrate()</code> que se ejecutará al aplicar la actualización.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

interface VersionCardProps {
  version: AppVersion;
  status: 'pending' | 'applied';
  typeBadge: Record<string, string>;
  onApply: (v: AppVersion) => Promise<void>;
  isRunning: boolean;
  result?: { success: boolean; message: string };
}

function VersionCard({ version, status, typeBadge, onApply, isRunning, result }: VersionCardProps) {
  const [expanded, setExpanded] = useState(status === 'pending');

  return (
    <Card className={status === 'applied' ? 'opacity-70' : ''}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono font-bold text-sm">v{version.version}</span>
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${typeBadge[version.type]}`}>
              {version.type}
            </Badge>
            <span className="text-xs text-muted-foreground">{version.date}</span>
            {status === 'applied' && (
              <span className="flex items-center gap-1 text-xs text-primary">
                <CheckCircle2 className="h-3 w-3" /> instalada
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {status === 'pending' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onApply(version)}
                disabled={isRunning}
                className="h-7 text-xs gap-1"
              >
                {isRunning ? (
                  <><Loader2 className="h-3 w-3 animate-spin" /> Aplicando…</>
                ) : (
                  <><ArrowUpCircle className="h-3 w-3" /> Aplicar</>
                )}
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => setExpanded((e) => !e)} className="h-7 text-xs">
              {expanded ? 'Ocultar' : 'Ver más'}
            </Button>
          </div>
        </div>
        <CardDescription className="text-sm">{version.title}</CardDescription>
      </CardHeader>
      {expanded && (
        <CardContent className="space-y-3 pt-0">
          <p className="text-sm text-muted-foreground">{version.description}</p>
          <ul className="space-y-1">
            {version.changes.map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="text-primary mt-0.5">•</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
          {version.migrate && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 rounded px-2 py-1">
              <RefreshCw className="h-3 w-3 flex-shrink-0" />
              Incluye migración automática
            </div>
          )}
          {result && (
            <div className={`flex items-start gap-2 text-xs rounded p-2 ${result.success ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>
              {result.success ? <CheckCircle2 className="h-3 w-3 mt-0.5 flex-shrink-0" /> : <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />}
              {result.message}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

// ─── EditUserForm ──────────────────────────────────────────────────────────────

interface EditUserFormProps {
  user: UserProfile;
  onUpdate: (userId: string, updates: Partial<UserProfile>) => void;
  onCancel: () => void;
}

function EditUserForm({ user, onUpdate, onCancel }: EditUserFormProps) {
  const [formData, setFormData] = useState({
    nombre: user.nombre || '',
    apellido: user.apellido || '',
    email: user.email || '',
    role: user.role || 'trabajador'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updates: any = {
      nombre: formData.nombre,
      apellido: formData.apellido,
      role: formData.role
    };

    if (formData.email !== user.email) {
      updates.email = formData.email;
    }

    onUpdate(user.id, updates);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nombre">Nombre</Label>
          <Input
            id="nombre"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            placeholder="Ingresa el nombre"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="apellido">Apellido</Label>
          <Input
            id="apellido"
            value={formData.apellido}
            onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
            placeholder="Ingresa el apellido"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="correo@ejemplo.com"
        />
        <p className="text-xs text-muted-foreground">
          Nota: Solo se actualiza el email de perfil. El usuario mantendrá su email de login original.
        </p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="role">Rol del Usuario</Label>
        <Select value={formData.role} onValueChange={(value: UserRole) => setFormData({ ...formData, role: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona un rol" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="trabajador">Trabajador</SelectItem>
            <SelectItem value="coordinador">Coordinador</SelectItem>
            <SelectItem value="administrador">Administrador</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
        <p className="text-xs text-blue-800 dark:text-blue-300">
          <strong>Cambio de contraseña:</strong> El usuario debe usar la opción "Olvidé mi contraseña" en la página de login para establecer una nueva contraseña.
        </p>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          Guardar Cambios
        </Button>
      </div>
    </form>
  );
}

interface InviteUserFormProps {
  onInvite: (userData: { email: string; nombre: string; apellido: string; role: UserRole; password?: string }) => Promise<{ success: boolean; password?: string } | null>;
  onCancel: () => void;
}

function InviteUserForm({ onInvite, onCancel }: InviteUserFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    nombre: '',
    apellido: '',
    role: 'trabajador' as UserRole,
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);
  const [copiedPassword, setCopiedPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.nombre || !formData.apellido) {
      toast.error('Por favor completa todos los campos');
      return;
    }
    if (formData.password && formData.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    setCreating(true);
    setCreatedPassword(null);
    try {
      const result = await onInvite({
        email: formData.email,
        nombre: formData.nombre,
        apellido: formData.apellido,
        role: formData.role,
        password: formData.password || undefined
      });
      
      if (result?.password) {
        setCreatedPassword(result.password);
      }
      
      // Resetear el formulario
      setFormData({
        email: '',
        nombre: '',
        apellido: '',
        role: 'trabajador' as UserRole,
        password: ''
      });
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="correo@ejemplo.com"
          required
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="invite-nombre">Nombre</Label>
          <Input
            id="invite-nombre"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            placeholder="Ingresa el nombre"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="invite-apellido">Apellido</Label>
          <Input
            id="invite-apellido"
            value={formData.apellido}
            onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
            placeholder="Ingresa el apellido"
            required
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="invite-role">Rol del Usuario</Label>
        <Select value={formData.role} onValueChange={(value: UserRole) => setFormData({ ...formData, role: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona un rol" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="trabajador">Trabajador</SelectItem>
            <SelectItem value="coordinador">Coordinador</SelectItem>
            <SelectItem value="administrador">Administrador</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="invite-password">Contraseña Temporal (opcional)</Label>
        <div className="relative">
          <Input
            id="invite-password"
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
        <p className="text-sm text-muted-foreground">
          {formData.password ? 'Usando contraseña personalizada' : 'Se generará una contraseña automáticamente'}
        </p>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={creating}>
          {creating ? 'Creando...' : 'Enviar Invitación'}
        </Button>
      </div>
    </form>
  );
}

interface CargoFormProps {
  cargo?: CargoProfesional | null;
  onSave: (cargoData: { nombre: string; descripcion: string }) => void;
  onCancel: () => void;
}

function CargoForm({ cargo, onSave, onCancel }: CargoFormProps) {
  const [formData, setFormData] = useState({
    nombre: cargo?.nombre || '',
    descripcion: cargo?.descripcion || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre.trim()) {
      toast.error('El nombre del cargo es requerido');
      return;
    }
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="cargo-nombre">Nombre del Cargo *</Label>
        <Input
          id="cargo-nombre"
          value={formData.nombre}
          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
          placeholder="ej: Psicólogo/a"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="cargo-descripcion">Descripción</Label>
        <Textarea
          id="cargo-descripcion"
          value={formData.descripcion}
          onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
          placeholder="Describe las responsabilidades y características del cargo..."
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          {cargo ? 'Actualizar' : 'Crear'} Cargo
        </Button>
      </div>
    </form>
  );
}

interface NacionalidadFormProps {
  nacionalidad?: Nacionalidad | null;
  onSave: (nacionalidadData: { nombre: string }) => void;
  onCancel: () => void;
}

function NacionalidadForm({ nacionalidad, onSave, onCancel }: NacionalidadFormProps) {
  const [formData, setFormData] = useState({
    nombre: nacionalidad?.nombre || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre.trim()) {
      toast.error('El nombre de la nacionalidad es requerido');
      return;
    }
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nacionalidad-nombre">Nombre de la Nacionalidad *</Label>
        <Input
          id="nacionalidad-nombre"
          value={formData.nombre}
          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
          placeholder="ej: Argentina"
          required
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          {nacionalidad ? 'Actualizar' : 'Crear'} Nacionalidad
        </Button>
      </div>
    </form>
  );
}

interface LugarFormProps {
  lugar?: Lugar | null;
  onSubmit: (data: { nombre: string }) => void;
  onCancel: () => void;
}

function LugarForm({ lugar, onSubmit, onCancel }: LugarFormProps) {
  const [formData, setFormData] = useState({
    nombre: lugar?.nombre || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.nombre.trim()) {
      onSubmit({
        nombre: formData.nombre.trim()
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="nombre">Nombre del Lugar *</Label>
        <Input
          id="nombre"
          value={formData.nombre}
          onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
          placeholder="Ej: Plaza del Barrio"
          required
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button 
          type="submit" 
          className="bg-green-600 hover:bg-green-700"
          disabled={!formData.nombre.trim()}
        >
          {lugar ? 'Actualizar' : 'Crear'} Lugar
        </Button>
      </div>
    </form>
  );
}