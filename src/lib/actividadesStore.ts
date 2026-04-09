import { supabase } from "@/integrations/supabase/client";

export type EstadoActividad = 'planificado' | 'en_curso' | 'completado';
export type PrioridadActividad = 'alta' | 'media' | 'baja' | null;

export interface Actividad {
  id: string;
  titulo: string;
  descripcion: string | null;
  estado: EstadoActividad;
  prioridad: PrioridadActividad;
  fecha_limite: string | null;
  responsable_id: string | null;
  creado_por: string;
  orden: number;
  created_at: string;
  updated_at: string;
}

export const PRIORIDADES: { value: PrioridadActividad; label: string; borderColor: string; bgColor: string }[] = [
  { value: 'alta', label: 'Alta', borderColor: 'border-red-500', bgColor: 'bg-red-500' },
  { value: 'media', label: 'Media', borderColor: 'border-yellow-500', bgColor: 'bg-yellow-500' },
  { value: 'baja', label: 'Baja', borderColor: 'border-green-500', bgColor: 'bg-green-500' },
];

export const COLUMNAS_KANBAN: { estado: EstadoActividad; titulo: string; color: string }[] = [
  { estado: 'planificado', titulo: 'Planificado', color: 'bg-slate-500' },
  { estado: 'en_curso', titulo: 'En Curso', color: 'bg-blue-500' },
  { estado: 'completado', titulo: 'Completado', color: 'bg-emerald-600' },
];

export const actividadesStore = {
  getActividades: async (): Promise<Actividad[]> => {
    try {
      const { data, error } = await (supabase
        .from('actividades' as any)
        .select('*')
        .order('orden', { ascending: true }) as any);
      
      if (error) {
        console.error('Error fetching actividades:', error);
        return [];
      }
      
      return (data || []) as Actividad[];
    } catch (error) {
      console.error('Error in getActividades:', error);
      return [];
    }
  },

  createActividad: async (actividad: Omit<Actividad, 'id' | 'created_at' | 'updated_at'>): Promise<{ data: Actividad | null; error: string | null }> => {
    try {
      const { data, error } = await (supabase
        .from('actividades' as any)
        .insert(actividad)
        .select()
        .single() as any);
      
      if (error) {
        console.error('Error creating actividad:', error);
        return { data: null, error: error.message || 'Error al crear la actividad' };
      }
      
      return { data: data as Actividad, error: null };
    } catch (error) {
      console.error('Error in createActividad:', error);
      return { data: null, error: 'Error inesperado al crear la actividad' };
    }
  },

  updateActividad: async (id: string, updates: Partial<Actividad>): Promise<Actividad | null> => {
    try {
      const { data, error } = await (supabase
        .from('actividades' as any)
        .update(updates)
        .eq('id', id)
        .select()
        .single() as any);
      
      if (error) {
        console.error('Error updating actividad:', error);
        return null;
      }
      
      return data as Actividad;
    } catch (error) {
      console.error('Error in updateActividad:', error);
      return null;
    }
  },

  deleteActividad: async (id: string): Promise<boolean> => {
    try {
      const { error } = await (supabase
        .from('actividades' as any)
        .delete()
        .eq('id', id) as any);
      
      if (error) {
        console.error('Error deleting actividad:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error in deleteActividad:', error);
      return false;
    }
  },

  updateOrden: async (actividades: { id: string; estado: EstadoActividad; orden: number }[]): Promise<boolean> => {
    try {
      for (const act of actividades) {
        const { error } = await (supabase
          .from('actividades' as any)
          .update({ estado: act.estado, orden: act.orden })
          .eq('id', act.id) as any);
        
        if (error) {
          console.error('Error updating orden:', error);
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error('Error in updateOrden:', error);
      return false;
    }
  }
};
