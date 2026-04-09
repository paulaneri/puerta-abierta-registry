-- Add missing fields to equipo table for compatibility with equipoStore
ALTER TABLE public.equipo 
ADD COLUMN IF NOT EXISTS fecha_ingreso date,
ADD COLUMN IF NOT EXISTS experiencia text,
ADD COLUMN IF NOT EXISTS certificaciones text[];

-- Add index for better performance on certificaciones array
CREATE INDEX IF NOT EXISTS idx_equipo_certificaciones ON public.equipo USING GIN(certificaciones);

-- Drop existing trigger if it exists and recreate
DROP TRIGGER IF EXISTS update_equipo_updated_at ON public.equipo;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_equipo_updated_at
  BEFORE UPDATE ON public.equipo
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();