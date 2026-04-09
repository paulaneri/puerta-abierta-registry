
-- Agregar campos de vivienda, salud y aportes a la tabla mujeres
ALTER TABLE public.mujeres
  ADD COLUMN IF NOT EXISTS vivienda_tipo text,
  ADD COLUMN IF NOT EXISTS vivienda_contrato text,
  ADD COLUMN IF NOT EXISTS ayuda_habitacional text,
  ADD COLUMN IF NOT EXISTS cobertura_salud text,
  ADD COLUMN IF NOT EXISTS aporte_previsional text;
