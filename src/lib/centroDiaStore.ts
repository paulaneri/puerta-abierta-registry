import { supabase } from "@/integrations/supabase/client";
import { mujeresStore, type Mujer } from './mujeresStore';

interface RegistroCentroDia {
  id: string;
  fecha: string;
  mujeresAsistieron: {
    mujer: Mujer;
    entrevistaRealizada: boolean;
  }[];
  talleresActividades: string;
  llamadasRecibidas: {
    nombre: string;
    descripcion?: string;
  }[];
  llamadasHechas: {
    nombre: string;
    descripcion?: string;
  }[];
  articulacionInstituciones: string;
  tramites: {
    tipo: string;
    cantidad: number;
  }[];
  trabajoCampoResumen: string;
  equipoTrabajo: string;
  comentariosObservaciones: string;
}

export const centroDiaStore = (() => {
    return {
    getRegistros: async (mostrarArchivados = false): Promise<RegistroCentroDia[]> => {
      let query = supabase
        .from('centro_dia')
        .select('*')
        .order('updated_at', { ascending: false });
      
      if (!mostrarArchivados) {
        query = query.eq('archivado', false);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching registros centro dia:', error);
        return [];
      }
      
      return data.map(row => ({
        id: row.id,
        fecha: row.fecha,
        mujeresAsistieron: (row.mujeres_asistieron as any) || [],
        talleresActividades: row.descripcion || '',
        llamadasRecibidas: (row.llamadas_recibidas as any) || [],
        llamadasHechas: (row.llamadas_hechas as any) || [],
        articulacionInstituciones: row.articulacion_instituciones || '',
        tramites: (row.tramites as any) || [],
        trabajoCampoResumen: row.trabajo_campo_resumen || '',
        equipoTrabajo: row.profesional || '',
        comentariosObservaciones: row.observaciones || ''
      }));
    },

    setRegistros: async (registros: RegistroCentroDia[]) => {
      // This method is kept for compatibility but doesn't do anything in the new implementation
    },

    agregarRegistro: async (registro: Omit<RegistroCentroDia, 'id'>) => {
      const { data, error } = await supabase
        .from('centro_dia')
        .insert({
          fecha: registro.fecha,
          tipo_actividad: 'taller',
          descripcion: registro.talleresActividades,
          profesional: registro.equipoTrabajo,
          observaciones: registro.comentariosObservaciones,
          mujeres_asistieron: registro.mujeresAsistieron as any,
          llamadas_recibidas: registro.llamadasRecibidas as any,
          llamadas_hechas: registro.llamadasHechas as any,
          tramites: registro.tramites as any,
          articulacion_instituciones: registro.articulacionInstituciones,
          trabajo_campo_resumen: registro.trabajoCampoResumen
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error adding registro centro dia:', error);
        return null;
      }
      
      return {
        id: data.id,
        ...registro
      };
    },

    actualizarRegistro: async (id: string, registroActualizado: Partial<RegistroCentroDia>) => {
      const { error } = await supabase
        .from('centro_dia')
        .update({
          fecha: registroActualizado.fecha,
          descripcion: registroActualizado.talleresActividades,
          profesional: registroActualizado.equipoTrabajo,
          observaciones: registroActualizado.comentariosObservaciones,
          mujeres_asistieron: registroActualizado.mujeresAsistieron as any,
          llamadas_recibidas: registroActualizado.llamadasRecibidas as any,
          llamadas_hechas: registroActualizado.llamadasHechas as any,
          tramites: registroActualizado.tramites as any,
          articulacion_instituciones: registroActualizado.articulacionInstituciones,
          trabajo_campo_resumen: registroActualizado.trabajoCampoResumen
        })
        .eq('id', id);
      
      if (error) {
        console.error('Error updating registro centro dia:', error);
      }
    },

    archivarRegistro: async (id: string, archivado: boolean) => {
      const { error } = await supabase
        .from('centro_dia')
        .update({ archivado })
        .eq('id', id);
      
      if (error) {
        console.error('Error archivando registro centro dia:', error);
        throw error;
      }
    },

    eliminarRegistro: async (id: string) => {
      const { error } = await supabase
        .from('centro_dia')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting registro centro dia:', error);
      }
    },

    getRegistroPorId: async (id: string): Promise<RegistroCentroDia | null> => {
      const { data, error } = await supabase
        .from('centro_dia')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error || !data) {
        return null;
      }
      
      return {
        id: data.id,
        fecha: data.fecha,
        mujeresAsistieron: (data.mujeres_asistieron as any) || [],
        talleresActividades: data.descripcion || '',
        llamadasRecibidas: (data.llamadas_recibidas as any) || [],
        llamadasHechas: (data.llamadas_hechas as any) || [],
        articulacionInstituciones: data.articulacion_instituciones || '',
        tramites: (data.tramites as any) || [],
        trabajoCampoResumen: data.trabajo_campo_resumen || '',
        equipoTrabajo: data.profesional || '',
        comentariosObservaciones: data.observaciones || ''
      };
    }
  };
})();

export type { RegistroCentroDia };