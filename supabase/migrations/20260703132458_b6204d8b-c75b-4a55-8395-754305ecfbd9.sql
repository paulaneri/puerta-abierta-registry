
-- ============ EVENTOS ============
DROP POLICY IF EXISTS "Cualquiera puede crear eventos" ON public.eventos;
DROP POLICY IF EXISTS "Cualquiera puede actualizar eventos" ON public.eventos;
DROP POLICY IF EXISTS "Cualquiera puede eliminar eventos" ON public.eventos;
DROP POLICY IF EXISTS "Eventos son visibles para todos" ON public.eventos;

CREATE POLICY "Authenticated users can view eventos"
  ON public.eventos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert eventos"
  ON public.eventos FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update eventos"
  ON public.eventos FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete eventos"
  ON public.eventos FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- ============ DISPONIBILIDAD REUNIONES ============
DROP POLICY IF EXISTS "Authenticated users can insert disponibilidad" ON public.disponibilidad_reuniones;
DROP POLICY IF EXISTS "Authenticated users can update disponibilidad" ON public.disponibilidad_reuniones;
DROP POLICY IF EXISTS "Authenticated users can delete disponibilidad" ON public.disponibilidad_reuniones;

CREATE POLICY "Authorized users can insert disponibilidad"
  ON public.disponibilidad_reuniones FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(),'administrador')
    OR public.has_role(auth.uid(),'coordinador')
    OR public.has_role(auth.uid(),'trabajador')
  );

CREATE POLICY "Authorized users can update disponibilidad"
  ON public.disponibilidad_reuniones FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(),'administrador')
    OR public.has_role(auth.uid(),'coordinador')
    OR public.has_role(auth.uid(),'trabajador')
  );

CREATE POLICY "Authorized users can delete disponibilidad"
  ON public.disponibilidad_reuniones FOR DELETE
  TO authenticated
  USING (
    public.has_role(auth.uid(),'administrador')
    OR public.has_role(auth.uid(),'coordinador')
  );

-- ============ PROFILES ============
DROP POLICY IF EXISTS "Los usuarios pueden ver todos los perfiles" ON public.profiles;

CREATE POLICY "Users can view their own profile or admins view all"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR public.is_admin(auth.uid()));

-- ============ STORAGE: gastos-documentos ============
DROP POLICY IF EXISTS "Users can view their gastos documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload gastos documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update gastos documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete gastos documents" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver documentos de gastos" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios autenticados pueden subir documentos de gastos" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar documentos de gastos" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar documentos de gastos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view gastos-documentos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to gastos-documentos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update gastos-documentos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete gastos-documentos" ON storage.objects;

CREATE POLICY "Gastos docs: admin/coord can view"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'gastos-documentos'
    AND (public.has_role(auth.uid(),'administrador') OR public.has_role(auth.uid(),'coordinador'))
  );

CREATE POLICY "Gastos docs: admin/coord can upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'gastos-documentos'
    AND (public.has_role(auth.uid(),'administrador') OR public.has_role(auth.uid(),'coordinador'))
  );

CREATE POLICY "Gastos docs: admin/coord can update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'gastos-documentos'
    AND (public.has_role(auth.uid(),'administrador') OR public.has_role(auth.uid(),'coordinador'))
  );

CREATE POLICY "Gastos docs: admin/coord can delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'gastos-documentos'
    AND (public.has_role(auth.uid(),'administrador') OR public.has_role(auth.uid(),'coordinador'))
  );

-- ============ STORAGE: mujeres-documentos ============
DROP POLICY IF EXISTS "Users can view mujeres documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload mujeres documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update mujeres documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete mujeres documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view mujeres-documentos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to mujeres-documentos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update mujeres-documentos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete mujeres-documentos" ON storage.objects;

CREATE POLICY "Mujeres docs: authorized can view"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'mujeres-documentos'
    AND public.is_authorized_for_mujeres(auth.uid())
  );

CREATE POLICY "Mujeres docs: authorized can upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'mujeres-documentos'
    AND public.is_authorized_for_mujeres(auth.uid())
  );

CREATE POLICY "Mujeres docs: authorized can update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'mujeres-documentos'
    AND public.is_authorized_for_mujeres(auth.uid())
  );

CREATE POLICY "Mujeres docs: authorized can delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'mujeres-documentos'
    AND public.is_authorized_for_mujeres(auth.uid())
  );

-- ============ FUNCTION SEARCH PATH ============
ALTER FUNCTION public.has_role(uuid, app_role) SET search_path = public;
ALTER FUNCTION public.is_admin(uuid) SET search_path = public;
ALTER FUNCTION public.create_example_user(text, text, app_role, text, text) SET search_path = public;

-- ============ REVOKE EXECUTE on internal function ============
REVOKE EXECUTE ON FUNCTION public.create_example_user(text, text, app_role, text, text) FROM anon, authenticated, PUBLIC;
