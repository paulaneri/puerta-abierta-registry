import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type RolReunion = Database["public"]["Enums"]["rol_reunion"];

interface Reunion {
  id: string;
  fecha: string;
  semana_numero: number;
  ano: number;
  estado: 'planificada' | 'realizada' | 'cancelada';
  observaciones?: string;
  numero_acta?: number | null;
  motivo_cancelacion?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface AsignacionRol {
  id: string;
  reunion_id: string;
  profesional_id: string;
  rol: RolReunion;
  presente: boolean;
  suplente_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface ReunionConAsignaciones extends Reunion {
  asignaciones: AsignacionRol[];
}

// Obtener número de semana ISO
export const getWeekNumber = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

// Obtener fecha del lunes de una semana específica
export const getMondayOfWeek = (weekNumber: number, year: number): Date => {
  const simple = new Date(year, 0, 1 + (weekNumber - 1) * 7);
  const dow = simple.getDay();
  const monday = new Date(simple);
  if (dow <= 4) {
    monday.setDate(simple.getDate() - simple.getDay() + 1);
  } else {
    monday.setDate(simple.getDate() + 8 - simple.getDay());
  }
  return monday;
};

export const reunionesStore = {
  getReuniones: async (ano: number): Promise<ReunionConAsignaciones[]> => {
    try {
      const { data: reuniones, error: reunionesError } = await supabase
        .from('reuniones_semanales')
        .select('*')
        .eq('ano', ano)
        .order('semana_numero', { ascending: true });
      
      if (reunionesError) {
        console.error('Error fetching reuniones:', reunionesError);
        return [];
      }
      
      const reunionIds = (reuniones || []).map(r => r.id);
      
      if (reunionIds.length === 0) {
        return [];
      }
      
      const { data: asignaciones, error: asignacionesError } = await supabase
        .from('asignaciones_roles')
        .select('*')
        .in('reunion_id', reunionIds);
      
      if (asignacionesError) {
        console.error('Error fetching asignaciones:', asignacionesError);
      }
      
      return (reuniones || []).map(reunion => ({
        ...reunion,
        estado: reunion.estado as 'planificada' | 'realizada' | 'cancelada',
        numero_acta: reunion.numero_acta,
        motivo_cancelacion: reunion.motivo_cancelacion,
        asignaciones: (asignaciones || []).filter(a => a.reunion_id === reunion.id) as AsignacionRol[]
      }));
    } catch (error) {
      console.error('Error in getReuniones:', error);
      return [];
    }
  },

  getReunion: async (id: string): Promise<ReunionConAsignaciones | null> => {
    try {
      const { data: reunion, error } = await supabase
        .from('reuniones_semanales')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error || !reunion) return null;
      
      const { data: asignaciones } = await supabase
        .from('asignaciones_roles')
        .select('*')
        .eq('reunion_id', id);
      
      return {
        ...reunion,
        estado: reunion.estado as 'planificada' | 'realizada' | 'cancelada',
        numero_acta: reunion.numero_acta,
        motivo_cancelacion: reunion.motivo_cancelacion,
        asignaciones: (asignaciones || []) as AsignacionRol[]
      };
    } catch (error) {
      console.error('Error in getReunion:', error);
      return null;
    }
  },

  crearReunion: async (fecha: string, semana_numero: number, ano: number): Promise<Reunion | null> => {
    try {
      const { data, error } = await supabase
        .from('reuniones_semanales')
        .insert({
          fecha,
          semana_numero,
          ano,
          estado: 'planificada'
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error creating reunion:', error);
        return null;
      }
      
      return {
        ...data,
        estado: data.estado as 'planificada' | 'realizada' | 'cancelada',
        numero_acta: data.numero_acta,
        motivo_cancelacion: data.motivo_cancelacion
      };
    } catch (error) {
      console.error('Error in crearReunion:', error);
      return null;
    }
  },

  actualizarReunion: async (id: string, updates: Partial<Reunion>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('reuniones_semanales')
        .update(updates)
        .eq('id', id);
      
      if (error) {
        console.error('Error updating reunion:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error in actualizarReunion:', error);
      return false;
    }
  },

  eliminarReunion: async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('reuniones_semanales')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting reunion:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error in eliminarReunion:', error);
      return false;
    }
  },

  asignarRol: async (reunion_id: string, profesional_id: string, rol: RolReunion): Promise<AsignacionRol | null> => {
    try {
      const { data, error } = await supabase
        .from('asignaciones_roles')
        .insert({
          reunion_id,
          profesional_id,
          rol,
          presente: true
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error assigning rol:', error);
        return null;
      }
      
      return data as AsignacionRol;
    } catch (error) {
      console.error('Error in asignarRol:', error);
      return null;
    }
  },

  actualizarAsignacion: async (id: string, updates: Partial<AsignacionRol>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('asignaciones_roles')
        .update(updates)
        .eq('id', id);
      
      if (error) {
        console.error('Error updating asignacion:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error in actualizarAsignacion:', error);
      return false;
    }
  },

  eliminarAsignacion: async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('asignaciones_roles')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting asignacion:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error in eliminarAsignacion:', error);
      return false;
    }
  },

  // Obtener el historial de roles de un profesional
  getHistorialRoles: async (profesionalId: string, ano: number): Promise<{semana: number; rol: RolReunion}[]> => {
    try {
      const { data: reuniones } = await supabase
        .from('reuniones_semanales')
        .select('id, semana_numero')
        .eq('ano', ano);
      
      if (!reuniones || reuniones.length === 0) return [];
      
      const reunionIds = reuniones.map(r => r.id);
      
      const { data: asignaciones } = await supabase
        .from('asignaciones_roles')
        .select('reunion_id, rol')
        .eq('profesional_id', profesionalId)
        .in('reunion_id', reunionIds);
      
      if (!asignaciones) return [];
      
      return asignaciones.map(a => {
        const reunion = reuniones.find(r => r.id === a.reunion_id);
        return {
          semana: reunion?.semana_numero || 0,
          rol: a.rol as RolReunion
        };
      });
    } catch (error) {
      console.error('Error in getHistorialRoles:', error);
      return [];
    }
  },

  // Obtener estadísticas de roles por profesional para un año
  getEstadisticasRoles: async (ano: number): Promise<Map<string, {reflexion: number; coordinacion: number; acta: number}>> => {
    try {
      const { data: reuniones } = await supabase
        .from('reuniones_semanales')
        .select('id')
        .eq('ano', ano);
      
      if (!reuniones || reuniones.length === 0) return new Map();
      
      const reunionIds = reuniones.map(r => r.id);
      
      const { data: asignaciones } = await supabase
        .from('asignaciones_roles')
        .select('profesional_id, rol')
        .in('reunion_id', reunionIds);
      
      if (!asignaciones) return new Map();
      
      const stats = new Map<string, {reflexion: number; coordinacion: number; acta: number}>();
      
      asignaciones.forEach(a => {
        if (!stats.has(a.profesional_id)) {
          stats.set(a.profesional_id, { reflexion: 0, coordinacion: 0, acta: 0 });
        }
        const current = stats.get(a.profesional_id)!;
        current[a.rol as RolReunion]++;
      });
      
      return stats;
    } catch (error) {
      console.error('Error in getEstadisticasRoles:', error);
      return new Map();
    }
  },

  // Asignar roles múltiples de una vez
  asignarRolesMultiples: async (asignaciones: { reunion_id: string; profesional_id: string; rol: RolReunion }[]): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('asignaciones_roles')
        .insert(asignaciones.map(a => ({
          reunion_id: a.reunion_id,
          profesional_id: a.profesional_id,
          rol: a.rol,
          presente: true
        })));
      
      if (error) {
        console.error('Error assigning multiple roles:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error in asignarRolesMultiples:', error);
      return false;
    }
  },

  // Eliminar todas las asignaciones de una reunión
  eliminarAsignacionesReunion: async (reunionId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('asignaciones_roles')
        .delete()
        .eq('reunion_id', reunionId);
      
      if (error) {
        console.error('Error deleting asignaciones:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error in eliminarAsignacionesReunion:', error);
      return false;
    }
  },

  // Eliminar asignaciones de múltiples reuniones
  eliminarAsignacionesMultiples: async (reunionIds: string[]): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('asignaciones_roles')
        .delete()
        .in('reunion_id', reunionIds);
      
      if (error) {
        console.error('Error deleting multiple asignaciones:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error in eliminarAsignacionesMultiples:', error);
      return false;
    }
  }
};

export type { Reunion, AsignacionRol, ReunionConAsignaciones, RolReunion };
