-- Add encuentros field to trabajo_campo table to store encounters with women
ALTER TABLE public.trabajo_campo 
ADD COLUMN encuentros JSONB DEFAULT '[]'::jsonb;