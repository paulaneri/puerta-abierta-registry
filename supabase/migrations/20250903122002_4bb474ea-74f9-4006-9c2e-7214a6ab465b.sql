-- Create storage buckets for gastos and mujeres documents
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('gastos-documentos', 'gastos-documentos', false),
  ('mujeres-documentos', 'mujeres-documentos', false)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for gastos-documentos bucket
CREATE POLICY "Users can view their gastos documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'gastos-documentos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can upload gastos documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'gastos-documentos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update gastos documents" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'gastos-documentos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete gastos documents" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'gastos-documentos' AND auth.uid() IS NOT NULL);

-- Create RLS policies for mujeres-documentos bucket
CREATE POLICY "Users can view mujeres documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'mujeres-documentos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can upload mujeres documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'mujeres-documentos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update mujeres documents" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'mujeres-documentos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete mujeres documents" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'mujeres-documentos' AND auth.uid() IS NOT NULL);