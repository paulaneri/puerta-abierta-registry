import { supabase } from "@/integrations/supabase/client";

interface Dupla {
  id: string;
  profesional1Id: string;
  profesional2Id: string;
  mujerId?: string | null;
  fechaFormacion: string;
  observaciones?: string;
  activa: boolean;
  createdAt: string;
  updatedAt: string;
}

interface DuplaConNombres extends Dupla {
  profesional1Nombre: string;
  profesional2Nombre: string;
  mujerNombre?: string;
}

export const duplasStore = {
  getDuplas: async (mostrarArchivadas = false): Promise<DuplaConNombres[]> => {
    try {
      let query = supabase
        .from('duplas_acompanamiento')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!mostrarArchivadas) {
        query = query.eq('archivado', false);
      }
      
      const { data: duplasData, error } = await query;
      
      if (error) throw error;
      if (!duplasData) return [];

      // Obtener profesionales y mujeres por separado
      const { data: profesionales } = await supabase
        .from('equipo')
        .select('id, nombre, apellido, profesion');
      
      const { data: mujeres } = await supabase
        .from('mujeres')
        .select('id, nombre, apellido, apodo');
      
      return duplasData.map(dupla => {
        const profesional1 = profesionales?.find(p => p.id === dupla.profesional1_id);
        const profesional2 = profesionales?.find(p => p.id === dupla.profesional2_id);
        const mujer = mujeres?.find(m => m.id === dupla.mujer_id);

        return {
          id: dupla.id,
          profesional1Id: dupla.profesional1_id,
          profesional2Id: dupla.profesional2_id,
          mujerId: dupla.mujer_id,
          fechaFormacion: dupla.fecha_formacion,
          observaciones: dupla.observaciones || '',
          activa: dupla.activa,
          createdAt: dupla.created_at,
          updatedAt: dupla.updated_at,
          profesional1Nombre: profesional1 
            ? `${profesional1.nombre} ${profesional1.apellido} (${profesional1.profesion})` 
            : 'Profesional no encontrado',
          profesional2Nombre: profesional2 
            ? `${profesional2.nombre} ${profesional2.apellido} (${profesional2.profesion})` 
            : 'Profesional no encontrado',
          mujerNombre: mujer 
            ? `${mujer.nombre || mujer.apodo} ${mujer.apellido}` 
            : undefined
        };
      });
    } catch (error) {
      console.error('Error fetching duplas:', error);
      return [];
    }
  },

  agregarDupla: async (dupla: {
    profesional1Id: string;
    profesional2Id: string;
    mujerId?: string | null;
    fechaFormacion: string;
    observaciones?: string;
    activa?: boolean;
  }): Promise<Dupla | null> => {
    try {
      const { data, error } = await supabase
        .from('duplas_acompanamiento')
        .insert({
          profesional1_id: dupla.profesional1Id,
          profesional2_id: dupla.profesional2Id,
          mujer_id: dupla.mujerId || null,
          fecha_formacion: dupla.fechaFormacion,
          observaciones: dupla.observaciones || '',
          activa: dupla.activa !== undefined ? dupla.activa : true
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        id: data.id,
        profesional1Id: data.profesional1_id,
        profesional2Id: data.profesional2_id,
        mujerId: data.mujer_id,
        fechaFormacion: data.fecha_formacion,
        observaciones: data.observaciones,
        activa: data.activa,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Error adding dupla:', error);
      return null;
    }
  },

  actualizarDupla: async (id: string, updates: {
    profesional1Id?: string;
    profesional2Id?: string;
    mujerId?: string | null;
    fechaFormacion?: string;
    observaciones?: string;
    activa?: boolean;
  }): Promise<boolean> => {
    try {
      const updateData: any = {};
      
      if (updates.profesional1Id !== undefined) updateData.profesional1_id = updates.profesional1Id;
      if (updates.profesional2Id !== undefined) updateData.profesional2_id = updates.profesional2Id;
      if (updates.mujerId !== undefined) updateData.mujer_id = updates.mujerId;
      if (updates.fechaFormacion !== undefined) updateData.fecha_formacion = updates.fechaFormacion;
      if (updates.observaciones !== undefined) updateData.observaciones = updates.observaciones;
      if (updates.activa !== undefined) updateData.activa = updates.activa;

      const { error } = await supabase
        .from('duplas_acompanamiento')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating dupla:', error);
      return false;
    }
  },

  archivarDupla: async (id: string, archivado: boolean): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('duplas_acompanamiento')
        .update({ archivado })
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error archivando dupla:', error);
      return false;
    }
  },

  eliminarDupla: async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('duplas_acompanamiento')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting dupla:', error);
      return false;
    }
  },

  getDuplaById: async (id: string): Promise<DuplaConNombres | null> => {
    try {
      const { data: duplaData, error } = await supabase
        .from('duplas_acompanamiento')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error || !duplaData) return null;
      
      // Obtener profesionales y mujer por separado
      const { data: profesionales } = await supabase
        .from('equipo')
        .select('id, nombre, apellido, profesion')
        .in('id', [duplaData.profesional1_id, duplaData.profesional2_id]);
      
      const { data: mujer } = duplaData.mujer_id ? await supabase
        .from('mujeres')
        .select('id, nombre, apellido, apodo')
        .eq('id', duplaData.mujer_id)
        .single() : { data: null };
      
      const profesional1 = profesionales?.find(p => p.id === duplaData.profesional1_id);
      const profesional2 = profesionales?.find(p => p.id === duplaData.profesional2_id);
      
      return {
        id: duplaData.id,
        profesional1Id: duplaData.profesional1_id,
        profesional2Id: duplaData.profesional2_id,
        mujerId: duplaData.mujer_id,
        fechaFormacion: duplaData.fecha_formacion,
        observaciones: duplaData.observaciones || '',
        activa: duplaData.activa,
        createdAt: duplaData.created_at,
        updatedAt: duplaData.updated_at,
        profesional1Nombre: profesional1 
          ? `${profesional1.nombre} ${profesional1.apellido} (${profesional1.profesion})` 
          : 'Profesional no encontrado',
        profesional2Nombre: profesional2 
          ? `${profesional2.nombre} ${profesional2.apellido} (${profesional2.profesion})` 
          : 'Profesional no encontrado',
        mujerNombre: mujer 
          ? `${mujer.nombre || mujer.apodo} ${mujer.apellido}` 
          : undefined
      };
    } catch (error) {
      console.error('Error fetching dupla by id:', error);
      return null;
    }
  },

  // Migrar datos de localStorage a Supabase
  migrateFromLocalStorage: async () => {
    try {
      const stored = localStorage.getItem('duplasAcompanamiento');
      if (!stored) return;
      
      const localData: any[] = JSON.parse(stored);
      console.log('🔄 Migrando duplas desde localStorage:', localData.length);
      
      for (const dupla of localData) {
        await duplasStore.agregarDupla({
          profesional1Id: dupla.profesional1Id,
          profesional2Id: dupla.profesional2Id,
          mujerId: dupla.mujerAsignada || null,
          fechaFormacion: dupla.fechaAsignacion || new Date().toISOString().split('T')[0],
          observaciones: dupla.notas || '',
          activa: dupla.activa !== undefined ? dupla.activa : true
        });
      }
      
      // Remover datos de localStorage después de la migración exitosa
      localStorage.removeItem('duplasAcompanamiento');
      console.log('✅ Migración de duplas completada');
    } catch (error) {
      console.error('❌ Error migrando duplas:', error);
    }
  }
};

export type { Dupla, DuplaConNombres };