-- Add missing fields to equipo table for compatibility with equipoStore
ALTER TABLE public.equipo 
ADD COLUMN IF NOT EXISTS fecha_ingreso date,
ADD COLUMN IF NOT EXISTS experiencia text,
ADD COLUMN IF NOT EXISTS certificaciones text[];

-- Add index for better performance on certificaciones array
CREATE INDEX IF NOT EXISTS idx_equipo_certificaciones ON public.equipo USING GIN(certificaciones);

-- Update the trigger for updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_equipo_updated_at
  BEFORE UPDATE ON public.equipo
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();