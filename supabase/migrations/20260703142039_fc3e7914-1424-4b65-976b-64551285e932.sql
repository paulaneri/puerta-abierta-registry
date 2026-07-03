
-- ============ DROP INSECURE FUNCTION ============
DROP FUNCTION IF EXISTS public.create_example_user(text, text, app_role, text, text);

-- ============ LOCK DOWN SECURITY DEFINER FUNCTIONS ============
-- Revoke default PUBLIC EXECUTE on all definer helpers; re-grant to authenticated
-- only where the app actually needs to call them (RLS helpers).
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_authorized_for_mujeres(uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_authorized_for_mujeres(uuid) TO authenticated;

-- Trigger-only helpers: no client should call these directly
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- ============ ACTIVIDADES: restrict read ============
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver actividades" ON public.actividades;
CREATE POLICY "Creador, admin o coordinador pueden ver actividades"
  ON public.actividades FOR SELECT
  TO authenticated
  USING (
    creado_por = auth.uid()
    OR public.is_admin(auth.uid())
    OR public.has_role(auth.uid(), 'coordinador')
  );

-- ============ ASIGNACIONES_ROLES: restrict writes ============
DROP POLICY IF EXISTS "Usuarios autenticados pueden crear asignaciones" ON public.asignaciones_roles;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar asignaciones" ON public.asignaciones_roles;
CREATE POLICY "Admin o coordinador pueden crear asignaciones"
  ON public.asignaciones_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'coordinador'));
CREATE POLICY "Admin o coordinador pueden actualizar asignaciones"
  ON public.asignaciones_roles FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'coordinador'));

-- ============ CONTACTOS: restrict all ops ============
DROP POLICY IF EXISTS "Authenticated users can view contactos" ON public.contactos;
DROP POLICY IF EXISTS "Authenticated users can create contactos" ON public.contactos;
DROP POLICY IF EXISTS "Authenticated users can update contactos" ON public.contactos;
DROP POLICY IF EXISTS "Authenticated users can delete contactos" ON public.contactos;
CREATE POLICY "Admin o coordinador pueden ver contactos"
  ON public.contactos FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'coordinador'));
CREATE POLICY "Admin o coordinador pueden crear contactos"
  ON public.contactos FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'coordinador'));
CREATE POLICY "Admin o coordinador pueden actualizar contactos"
  ON public.contactos FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'coordinador'));
CREATE POLICY "Admin o coordinador pueden eliminar contactos"
  ON public.contactos FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'coordinador'));

-- ============ DUPLAS_ACOMPANAMIENTO: mujeres-authorized only ============
DROP POLICY IF EXISTS "Duplas son visibles para usuarios autenticados" ON public.duplas_acompanamiento;
DROP POLICY IF EXISTS "Usuarios autenticados pueden crear duplas" ON public.duplas_acompanamiento;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar duplas" ON public.duplas_acompanamiento;
DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar duplas" ON public.duplas_acompanamiento;
CREATE POLICY "Autorizados mujeres pueden ver duplas"
  ON public.duplas_acompanamiento FOR SELECT TO authenticated
  USING (public.is_authorized_for_mujeres(auth.uid()));
CREATE POLICY "Autorizados mujeres pueden crear duplas"
  ON public.duplas_acompanamiento FOR INSERT TO authenticated
  WITH CHECK (public.is_authorized_for_mujeres(auth.uid()));
CREATE POLICY "Autorizados mujeres pueden actualizar duplas"
  ON public.duplas_acompanamiento FOR UPDATE TO authenticated
  USING (public.is_authorized_for_mujeres(auth.uid()));
CREATE POLICY "Admin o coordinador pueden eliminar duplas"
  ON public.duplas_acompanamiento FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'coordinador'));

-- ============ LUGARES: restrict writes ============
DROP POLICY IF EXISTS "Authenticated users can create lugares" ON public.lugares;
DROP POLICY IF EXISTS "Authenticated users can update lugares" ON public.lugares;
CREATE POLICY "Admin o coordinador pueden crear lugares"
  ON public.lugares FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'coordinador'));
CREATE POLICY "Admin o coordinador pueden actualizar lugares"
  ON public.lugares FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'coordinador'));

-- ============ REUNIONES_SEMANALES: restrict writes ============
DROP POLICY IF EXISTS "Usuarios autenticados pueden crear reuniones" ON public.reuniones_semanales;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar reuniones" ON public.reuniones_semanales;
CREATE POLICY "Admin o coordinador pueden crear reuniones"
  ON public.reuniones_semanales FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'coordinador'));
CREATE POLICY "Admin o coordinador pueden actualizar reuniones"
  ON public.reuniones_semanales FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'coordinador'));
