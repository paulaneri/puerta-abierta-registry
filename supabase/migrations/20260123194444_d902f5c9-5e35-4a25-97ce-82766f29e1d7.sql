-- Create table for activities/tasks (Trello-style board)
CREATE TABLE public.actividades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  estado TEXT NOT NULL DEFAULT 'planificado' CHECK (estado IN ('planificado', 'en_progreso', 'en_curso', 'completado')),
  fecha_limite DATE,
  responsable_id UUID REFERENCES public.equipo(id) ON DELETE SET NULL,
  creado_por UUID NOT NULL,
  orden INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.actividades ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Everyone authenticated can view all activities
CREATE POLICY "Usuarios autenticados pueden ver actividades"
ON public.actividades
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Users can create activities (they become the creator)
CREATE POLICY "Usuarios autenticados pueden crear actividades"
ON public.actividades
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND creado_por = auth.uid());

-- Users can update their own activities OR if they are admin/coordinator
CREATE POLICY "Usuarios pueden actualizar sus actividades o admins"
ON public.actividades
FOR UPDATE
USING (
  creado_por = auth.uid() 
  OR is_admin(auth.uid())
  OR EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'coordinador'
  )
);

-- Only creator or admin can delete
CREATE POLICY "Creador o admin pueden eliminar actividades"
ON public.actividades
FOR DELETE
USING (
  creado_por = auth.uid() 
  OR is_admin(auth.uid())
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_actividades_updated_at
BEFORE UPDATE ON public.actividades
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance on common queries
CREATE INDEX idx_actividades_estado ON public.actividades(estado);
CREATE INDEX idx_actividades_responsable ON public.actividades(responsable_id);
CREATE INDEX idx_actividades_creado_por ON public.actividades(creado_por);