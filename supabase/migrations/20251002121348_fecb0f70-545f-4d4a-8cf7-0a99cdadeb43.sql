-- Eliminar la política restrictiva actual
DROP POLICY IF EXISTS "Administrators and coordinators can view staff data" ON public.equipo;

-- Crear nueva política que permita a administradores, coordinadores y trabajadores ver los datos del equipo
CREATE POLICY "Authorized users can view staff data"
ON public.equipo
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('administrador', 'coordinador', 'trabajador')
  )
);