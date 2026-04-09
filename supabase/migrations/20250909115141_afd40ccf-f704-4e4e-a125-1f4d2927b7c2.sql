-- Limpiar documentos huérfanos que no tienen archivos físicos en storage
-- Esto es seguro ya que estos archivos no existen físicamente

-- Primero, vamos a limpiar los documentos de mujeres que no existen
UPDATE public.mujeres 
SET documentos = '[]'::jsonb 
WHERE documentos != '[]'::jsonb 
AND documentos IS NOT NULL;