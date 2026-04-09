import { supabase } from "@/integrations/supabase/client";

interface Evento {
  id: string;
  titulo: string;
  descripcion: string;
  fecha: string; // YYYY-MM-DD
  hora_inicio: string; // HH:MM
  hora_fin: string; // HH:MM
  lugar: string;
  tipo: 'reunion' | 'taller' | 'actividad' | 'seguimiento' | 'celebracion' | 'otro';
  participantes: string[];
  recordatorio: boolean;
  repeticion?: 'ninguna' | 'semanal' | 'mensual' | 'anualmente';
  fecha_fin_repeticion?: string;
  created_at?: string;
  updated_at?: string;
}

// Store para eventos
export const eventosStore = {
  getEventos: async (): Promise<Evento[]> => {
    try {
      const { data, error } = await supabase
        .from('eventos')
        .select('*')
        .order('fecha', { ascending: true });
      
      if (error) {
        console.error('Error fetching eventos:', error);
        return [];
      }
      
      return (data || []) as Evento[];
    } catch (error) {
      console.error('Error in getEventos:', error);
      return [];
    }
  },
  
  agregarEvento: async (evento: Omit<Evento, 'id' | 'created_at' | 'updated_at'>): Promise<Evento | null> => {
    try {
      const { data, error } = await supabase
        .from('eventos')
        .insert(evento)
        .select()
        .single();
      
      if (error) {
        console.error('Error adding evento:', error);
        return null;
      }
      
      return data as Evento;
    } catch (error) {
      console.error('Error in agregarEvento:', error);
      return null;
    }
  },
  
  actualizarEvento: async (id: string, eventoActualizado: Partial<Evento>): Promise<Evento | null> => {
    try {
      const { data, error } = await supabase
        .from('eventos')
        .update(eventoActualizado)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating evento:', error);
        return null;
      }
      
      return data as Evento;
    } catch (error) {
      console.error('Error in actualizarEvento:', error);
      return null;
    }
  },
  
  eliminarEvento: async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('eventos')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting evento:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error in eliminarEvento:', error);
      return false;
    }
  }
};

export type { Evento };