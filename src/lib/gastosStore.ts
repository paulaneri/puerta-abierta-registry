import { supabase } from "@/integrations/supabase/client";

export interface DocumentoAdjunto {
  id: string;
  nombre: string;
  url: string;
  tipo: string;
  tamaño: number;
}

export interface Gasto {
  id: string;
  descripcion: string;
  monto: number;
  fecha: string;
  detalleFactura: string;
  etiqueta: string;
  documentosAdjuntos: DocumentoAdjunto[];
  createdAt: string;
}

export interface EtiquetaGasto {
  id: string;
  nombre: string;
  color: string;
}

class GastosStore {
  async getGastos(mostrarArchivados = false): Promise<Gasto[]> {
    const { data, error } = await supabase
      .from('gastos')
      .select('*')
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching gastos:', error);
      return [];
    }
    
    console.log('Raw gastos data from DB:', data);
    
    return data.map(row => {
      let documentosAdjuntos = [];
      try {
        if (row.documentos_adjuntos) {
          documentosAdjuntos = typeof row.documentos_adjuntos === 'string' 
            ? JSON.parse(row.documentos_adjuntos) 
            : Array.isArray(row.documentos_adjuntos) 
              ? row.documentos_adjuntos 
              : [];
        }
      } catch (e) {
        console.error('Error parsing documentos_adjuntos for gasto', row.id, e);
        documentosAdjuntos = [];
      }

      return {
        id: row.id,
        descripcion: row.descripcion || '',
        monto: Number(row.monto),
        fecha: row.fecha,
        detalleFactura: row.concepto || '',
        etiqueta: row.categoria || 'Gastos Generales',
        documentosAdjuntos,
        createdAt: row.created_at
      };
    });
  }

  async addGasto(gasto: Omit<Gasto, 'id' | 'createdAt'>): Promise<boolean> {
    const { error } = await supabase
      .from('gastos')
      .insert({
        descripcion: gasto.descripcion,
        concepto: gasto.detalleFactura,
        monto: gasto.monto,
        fecha: gasto.fecha,
        categoria: gasto.etiqueta || 'Gastos Generales',
        metodo_pago: 'Efectivo',
        documentos_adjuntos: JSON.stringify(gasto.documentosAdjuntos || [])
      });
    
    if (error) {
      console.error('Error adding gasto:', error);
      return false;
    }
    
    return true;
  }

  async updateGasto(id: string, updates: Partial<Omit<Gasto, 'id' | 'createdAt'>>): Promise<boolean> {
    const { error } = await supabase
      .from('gastos')
      .update({
        descripcion: updates.descripcion,
        concepto: updates.detalleFactura,
        monto: updates.monto,
        fecha: updates.fecha,
        categoria: updates.etiqueta,
        documentos_adjuntos: updates.documentosAdjuntos ? JSON.stringify(updates.documentosAdjuntos) : undefined
      })
      .eq('id', id);
    
    if (error) {
      console.error('Error updating gasto:', error);
      return false;
    }
    
    return true;
  }

  async deleteGasto(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('gastos')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting gasto:', error);
      return false;
    }
    
    return true;
  }

  async getGastoById(id: string): Promise<Gasto | undefined> {
    const { data, error } = await supabase
      .from('gastos')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error || !data) {
      console.error('Error fetching gasto by id:', error);
      return undefined;
    }
    
    let documentosAdjuntos = [];
    try {
      if (data.documentos_adjuntos) {
        documentosAdjuntos = typeof data.documentos_adjuntos === 'string' 
          ? JSON.parse(data.documentos_adjuntos) 
          : Array.isArray(data.documentos_adjuntos) 
            ? data.documentos_adjuntos 
            : [];
      }
    } catch (e) {
      console.error('Error parsing documentos_adjuntos for gasto', data.id, e);
      documentosAdjuntos = [];
    }
    
    return {
      id: data.id,
      descripcion: data.descripcion || '',
      monto: Number(data.monto),
      fecha: data.fecha,
      detalleFactura: data.concepto || '',
      etiqueta: data.categoria || 'Gastos Generales',
      documentosAdjuntos,
      createdAt: data.created_at
    };
  }

  async getSumatoriaAnual(año: number): Promise<number> {
    const gastos = await this.getGastos();
    return gastos
      .filter(gasto => new Date(gasto.fecha).getFullYear() === año)
      .reduce((total, gasto) => total + gasto.monto, 0);
  }

  async getGastosPorAño(año: number): Promise<Gasto[]> {
    const gastos = await this.getGastos();
    return gastos.filter(gasto => new Date(gasto.fecha).getFullYear() === año);
  }

  async archivarGasto(id: string, archivado: boolean): Promise<void> {
    try {
      const { error } = await supabase
        .from('gastos')
        .update({ archivado })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error archivando gasto:', error);
      throw error;
    }
  }

  async subirDocumento(file: File, gastoId: string): Promise<DocumentoAdjunto | null> {
    const fileName = `${gastoId}/${Date.now()}-${file.name}`;
    
    console.log('Uploading file to gastos-documentos bucket:', fileName);
    
    const { data, error } = await supabase.storage
      .from('gastos-documentos')
      .upload(fileName, file);
    
    if (error) {
      console.error('Error uploading document to gastos-documentos:', error);
      return null;
    }
    
    console.log('File uploaded successfully:', data);
    
    // Para buckets privados, guardamos el path y generamos URLs firmadas cuando sea necesario
    return {
      id: Date.now().toString(),
      nombre: file.name,
      url: fileName, // Guardamos el path, no la URL
      tipo: file.type,
      tamaño: file.size
    };
  }

  async getDocumentUrl(fileName: string): Promise<string | null> {
    // Si fileName es una URL completa, extraer solo el path
    let path = fileName;
    if (fileName.startsWith('https://')) {
      // Extraer el path de la URL: /storage/v1/object/public/gastos-documentos/path/file.ext
      const url = new URL(fileName);
      const pathParts = url.pathname.split('/');
      // Encontrar la parte después de "gastos-documentos"
      const bucketIndex = pathParts.indexOf('gastos-documentos');
      if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
        path = pathParts.slice(bucketIndex + 1).join('/');
      }
    }
    
    console.log('Creating signed URL for path:', path);
    
    const { data, error } = await supabase.storage
      .from('gastos-documentos')
      .createSignedUrl(path, 3600); // URL válida por 1 hora
    
    if (error) {
      console.error('Error creating signed URL:', error);
      return null;
    }
    
    return data.signedUrl;
  }

  async eliminarDocumento(fileName: string): Promise<boolean> {
    const { error } = await supabase.storage
      .from('gastos-documentos')
      .remove([fileName]);
    
    if (error) {
      console.error('Error deleting document:', error);
      return false;
    }
    
    return true;
  }
  async getEtiquetas(): Promise<EtiquetaGasto[]> {
    const { data, error } = await supabase
      .from('etiquetas_gastos' as any)
      .select('*')
      .order('nombre');
    if (error) {
      console.error('Error fetching etiquetas:', error);
      return [];
    }
    return (data as any[]).map(row => ({ id: row.id, nombre: row.nombre, color: row.color || '#6b7280' }));
  }

  async addEtiqueta(nombre: string): Promise<boolean> {
    const { error } = await supabase
      .from('etiquetas_gastos' as any)
      .insert({ nombre });
    if (error) {
      console.error('Error adding etiqueta:', error);
      return false;
    }
    return true;
  }

  async deleteEtiqueta(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('etiquetas_gastos' as any)
      .delete()
      .eq('id', id);
    if (error) {
      console.error('Error deleting etiqueta:', error);
      return false;
    }
    return true;
  }
}

export const gastosStore = new GastosStore();