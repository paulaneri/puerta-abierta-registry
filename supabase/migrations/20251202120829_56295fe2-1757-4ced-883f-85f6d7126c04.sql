-- Add new fields to mujeres table for additional participant information

-- Documentation fields
ALTER TABLE public.mujeres 
ADD COLUMN tiene_documentacion boolean DEFAULT false,
ADD COLUMN tipo_documentacion text;

-- Residency status for non-Argentine nationalities
ALTER TABLE public.mujeres 
ADD COLUMN tipo_residencia text;

-- Additional identification and contact fields
ALTER TABLE public.mujeres 
ADD COLUMN fecha_primer_contacto date,
ADD COLUMN descripcion_rasgos text,
ADD COLUMN parada_zona text,
ADD COLUMN persona_contacto_referencia text,
ADD COLUMN observaciones_historia text;

-- Add comments for documentation
COMMENT ON COLUMN public.mujeres.tiene_documentacion IS 'Indica si la participante tiene documentación';
COMMENT ON COLUMN public.mujeres.tipo_documentacion IS 'Información alfanumérica de documentación (DNI, Pasaporte, etc.)';
COMMENT ON COLUMN public.mujeres.tipo_residencia IS 'Tipo de residencia para extranjeras: Nacionalizada/Precaria/Residencia permanente';
COMMENT ON COLUMN public.mujeres.fecha_primer_contacto IS 'Fecha del primer contacto con la participante';
COMMENT ON COLUMN public.mujeres.descripcion_rasgos IS 'Rasgos o elementos que ayudan a identificar (sin juicios)';
COMMENT ON COLUMN public.mujeres.parada_zona IS 'Zona habitual / punto de encuentro';
COMMENT ON COLUMN public.mujeres.persona_contacto_referencia IS 'Persona de contacto / referencia';
COMMENT ON COLUMN public.mujeres.observaciones_historia IS 'Observaciones sobre su historia o contexto';