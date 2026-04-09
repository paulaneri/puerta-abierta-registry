-- Add documentos column to mujeres table
ALTER TABLE public.mujeres ADD COLUMN IF NOT EXISTS documentos jsonb DEFAULT '[]'::jsonb;