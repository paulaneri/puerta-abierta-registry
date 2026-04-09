import { supabase } from "@/integrations/supabase/client";

interface EncuentroMujer {
  id: number;
  nombre: string;
  apellido: string;
  conversacion: string;
  esRegistrada: boolean;
}

export interface TrabajoCampo {
  id: string; // Changed to string for UUID compatibility
  fecha: string;
  lugar: string;
  descripcion: string;
  profesionales: string[];
  encuentros: EncuentroMujer[];
  actividad: string;
  resultados?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const trabajoCampoStore = (() => {
  // Helper function to safely parse encuentros from JSONB
  const parseEncuentros = (encuentrosData: any): EncuentroMujer[] => {
    if (!encuentrosData) return [];
    if (typeof encuentrosData === 'string') {
      try {
        return JSON.parse(encuentrosData);
      } catch {
        return [];
      }
    }
    if (Array.isArray(encuentrosData)) {
      return encuentrosData as EncuentroMujer[];
    }
    return [];
  };

  return {
    getTrabajosCampo: async (mostrarArchivados = false): Promise<TrabajoCampo[]> => {
      try {
        let query = supabase
          .from('trabajo_campo')
          .select('*')
          .order('updated_at', { ascending: false });
        
        if (!mostrarArchivados) {
          query = query.eq('archivado', false);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        return data?.map(row => ({
          id: row.id,
          fecha: row.fecha,
          lugar: row.lugar,
          descripcion: row.observaciones || '',
          actividad: row.actividad,
          resultados: row.resultados || '',
          profesionales: row.participantes || [],
          encuentros: parseEncuentros(row.encuentros), // Use helper function to parse
          createdAt: row.created_at,
          updatedAt: row.updated_at
        })) || [];
      } catch (error) {
        console.error('Error fetching trabajos de campo:', error);
        return [];
      }
    },

    // Método síncrono para compatibilidad (deprecated)
    getTrabajosCampoSync: (): TrabajoCampo[] => {
      const stored = localStorage.getItem('trabajosCampo');
      return stored ? JSON.parse(stored) : [];
    },

    setTrabajosCampo: async (trabajos: TrabajoCampo[]) => {
      // This method is kept for compatibility but doesn't do anything in the new implementation
      console.warn('setTrabajosCampo is deprecated, use agregarTrabajo or actualizarTrabajo instead');
    },

    agregarTrabajo: async (trabajo: Omit<TrabajoCampo, 'id' | 'createdAt' | 'updatedAt'>): Promise<TrabajoCampo | null> => {
      try {
        const { data, error } = await supabase
          .from('trabajo_campo')
          .insert({
            fecha: trabajo.fecha,
            lugar: trabajo.lugar,
            actividad: trabajo.actividad || trabajo.descripcion,
            observaciones: trabajo.descripcion,
            resultados: trabajo.resultados || '',
            participantes: trabajo.profesionales,
            profesional_responsable: trabajo.profesionales[0] || '',
            encuentros: JSON.stringify(trabajo.encuentros || [])
          })
          .select()
          .single();
        
        if (error) throw error;
        
        return {
          id: data.id,
          fecha: data.fecha,
          lugar: data.lugar,
          descripcion: data.observaciones || '',
          actividad: data.actividad,
          resultados: data.resultados || '',
          profesionales: data.participantes || [],
          encuentros: parseEncuentros(data.encuentros),
          createdAt: data.created_at,
          updatedAt: data.updated_at
        };
      } catch (error) {
        console.error('Error adding trabajo de campo:', error);
        return null;
      }
    },

    actualizarTrabajo: async (id: string, trabajoActualizado: Partial<TrabajoCampo>): Promise<boolean> => {
      try {
        const updateData: any = {};
        
        if (trabajoActualizado.fecha !== undefined) updateData.fecha = trabajoActualizado.fecha;
        if (trabajoActualizado.lugar !== undefined) updateData.lugar = trabajoActualizado.lugar;
        if (trabajoActualizado.descripcion !== undefined) updateData.observaciones = trabajoActualizado.descripcion;
        if (trabajoActualizado.actividad !== undefined) updateData.actividad = trabajoActualizado.actividad;
        if (trabajoActualizado.resultados !== undefined) updateData.resultados = trabajoActualizado.resultados;
        if (trabajoActualizado.profesionales !== undefined) {
          updateData.participantes = trabajoActualizado.profesionales;
          updateData.profesional_responsable = trabajoActualizado.profesionales[0] || '';
        }
        if (trabajoActualizado.encuentros !== undefined) {
          updateData.encuentros = JSON.stringify(trabajoActualizado.encuentros);
        }

        const { error } = await supabase
          .from('trabajo_campo')
          .update(updateData)
          .eq('id', id);
        
        if (error) throw error;
        return true;
      } catch (error) {
        console.error('Error updating trabajo de campo:', error);
        return false;
      }
    },

    // Método actualizado para usar UUID
    actualizarTrabajoLegacy: (id: number, trabajoActualizado: Partial<TrabajoCampo>) => {
      console.warn('actualizarTrabajoLegacy is deprecated, data will be migrated to Supabase');
      // For legacy compatibility, try to find by date and update
      const migrateAndUpdate = async () => {
        const trabajos = await trabajoCampoStore.getTrabajosCampo();
        const trabajo = trabajos.find(t => t.fecha === trabajoActualizado.fecha);
        if (trabajo) {
          await trabajoCampoStore.actualizarTrabajo(trabajo.id, trabajoActualizado);
        }
      };
      migrateAndUpdate();
    },

    getTrabajoByFecha: async (fecha: string): Promise<TrabajoCampo | null> => {
      try {
        const { data, error } = await supabase
          .from('trabajo_campo')
          .select('*')
          .eq('fecha', fecha)
          .maybeSingle();
        
        if (error || !data) return null;
        
        return {
          id: data.id,
          fecha: data.fecha,
          lugar: data.lugar,
          descripcion: data.observaciones || '',
          actividad: data.actividad,
          resultados: data.resultados || '',
          profesionales: data.participantes || [],
          encuentros: parseEncuentros(data.encuentros),
          createdAt: data.created_at,
          updatedAt: data.updated_at
        };
      } catch (error) {
        console.error('Error fetching trabajo by fecha:', error);
        return null;
      }
    },

    getTrabajoPorId: async (id: string): Promise<TrabajoCampo | null> => {
      try {
        const { data, error } = await supabase
          .from('trabajo_campo')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        
        if (error || !data) return null;
        
        return {
          id: data.id,
          fecha: data.fecha,
          lugar: data.lugar,
          descripcion: data.observaciones || '',
          actividad: data.actividad,
          resultados: data.resultados || '',
          profesionales: data.participantes || [],
          encuentros: parseEncuentros(data.encuentros),
          createdAt: data.created_at,
          updatedAt: data.updated_at
        };
      } catch (error) {
        console.error('Error fetching trabajo por id:', error);
        return null;
      }
    },

    archivarTrabajo: async (id: string, archivado: boolean): Promise<boolean> => {
      try {
        const { error } = await supabase
          .from('trabajo_campo')
          .update({ archivado })
          .eq('id', id);
        
        if (error) throw error;
        return true;
      } catch (error) {
        console.error('Error archivando trabajo de campo:', error);
        return false;
      }
    },

    eliminarTrabajo: async (id: string): Promise<boolean> => {
      try {
        const { error } = await supabase
          .from('trabajo_campo')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        return true;
      } catch (error) {
        console.error('Error deleting trabajo de campo:', error);
        return false;
      }
    },

    // Migrar datos de localStorage a Supabase
    migrateFromLocalStorage: async () => {
      try {
        const stored = localStorage.getItem('trabajosCampo');
        if (!stored) return;
        
        const localData: any[] = JSON.parse(stored);
        console.log('🔄 Migrando trabajos de campo desde localStorage:', localData.length);
        
        for (const trabajo of localData) {
          await trabajoCampoStore.agregarTrabajo({
            fecha: trabajo.fecha,
            lugar: trabajo.lugar,
            descripcion: trabajo.descripcion,
            actividad: trabajo.descripcion, // usar descripción como actividad por defecto
            profesionales: trabajo.profesionales || [],
            encuentros: trabajo.encuentros || [],
            resultados: ''
          });
        }
        
        // Remover datos de localStorage después de la migración exitosa
        localStorage.removeItem('trabajosCampo');
        console.log('✅ Migración de trabajos de campo completada');
      } catch (error) {
        console.error('❌ Error migrando trabajos de campo:', error);
      }
    }
  };
})();