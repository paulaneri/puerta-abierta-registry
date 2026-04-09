import { supabase } from "@/integrations/supabase/client";

interface Profesional {
  id: string; // Changed to string for UUID compatibility
  nombre: string;
  apellido: string;
  cargo: string;
  especialidad: string;
  telefono: string;
  email: string;
  fechaIngreso: string;
  fechaNacimiento?: string;
  estado: "activo" | "inactivo";
  experiencia: string;
  certificaciones: string[];
  activo?: boolean; // For compatibility
  equipoAmpliado: boolean; // Nueva propiedad
}

// Datos iniciales del equipo (will be migrated to Supabase)
const equipoInicial: any[] = [
  {
    id: "1", // Changed to string
    nombre: "Ana",
    apellido: "García",
    cargo: "Psicólogo/a",
    especialidad: "Psicología Clínica",
    telefono: "555-1001",
    email: "ana.garcia@puertaabierta.com",
    fechaIngreso: "2023-03-15",
    fechaNacimiento: "1985-07-15",
    estado: "activo",
    experiencia: "5 años en centros de día",
    certificaciones: ["Psicología Clínica", "Terapia Grupal"]
  },
  {
    id: "2", // Changed to string
    nombre: "Carlos",
    apellido: "Martínez",
    cargo: "Trabajador/a Social",
    especialidad: "Intervención Social",
    telefono: "555-1002",
    email: "carlos.martinez@puertaabierta.com",
    fechaIngreso: "2023-01-10",
    fechaNacimiento: "1990-03-22",
    estado: "activo",
    experiencia: "7 años en trabajo comunitario",
    certificaciones: ["Trabajo Social", "Mediación Familiar"]
  },
  {
    id: "3", // Changed to string
    nombre: "María",
    apellido: "Rodríguez",
    cargo: "Terapeuta Ocupacional",
    especialidad: "Terapia Ocupacional",
    telefono: "555-1003",
    email: "maria.rodriguez@puertaabierta.com",
    fechaIngreso: "2023-02-20",
    fechaNacimiento: "1988-11-08",
    estado: "activo",
    experiencia: "4 años en rehabilitación",
    certificaciones: ["Terapia Ocupacional", "Estimulación Cognitiva"]
  },
  {
    id: "4", // Changed to string
    nombre: "Laura",
    apellido: "Fernández",
    cargo: "Educador/a Social",
    especialidad: "Educación Social",
    telefono: "555-1004",
    email: "laura.fernandez@puertaabierta.com",
    fechaIngreso: "2023-04-10",
    fechaNacimiento: "1992-05-30",
    estado: "activo",
    experiencia: "3 años en trabajo comunitario",
    certificaciones: ["Educación Social", "Talleres Grupales"]
  }
];

export const equipoStore = {
  getProfesionales: async (): Promise<Profesional[]> => {
    try {
      const { data, error } = await supabase
        .from('equipo')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data?.map(item => ({
        id: item.id,
        nombre: item.nombre,
        apellido: item.apellido,
        cargo: item.profesion || '',
        especialidad: item.especialidad || '',
        telefono: item.telefono || '',
        email: item.email || '',
        fechaIngreso: item.fecha_ingreso || '',
        fechaNacimiento: item.fecha_nacimiento || '',
        estado: item.activo ? 'activo' : 'inactivo',
        experiencia: item.experiencia || '',
        certificaciones: item.certificaciones || [],
        activo: item.activo,
        equipoAmpliado: item.equipo_ampliado || false
      })) || [];
    } catch (error) {
      console.error('Error fetching profesionales:', error);
      return [];
    }
  },

  migrateFromLocalStorage: async () => {
    try {
      const stored = localStorage.getItem('equipoProfesionales');
      if (!stored) return;
      
      const localData: any[] = JSON.parse(stored);
      
      // Verificar si ya existen profesionales en la base de datos
      const { data: existingData } = await supabase
        .from('equipo')
        .select('email');
      
      const existingEmails = new Set((existingData || []).map(p => p.email));
      
      for (const profesional of localData) {
        // Solo insertar si no existe ya un profesional con el mismo email
        if (!existingEmails.has(profesional.email)) {
          await supabase
            .from('equipo')
            .insert({
              nombre: profesional.nombre,
              apellido: profesional.apellido,
              profesion: profesional.cargo,
              especialidad: profesional.especialidad,
              telefono: profesional.telefono,
              email: profesional.email,
              fecha_ingreso: profesional.fechaIngreso || null,
              fecha_nacimiento: profesional.fechaNacimiento || null,
              activo: profesional.estado === 'activo',
              experiencia: profesional.experiencia,
              certificaciones: profesional.certificaciones,
              equipo_ampliado: profesional.equipoAmpliado || false
            });
        }
      }
      
      // Remove localStorage data after successful migration
      localStorage.removeItem('equipoProfesionales');
    } catch (error) {
      console.error('Error migrating data:', error);
    }
  },

  getProfesionalesActivos: async (): Promise<Profesional[]> => {
    const profesionales = await equipoStore.getProfesionales();
    return profesionales.filter(p => p.estado === 'activo');
  },

  agregarProfesional: async (profesional: Omit<Profesional, 'id'>) => {
    try {
      // Verificar si ya existe un profesional con el mismo email
      if (profesional.email) {
        const { data: existing } = await supabase
          .from('equipo')
          .select('id')
          .eq('email', profesional.email)
          .maybeSingle();
        
        if (existing) {
          console.log('Profesional con este email ya existe:', profesional.email);
          return null;
        }
      }
      
      const { data, error } = await supabase
        .from('equipo')
        .insert({
          nombre: profesional.nombre,
          apellido: profesional.apellido,
          profesion: profesional.cargo,
          especialidad: profesional.especialidad,
          telefono: profesional.telefono,
          email: profesional.email,
          fecha_ingreso: profesional.fechaIngreso || null,
          fecha_nacimiento: profesional.fechaNacimiento || null,
          activo: profesional.estado === 'activo',
          experiencia: profesional.experiencia,
          certificaciones: profesional.certificaciones,
          equipo_ampliado: profesional.equipoAmpliado
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        id: data.id,
        nombre: data.nombre,
        apellido: data.apellido,
        cargo: data.profesion,
        especialidad: data.especialidad,
        telefono: data.telefono,
        email: data.email,
        fechaIngreso: data.fecha_ingreso,
        fechaNacimiento: data.fecha_nacimiento,
        estado: data.activo ? 'activo' : 'inactivo',
        experiencia: data.experiencia,
        certificaciones: data.certificaciones,
        activo: data.activo,
        equipoAmpliado: data.equipo_ampliado
      };
    } catch (error) {
      console.error('Error adding profesional:', error);
      throw error;
    }
  },

  actualizarProfesional: async (id: string, profesionalActualizado: Partial<Profesional>) => {
    try {
      const updateData: any = {};
      
      if (profesionalActualizado.nombre !== undefined) updateData.nombre = profesionalActualizado.nombre;
      if (profesionalActualizado.apellido !== undefined) updateData.apellido = profesionalActualizado.apellido;
      if (profesionalActualizado.cargo !== undefined) updateData.profesion = profesionalActualizado.cargo;
      if (profesionalActualizado.especialidad !== undefined) updateData.especialidad = profesionalActualizado.especialidad;
      if (profesionalActualizado.telefono !== undefined) updateData.telefono = profesionalActualizado.telefono;
      if (profesionalActualizado.email !== undefined) updateData.email = profesionalActualizado.email;
      if (profesionalActualizado.fechaIngreso !== undefined) updateData.fecha_ingreso = profesionalActualizado.fechaIngreso;
      if (profesionalActualizado.fechaNacimiento !== undefined) updateData.fecha_nacimiento = profesionalActualizado.fechaNacimiento;
      if (profesionalActualizado.estado !== undefined) updateData.activo = profesionalActualizado.estado === 'activo';
      if (profesionalActualizado.experiencia !== undefined) updateData.experiencia = profesionalActualizado.experiencia;
      if (profesionalActualizado.certificaciones !== undefined) updateData.certificaciones = profesionalActualizado.certificaciones;
      if (profesionalActualizado.equipoAmpliado !== undefined) updateData.equipo_ampliado = profesionalActualizado.equipoAmpliado;

      console.log('Actualizando profesional ID:', id, 'con datos:', updateData);

      const { data, error } = await supabase
        .from('equipo')
        .update(updateData)
        .eq('id', id)
        .select();
      
      if (error) {
        console.error('Error de Supabase:', error);
        throw error;
      }
      
      console.log('Resultado de actualización:', data);
    } catch (error) {
      console.error('Error updating profesional:', error);
      throw error;
    }
  },

  eliminarProfesional: async (id: string) => {
    try {
      const { error } = await supabase
        .from('equipo')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting profesional:', error);
      throw error;
    }
  }
};

export type { Profesional };