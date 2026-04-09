import { type RolReunion } from "@/lib/reunionesStore";
import { type Profesional } from "@/lib/equipoStore";

interface AsignacionRol {
  reunion_id: string;
  profesional_id: string;
  rol: RolReunion;
}

interface ReunionParaAsignar {
  id: string;
  semana_numero: number;
  asignaciones: AsignacionRol[];
}



/**
 * Calcula las asignaciones automáticas de roles siguiendo las reglas:
 * 1. Si una persona tiene "acta" una semana, no puede tener "reflexión" ni "coordinación" la semana siguiente
 * 2. No tendrá el mismo rol hasta que hayan pasado todos los participantes por ese rol
 * 3. Primera prioridad: Participantes que no tuvieron ningún rol la semana anterior
 * 4. Segunda prioridad: Participantes que no tuvieron el mismo rol específico
 */
export const calcularAsignacionesAutomaticas = (
  reuniones: ReunionParaAsignar[],
  profesionales: Profesional[],
  disponibilidadPorReunion: Map<string, Set<string>>,
  reunionDesde?: string // ID de la reunión desde la cual recalcular
): Map<string, { reflexion: string; coordinacion: string; acta: string }> => {
  const resultado = new Map<string, { reflexion: string; coordinacion: string; acta: string }>();
  
  if (profesionales.length === 0) return resultado;
  
  // Ordenar reuniones por semana
  const reunionesOrdenadas = [...reuniones].sort((a, b) => a.semana_numero - b.semana_numero);
  
  // Encontrar el índice desde donde empezar
  let startIndex = 0;
  if (reunionDesde) {
    const idx = reunionesOrdenadas.findIndex(r => r.id === reunionDesde);
    if (idx > 0) startIndex = idx;
  }
  
  // Historial de asignaciones: profesionalId -> array de {semana, rol}
  const historial: Map<string, { semana: number; rol: RolReunion }[]> = new Map();
  profesionales.forEach(p => historial.set(p.id, []));
  
  // Procesar reuniones anteriores para construir historial
  for (let i = 0; i < startIndex; i++) {
    const reunion = reunionesOrdenadas[i];
    reunion.asignaciones.forEach(a => {
      const hist = historial.get(a.profesional_id);
      if (hist) {
        hist.push({ semana: reunion.semana_numero, rol: a.rol });
      }
    });
  }
  
  // Contadores de veces que cada profesional ha tenido cada rol
  const contadorRoles: Map<string, Map<RolReunion, number>> = new Map();
  profesionales.forEach(p => {
    contadorRoles.set(p.id, new Map([['reflexion', 0], ['coordinacion', 0], ['acta', 0]]));
  });
  
  // Inicializar contadores con el historial existente
  historial.forEach((asigs, profId) => {
    asigs.forEach(a => {
      const contador = contadorRoles.get(profId);
      if (contador) {
        contador.set(a.rol, (contador.get(a.rol) || 0) + 1);
      }
    });
  });
  
  // Asignar roles desde startIndex
  for (let i = startIndex; i < reunionesOrdenadas.length; i++) {
    const reunion = reunionesOrdenadas[i];
    const reunionAnterior = i > 0 ? reunionesOrdenadas[i - 1] : null;
    
    // Obtener profesionales disponibles para esta reunión.
    // Regla:
    // - Si existe disponibilidad explícita para la reunión, usar SOLO ese subconjunto
    // - Si no hay registros (no se cargó/definió disponibilidad), asumir todo el equipo disponible
    const disponiblesSet = disponibilidadPorReunion.get(reunion.id);
    const profesionalesDisponibles = disponiblesSet
      ? profesionales.filter(p => disponiblesSet.has(p.id))
      : profesionales;
    
    if (profesionalesDisponibles.length === 0) continue;
    
    const asignacionReunion: { reflexion: string; coordinacion: string; acta: string } = {
      reflexion: '',
      coordinacion: '',
      acta: ''
    };

    // Prefijar asignaciones existentes (si las hay) y tratarlas como “fijas”
    // para que el recalculado solo complete los huecos.
    const asignadosEstaReunion = new Set<string>();
    reunion.asignaciones.forEach(a => {
      if (!asignacionReunion[a.rol]) {
        asignacionReunion[a.rol] = a.profesional_id;
        asignadosEstaReunion.add(a.profesional_id);

        // Contabilizar también estas asignaciones fijas para mantener la rotación justa.
        const contador = contadorRoles.get(a.profesional_id);
        if (contador) {
          contador.set(a.rol, (contador.get(a.rol) || 0) + 1);
        }
      }
    });
    
    // Obtener quién tuvo cada rol en la reunión anterior
    let tuvoActaAnterior: string | null = null;
    let tuvoReflexionAnterior: string | null = null;
    let tuvoCoordinacionAnterior: string | null = null;
    
    if (reunionAnterior) {
      const asigAnterior = resultado.get(reunionAnterior.id);
      if (asigAnterior) {
        tuvoActaAnterior = asigAnterior.acta || null;
        tuvoReflexionAnterior = asigAnterior.reflexion || null;
        tuvoCoordinacionAnterior = asigAnterior.coordinacion || null;
      } else {
        const asigActa = reunionAnterior.asignaciones.find(a => a.rol === 'acta');
        const asigReflexion = reunionAnterior.asignaciones.find(a => a.rol === 'reflexion');
        const asigCoordinacion = reunionAnterior.asignaciones.find(a => a.rol === 'coordinacion');
        if (asigActa) tuvoActaAnterior = asigActa.profesional_id;
        if (asigReflexion) tuvoReflexionAnterior = asigReflexion.profesional_id;
        if (asigCoordinacion) tuvoCoordinacionAnterior = asigCoordinacion.profesional_id;
      }
    }
    
    // Obtener quién tuvo cualquier rol en la reunión anterior
    const tuvoRolAnterior = new Set<string>();
    if (tuvoActaAnterior) tuvoRolAnterior.add(tuvoActaAnterior);
    if (tuvoReflexionAnterior) tuvoRolAnterior.add(tuvoReflexionAnterior);
    if (tuvoCoordinacionAnterior) tuvoRolAnterior.add(tuvoCoordinacionAnterior);
    
    // Mapa de rol anterior por persona
    const rolAnteriorPorPersona = new Map<string, RolReunion>();
    if (tuvoActaAnterior) rolAnteriorPorPersona.set(tuvoActaAnterior, 'acta');
    if (tuvoReflexionAnterior) rolAnteriorPorPersona.set(tuvoReflexionAnterior, 'reflexion');
    if (tuvoCoordinacionAnterior) rolAnteriorPorPersona.set(tuvoCoordinacionAnterior, 'coordinacion');
    
    // Asignar cada rol en orden específico: acta primero (porque tiene más restricciones)
    const rolesOrdenados: RolReunion[] = ['acta', 'coordinacion', 'reflexion'];
    
    for (const rol of rolesOrdenados) {
      // Si ya viene asignado (fijo), no lo recalculamos
      if (asignacionReunion[rol]) continue;

      // Filtrar candidatos con reglas estrictas
      const candidatosEstrictos = profesionalesDisponibles.filter(p => {
        // No puede estar ya asignado en esta reunión
        if (asignadosEstaReunion.has(p.id)) return false;
        
        // REGLA 1: No puede repetir el MISMO rol en dos reuniones consecutivas
        if (rolAnteriorPorPersona.get(p.id) === rol) return false;
        
        // REGLA 2 (ACTA): Si tuvo acta la semana anterior, no puede tener NINGÚN rol esta semana
        if ((rol === 'reflexion' || rol === 'coordinacion') && tuvoActaAnterior === p.id) {
          return false;
        }
        
        return true;
      });
      
      // Candidatos relajados (solo sin repetir mismo rol, pero sí permite tener rol si tuvo acta antes)
      const candidatosRelajados = profesionalesDisponibles.filter(p => {
        if (asignadosEstaReunion.has(p.id)) return false;
        // Solo evitar repetir el mismo rol
        if (rolAnteriorPorPersona.get(p.id) === rol) return false;
        return true;
      });
      
      // Fallback total: cualquiera que no esté asignado en esta reunión
      const candidatosFallback = profesionalesDisponibles.filter(p => !asignadosEstaReunion.has(p.id));

      // Último recurso: ampliar a TODO el equipo (ignorando disponibilidad explícita),
      // pero SIEMPRE evitando duplicar profesional dentro de la misma reunión.
      const candidatosUltimoRecurso = profesionales.filter(p => !asignadosEstaReunion.has(p.id));

      // Elegir el conjunto de candidatos a usar
      let candidatos = candidatosEstrictos;
      if (candidatos.length === 0) candidatos = candidatosRelajados;
      if (candidatos.length === 0) candidatos = candidatosFallback;
      if (candidatos.length === 0) candidatos = candidatosUltimoRecurso;

      if (candidatos.length === 0) {
        // Si no hay candidatos sin duplicar, no podemos asignar 3 roles distintos.
        continue;
      }
      
      if (candidatos.length === 0) {
        // Caso extremo: no hay profesionales (imposible asignar)
        continue;
      }
      
      // Ordenar candidatos por prioridad
      candidatos.sort((a, b) => {
        // Primera prioridad: quien no tuvo rol la semana anterior
        const tuvoPrevA = tuvoRolAnterior.has(a.id) ? 1 : 0;
        const tuvoPrevB = tuvoRolAnterior.has(b.id) ? 1 : 0;
        if (tuvoPrevA !== tuvoPrevB) return tuvoPrevA - tuvoPrevB;
        
        // Segunda prioridad: quien menos veces ha tenido este rol específico
        const countA = contadorRoles.get(a.id)?.get(rol) || 0;
        const countB = contadorRoles.get(b.id)?.get(rol) || 0;
        return countA - countB;
      });
      
      const seleccionado = candidatos[0];
      asignacionReunion[rol] = seleccionado.id;
      asignadosEstaReunion.add(seleccionado.id);
      
      // Actualizar contador
      const contador = contadorRoles.get(seleccionado.id);
      if (contador) {
        contador.set(rol, (contador.get(rol) || 0) + 1);
      }
    }
    
    resultado.set(reunion.id, asignacionReunion);
    
    // Actualizar historial
    Object.entries(asignacionReunion).forEach(([rol, profId]) => {
      if (profId) {
        const hist = historial.get(profId);
        if (hist) {
          hist.push({ semana: reunion.semana_numero, rol: rol as RolReunion });
        }
      }
    });
  }
  
  return resultado;
};

/**
 * Obtiene el mejor candidato para reemplazar un rol eliminado
 */
export const obtenerMejorCandidatoParaRol = (
  rol: RolReunion,
  reunionActual: ReunionParaAsignar,
  reunionAnterior: ReunionParaAsignar | null,
  profesionales: Profesional[],
  profesionalesExcluidos: string[],
  historialAsignaciones: Map<string, { semana: number; rol: RolReunion }[]>
): string | null => {
  const candidatos = profesionales.filter(p => !profesionalesExcluidos.includes(p.id));
  
  if (candidatos.length === 0) return null;
  
  // Quien tuvo acta en la reunión anterior
  let tuvoActaAnterior: string | null = null;
  if (reunionAnterior) {
    const asigActa = reunionAnterior.asignaciones.find(a => a.rol === 'acta');
    if (asigActa) tuvoActaAnterior = asigActa.profesional_id;
  }
  
  // Quien tuvo cualquier rol la semana anterior
  const tuvoRolAnterior = new Set<string>();
  if (reunionAnterior) {
    reunionAnterior.asignaciones.forEach(a => tuvoRolAnterior.add(a.profesional_id));
  }
  
  // Filtrar y ordenar candidatos
  const candidatosFiltrados = candidatos.filter(p => {
    // Regla del Acta: Si tuvo acta la semana anterior, no puede tener reflexión ni coordinación
    if ((rol === 'reflexion' || rol === 'coordinacion') && tuvoActaAnterior === p.id) {
      return false;
    }
    return true;
  });
  
  if (candidatosFiltrados.length === 0) {
    return candidatos[0]?.id || null;
  }
  
  // Ordenar por prioridad
  candidatosFiltrados.sort((a, b) => {
    // Primera prioridad: quien no tuvo rol la semana anterior
    const tuvoPrevA = tuvoRolAnterior.has(a.id) ? 1 : 0;
    const tuvoPrevB = tuvoRolAnterior.has(b.id) ? 1 : 0;
    if (tuvoPrevA !== tuvoPrevB) return tuvoPrevA - tuvoPrevB;
    
    // Segunda prioridad: quien menos veces ha tenido este rol
    const histA = historialAsignaciones.get(a.id) || [];
    const histB = historialAsignaciones.get(b.id) || [];
    const countA = histA.filter(h => h.rol === rol).length;
    const countB = histB.filter(h => h.rol === rol).length;
    return countA - countB;
  });
  
  return candidatosFiltrados[0]?.id || null;
};
