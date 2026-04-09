import { supabase } from "@/integrations/supabase/client";

export interface CargoProfesional {
  id: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

export const cargosProfesionalesStore = {
  getCargos: async (): Promise<CargoProfesional[]> => {
    try {
      const { data, error } = await supabase
        .from('cargos_profesionales')
        .select('*')
        .eq('activo', true)
        .order('nombre', { ascending: true });
      
      if (error) {
        console.error('Error fetching cargos profesionales:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getCargos:', error);
      return [];
    }
  },

  getTodosCargos: async (): Promise<CargoProfesional[]> => {
    try {
      const { data, error } = await supabase
        .from('cargos_profesionales')
        .select('*')
        .order('nombre', { ascending: true });
      
      if (error) {
        console.error('Error fetching todos los cargos:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getTodosCargos:', error);
      return [];
    }
  },

  agregarCargo: async (cargo: Omit<CargoProfesional, 'id' | 'created_at' | 'updated_at'>): Promise<CargoProfesional | null> => {
    try {
      const { data, error } = await supabase
        .from('cargos_profesionales')
        .insert(cargo)
        .select()
        .single();
      
      if (error) {
        console.error('Error adding cargo profesional:', error);
        return null;
      }
      
      return data as CargoProfesional;
    } catch (error) {
      console.error('Error in agregarCargo:', error);
      return null;
    }
  },

  actualizarCargo: async (id: string, cargoActualizado: Partial<CargoProfesional>): Promise<CargoProfesional | null> => {
    try {
      const { data, error } = await supabase
        .from('cargos_profesionales')
        .update(cargoActualizado)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating cargo profesional:', error);
        return null;
      }
      
      return data as CargoProfesional;
    } catch (error) {
      console.error('Error in actualizarCargo:', error);
      return null;
    }
  },

  eliminarCargo: async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('cargos_profesionales')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting cargo profesional:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error in eliminarCargo:', error);
      return false;
    }
  },

  toggleActivo: async (id: string, activo: boolean): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('cargos_profesionales')
        .update({ activo })
        .eq('id', id);
      
      if (error) {
        console.error('Error toggling cargo activo:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error in toggleActivo:', error);
      return false;
    }
  }
};