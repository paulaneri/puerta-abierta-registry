import { supabase } from '@/integrations/supabase/client';

// Script directo para crear usuarios sin necesidad de estar logueado
export const directCreateUsers = async () => {
  const users = [
    {
      email: 'puertaabiertarecreando@gmail.com',
      password: 'CoordTest123!',
      role: 'coordinador' as const,
      nombre: 'Paula',
      apellido: 'Coordinadora'
    },
    {
      email: 'comunicacion@puertaabiertarecreando.org.ar',
      password: 'TrabTest123!',
      role: 'trabajador' as const,
      nombre: 'Comunicación',
      apellido: 'Trabajador'
    }
  ];

  console.log('Iniciando creación de usuarios...');
  
  for (const user of users) {
    try {
      console.log(`Creando usuario: ${user.email}`);
      
      const { data, error } = await supabase.auth.signUp({
        email: user.email,
        password: user.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            nombre: user.nombre,
            apellido: user.apellido,
            role: user.role
          }
        }
      });

      if (error) {
        console.error(`Error con ${user.email}:`, error.message);
      } else {
        console.log(`✅ Usuario ${user.email} creado exitosamente`);
        console.log(`Password: ${user.password}`);
      }
    } catch (error) {
      console.error(`Error general con ${user.email}:`, error);
    }
  }

  console.log('Proceso completado. Revisa los mensajes arriba para ver los resultados.');
};

// Ejecutar automáticamente cuando se importe
if (typeof window !== 'undefined') {
  // Solo ejecutar en el navegador
  setTimeout(() => {
    directCreateUsers();
  }, 1000);
}