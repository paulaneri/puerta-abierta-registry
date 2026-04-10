import { supabase } from "@/integrations/supabase/client";

interface Acompanamiento {
  id: number;
  fecha: string;
  equipo: string[];
  notas: string;
}

interface Documento {
  id: string; 
  nombre: string;
  tipo: string;
  fechaSubida: string;
  descripcion?: string;
  url?: string; // URL de Supabase Storage (opcional)
  fileId?: string; // ID del archivo en algunos documentos existentes
  tamaño: number;
}

interface Mujer {
  id: string;
  nombre: string;
  apodo?: string;
  apellido: string;
  fechaNacimiento: string; 
  nacionalidad: string;
  tieneDocumentacion?: boolean;
  tipoDocumentacion?: string;
  tipoResidencia?: string;
  telefono: string;
  email: string;
  direccion: string;
  documentacion: string;
  hijosACargo: boolean;
  fechaRegistro: string; 
  origenRegistro?: 'trabajo-campo' | 'centro-dia' | 'derivacion';
  fechaPrimerContacto?: string;
  descripcionRasgos?: string;
  paradaZona?: string;
  personaContactoReferencia?: string;
  observacionesHistoria?: string;
  acompanamientos: Acompanamiento[];
  documentos: Documento[];
  alfabetizada?: boolean;
  tramites_realizados?: string[];
  llamadas_recibidas?: number;
  llamadas_realizadas?: number;
  observaciones?: string;
  viviendaTipo?: string;
  viviendaContrato?: string;
  ayudaHabitacional?: string;
  coberturaSalud?: string;
  aportePrevisional?: string;
}

// Store integrado con Supabase
export const mujeresStore = {
  getMujeres: async (): Promise<Mujer[]> => {
    const { data, error } = await supabase
      .from('mujeres')
      .select('*')
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching mujeres:', error);
      return [];
    }
    
    return data.map(row => ({
      id: row.id,
      nombre: row.nombre || '',
      apodo: row.apodo || '',
      apellido: row.apellido || '',
      fechaNacimiento: row.fecha_nacimiento || '',
      nacionalidad: row.nacionalidad || '',
      tieneDocumentacion: row.tiene_documentacion || false,
      tipoDocumentacion: row.tipo_documentacion || '',
      tipoResidencia: row.tipo_residencia || '',
      telefono: row.telefono || '',
      email: row.email || '',
      direccion: row.direccion || '',
      documentacion: '',
      hijosACargo: row.hijos || false,
      fechaRegistro: row.created_at?.split('T')[0] || '',
      origenRegistro: (row.origen_registro as 'trabajo-campo' | 'centro-dia' | 'derivacion') || 'centro-dia',
      fechaPrimerContacto: row.fecha_primer_contacto || '',
      descripcionRasgos: row.descripcion_rasgos || '',
      paradaZona: row.parada_zona || '',
      personaContactoReferencia: row.persona_contacto_referencia || '',
      observacionesHistoria: row.observaciones_historia || '',
      acompanamientos: row.acompanamientos 
        ? typeof row.acompanamientos === 'string' 
          ? JSON.parse(row.acompanamientos) 
          : Array.isArray(row.acompanamientos)
            ? (row.acompanamientos as any[]).map(a => ({
                id: a.id || 0,
                fecha: a.fecha || '',
                equipo: Array.isArray(a.equipo) ? a.equipo : [],
                notas: a.notas || ''
              }))
            : []
        : [],
      documentos: row.documentos 
        ? typeof row.documentos === 'string' 
          ? JSON.parse(row.documentos) 
          : Array.isArray(row.documentos) 
            ? row.documentos 
            : []
        : [],
      alfabetizada: row.alfabetizada || false,
      tramites_realizados: row.tramites_realizados || [],
      llamadas_recibidas: row.llamadas_recibidas || 0,
      llamadas_realizadas: row.llamadas_realizadas || 0,
      observaciones: row.observaciones || '',
      viviendaTipo: (row as any).vivienda_tipo || '',
      viviendaContrato: (row as any).vivienda_contrato || '',
      ayudaHabitacional: (row as any).ayuda_habitacional || '',
      coberturaSalud: (row as any).cobertura_salud || '',
      aportePrevisional: (row as any).aporte_previsional || '',
    }));
  },

  // Método síncrono para compatibilidad
  getMujeresSync: (): Mujer[] => {
    const stored = localStorage.getItem('mujeres');
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  },

  setMujeres: (mujeres: Mujer[]) => {
    localStorage.setItem('mujeres', JSON.stringify(mujeres));
  },

  agregarMujer: async (mujer: Mujer): Promise<boolean> => {
    try {
      // Verificar si ya existe una mujer con el mismo nombre y apellido
      const { data: existingMujeres, error: searchError } = await supabase
        .from('mujeres')
        .select('id')
        .ilike('nombre', mujer.nombre)
        .ilike('apellido', mujer.apellido)
        .limit(1);

      if (searchError) {
        console.error('Error checking for existing mujer:', searchError);
        return false;
      }

      if (existingMujeres && existingMujeres.length > 0) {
        console.log('Mujer already exists:', mujer.nombre, mujer.apellido);
        return false; // Ya existe
      }

      const { error } = await supabase
        .from('mujeres')
        .insert({
          nombre: mujer.nombre,
          apellido: mujer.apellido,
          apodo: mujer.apodo || null,
          fecha_nacimiento: mujer.fechaNacimiento || null,
          nacionalidad: mujer.nacionalidad || '',
          tiene_documentacion: mujer.tieneDocumentacion || false,
          tipo_documentacion: mujer.tipoDocumentacion || null,
          tipo_residencia: mujer.tipoResidencia || null,
          telefono: mujer.telefono || '',
          email: mujer.email || '',
          direccion: mujer.direccion || '',
          hijos: mujer.hijosACargo,
          numero_hijos: mujer.hijosACargo ? 1 : 0,
          alfabetizada: mujer.alfabetizada || false,
          tramites_realizados: mujer.tramites_realizados || [],
          llamadas_recibidas: mujer.llamadas_recibidas || 0,
          llamadas_realizadas: mujer.llamadas_realizadas || 0,
          origen_registro: mujer.origenRegistro || 'centro-dia',
          fecha_primer_contacto: mujer.fechaPrimerContacto || null,
          descripcion_rasgos: mujer.descripcionRasgos || null,
          parada_zona: mujer.paradaZona || null,
          persona_contacto_referencia: mujer.personaContactoReferencia || null,
          observaciones_historia: mujer.observacionesHistoria || null,
          acompanamientos: JSON.stringify(mujer.acompanamientos || []),
          documentos: JSON.stringify(mujer.documentos || []),
          observaciones: mujer.observaciones || '',
          vivienda_tipo: mujer.viviendaTipo || null,
          vivienda_contrato: mujer.viviendaContrato || null,
          ayuda_habitacional: mujer.ayudaHabitacional || null,
          cobertura_salud: mujer.coberturaSalud || null,
          aporte_previsional: mujer.aportePrevisional || null,
        } as any);
      
      if (error) {
        console.error('Error adding mujer:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error adding mujer:', error);
      return false;
    }
  },

  // Método síncrono de agregar para compatibilidad  
  agregarMujerSync: (mujer: Mujer): boolean => {
    const mujeres = mujeresStore.getMujeresSync();
    const existe = mujeres.some(m => (
      (m.nombre && mujer.nombre && m.nombre === mujer.nombre && m.apellido === mujer.apellido) ||
      (m.apodo && mujer.apodo && m.apodo === mujer.apodo && m.apellido === mujer.apellido)
    ));
    if (!existe) {
      const nuevasMujeres = [...mujeres, mujer];
      mujeresStore.setMujeres(nuevasMujeres);
      return true;
    }
    return false;
  },

  actualizarMujer: async (id: string, mujerActualizada: Partial<Mujer>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('mujeres')
        .update({
          nombre: mujerActualizada.nombre,
          apellido: mujerActualizada.apellido,
          apodo: mujerActualizada.apodo || null,
          fecha_nacimiento: mujerActualizada.fechaNacimiento || null,
          nacionalidad: mujerActualizada.nacionalidad || '',
          tiene_documentacion: mujerActualizada.tieneDocumentacion || false,
          tipo_documentacion: mujerActualizada.tipoDocumentacion || null,
          tipo_residencia: mujerActualizada.tipoResidencia || null,
          telefono: mujerActualizada.telefono || '',
          email: mujerActualizada.email || '',
          direccion: mujerActualizada.direccion || '',
          hijos: mujerActualizada.hijosACargo,
          alfabetizada: mujerActualizada.alfabetizada || false,
          tramites_realizados: mujerActualizada.tramites_realizados || [],
          llamadas_recibidas: mujerActualizada.llamadas_recibidas || 0,
          llamadas_realizadas: mujerActualizada.llamadas_realizadas || 0,
          origen_registro: mujerActualizada.origenRegistro || 'centro-dia',
          fecha_primer_contacto: mujerActualizada.fechaPrimerContacto || null,
          descripcion_rasgos: mujerActualizada.descripcionRasgos || null,
          parada_zona: mujerActualizada.paradaZona || null,
          persona_contacto_referencia: mujerActualizada.personaContactoReferencia || null,
          observaciones_historia: mujerActualizada.observacionesHistoria || null,
          acompanamientos: mujerActualizada.acompanamientos ? 
            JSON.stringify(mujerActualizada.acompanamientos) : undefined,
          documentos: mujerActualizada.documentos ? 
            JSON.stringify(mujerActualizada.documentos) : undefined,
          observaciones: mujerActualizada.observaciones || '',
          vivienda_tipo: mujerActualizada.viviendaTipo || null,
          vivienda_contrato: mujerActualizada.viviendaContrato || null,
          ayuda_habitacional: mujerActualizada.ayudaHabitacional || null,
          cobertura_salud: mujerActualizada.coberturaSalud || null,
          aporte_previsional: mujerActualizada.aportePrevisional || null,
        } as any)
        .eq('id', id);
      
      return !error;
    } catch (error) {
      return false;
    }
  },

  // Método síncrono para compatibilidad
  actualizarMujerSync: (id: string, mujerActualizada: Partial<Mujer>) => {
    const mujeres = mujeresStore.getMujeresSync();
    const nuevasMujeres = mujeres.map(m => m.id === id ? { ...m, ...mujerActualizada } : m);
    mujeresStore.setMujeres(nuevasMujeres);
  },

  eliminarMujer: async (id: string): Promise<boolean> => {
    try {
      console.log('🗑️ Intentando eliminar mujer con ID:', id);
      const { error, count } = await supabase
        .from('mujeres')
        .delete()
        .eq('id', id)
        .select();
      
      if (error) {
        console.error('❌ Error al eliminar mujer:', error.message, error.details, error.hint);
        return false;
      }
      
      console.log('✅ Mujer eliminada correctamente, ID:', id);
      return true;
    } catch (error) {
      console.error('❌ Excepción al eliminar mujer:', error);
      return false;
    }
  },

  archivarMujer: async (id: string, archivado: boolean): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('mujeres')
        .update({ archivado: archivado } as any)
        .eq('id', id);
      
      return !error;
    } catch (error) {
      console.error('Error archivando mujer:', error);
      return false;
    }
  },

  // Método síncrono para compatibilidad
  eliminarMujerSync: (id: string) => {
    const mujeres = mujeresStore.getMujeresSync();
    const nuevasMujeres = mujeres.filter(m => m.id !== id);
    mujeresStore.setMujeres(nuevasMujeres);
  },

  // Funciones para documentos usando Supabase Storage
  subirDocumento: async (file: File, mujerId: string, descripcion: string): Promise<Documento | null> => {
    try {
      const fileName = `${mujerId}/${Date.now()}-${file.name}`;
      
      console.log('Uploading file to mujeres-documentos bucket:', fileName);
      
      const { data, error } = await supabase.storage
        .from('mujeres-documentos')
        .upload(fileName, file);
      
      if (error) {
        console.error('Error uploading document to mujeres-documentos:', error);
        return null;
      }
      
      console.log('File uploaded successfully:', data);
      
      // Para buckets privados, guardamos el path y generamos URLs firmadas cuando sea necesario
      return {
        id: Date.now().toString(),
        nombre: file.name,
        url: fileName, // Guardamos el path, no la URL
        tipo: file.type,
        tamaño: file.size,
        descripcion: descripcion,
        fechaSubida: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error uploading document:', error);
      return null;
    }
  },

  getDocumentUrl: async (fileName: string): Promise<string | null> => {
    try {
      console.log('Getting document URL for:', fileName);
      
      // Si fileName es una URL completa, extraer solo el path
      let path = fileName;
      if (fileName.startsWith('https://')) {
        // Extraer el path de la URL: /storage/v1/object/public/mujeres-documentos/path/file.ext
        const url = new URL(fileName);
        const pathParts = url.pathname.split('/');
        // Encontrar la parte después de "mujeres-documentos"
        const bucketIndex = pathParts.indexOf('mujeres-documentos');
        if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
          path = pathParts.slice(bucketIndex + 1).join('/');
        }
      }
      
      console.log('Creating signed URL for path:', path);
      
      const { data, error } = await supabase.storage
        .from('mujeres-documentos')
        .createSignedUrl(path, 3600); // URL válida por 1 hora
      
      if (error) {
        console.error('Error creating signed URL:', error);
        return null;
      }
      
      return data.signedUrl;
    } catch (error) {
      console.error('Error creating signed URL:', error);
      return null;
    }
  },

  eliminarDocumento: async (fileName: string): Promise<boolean> => {
    try {
      const { error } = await supabase.storage
        .from('mujeres-documentos')
        .remove([fileName]);
      
      if (error) {
        console.error('Error deleting document:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting document:', error);
      return false;
    }
  }
};

export type { Mujer, Acompanamiento, Documento };