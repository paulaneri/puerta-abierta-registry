import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type UserRole = 'administrador' | 'coordinador' | 'trabajador';

export interface UserProfile {
  id: string;
  email: string;
  nombre?: string;
  apellido?: string;
  role?: UserRole;
}

export const useRoles = () => {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserRole();
    } else {
      setUserRole(null);
      setLoading(false);
    }
  }, [user]);

  const fetchUserRole = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user role:', error);
        setUserRole('trabajador'); // Default role
      } else {
        setUserRole(data.role as UserRole);
      }
    } catch (error) {
      console.error('Error:', error);
      setUserRole('trabajador');
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (requiredRole: UserRole): boolean => {
    if (!userRole) return false;
    
    const roleHierarchy = {
      'administrador': 3,
      'coordinador': 2,
      'trabajador': 1
    };
    
    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
  };

  const canAccessSection = (section: string): boolean => {
    if (!userRole) return false;
    
    switch (userRole) {
      case 'administrador':
        return true; // Access to everything
      case 'coordinador':
        return ['mujeres', 'centro-dia', 'calendario', 'gastos', 'contactos', 'equipo', 'duplas', 'trabajo-campo', 'estadisticas', 'galeria', 'actividades', 'inicio'].includes(section);
      case 'trabajador':
        return ['mujeres', 'centro-dia', 'calendario', 'contactos', 'trabajo-campo', 'equipo', 'estadisticas', 'galeria', 'actividades', 'inicio'].includes(section);
      default:
        return false;
    }
  };

  const getAllUsers = async (): Promise<UserProfile[]> => {
    try {
      // Primero obtener todos los perfiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, nombre, apellido');

      if (profilesError) throw profilesError;

      // Luego obtener todos los roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Combinar los datos
      return profiles.map(profile => {
        const userRole = roles.find(r => r.user_id === profile.id);
        return {
          ...profile,
          role: (userRole?.role as UserRole) || 'trabajador'
        };
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  };

  const updateUserRole = async (userId: string, newRole: UserRole): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .upsert({ user_id: userId, role: newRole }, { onConflict: 'user_id' });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating user role:', error);
      return false;
    }
  };

  const updateUserProfile = async (userId: string, updates: Partial<UserProfile>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating user profile:', error);
      return false;
    }
  };

  const inviteUser = async (email: string, userData: { nombre: string; apellido: string; role: UserRole; password?: string }): Promise<{ success: boolean; error?: string; password?: string }> => {
    try {
      // Usar la contraseña proporcionada o generar una temporal
      const temporaryPassword = userData.password || (Math.random().toString(36).slice(-12) + 'A1!');
      
      // Crear el usuario usando signUp del admin
      const { data, error } = await supabase.auth.signUp({
        email,
        password: temporaryPassword,
        options: {
          data: {
            nombre: userData.nombre,
            apellido: userData.apellido,
            role: userData.role
          },
          emailRedirectTo: `${window.location.origin}/auth`
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // Si el usuario se creó exitosamente, asignar el rol
      if (data.user) {
        await updateUserRole(data.user.id, userData.role);
      }

      return { success: true, password: temporaryPassword };
    } catch (error) {
      console.error('Error inviting user:', error);
      return { success: false, error: 'Error al invitar usuario' };
    }
  };

  const deleteUser = async (userId: string): Promise<boolean> => {
    try {
      // Primero eliminar el rol del usuario
      const { error: roleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (roleError) throw roleError;

      // Luego eliminar el perfil (esto activará la cascada para auth.users)
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileError) throw profileError;

      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  };

  const updateUserEmail = async (userId: string, newEmail: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Actualizar en la tabla profiles
      const { error } = await supabase
        .from('profiles')
        .update({ email: newEmail })
        .eq('id', userId);
      
      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error updating user email:', error);
      return { success: false, error: error.message || 'Error al actualizar email' };
    }
  };

  return {
    userRole,
    loading,
    hasPermission,
    canAccessSection,
    getAllUsers,
    updateUserRole,
    updateUserProfile,
    inviteUser,
    deleteUser,
    updateUserEmail,
    fetchUserRole
  };
};