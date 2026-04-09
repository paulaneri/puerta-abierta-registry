-- Verificar y crear políticas RLS para buckets de storage
-- Política para ver archivos de gastos
CREATE POLICY "Users can view gastos documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'gastos-documentos' AND auth.uid() IS NOT NULL);

-- Política para subir archivos de gastos  
CREATE POLICY "Users can upload gastos documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'gastos-documentos' AND auth.uid() IS NOT NULL);

-- Política para actualizar archivos de gastos
CREATE POLICY "Users can update gastos documents" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'gastos-documentos' AND auth.uid() IS NOT NULL);

-- Política para borrar archivos de gastos
CREATE POLICY "Users can delete gastos documents" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'gastos-documentos' AND auth.uid() IS NOT NULL);

-- Política para ver archivos de mujeres
CREATE POLICY "Users can view mujeres documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'mujeres-documentos' AND auth.uid() IS NOT NULL);

-- Política para subir archivos de mujeres
CREATE POLICY "Users can upload mujeres documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'mujeres-documentos' AND auth.uid() IS NOT NULL);

-- Política para actualizar archivos de mujeres
CREATE POLICY "Users can update mujeres documents" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'mujeres-documentos' AND auth.uid() IS NOT NULL);

-- Política para borrar archivos de mujeres
CREATE POLICY "Users can delete mujeres documents" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'mujeres-documentos' AND auth.uid() IS NOT NULL);