-- Agregar campos JSON para almacenar información compleja del Centro de Día
ALTER TABLE public.centro_dia 
ADD COLUMN mujeres_asistieron JSONB DEFAULT '[]'::jsonb,
ADD COLUMN llamadas_recibidas JSONB DEFAULT '[]'::jsonb,
ADD COLUMN llamadas_hechas JSONB DEFAULT '[]'::jsonb,
ADD COLUMN tramites JSONB DEFAULT '[]'::jsonb,
ADD COLUMN articulacion_instituciones TEXT DEFAULT '',
ADD COLUMN trabajo_campo_resumen TEXT DEFAULT '';