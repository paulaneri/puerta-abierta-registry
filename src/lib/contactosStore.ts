import { supabase } from "@/integrations/supabase/client";

interface Contacto {
  id: string;
  referente: string;
  institucion: string;
  tipoContacto: string;
  telefono: string;
  email: string;
  paginaWeb: string;
  descripcion: string;
  direccion: string;
  servicio: string;
  diaAtencion: string;
  horarioAtencion: string;
  ciudad: string;
  provincia: string;
  pais: string;
  createdAt: string;
}

const tiposContacto = [
  "Salud",
  "Adicciones", 
  "Migraciones",
  "Educación",
  "Trabajo",
  "Vivienda",
  "Legal/Jurídico",
  "Psicológico",
  "Social",
  "Alimentación",
  "Capacitación",
  "Otros"
];

class ContactosStore {
  async getContactos(): Promise<Contacto[]> {
    const { data, error } = await supabase
      .from('contactos')
      .select('*')
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching contactos:', error);
      return [];
    }
    
    return data.map(row => ({
      id: row.id,
      referente: row.nombre || '',
      institucion: row.organizacion || '',
      tipoContacto: row.tags?.[0] || 'Otros',
      telefono: row.telefono || '',
      email: row.email || '',
      paginaWeb: row.pagina_web || '',
      descripcion: row.notas || '',
      direccion: row.direccion || '',
      servicio: row.servicio || '',
      diaAtencion: row.dia_atencion || '',
      horarioAtencion: row.horario_atencion || '',
      ciudad: row.ciudad || '',
      provincia: row.provincia || '',
      pais: row.pais || '',
      createdAt: row.created_at
    }));
  }

  async addContacto(contacto: Omit<Contacto, 'id' | 'createdAt'>): Promise<boolean> {
    const { error } = await supabase
      .from('contactos')
      .insert({
        nombre: contacto.referente,
        apellido: '',
        organizacion: contacto.institucion,
        cargo: '',
        telefono: contacto.telefono,
        email: contacto.email,
        pagina_web: contacto.paginaWeb,
        direccion: contacto.direccion,
        servicio: contacto.servicio,
        dia_atencion: contacto.diaAtencion,
        horario_atencion: contacto.horarioAtencion,
        ciudad: contacto.ciudad,
        provincia: contacto.provincia,
        pais: contacto.pais,
        tags: [contacto.tipoContacto],
        notas: contacto.descripcion
      });
    
    if (error) {
      console.error('Error adding contacto:', error);
      return false;
    }
    
    return true;
  }

  async updateContacto(id: string, updates: Partial<Omit<Contacto, 'id' | 'createdAt'>>): Promise<boolean> {
    const { error } = await supabase
      .from('contactos')
      .update({
        nombre: updates.referente,
        organizacion: updates.institucion,
        telefono: updates.telefono,
        email: updates.email,
        pagina_web: updates.paginaWeb,
        direccion: updates.direccion,
        servicio: updates.servicio,
        dia_atencion: updates.diaAtencion,
        horario_atencion: updates.horarioAtencion,
        ciudad: updates.ciudad,
        provincia: updates.provincia,
        pais: updates.pais,
        tags: updates.tipoContacto ? [updates.tipoContacto] : undefined,
        notas: updates.descripcion
      })
      .eq('id', id);
    
    if (error) {
      console.error('Error updating contacto:', error);
      return false;
    }
    
    return true;
  }

  async deleteContacto(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('contactos')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting contacto:', error);
      return false;
    }
    
    return true;
  }

  async getContactoById(id: string): Promise<Contacto | undefined> {
    const { data, error } = await supabase
      .from('contactos')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) {
      return undefined;
    }
    
    return {
      id: data.id,
      referente: data.nombre || '',
      institucion: data.organizacion || '',
      tipoContacto: data.tags?.[0] || 'Otros',
      telefono: data.telefono || '',
      email: data.email || '',
      paginaWeb: data.pagina_web || '',
      descripcion: data.notas || '',
      direccion: data.direccion || '',
      servicio: data.servicio || '',
      diaAtencion: data.dia_atencion || '',
      horarioAtencion: data.horario_atencion || '',
      ciudad: data.ciudad || '',
      provincia: data.provincia || '',
      pais: data.pais || '',
      createdAt: data.created_at
    };
  }

  async getContactosPorTipo(tipo: string): Promise<Contacto[]> {
    const contactos = await this.getContactos();
    return contactos.filter(contacto => contacto.tipoContacto === tipo);
  }

  getTiposContacto(): string[] {
    return tiposContacto;
  }

  async archivarContacto(id: string, archivado: boolean): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('contactos')
        .update({ archivado: archivado } as any)
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error archivando contacto:', error);
      return false;
    }
  }
}

export const contactosStore = new ContactosStore();
export type { Contacto };
export { tiposContacto };