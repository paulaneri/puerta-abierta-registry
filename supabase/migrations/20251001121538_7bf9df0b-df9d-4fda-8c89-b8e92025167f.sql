-- Eliminar la política restrictiva actual
DROP POLICY IF EXISTS "Solo administradores pueden ver roles" ON public.user_roles;

-- Crear nueva política que permita a los usuarios ver su propio rol y a los admins ver todos
CREATE POLICY "Users can view their own role, admins can view all"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id OR is_admin(auth.uid())
);