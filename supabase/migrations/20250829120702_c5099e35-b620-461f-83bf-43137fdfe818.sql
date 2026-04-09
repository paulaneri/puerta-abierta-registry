-- Add acompanamientos column to mujeres table to store accompaniment data
ALTER TABLE public.mujeres 
ADD COLUMN acompanamientos JSONB DEFAULT '[]'::jsonb;