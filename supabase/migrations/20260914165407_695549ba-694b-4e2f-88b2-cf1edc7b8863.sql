ALTER TABLE public.trabajo_campo
ADD COLUMN IF NOT EXISTS ubicaciones jsonb NOT NULL DEFAULT '[]'::jsonb;