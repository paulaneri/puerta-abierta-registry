import { supabase } from "@/integrations/supabase/client";

export interface Lugar {
  id: string;
  nombre: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export const lugaresStore = {
  async getLugares(): Promise<Lugar[]> {
    console.log('🏪 Store: Fetching lugares from database...');
    try {
      const { data, error } = await supabase
        .from('lugares')
        .select('*')
        .eq('activo', true)
        .order('nombre');

      if (error) {
        console.error('🏪 Store: Error fetching lugares:', error);
        return [];
      }

      console.log('🏪 Store: Successfully fetched lugares:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('🏪 Store: Exception in getLugares:', error);
      return [];
    }
  },

  async agregarLugar(nombre: string): Promise<Lugar | null> {
    try {
      // Verificar si ya existe
      const { data: existente } = await supabase
        .from('lugares')
        .select('*')
        .ilike('nombre', nombre)
        .maybeSingle();

      if (existente) {
        // Si existe pero está inactivo, activarlo
        if (!existente.activo) {
          const { data, error } = await supabase
            .from('lugares')
            .update({ activo: true })
            .eq('id', existente.id)
            .select()
            .single();

          if (error) {
            console.error('Error reactivating lugar:', error);
            return null;
          }
          return data;
        }
        return existente;
      }

      // Crear nuevo lugar
      const { data, error } = await supabase
        .from('lugares')
        .insert([{ nombre: nombre.trim(), activo: true }])
        .select()
        .single();

      if (error) {
        console.error('Error creating lugar:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in agregarLugar:', error);
      return null;
    }
  },

  async buscarLugares(termino: string): Promise<Lugar[]> {
    try {
      if (!termino.trim()) {
        return this.getLugares();
      }

      const { data, error } = await supabase
        .from('lugares')
        .select('*')
        .eq('activo', true)
        .ilike('nombre', `%${termino}%`)
        .order('nombre')
        .limit(10);

      if (error) {
        console.error('Error searching lugares:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in buscarLugares:', error);
      return [];
    }
  },

  async actualizarLugar(id: string, updates: { nombre: string }): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('lugares')
        .update({ nombre: updates.nombre.trim() })
        .eq('id', id);

      if (error) {
        console.error('Error updating lugar:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in actualizarLugar:', error);
      return false;
    }
  },

  async toggleActivo(id: string, activo: boolean): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('lugares')
        .update({ activo })
        .eq('id', id);

      if (error) {
        console.error('Error toggling lugar activo:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in toggleActivo:', error);
      return false;
    }
  },

  async eliminarLugar(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('lugares')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting lugar:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in eliminarLugar:', error);
      return false;
    }
  }
};