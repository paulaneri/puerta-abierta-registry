-- Crear tabla para duplas de acompañamiento
CREATE TABLE public.duplas_acompanamiento (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profesional1_id uuid NOT NULL,
  profesional2_id uuid NOT NULL,
  mujer_id uuid NULL,
  fecha_formacion date NOT NULL,
  observaciones text,
  activa boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Referencias a las tablas existentes
  FOREIGN KEY (profesional1_id) REFERENCES public.equipo(id) ON DELETE CASCADE,
  FOREIGN KEY (profesional2_id) REFERENCES public.equipo(id) ON DELETE CASCADE,
  FOREIGN KEY (mujer_id) REFERENCES public.mujeres(id) ON DELETE SET NULL
);

-- Habilitar RLS
ALTER TABLE public.duplas_acompanamiento ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Duplas son visibles para usuarios autenticados" 
ON public.duplas_acompanamiento 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuarios autenticados pueden crear duplas" 
ON public.duplas_acompanamiento 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuarios autenticados pueden actualizar duplas" 
ON public.duplas_acompanamiento 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuarios autenticados pueden eliminar duplas" 
ON public.duplas_acompanamiento 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Trigger para updated_at
CREATE TRIGGER update_duplas_acompanamiento_updated_at
BEFORE UPDATE ON public.duplas_acompanamiento
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para mejor rendimiento
CREATE INDEX idx_duplas_profesional1 ON public.duplas_acompanamiento(profesional1_id);
CREATE INDEX idx_duplas_profesional2 ON public.duplas_acompanamiento(profesional2_id);
CREATE INDEX idx_duplas_mujer ON public.duplas_acompanamiento(mujer_id);
CREATE INDEX idx_duplas_activa ON public.duplas_acompanamiento(activa);