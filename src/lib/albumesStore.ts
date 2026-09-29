import { supabase } from "@/integrations/supabase/client";

export interface Album {
  id: string;
  nombre: string;
  fecha: string;
  evento?: string;
  descripcion?: string;
  foto_portada_url?: string;
  created_at: string;
  updated_at: string;
}

export interface FotoAlbum {
  id: string;
  album_id: string;
  url: string;
  nombre_archivo?: string;
  descripcion?: string;
  orden: number;
  created_at: string;
}

export const albumesStore = {
  async getAlbumes(): Promise<Album[]> {
    const { data, error } = await supabase
      .from('albumes' as any)
      .select('*')
      .order('fecha', { ascending: false });
    
    if (error) {
      console.error('Error fetching albumes:', error);
      return [];
    }
    
    return (data as unknown) as Album[];
  },

  async getAlbum(id: string): Promise<Album | null> {
    const { data, error } = await supabase
      .from('albumes' as any)
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching album:', error);
      return null;
    }
    
    return (data as unknown) as Album;
  },

  async createAlbum(album: Omit<Album, 'id' | 'created_at' | 'updated_at'>): Promise<Album | null> {
    const { getCurrentUserId } = await import('./currentUser');
    const creado_por = await getCurrentUserId();
    const { data, error } = await supabase
      .from('albumes' as any)
      .insert({ ...album, creado_por } as any)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating album:', error);
      throw error;
    }
    
    return (data as unknown) as Album;
  },

  async updateAlbum(id: string, album: Partial<Album>): Promise<Album | null> {
    const { data, error } = await supabase
      .from('albumes' as any)
      .update(album as any)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating album:', error);
      throw error;
    }
    
    return (data as unknown) as Album;
  },

  async deleteAlbum(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('albumes' as any)
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting album:', error);
      return false;
    }
    
    return true;
  },

  async getFotosAlbum(albumId: string): Promise<FotoAlbum[]> {
    const { data, error } = await supabase
      .from('fotos_album' as any)
      .select('*')
      .eq('album_id', albumId)
      .order('orden', { ascending: true });
    
    if (error) {
      console.error('Error fetching fotos:', error);
      return [];
    }
    
    return (data as unknown) as FotoAlbum[];
  },

  async getResumenFotos(): Promise<Record<string, { total: number; porUsuario: Record<string, number>; ultima: string | null }>> {
    const resumen: Record<string, { total: number; porUsuario: Record<string, number>; ultima: string | null }> = {};
    const paso = 1000;
    for (let desde = 0; ; desde += paso) {
      const { data, error } = await supabase
        .from('fotos_album' as any)
        .select('album_id, creado_por, created_at')
        .range(desde, desde + paso - 1);
      if (error) { console.error('Error resumen fotos:', error); break; }
      const filas = (data as any[]) || [];
      for (const f of filas) {
        const r = (resumen[f.album_id] ||= { total: 0, porUsuario: {}, ultima: null });
        r.total++;
        const u = f.creado_por || '__sin__';
        r.porUsuario[u] = (r.porUsuario[u] || 0) + 1;
        if (!r.ultima || f.created_at > r.ultima) r.ultima = f.created_at;
      }
      if (filas.length < paso) break;
    }
    return resumen;
  },

  async getAllFotos(): Promise<FotoAlbum[]> {
    const { data, error } = await supabase
      .from('fotos_album' as any)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (error) {
      console.error('Error fetching all fotos:', error);
      return [];
    }
    
    return (data as unknown) as FotoAlbum[];
  },

  async addFoto(foto: Omit<FotoAlbum, 'id' | 'created_at'>): Promise<FotoAlbum | null> {
    const { getCurrentUserId } = await import('./currentUser');
    const creado_por = await getCurrentUserId();
    const { data, error } = await supabase
      .from('fotos_album' as any)
      .insert({ ...foto, creado_por } as any)
      .select()
      .single();
    
    if (error) {
      console.error('Error adding foto:', error);
      throw error;
    }
    
    return (data as unknown) as FotoAlbum;
  },

  async deleteFoto(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('fotos_album' as any)
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting foto:', error);
      return false;
    }
    
    return true;
  },

  async uploadFoto(file: File, albumId: string): Promise<string | null> {
    const nombreSeguro = file.name
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `${albumId}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${nombreSeguro}`;
    
    const { error: uploadError } = await supabase.storage
      .from('fotos-albumes')
      .upload(fileName, file);
    
    if (uploadError) {
      console.error('Error uploading foto:', uploadError);
      throw uploadError;
    }
    
    const { data } = supabase.storage
      .from('fotos-albumes')
      .getPublicUrl(fileName);
    
    return data.publicUrl;
  },

  async deleteFotoStorage(url: string): Promise<boolean> {
    // Extract path from URL
    const path = url.split('/fotos-albumes/')[1];
    if (!path) return false;
    
    const { error } = await supabase.storage
      .from('fotos-albumes')
      .remove([path]);
    
    if (error) {
      console.error('Error deleting foto from storage:', error);
      return false;
    }
    
    return true;
  }
};
