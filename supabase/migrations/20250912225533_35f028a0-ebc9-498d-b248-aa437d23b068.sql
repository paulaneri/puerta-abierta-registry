-- Crear enum para los roles de reunión
CREATE TYPE public.rol_reunion AS ENUM ('reflexion', 'coordinacion', 'acta');

-- Crear tabla para las reuniones semanales
CREATE TABLE public.reuniones_semanales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fecha DATE NOT NULL,
  semana_numero INTEGER NOT NULL,
  ano INTEGER NOT NULL,
  estado TEXT NOT NULL DEFAULT 'planificada', -- planificada, realizada, cancelada
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(semana_numero, ano)
);

-- Crear tabla para asignaciones de roles
CREATE TABLE public.asignaciones_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reunion_id UUID NOT NULL REFERENCES public.reuniones_semanales(id) ON DELETE CASCADE,
  profesional_id UUID NOT NULL REFERENCES public.equipo(id) ON DELETE CASCADE,
  rol public.rol_reunion NOT NULL,
  presente BOOLEAN NOT NULL DEFAULT true,
  suplente_id UUID REFERENCES public.equipo(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(reunion_id, rol), -- Un rol por reunión
  UNIQUE(reunion_id, profesional_id) -- Una persona no puede tener múltiples roles en la misma reunión
);

-- Habilitar RLS
ALTER TABLE public.reuniones_semanales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asignaciones_roles ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS
CREATE POLICY "Usuarios autenticados pueden ver reuniones" 
ON public.reuniones_semanales 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuarios autenticados pueden crear reuniones" 
ON public.reuniones_semanales 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuarios autenticados pueden actualizar reuniones" 
ON public.reuniones_semanales 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Solo administradores pueden eliminar reuniones" 
ON public.reuniones_semanales 
FOR DELETE 
USING (is_admin(auth.uid()));

CREATE POLICY "Usuarios autenticados pueden ver asignaciones" 
ON public.asignaciones_roles 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuarios autenticados pueden crear asignaciones" 
ON public.asignaciones_roles 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuarios autenticados pueden actualizar asignaciones" 
ON public.asignaciones_roles 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Solo administradores pueden eliminar asignaciones" 
ON public.asignaciones_roles 
FOR DELETE 
USING (is_admin(auth.uid()));

-- Crear función para actualizar timestamps
CREATE TRIGGER update_reuniones_updated_at
BEFORE UPDATE ON public.reuniones_semanales
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_asignaciones_updated_at
BEFORE UPDATE ON public.asignaciones_roles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();