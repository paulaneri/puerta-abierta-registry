import { supabase } from '@/integrations/supabase/client';

export interface Nacionalidad {
  id: string;
  nombre: string;
  activa: boolean;
  created_at?: string;
  updated_at?: string;
}

class NacionalidadesStore {
  async getNacionalidades(): Promise<Nacionalidad[]> {
    try {
      const { data, error } = await supabase
        .from('nacionalidades')
        .select('*')
        .order('nombre');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching nacionalidades:', error);
      return [];
    }
  }

  async getNacionalidadesActivas(): Promise<Nacionalidad[]> {
    try {
      const { data, error } = await supabase
        .from('nacionalidades')
        .select('*')
        .eq('activa', true)
        .order('nombre');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching nacionalidades activas:', error);
      return [];
    }
  }

  async agregarNacionalidad(nacionalidad: Omit<Nacionalidad, 'id' | 'created_at' | 'updated_at'>): Promise<Nacionalidad | null> {
    try {
      const { data, error } = await supabase
        .from('nacionalidades')
        .insert([nacionalidad])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding nacionalidad:', error);
      return null;
    }
  }

  async actualizarNacionalidad(id: string, updates: Partial<Omit<Nacionalidad, 'id' | 'created_at' | 'updated_at'>>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('nacionalidades')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating nacionalidad:', error);
      return false;
    }
  }

  async toggleActiva(id: string, activa: boolean): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('nacionalidades')
        .update({ activa })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error toggling nacionalidad:', error);
      return false;
    }
  }

  async eliminarNacionalidad(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('nacionalidades')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting nacionalidad:', error);
      return false;
    }
  }
}

export const nacionalidadesStore = new NacionalidadesStore();