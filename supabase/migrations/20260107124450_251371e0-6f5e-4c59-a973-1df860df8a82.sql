-- Tabla para almacenar la disponibilidad de participantes por fecha de reunión
CREATE TABLE public.disponibilidad_reuniones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reunion_id UUID NOT NULL REFERENCES public.reuniones_semanales(id) ON DELETE CASCADE,
  profesional_id UUID NOT NULL REFERENCES public.equipo(id) ON DELETE CASCADE,
  disponible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(reunion_id, profesional_id)
);

-- Enable RLS
ALTER TABLE public.disponibilidad_reuniones ENABLE ROW LEVEL SECURITY;

-- Policies for disponibilidad_reuniones (same pattern as other tables)
CREATE POLICY "Authenticated users can view disponibilidad" 
ON public.disponibilidad_reuniones 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert disponibilidad" 
ON public.disponibilidad_reuniones 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update disponibilidad" 
ON public.disponibilidad_reuniones 
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete disponibilidad" 
ON public.disponibilidad_reuniones 
FOR DELETE 
TO authenticated
USING (true);

-- Add numero_acta column to reuniones_semanales
ALTER TABLE public.reuniones_semanales 
ADD COLUMN numero_acta INTEGER;

-- Add motivo_cancelacion column to reuniones_semanales
ALTER TABLE public.reuniones_semanales 
ADD COLUMN motivo_cancelacion TEXT;

-- Create trigger for updated_at on disponibilidad_reuniones
CREATE TRIGGER update_disponibilidad_reuniones_updated_at
BEFORE UPDATE ON public.disponibilidad_reuniones
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();