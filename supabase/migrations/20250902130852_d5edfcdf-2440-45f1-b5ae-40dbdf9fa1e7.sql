-- Crear bucket para documentos de gastos
INSERT INTO storage.buckets (id, name, public) VALUES ('gastos-documentos', 'gastos-documentos', false);

-- Crear políticas para el bucket gastos-documentos
CREATE POLICY "Usuarios autenticados pueden ver documentos de gastos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'gastos-documentos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Usuarios autenticados pueden subir documentos de gastos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'gastos-documentos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Usuarios autenticados pueden actualizar documentos de gastos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'gastos-documentos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Usuarios autenticados pueden eliminar documentos de gastos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'gastos-documentos' AND auth.uid() IS NOT NULL);

-- Agregar campo para documentos adjuntos en la tabla gastos
ALTER TABLE public.gastos 
ADD COLUMN IF NOT EXISTS documentos_adjuntos jsonb DEFAULT '[]'::jsonb;