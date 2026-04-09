import { supabase } from "@/integrations/supabase/client";

/**
 * Script para eliminar duplicados del equipo de trabajo
 * Ejecutar una sola vez desde la consola del navegador:
 * 
 * import('./scripts/limpiarDuplicadosEquipo').then(m => m.limpiarDuplicados())
 */
export async function limpiarDuplicados() {
  console.log('🔄 Iniciando limpieza de duplicados...');
  
  // IDs de los registros antiguos/duplicados a eliminar
  const idsAEliminar = [
    'fb707f75-9350-4f83-97c3-240996f64a61',  // Ana García antigua (Voluntariado)
    'a3452585-e651-4d19-b536-a4aeafc5d729',  // Carlos Martínez antiguo
    'a5b9c186-ba7e-4118-8df0-deb965f582e3',  // Laura Fernández antigua (Coordinador/a)
    '108acbb5-3108-4878-b176-925511760886'   // María Rodríguez antigua (Operador/a)
  ];
  
  try {
    for (const id of idsAEliminar) {
      console.log(`Eliminando registro: ${id}`);
      const { error } = await supabase
        .from('equipo')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error(`❌ Error eliminando ${id}:`, error);
      } else {
        console.log(`✅ Registro ${id} eliminado`);
      }
    }
    
    console.log('✨ Limpieza completada!');
    console.log('Recarga la página para ver los cambios.');
    
    return { success: true, message: 'Duplicados eliminados correctamente' };
  } catch (error) {
    console.error('❌ Error en la limpieza:', error);
    return { success: false, error };
  }
}

// Para ejecutar desde la consola:
// (window as any).limpiarDuplicadosEquipo = limpiarDuplicados;
