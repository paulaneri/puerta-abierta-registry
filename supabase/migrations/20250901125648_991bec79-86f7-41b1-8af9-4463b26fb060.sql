-- Agregar campo para origen de registro a la tabla mujeres
ALTER TABLE public.mujeres 
ADD COLUMN IF NOT EXISTS origen_registro text CHECK (origen_registro IN ('trabajo-campo', 'centro-dia', 'derivacion'));