-- Add literacy field to mujeres table
ALTER TABLE public.mujeres ADD COLUMN alfabetizada boolean DEFAULT false;

-- Add fields for procedures (trámites) and calls tracking
ALTER TABLE public.mujeres ADD COLUMN tramites_realizados text[];
ALTER TABLE public.mujeres ADD COLUMN llamadas_recibidas integer DEFAULT 0;
ALTER TABLE public.mujeres ADD COLUMN llamadas_realizadas integer DEFAULT 0;