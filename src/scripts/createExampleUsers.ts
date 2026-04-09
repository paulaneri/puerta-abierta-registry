import { supabase } from '@/integrations/supabase/client';

// Script para crear usuarios de ejemplo
export const createExampleUsers = async () => {
  const exampleUsers = [
    {
      email: 'admin.test@example.com',
      nombre: 'María',
      apellido: 'González',
      role: 'administrador' as const,
      password: 'AdminTest123!'
    },
    {
      email: 'puertaabiertarecreando@gmail.com',
      nombre: 'Paula',
      apellido: 'Coordinadora', 
      role: 'coordinador' as const,
      password: 'CoordTest123!'
    },
    {
      email: 'comunicacion@puertaabiertarecreando.org.ar',
      nombre: 'Comunicación',
      apellido: 'Trabajador',
      role: 'trabajador' as const,
      password: 'TrabTest123!'
    }
  ];

  const results = [];

  for (const user of exampleUsers) {
    try {
      // Verificar si el usuario ya existe
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', user.email)
        .maybeSingle();

      if (existingUser) {
        console.log(`Usuario ${user.email} ya existe`);
        results.push({ 
          email: user.email, 
          success: true, 
          message: 'Usuario ya existe',
          credentials: `Email: ${user.email}, Password: ${user.password}`
        });
        continue;
      }

      // Crear usuario en auth con skipEmailConfirmation si es posible
      const { data: authData, error: authError } = await supabase.auth.signUp({
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

      if (authError) {
        // Si el error es que el usuario ya existe, intentar confirmarlo automáticamente
        if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
          console.log(`Usuario ${user.email} ya registrado, intentando confirmar...`);
          
          // El usuario existe pero no está confirmado, lo marcamos como éxito
          results.push({ 
            email: user.email, 
            success: true, 
            message: 'Usuario ya registrado (puede necesitar confirmación de email)',
            credentials: `Email: ${user.email}, Password: ${user.password}`
          });
          continue;
        } else {
          console.error(`Error creando usuario ${user.email}:`, authError);
          results.push({ email: user.email, success: false, error: authError.message });
          continue;
        }
      }

      if (authData.user) {
        // Intentar asignar rol específico
        const { error: roleError } = await supabase
          .from('user_roles')
          .upsert({ 
            user_id: authData.user.id, 
            role: user.role 
          }, { 
            onConflict: 'user_id' 
          });

        if (roleError) {
          console.error(`Error asignando rol a ${user.email}:`, roleError);
          // Aún así lo marcamos como éxito parcial
          results.push({ 
            email: user.email, 
            success: true, 
            role: user.role,
            warning: 'Usuario creado pero error asignando rol',
            credentials: `Email: ${user.email}, Password: ${user.password}`
          });
        } else {
          results.push({ 
            email: user.email, 
            success: true, 
            role: user.role,
            credentials: `Email: ${user.email}, Password: ${user.password}`
          });
        }
      } else {
        results.push({ 
          email: user.email, 
          success: false, 
          error: 'No se pudo crear el usuario'
        });
      }
    } catch (error) {
      console.error(`Error general con usuario ${user.email}:`, error);
      results.push({ email: user.email, success: false, error: 'Error general' });
    }
  }

  return results;
};