-- Políticas para el bucket gastos-documentos
-- Permitir que usuarios autenticados suban documentos
CREATE POLICY "Authenticated users can upload to gastos-documentos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'gastos-documentos');

-- Permitir que usuarios autenticados vean los documentos
CREATE POLICY "Authenticated users can view gastos-documentos"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'gastos-documentos');

-- Permitir que usuarios autenticados actualicen documentos
CREATE POLICY "Authenticated users can update gastos-documentos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'gastos-documentos');

-- Permitir que usuarios autenticados eliminen documentos
CREATE POLICY "Authenticated users can delete gastos-documentos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'gastos-documentos');

-- Políticas para el bucket mujeres-documentos (por si acaso)
CREATE POLICY "Authenticated users can upload to mujeres-documentos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'mujeres-documentos');

CREATE POLICY "Authenticated users can view mujeres-documentos"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'mujeres-documentos');

CREATE POLICY "Authenticated users can update mujeres-documentos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'mujeres-documentos');

CREATE POLICY "Authenticated users can delete mujeres-documentos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'mujeres-documentos');