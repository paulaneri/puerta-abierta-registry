-- Add priority column to actividades table
ALTER TABLE public.actividades 
ADD COLUMN prioridad text DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.actividades.prioridad IS 'Priority level: alta, media, baja';