-- Agregar columna equipo_ampliado a la tabla equipo
ALTER TABLE public.equipo 
ADD COLUMN equipo_ampliado BOOLEAN NOT NULL DEFAULT false;