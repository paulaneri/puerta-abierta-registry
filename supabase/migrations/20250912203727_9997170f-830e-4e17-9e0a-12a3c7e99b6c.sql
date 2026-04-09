-- Crear tabla para gestionar cargos/profesiones
CREATE TABLE public.cargos_profesionales (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre text NOT NULL UNIQUE,
  descripcion text,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.cargos_profesionales ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
CREATE POLICY "Cargos son visibles para usuarios autenticados" 
ON public.cargos_profesionales 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Solo administradores pueden crear cargos" 
ON public.cargos_profesionales 
FOR INSERT 
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Solo administradores pueden actualizar cargos" 
ON public.cargos_profesionales 
FOR UPDATE 
USING (is_admin(auth.uid()));

CREATE POLICY "Solo administradores pueden eliminar cargos" 
ON public.cargos_profesionales 
FOR DELETE 
USING (is_admin(auth.uid()));

-- Trigger para updated_at
CREATE TRIGGER update_cargos_profesionales_updated_at
BEFORE UPDATE ON public.cargos_profesionales
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insertar cargos iniciales
INSERT INTO public.cargos_profesionales (nombre, descripcion) VALUES
('Psicólogo/a', 'Profesional especializado en salud mental y bienestar psicológico'),
('Trabajador/a Social', 'Profesional especializado en intervención social y comunitaria'),
('Terapeuta Ocupacional', 'Profesional especializado en rehabilitación y actividades terapéuticas'),
('Educador/a Social', 'Profesional especializado en educación social y comunitaria'),
('Coordinador/a', 'Profesional encargado de coordinar equipos y actividades'),
('Auxiliar de Apoyo', 'Profesional de apoyo en actividades diarias y administrativas'),
('Enfermero/a', 'Profesional especializado en cuidados de salud y enfermería'),
('Nutricionista', 'Profesional especializado en alimentación y nutrición'),
('Recreacionista', 'Profesional especializado en actividades recreativas y lúdicas');