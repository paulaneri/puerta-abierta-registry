-- Crear tabla de nacionalidades
CREATE TABLE public.nacionalidades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  activa BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.nacionalidades ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS
CREATE POLICY "Nacionalidades son visibles para usuarios autenticados" 
ON public.nacionalidades 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Solo administradores pueden crear nacionalidades" 
ON public.nacionalidades 
FOR INSERT 
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Solo administradores pueden actualizar nacionalidades" 
ON public.nacionalidades 
FOR UPDATE 
USING (is_admin(auth.uid()));

CREATE POLICY "Solo administradores pueden eliminar nacionalidades" 
ON public.nacionalidades 
FOR DELETE 
USING (is_admin(auth.uid()));

-- Crear trigger para updated_at
CREATE TRIGGER update_nacionalidades_updated_at
BEFORE UPDATE ON public.nacionalidades
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insertar nacionalidades predeterminadas
INSERT INTO public.nacionalidades (nombre) VALUES
  ('Argentina'),
  ('Bolivia'),
  ('Brasil'),
  ('Chile'),
  ('Colombia'),
  ('Ecuador'),
  ('Paraguay'),
  ('Perú'),
  ('Uruguay'),
  ('Venezuela'),
  ('España'),
  ('Italia'),
  ('Francia'),
  ('Alemania'),
  ('Portugal'),
  ('Ucrania'),
  ('Rusia'),
  ('China'),
  ('Japón'),
  ('Corea del Sur'),
  ('Estados Unidos'),
  ('Canadá'),
  ('México'),
  ('Cuba'),
  ('República Dominicana'),
  ('Haití'),
  ('Jamaica'),
  ('Marruecos'),
  ('Senegal'),
  ('Nigeria'),
  ('Ghana'),
  ('Sudáfrica'),
  ('Otro');